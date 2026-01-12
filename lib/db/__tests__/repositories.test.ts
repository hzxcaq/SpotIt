import { describe, it, expect, beforeEach } from "vitest";
import { db, roomsRepo, containersRepo, itemsRepo, imagesRepo, historyRepo } from "../index";

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe("roomsRepo", () => {
  it("create: should create a room with generated id and timestamps", async () => {
    const room = await roomsRepo.create({ name: "Living Room", description: "Main living area" });

    expect(room.id).toBeDefined();
    expect(room.name).toBe("Living Room");
    expect(room.description).toBe("Main living area");
    expect(room.createdAt).toBeGreaterThan(0);
    expect(room.updatedAt).toBeGreaterThan(0);
  });

  it("getById: should retrieve a room by id", async () => {
    const created = await roomsRepo.create({ name: "Bedroom" });
    const found = await roomsRepo.getById(created.id);

    expect(found).toEqual(created);
  });

  it("getById: should return undefined for non-existent id", async () => {
    const found = await roomsRepo.getById("non-existent");
    expect(found).toBeUndefined();
  });

  it("getAll: should return all rooms ordered by createdAt desc", async () => {
    const roomA = await roomsRepo.create({ name: "Room A" });
    await new Promise((r) => setTimeout(r, 5));
    const roomB = await roomsRepo.create({ name: "Room B" });
    await new Promise((r) => setTimeout(r, 5));
    const roomC = await roomsRepo.create({ name: "Room C" });

    const rooms = await roomsRepo.getAll();

    expect(rooms).toHaveLength(3);
    expect(rooms[0].id).toBe(roomC.id);
    expect(rooms[2].id).toBe(roomA.id);
  });

  it("update: should update room fields and updatedAt", async () => {
    const room = await roomsRepo.create({ name: "Old Name" });
    const originalUpdatedAt = room.updatedAt;

    await new Promise((r) => setTimeout(r, 10));
    await roomsRepo.update(room.id, { name: "New Name" });

    const updated = await roomsRepo.getById(room.id);
    expect(updated?.name).toBe("New Name");
    expect(updated?.updatedAt).toBeGreaterThan(originalUpdatedAt);
  });

  it("delete: should remove room and cascade to containers/items", async () => {
    const room = await roomsRepo.create({ name: "To Delete" });
    const container = await containersRepo.create({ name: "Box", roomId: room.id, code: "BOX001" });
    await itemsRepo.create({
      name: "Item",
      containerId: container.id,
      roomId: room.id,
      quantity: 1,
      unit: "个",
      tags: [],
      status: "in_stock",
    });

    await roomsRepo.delete(room.id);

    expect(await roomsRepo.getById(room.id)).toBeUndefined();
    expect(await containersRepo.getById(container.id)).toBeUndefined();
    const items = await itemsRepo.getAll();
    expect(items[0].containerId).toBeUndefined();
    expect(items[0].roomId).toBeUndefined();
  });
});

