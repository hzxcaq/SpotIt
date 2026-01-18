"use client";

import { useLiveQuery } from "dexie-react-hooks";
import {
  db,
  roomsRepo,
  containersRepo,
  itemsRepo,
  imagesRepo,
  historyRepo,
} from "./index";
import type { ID, Room, Container, Item, Image, ItemHistory } from "./types";

// ============ Room Hooks ============

export function useRooms(): Room[] {
  return useLiveQuery(() => roomsRepo.getAll(), []) ?? [];
}

export function useRoom(id: ID | undefined): Room | undefined {
  return useLiveQuery(() => (id ? roomsRepo.getById(id) : undefined), [id]);
}

// ============ Container Hooks ============

export function useContainers(): Container[] {
  return useLiveQuery(() => containersRepo.getAll(), []) ?? [];
}

export function useContainersByRoom(roomId: ID | undefined): Container[] {
  return useLiveQuery(
    () => (roomId ? containersRepo.getByRoomId(roomId) : []),
    [roomId]
  ) ?? [];
}

export function useContainer(id: ID | undefined): Container | undefined {
  return useLiveQuery(() => (id ? containersRepo.getById(id) : undefined), [id]);
}

// ============ Item Hooks ============

export function useItems(): Item[] {
  return useLiveQuery(() => itemsRepo.getAll(), []) ?? [];
}

export function useItemsByContainer(containerId: ID | undefined): Item[] {
  return useLiveQuery(
    () => (containerId ? itemsRepo.getByContainerId(containerId) : []),
    [containerId]
  ) ?? [];
}

export function useItemsByRoom(roomId: ID | undefined): Item[] {
  return useLiveQuery(
    () => (roomId ? itemsRepo.getByRoomId(roomId) : []),
    [roomId]
  ) ?? [];
}

export function useItemsByStatus(status: Item["status"]): Item[] {
  return useLiveQuery(() => itemsRepo.getByStatus(status), [status]) ?? [];
}

export function useItem(id: ID | undefined): Item | undefined {
  return useLiveQuery(() => (id ? itemsRepo.getById(id) : undefined), [id]);
}

export function useItemSearch(query: string): Item[] {
  return useLiveQuery(
    () => (query.trim() ? itemsRepo.search(query) : []),
    [query]
  ) ?? [];
}

// ============ Image Hooks ============

export function useImagesByItem(itemId: ID | undefined): Image[] {
  return useLiveQuery(
    () => (itemId ? imagesRepo.getByItemId(itemId) : []),
    [itemId]
  ) ?? [];
}

export function useImage(imageId: ID | undefined): Image | undefined {
  return useLiveQuery(() => (imageId ? imagesRepo.getById(imageId) : undefined), [imageId]);
}

export function useItemImage(itemId: ID | undefined): Image | undefined {
  const images = useImagesByItem(itemId);
  return images[0];
}

// ============ History Hooks ============

export function useAllHistory(): ItemHistory[] {
  return useLiveQuery(
    () => db.history.orderBy("createdAt").reverse().limit(50).toArray(),
    []
  ) ?? [];
}

export function useItemHistory(itemId: ID | undefined): ItemHistory[] {
  return useLiveQuery(
    () => (itemId ? historyRepo.getByItemId(itemId) : []),
    [itemId]
  ) ?? [];
}

// ============ Stats Hooks ============

export function useStats() {
  return useLiveQuery(async () => {
    const [roomCount, containerCount, itemCount, lentCount] = await Promise.all([
      db.rooms.count(),
      db.containers.filter((c) => !c.deletedAt).count(),
      db.items.count(),
      db.items.where("status").equals("lent").count(),
    ]);
    return { roomCount, containerCount, itemCount, lentCount };
  }, []) ?? { roomCount: 0, containerCount: 0, itemCount: 0, lentCount: 0 };
}

// Re-export repos for direct usage
export { roomsRepo, containersRepo, itemsRepo, imagesRepo, historyRepo };
