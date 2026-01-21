import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db, itemsRepo, imagesRepo, locationsRepo, roomsRepo, containersRepo } from '../index';

describe('Database Operations', () => {
  beforeEach(async () => {
    // 清空数据库
    await db.transaction('rw', [db.locations, db.rooms, db.containers, db.items, db.images, db.history], async () => {
      await db.history.clear();
      await db.images.clear();
      await db.items.clear();
      await db.containers.clear();
      await db.rooms.clear();
      await db.locations.clear();
    });
  });

  afterEach(async () => {
    // 清理数据库
    await db.transaction('rw', [db.locations, db.rooms, db.containers, db.items, db.images, db.history], async () => {
      await db.history.clear();
      await db.images.clear();
      await db.items.clear();
      await db.containers.clear();
      await db.rooms.clear();
      await db.locations.clear();
    });
  });

  describe('Location Operations', () => {
    it('should create location with default rooms', async () => {
      const location = await locationsRepo.create({
        name: '测试地点',
        description: '测试描述'
      });

      expect(location.name).toBe('测试地点');
      expect(location.description).toBe('测试描述');
      expect(location.id).toBeDefined();
      expect(location.createdAt).toBeDefined();
      expect(location.updatedAt).toBeDefined();

      // 检查是否创建了默认房间
      const rooms = await roomsRepo.getByLocationId(location.id);
      expect(rooms).toHaveLength(5);

      const roomNames = rooms.map(room => room.name);
      expect(roomNames).toContain('客厅');
      expect(roomNames).toContain('厨房');
      expect(roomNames).toContain('主卧');
      expect(roomNames).toContain('次卧');
      expect(roomNames).toContain('卫生间');
    });

    it('should get location by id', async () => {
      const created = await locationsRepo.create({
        name: '测试地点'
      });

      const retrieved = await locationsRepo.getById(created.id);

      expect(retrieved).toEqual(created);
    });

    it('should update location', async () => {
      const location = await locationsRepo.create({
        name: '原始名称'
      });

      await locationsRepo.update(location.id, {
        name: '更新名称',
        description: '新描述'
      });

      const updated = await locationsRepo.getById(location.id);
      expect(updated?.name).toBe('更新名称');
      expect(updated?.description).toBe('新描述');
      expect(updated?.updatedAt).toBeGreaterThan(location.updatedAt);
    });

    it('should delete location and cascade delete rooms', async () => {
      const location = await locationsRepo.create({
        name: '待删除地点'
      });

      const roomsBefore = await roomsRepo.getByLocationId(location.id);
      expect(roomsBefore.length).toBeGreaterThan(0);

      await locationsRepo.delete(location.id);

      const deletedLocation = await locationsRepo.getById(location.id);
      expect(deletedLocation).toBeUndefined();

      const roomsAfter = await roomsRepo.getByLocationId(location.id);
      expect(roomsAfter).toHaveLength(0);
    });
  });

  describe('Item Operations', () => {
    let locationId: string;
    let roomId: string;
    let containerId: string;

    beforeEach(async () => {
      // 创建测试数据
      const location = await locationsRepo.create({ name: '测试地点' });
      locationId = location.id;

      const rooms = await roomsRepo.getByLocationId(locationId);
      roomId = rooms[0].id;

      const containers = await containersRepo.getByRoomId(roomId);
      containerId = containers[0].id;
    });

    it('should create item with history record', async () => {
      const item = await itemsRepo.create({
        name: '测试物品',
        quantity: 2,
        unit: '个',
        tags: ['测试', '物品'],
        status: 'in_stock',
        containerId,
        roomId,
        notes: '测试备注'
      });

      expect(item.name).toBe('测试物品');
      expect(item.quantity).toBe(2);
      expect(item.unit).toBe('个');
      expect(item.tags).toEqual(['测试', '物品']);
      expect(item.status).toBe('in_stock');
      expect(item.containerId).toBe(containerId);
      expect(item.roomId).toBe(roomId);
      expect(item.notes).toBe('测试备注');

      // 检查历史记录
      const history = await db.history.where('itemId').equals(item.id).toArray();
      expect(history).toHaveLength(1);
      expect(history[0].action).toBe('create');
    });

    it('should search items by name and tags', async () => {
      await itemsRepo.create({
        name: '苹果手机',
        quantity: 1,
        unit: '个',
        tags: ['电子产品', '手机'],
        status: 'in_stock',
        containerId,
        roomId
      });

      await itemsRepo.create({
        name: '苹果',
        quantity: 5,
        unit: '个',
        tags: ['水果', '食物'],
        status: 'in_stock',
        containerId,
        roomId
      });

      // 按名称搜索
      const nameResults = await itemsRepo.search('苹果');
      expect(nameResults).toHaveLength(2);

      // 按标签搜索
      const tagResults = await itemsRepo.search('电子产品');
      expect(tagResults).toHaveLength(1);
      expect(tagResults[0].name).toBe('苹果手机');
    });

    it('should update item and track movement', async () => {
      const item = await itemsRepo.create({
        name: '测试物品',
        quantity: 1,
        unit: '个',
        tags: [],
        status: 'in_stock',
        containerId,
        roomId
      });

      // 创建新的容器用于移动测试
      const newContainer = await containersRepo.create({
        name: '新容器',
        roomId,
        code: 'new-container'
      });

      await itemsRepo.update(item.id, {
        containerId: newContainer.id,
        quantity: 2
      });

      const updated = await itemsRepo.getById(item.id);
      expect(updated?.containerId).toBe(newContainer.id);
      expect(updated?.quantity).toBe(2);

      // 检查移动历史
      const history = await db.history.where('itemId').equals(item.id).toArray();
      const moveHistory = history.find(h => h.action === 'move');
      expect(moveHistory).toBeDefined();
      expect(moveHistory?.fromContainerId).toBe(containerId);
      expect(moveHistory?.toContainerId).toBe(newContainer.id);
    });

    it('should delete item and cleanup images', async () => {
      const item = await itemsRepo.create({
        name: '待删除物品',
        quantity: 1,
        unit: '个',
        tags: [],
        status: 'in_stock',
        containerId,
        roomId
      });

      // 添加图片
      const image = await imagesRepo.create({
        itemId: item.id,
        dataUrl: 'data:image/png;base64,test',
        mimeType: 'image/png',
        size: 1024,
        width: 100,
        height: 100
      });

      await itemsRepo.delete(item.id);

      // 检查物品是否删除
      const deletedItem = await itemsRepo.getById(item.id);
      expect(deletedItem).toBeUndefined();

      // 检查图片是否删除
      const deletedImage = await imagesRepo.getById(image.id);
      expect(deletedImage).toBeUndefined();

      // 检查删除历史
      const history = await db.history.where('itemId').equals(item.id).toArray();
      const deleteHistory = history.find(h => h.action === 'delete');
      expect(deleteHistory).toBeDefined();
    });
  });

  describe('Image Operations', () => {
    let itemId: string;

    beforeEach(async () => {
      const location = await locationsRepo.create({ name: '测试地点' });
      const rooms = await roomsRepo.getByLocationId(location.id);
      const containers = await containersRepo.getByRoomId(rooms[0].id);

      const item = await itemsRepo.create({
        name: '测试物品',
        quantity: 1,
        unit: '个',
        tags: [],
        status: 'in_stock',
        containerId: containers[0].id,
        roomId: rooms[0].id
      });
      itemId = item.id;
    });

    it('should create and retrieve image', async () => {
      const image = await imagesRepo.create({
        itemId,
        dataUrl: 'data:image/png;base64,test',
        mimeType: 'image/png',
        size: 1024,
        width: 100,
        height: 100
      });

      expect(image.itemId).toBe(itemId);
      expect(image.dataUrl).toBe('data:image/png;base64,test');
      expect(image.mimeType).toBe('image/png');
      expect(image.size).toBe(1024);

      const retrieved = await imagesRepo.getById(image.id);
      expect(retrieved).toEqual(image);
    });

    it('should get images by item id', async () => {
      await imagesRepo.create({
        itemId,
        dataUrl: 'data:image/png;base64,test1',
        mimeType: 'image/png',
        size: 1024,
        width: 100,
        height: 100
      });

      await imagesRepo.create({
        itemId,
        dataUrl: 'data:image/png;base64,test2',
        mimeType: 'image/png',
        size: 2048,
        width: 200,
        height: 200
      });

      const images = await imagesRepo.getByItemId(itemId);
      expect(images).toHaveLength(2);
    });
  });
});