describe("containersRepo", () => {
  let roomId: string;

  beforeEach(async () => {
    const room = await roomsRepo.create({ name: "Test Room" });
    roomId = room.id;
  });

  it("create: should create a container", async () => {
    const container = await containersRepo.create({
      name: "Drawer",
      roomId,
      code: "DRW001",
      description: "Top drawer",
    });

    expect(container.id).toBeDefined();
    expect(container.name).toBe("Drawer");
    expect(container.roomId).toBe(roomId);
    expect(container.code).toBe("DRW001");
  });

  it("getById: should retrieve a container by id", async () => {
    const created = await containersRepo.create({ name: "Shelf", roomId, code: "SHF001" });
    const found = await containersRepo.getById(created.id);

    expect(found).toEqual(created);
  });

  it("getByRoomId: should return containers for a room (excluding soft-deleted)", async () => {
    await containersRepo.create({ name: "Box A", roomId, code: "A001" });
    await containersRepo.create({ name: "Box B", roomId, code: "B001" });
    const toDelete = await containersRepo.create({ name: "Box C", roomId, code: "C001" });
    await containersRepo.delete(toDelete.id, true);

    const containers = await containersRepo.getByRoomId(roomId);

    expect(containers).toHaveLength(2);
    expect(containers.map((c) => c.name)).toContain("Box A");
    expect(containers.map((c) => c.name)).toContain("Box B");
  });

  it("getByCode: should find container by code", async () => {
    await containersRepo.create({ name: "Unique Box", roomId, code: "UNIQUE123" });

    const found = await containersRepo.getByCode("UNIQUE123");

    expect(found?.name).toBe("Unique Box");
  });

  it("getAll: should return all non-deleted containers", async () => {
    await containersRepo.create({ name: "Active", roomId, code: "ACT001" });
    const deleted = await containersRepo.create({ name: "Deleted", roomId, code: "DEL001" });
    await containersRepo.delete(deleted.id, true);

    const all = await containersRepo.getAll();

    expect(all).toHaveLength(1);
    expect(all[0].name).toBe("Active");
  });

  it("update: should update container fields", async () => {
    const container = await containersRepo.create({ name: "Old", roomId, code: "OLD001" });

    await containersRepo.update(container.id, { name: "Updated" });

    const updated = await containersRepo.getById(container.id);
    expect(updated?.name).toBe("Updated");
  });

  it("delete (soft): should soft-delete and unlink items", async () => {
    const container = await containersRepo.create({ name: "ToSoftDelete", roomId, code: "SD001" });
    await itemsRepo.create({
      name: "Linked Item",
      containerId: container.id,
      roomId,
      quantity: 1,
      unit: "个",
      tags: [],
      status: "in_stock",
    });

    await containersRepo.delete(container.id, true);

    const deleted = await containersRepo.getById(container.id);
    expect(deleted?.deletedAt).toBeDefined();

    const items = await itemsRepo.getAll();
    expect(items[0].containerId).toBeUndefined();
  });

  it("delete (hard): should permanently remove container", async () => {
    const container = await containersRepo.create({ name: "ToHardDelete", roomId, code: "HD001" });

    await containersRepo.delete(container.id, false);

    expect(await containersRepo.getById(container.id)).toBeUndefined();
  });
});

describe("itemsRepo", () => {
  let roomId: string;
  let containerId: string;

  beforeEach(async () => {
    const room = await roomsRepo.create({ name: "Test Room" });
    roomId = room.id;
    const container = await containersRepo.create({ name: "Test Container", roomId, code: "TC001" });
    containerId = container.id;
  });

  const createTestItem = (overrides = {}) =>
    itemsRepo.create({
      name: "Test Item",
      containerId,
      roomId,
      quantity: 1,
      unit: "个" as const,
      tags: ["test"],
      status: "in_stock" as const,
      ...overrides,
    });

  it("create: should create item and record history", async () => {
    const item = await createTestItem({ name: "New Item" });

    expect(item.id).toBeDefined();
    expect(item.name).toBe("New Item");

    const history = await historyRepo.getByItemId(item.id);
    expect(history).toHaveLength(1);
    expect(history[0].action).toBe("create");
  });

  it("getById: should retrieve item by id", async () => {
    const created = await createTestItem();
    const found = await itemsRepo.getById(created.id);

    expect(found).toEqual(created);
  });

  it("getByContainerId: should return items in a container", async () => {
    await createTestItem({ name: "Item 1" });
    await createTestItem({ name: "Item 2" });

    const items = await itemsRepo.getByContainerId(containerId);

    expect(items).toHaveLength(2);
  });

  it("getByRoomId: should return items in a room", async () => {
    await createTestItem({ name: "Room Item" });

    const items = await itemsRepo.getByRoomId(roomId);

    expect(items).toHaveLength(1);
    expect(items[0].name).toBe("Room Item");
  });

  it("getByStatus: should filter items by status", async () => {
    await createTestItem({ name: "In Stock", status: "in_stock" });
    await createTestItem({ name: "Lent", status: "lent", lentTo: "John" });

    const lentItems = await itemsRepo.getByStatus("lent");

    expect(lentItems).toHaveLength(1);
    expect(lentItems[0].name).toBe("Lent");
  });

  it("search: should find items by name, alias, or tags", async () => {
    await createTestItem({ name: "Screwdriver", tags: ["tool"] });
    await createTestItem({ name: "Hammer", alias: "Claw hammer", tags: ["tool"] });
    await createTestItem({ name: "Book", tags: ["reading"] });

    expect(await itemsRepo.search("screw")).toHaveLength(1);
    expect(await itemsRepo.search("claw")).toHaveLength(1);
    expect(await itemsRepo.search("tool")).toHaveLength(2);
    expect(await itemsRepo.search("xyz")).toHaveLength(0);
  });

  it("getAll: should return all items ordered by createdAt desc", async () => {
    await createTestItem({ name: "First" });
    await createTestItem({ name: "Second" });

    const items = await itemsRepo.getAll();

    expect(items).toHaveLength(2);
    expect(items[0].name).toBe("Second");
  });

  it("update: should update item and track movement history", async () => {
    const room2 = await roomsRepo.create({ name: "Room 2" });
    const container2 = await containersRepo.create({ name: "Container 2", roomId: room2.id, code: "C2001" });
    const item = await createTestItem();

    await itemsRepo.update(item.id, { containerId: container2.id, roomId: room2.id });

    const updated = await itemsRepo.getById(item.id);
    expect(updated?.containerId).toBe(container2.id);

    const history = await historyRepo.getByItemId(item.id);
    expect(history.some((h) => h.action === "move")).toBe(true);
  });

  it("update: should track lending history", async () => {
    const item = await createTestItem();

    await itemsRepo.update(item.id, { status: "lent", lentTo: "Alice" });

    const history = await historyRepo.getByItemId(item.id);
    expect(history.some((h) => h.action === "lend" && h.lentTo === "Alice")).toBe(true);
  });

  it("update: should track return history", async () => {
    const item = await createTestItem({ status: "lent", lentTo: "Bob" });

    await itemsRepo.update(item.id, { status: "in_stock" });

    const history = await historyRepo.getByItemId(item.id);
    expect(history.some((h) => h.action === "return")).toBe(true);
  });

  it("delete: should remove item, images, and record history", async () => {
    const item = await createTestItem();
    await imagesRepo.create({
      itemId: item.id,
      dataUrl: "data:image/png;base64,abc",
      mimeType: "image/png",
      size: 100,
    });

    await itemsRepo.delete(item.id);

    expect(await itemsRepo.getById(item.id)).toBeUndefined();
    expect(await imagesRepo.getByItemId(item.id)).toHaveLength(0);
  });
});

