import Dexie, { type EntityTable } from "dexie";
import { nanoid } from "nanoid";
import type {
  Location,
  Room,
  Container,
  Item,
  Image,
  ItemHistory,
  TagCategory,
  CreateLocationInput,
  CreateRoomInput,
  CreateContainerInput,
  CreateItemInput,
  CreateImageInput,
  CreateTagCategoryInput,
  UpdateLocationInput,
  UpdateRoomInput,
  UpdateContainerInput,
  UpdateItemInput,
  UpdateTagCategoryInput,
  ID,
} from "./types";

// ============ Database Definition ============

class SpotItDB extends Dexie {
  locations!: EntityTable<Location, "id">;
  rooms!: EntityTable<Room, "id">;
  containers!: EntityTable<Container, "id">;
  items!: EntityTable<Item, "id">;
  images!: EntityTable<Image, "id">;
  history!: EntityTable<ItemHistory, "id">;
  tagCategories!: EntityTable<TagCategory, "id">;

  constructor() {
    super("SpotItDB");

    this.version(1).stores({
      rooms: "&id, name, createdAt",
      containers: "&id, roomId, name, code, createdAt, deletedAt",
      items: "&id, roomId, containerId, name, status, *tags, createdAt",
      images: "&id, itemId, createdAt",
      history: "&id, itemId, action, createdAt",
    });

    this.version(2).stores({
      locations: "&id, name, isDefault, createdAt",
      rooms: "&id, locationId, name, createdAt",
    });

    this.version(3).stores({
      tagCategories: "&id, name, isCustom, createdAt",
    });
  }
}

export const db = new SpotItDB();

// ============ Helper Functions ============

const now = () => Date.now();
const generateId = () => nanoid();

// ============ Location Operations ============

export const locationsRepo = {
  async create(input: CreateLocationInput): Promise<Location> {
    const location: Location = {
      id: generateId(),
      ...input,
      createdAt: now(),
      updatedAt: now(),
    };

    await db.transaction("rw", [db.locations, db.rooms, db.containers], async () => {
      await db.locations.add(location);

      // 为新地点创建默认房间和容器
      const defaultRooms = [
        { name: "客厅", description: "客厅区域" },
        { name: "厨房", description: "厨房区域" },
        { name: "主卧", description: "主卧区域" },
        { name: "次卧", description: "次卧区域" },
        { name: "卫生间", description: "卫生间区域" },
      ];

      for (const roomData of defaultRooms) {
        await roomsRepo.create({
          ...roomData,
          locationId: location.id,
        });
      }
    });

    return location;
  },

  async getById(id: ID): Promise<Location | undefined> {
    return db.locations.get(id);
  },

  async getAll(): Promise<Location[]> {
    return db.locations.orderBy("createdAt").toArray();
  },

  async update(id: ID, input: UpdateLocationInput): Promise<void> {
    await db.locations.update(id, { ...input, updatedAt: now() });
  },

  async delete(id: ID): Promise<void> {
    await db.transaction("rw", [db.locations, db.rooms, db.containers, db.items], async () => {
      const rooms = await db.rooms.where("locationId").equals(id).toArray();
      for (const room of rooms) {
        await roomsRepo.delete(room.id);
      }
      await db.locations.delete(id);
    });
  },
};

// ============ Room Operations ============

export const roomsRepo = {
  async create(input: CreateRoomInput): Promise<Room> {
    const room: Room = {
      id: generateId(),
      ...input,
      createdAt: now(),
      updatedAt: now(),
    };

    await db.transaction("rw", [db.rooms, db.containers], async () => {
      await db.rooms.add(room);

      const cabinetTypes = ["上柜", "下柜"];
      const positions = ["左格", "中格", "右格"];

      for (const cabinet of cabinetTypes) {
        for (const position of positions) {
          await containersRepo.create({
            name: `${cabinet}-${position}`,
            roomId: room.id,
            description: `${room.name}的${cabinet}${position}`,
            code: `${room.id}-${cabinet}-${position}`,
          });
        }
      }
    });

    return room;
  },

  async getById(id: ID): Promise<Room | undefined> {
    return db.rooms.get(id);
  },

  async getByLocationId(locationId: ID): Promise<Room[]> {
    return db.rooms.where("locationId").equals(locationId).reverse().sortBy("createdAt");
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

// ============ TagCategory Operations ============

export const tagCategoriesRepo = {
  async create(input: CreateTagCategoryInput): Promise<TagCategory> {
    const tagCategory: TagCategory = {
      id: generateId(),
      ...input,
      createdAt: now(),
      updatedAt: now(),
    };
    await db.tagCategories.add(tagCategory);
    return tagCategory;
  },

  async getById(id: ID): Promise<TagCategory | undefined> {
    return db.tagCategories.get(id);
  },

  async getAll(): Promise<TagCategory[]> {
    return db.tagCategories.orderBy("createdAt").toArray();
  },

  async update(id: ID, input: UpdateTagCategoryInput): Promise<void> {
    await db.tagCategories.update(id, { ...input, updatedAt: now() });
  },

  async delete(id: ID): Promise<void> {
    await db.tagCategories.delete(id);
  },
};

// ============ Database Initialization ============

export const initializeDefaultTemplate = async (): Promise<void> => {
  const existingLocations = await db.locations.count();
  let defaultLocationId = "";

  if (existingLocations === 0) {
    const home = await locationsRepo.create({
      name: "我的家",
      isDefault: true,
      description: "默认区域"
    });
    defaultLocationId = home.id;
  } else {
    const defaultLoc = await db.locations.filter(l => l.isDefault === true).first();
    if (defaultLoc) {
      defaultLocationId = defaultLoc.id;
    } else {
      const firstLoc = await db.locations.orderBy("createdAt").first();
      if (!firstLoc) {
        const newHome = await locationsRepo.create({
          name: "我的家",
          isDefault: true,
          description: "默认区域"
        });
        defaultLocationId = newHome.id;
      } else {
        defaultLocationId = firstLoc.id;
      }
    }
  }

  const existingRooms = await db.rooms.count();
  if (existingRooms > 0 && defaultLocationId) {
    await db.rooms.filter(r => !r.locationId).modify({ locationId: defaultLocationId });
  }

  const existingTagCategories = await db.tagCategories.count();
  if (existingTagCategories === 0) {
    const { tagCategories } = await import("@/lib/utils/tag-suggestions");
    for (const [name, category] of Object.entries(tagCategories)) {
      await tagCategoriesRepo.create({
        name,
        keywords: category.keywords,
        suggestions: category.suggestions,
        isCustom: false,
      });
    }
  }
};
