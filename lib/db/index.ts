import Dexie, { type EntityTable } from "dexie";
import { nanoid } from "nanoid";
import type {
  Room,
  Container,
  Item,
  Image,
  ItemHistory,
  CreateRoomInput,
  CreateContainerInput,
  CreateItemInput,
  CreateImageInput,
  UpdateRoomInput,
  UpdateContainerInput,
  UpdateItemInput,
  ID,
} from "./types";

// ============ Database Definition ============

class SpotItDB extends Dexie {
  rooms!: EntityTable<Room, "id">;
  containers!: EntityTable<Container, "id">;
  items!: EntityTable<Item, "id">;
  images!: EntityTable<Image, "id">;
  history!: EntityTable<ItemHistory, "id">;

  constructor() {
    super("SpotItDB");

    this.version(1).stores({
      rooms: "&id, name, createdAt",
      containers: "&id, roomId, name, code, createdAt, deletedAt",
      items: "&id, roomId, containerId, name, status, *tags, createdAt",
      images: "&id, itemId, createdAt",
      history: "&id, itemId, action, createdAt",
    });
  }
}

export const db = new SpotItDB();

// ============ Helper Functions ============

const now = () => Date.now();
const generateId = () => nanoid();

// ============ Room Operations ============

export const roomsRepo = {
  async create(input: CreateRoomInput): Promise<Room> {
    const room: Room = {
      id: generateId(),
      ...input,
      createdAt: now(),
      updatedAt: now(),
    };
    await db.rooms.add(room);
    return room;
  },

  async getById(id: ID): Promise<Room | undefined> {
    return db.rooms.get(id);
  },

  async getAll(): Promise<Room[]> {
    return db.rooms.orderBy("createdAt").reverse().toArray();
  },

  async update(id: ID, input: UpdateRoomInput): Promise<void> {
    await db.rooms.update(id, { ...input, updatedAt: now() });
  },

  async delete(id: ID): Promise<void> {
    await db.transaction("rw", [db.rooms, db.containers, db.items], async () => {
      const containers = await db.containers.where("roomId").equals(id).toArray();
      for (const container of containers) {
        await db.items.where("containerId").equals(container.id).modify({ containerId: undefined, roomId: undefined });
      }
      await db.containers.where("roomId").equals(id).delete();
      await db.rooms.delete(id);
    });
  },
};

// ============ Container Operations ============

export const containersRepo = {
  async create(input: CreateContainerInput): Promise<Container> {
    const container: Container = {
      id: generateId(),
      ...input,
      createdAt: now(),
      updatedAt: now(),
    };
    await db.containers.add(container);
    return container;
  },

  async getById(id: ID): Promise<Container | undefined> {
    return db.containers.get(id);
  },

  async getByRoomId(roomId: ID): Promise<Container[]> {
    return db.containers
      .where("roomId")
      .equals(roomId)
      .and((c) => !c.deletedAt)
      .toArray();
  },

  async getByCode(code: string): Promise<Container | undefined> {
    return db.containers.where("code").equals(code).and((c) => !c.deletedAt).first();
  },

  async getAll(): Promise<Container[]> {
    return db.containers
      .filter((c) => !c.deletedAt)
      .toArray();
  },

  async update(id: ID, input: UpdateContainerInput): Promise<void> {
    await db.containers.update(id, { ...input, updatedAt: now() });
  },

  async delete(id: ID, soft = true): Promise<void> {
    if (soft) {
      await db.transaction("rw", [db.containers, db.items], async () => {
        await db.containers.update(id, { deletedAt: now(), updatedAt: now() });
        await db.items.where("containerId").equals(id).modify({ containerId: undefined, roomId: undefined });
      });
    } else {
      await db.transaction("rw", [db.containers, db.items], async () => {
        await db.items.where("containerId").equals(id).modify({ containerId: undefined, roomId: undefined });
        await db.containers.delete(id);
      });
    }
  },
};

// ============ Item Operations ============