describe("imagesRepo", () => {
  let itemId: string;

  beforeEach(async () => {
    const room = await roomsRepo.create({ name: "Room" });
    const container = await containersRepo.create({ name: "Container", roomId: room.id, code: "IMG001" });
    const item = await itemsRepo.create({
      name: "Item with Image",
      containerId: container.id,
      roomId: room.id,
      quantity: 1,
      unit: "个",
      tags: [],
      status: "in_stock",
    });
    itemId = item.id;
  });

  it("create: should create an image record", async () => {
    const image = await imagesRepo.create({
      itemId,
      dataUrl: "data:image/jpeg;base64,xyz",
      mimeType: "image/jpeg",
      size: 500,
      width: 100,
      height: 100,
    });

    expect(image.id).toBeDefined();
    expect(image.itemId).toBe(itemId);
  });

  it("getById: should retrieve image by id", async () => {
    const created = await imagesRepo.create({
      itemId,
      dataUrl: "data:image/png;base64,test",
      mimeType: "image/png",
      size: 200,
    });

    const found = await imagesRepo.getById(created.id);
    expect(found).toEqual(created);
  });

  it("getByItemId: should return all images for an item", async () => {
    await imagesRepo.create({ itemId, dataUrl: "data:1", mimeType: "image/png", size: 100 });
    await imagesRepo.create({ itemId, dataUrl: "data:2", mimeType: "image/png", size: 100 });

    const images = await imagesRepo.getByItemId(itemId);
    expect(images).toHaveLength(2);
  });

  it("delete: should remove an image", async () => {
    const image = await imagesRepo.create({
      itemId,
      dataUrl: "data:delete",
      mimeType: "image/png",
      size: 50,
    });

    await imagesRepo.delete(image.id);

    expect(await imagesRepo.getById(image.id)).toBeUndefined();
  });
});

describe("historyRepo", () => {
  it("getByItemId: should return history ordered by createdAt desc", async () => {
    const room = await roomsRepo.create({ name: "Room" });
    const container = await containersRepo.create({ name: "Container", roomId: room.id, code: "HIST001" });
    const item = await itemsRepo.create({
      name: "Tracked Item",
      containerId: container.id,
      roomId: room.id,
      quantity: 1,
      unit: "个",
      tags: [],
      status: "in_stock",
    });

    await itemsRepo.update(item.id, { status: "lent", lentTo: "Test" });
    await itemsRepo.update(item.id, { status: "in_stock" });

    const history = await historyRepo.getByItemId(item.id);

    expect(history.length).toBeGreaterThanOrEqual(3);
    expect(history[0].createdAt).toBeGreaterThanOrEqual(history[1].createdAt);
  });
});
