// Database type definitions for SpotIt

export type ID = string;

// ============ Enums ============

export type ItemStatus =
  | "in_stock"    // 在库
  | "lent"        // 已借出
  | "consumed"    // 已消耗
  | "disposed"    // 已处置
  | "lost";       // 遗失

export type ItemUnit =
  | "个" | "件" | "只"      // 通用
  | "盒" | "箱" | "包" | "袋" // 包装
  | "卷" | "张" | "本"       // 纸类
  | "瓶" | "罐" | "桶"       // 液体/容器
  | "套" | "组" | "对"       // 组合
  | "米" | "厘米"            // 长度
  | "克" | "千克";           // 重量

export type HistoryAction =
  | "create"
  | "move"
  | "lend"
  | "return"
  | "update"
  | "delete";

// ============ Base Entity ============

export interface BaseEntity {
  id: ID;
  createdAt: number;  // Unix timestamp
  updatedAt: number;  // Unix timestamp
}

// ============ Models ============

export interface Room extends BaseEntity {
  name: string;
  description?: string;
}

export interface Container extends BaseEntity {
  name: string;
  roomId: ID;
  description?: string;
  code: string;           // QR code identifier
  deletedAt?: number;     // Soft delete marker
}

export interface Item extends BaseEntity {
  name: string;
  alias?: string;
  roomId?: ID;            // Denormalized, derived from container
  containerId?: ID;
  quantity: number;
  unit: ItemUnit;
  tags: string[];
  status: ItemStatus;
  lentTo?: string;
  lentAt?: number;
  imageId?: ID;
  notes?: string;
}

export interface Image extends BaseEntity {
  itemId: ID;
  dataUrl: string;        // Base64 encoded image
  mimeType: string;
  size: number;           // Bytes
  width?: number;
  height?: number;
}

export interface ItemHistory extends BaseEntity {
  itemId: ID;
  action: HistoryAction;
  fromContainerId?: ID;
  toContainerId?: ID;
  fromRoomId?: ID;
  toRoomId?: ID;
  lentTo?: string;
  note?: string;
}

// ============ Input Types (for creation) ============

export type CreateRoomInput = Omit<Room, "id" | "createdAt" | "updatedAt">;
export type UpdateRoomInput = Partial<CreateRoomInput>;

export type CreateContainerInput = Omit<Container, "id" | "createdAt" | "updatedAt" | "deletedAt">;
export type UpdateContainerInput = Partial<CreateContainerInput>;

export type CreateItemInput = Omit<Item, "id" | "createdAt" | "updatedAt">;
export type UpdateItemInput = Partial<CreateItemInput>;

export type CreateImageInput = Omit<Image, "id" | "createdAt" | "updatedAt">;