export const itemsRepo = {
  async create(input: CreateItemInput): Promise<Item> {
    const item: Item = {
      id: generateId(),
      ...input,
      createdAt: now(),
      updatedAt: now(),
    };

    await db.transaction("rw", [db.items, db.history], async () => {
      await db.items.add(item);
      await db.history.add({
        id: generateId(),
        itemId: item.id,
        action: "create",
        toContainerId: item.containerId,
        toRoomId: item.roomId,
        createdAt: now(),
        updatedAt: now(),
      });
    });

    return item;
  },

  async getById(id: ID): Promise<Item | undefined> {
    return db.items.get(id);
  },

  async getByContainerId(containerId: ID): Promise<Item[]> {
    return db.items.where("containerId").equals(containerId).toArray();
  },

  async getByRoomId(roomId: ID): Promise<Item[]> {
    return db.items.where("roomId").equals(roomId).toArray();
  },

  async getByStatus(status: Item["status"]): Promise<Item[]> {
    return db.items.where("status").equals(status).toArray();
  },

  async search(query: string): Promise<Item[]> {
    const lowerQuery = query.toLowerCase();
    return db.items
      .filter(
        (item) =>
          item.name.toLowerCase().includes(lowerQuery) ||
          (item.alias?.toLowerCase().includes(lowerQuery) ?? false) ||
          (item.tags ?? []).some((tag) => tag.toLowerCase().includes(lowerQuery))
      )
      .toArray();
  },

  async getAll(): Promise<Item[]> {
    return db.items.orderBy("createdAt").reverse().toArray();
  },

  async update(id: ID, input: UpdateItemInput): Promise<void> {
    const oldItem = await db.items.get(id);
    if (!oldItem) return;

    await db.transaction("rw", [db.items, db.history], async () => {
      await db.items.update(id, { ...input, updatedAt: now() });

      // Track movement
      if (input.containerId !== undefined && input.containerId !== oldItem.containerId) {
        await db.history.add({
          id: generateId(),
          itemId: id,
          action: "move",
          fromContainerId: oldItem.containerId,
          toContainerId: input.containerId,
          fromRoomId: oldItem.roomId,
          toRoomId: input.roomId,
          createdAt: now(),
          updatedAt: now(),
        });
      }

      // Track lending
      if (input.status === "lent" && oldItem.status !== "lent") {
        await db.history.add({
          id: generateId(),
          itemId: id,
          action: "lend",
          lentTo: input.lentTo,
          createdAt: now(),
          updatedAt: now(),
        });
      }

      // Track return
      if (input.status === "in_stock" && oldItem.status === "lent") {
        await db.history.add({
          id: generateId(),
          itemId: id,
          action: "return",
          lentTo: oldItem.lentTo,
          createdAt: now(),
          updatedAt: now(),
        });
      }
    });
  },

  async delete(id: ID): Promise<void> {
    await db.transaction("rw", [db.items, db.images, db.history], async () => {
      await db.history.add({
        id: generateId(),
        itemId: id,
        action: "delete",
        createdAt: now(),
        updatedAt: now(),
      });
      await db.images.where("itemId").equals(id).delete();
      await db.items.delete(id);
    });
  },
};

// ============ Image Operations ============

export const imagesRepo = {
  async create(input: CreateImageInput): Promise<Image> {
    const image: Image = {
      id: generateId(),
      ...input,
      createdAt: now(),
      updatedAt: now(),
    };
    await db.images.add(image);
    return image;
  },

  async getById(id: ID): Promise<Image | undefined> {
    return db.images.get(id);
  },

  async getByItemId(itemId: ID): Promise<Image[]> {
    return db.images.where("itemId").equals(itemId).toArray();
  },

  async delete(id: ID): Promise<void> {
    await db.images.delete(id);
  },
};

// ============ History Operations ============

export const historyRepo = {
  async getByItemId(itemId: ID): Promise<ItemHistory[]> {
    const results = await db.history.where("itemId").equals(itemId).sortBy("createdAt");
    return results.reverse();
  },
};
