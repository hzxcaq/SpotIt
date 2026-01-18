import { db } from "@/lib/db";

export interface BackupData {
  version: number;
  exportedAt: string;
  data: {
    locations: unknown[];
    rooms: unknown[];
    containers: unknown[];
    items: unknown[];
    images: unknown[];
    history: unknown[];
  };
}

export interface BackupSettings {
  autoBackupEnabled: boolean;
  lastBackupTime: number | null;
  backupHistory: BackupRecord[];
}

export interface BackupRecord {
  id: string;
  timestamp: number;
  size: number;
  itemCount: number;
}

const BACKUP_SETTINGS_KEY = "spotit_backup_settings";
const BACKUP_PREFIX = "spotit_backup_";
const MAX_BACKUP_COUNT = 7; // 保留最近7天的备份

// 获取备份设置
export function getBackupSettings(): BackupSettings {
  if (typeof window === "undefined") {
    return {
      autoBackupEnabled: false,
      lastBackupTime: null,
      backupHistory: [],
    };
  }

  const stored = localStorage.getItem(BACKUP_SETTINGS_KEY);
  if (!stored) {
    return {
      autoBackupEnabled: false,
      lastBackupTime: null,
      backupHistory: [],
    };
  }

  try {
    return JSON.parse(stored);
  } catch {
    return {
      autoBackupEnabled: false,
      lastBackupTime: null,
      backupHistory: [],
    };
  }
}

// 保存备份设置
export function saveBackupSettings(settings: BackupSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(BACKUP_SETTINGS_KEY, JSON.stringify(settings));
}

// 创建备份
export async function createBackup(): Promise<BackupRecord> {
  const [locations, rooms, containers, items, images, history] = await Promise.all([
    db.locations.toArray(),
    db.rooms.toArray(),
    db.containers.toArray(),
    db.items.toArray(),
    db.images.toArray(),
    db.history.toArray(),
  ]);

  const backupData: BackupData = {
    version: 2,
    exportedAt: new Date().toISOString(),
    data: { locations, rooms, containers, items, images, history },
  };

  const backupJson = JSON.stringify(backupData);
  const backupId = `${BACKUP_PREFIX}${Date.now()}`;

  // 保存到 localStorage
  localStorage.setItem(backupId, backupJson);

  const record: BackupRecord = {
    id: backupId,
    timestamp: Date.now(),
    size: new Blob([backupJson]).size,
    itemCount: items.length,
  };

  // 更新备份历史
  const settings = getBackupSettings();
  settings.backupHistory.push(record);
  settings.lastBackupTime = Date.now();

  // 清理旧备份
  if (settings.backupHistory.length > MAX_BACKUP_COUNT) {
    const toDelete = settings.backupHistory.slice(0, settings.backupHistory.length - MAX_BACKUP_COUNT);
    toDelete.forEach((record) => {
      localStorage.removeItem(record.id);
    });
    settings.backupHistory = settings.backupHistory.slice(-MAX_BACKUP_COUNT);
  }

  saveBackupSettings(settings);

  return record;
}

// 恢复备份
export async function restoreBackup(backupId: string): Promise<void> {
  const backupJson = localStorage.getItem(backupId);
  if (!backupJson) {
    throw new Error("备份不存在");
  }

  const backupData: BackupData = JSON.parse(backupJson);

  await db.transaction("rw", [db.locations, db.rooms, db.containers, db.items, db.images, db.history], async () => {
    await db.history.clear();
    await db.images.clear();
    await db.items.clear();
    await db.containers.clear();
    await db.rooms.clear();
    await db.locations.clear();

    const { locations, rooms, containers, items, images, history } = backupData.data;
    if (locations && locations.length) await db.locations.bulkAdd(locations as never[]);
    if (rooms.length) await db.rooms.bulkAdd(rooms as never[]);
    if (containers.length) await db.containers.bulkAdd(containers as never[]);
    if (items.length) await db.items.bulkAdd(items as never[]);
    if (images && images.length) await db.images.bulkAdd(images as never[]);
    if (history && history.length) await db.history.bulkAdd(history as never[]);
  });
}

// 删除备份
export function deleteBackup(backupId: string): void {
  localStorage.removeItem(backupId);

  const settings = getBackupSettings();
  settings.backupHistory = settings.backupHistory.filter((record) => record.id !== backupId);
  saveBackupSettings(settings);
}

// 获取备份数据（用于下载）
export function getBackupData(backupId: string): BackupData | null {
  const backupJson = localStorage.getItem(backupId);
  if (!backupJson) return null;

  try {
    return JSON.parse(backupJson);
  } catch {
    return null;
  }
}

// 检查是否需要自动备份
export function shouldAutoBackup(): boolean {
  const settings = getBackupSettings();

  if (!settings.autoBackupEnabled) {
    return false;
  }

  if (!settings.lastBackupTime) {
    return true;
  }

  const now = Date.now();
  const lastBackup = new Date(settings.lastBackupTime);
  const today = new Date(now);

  // 检查是否是新的一天，且已过零点
  return (
    lastBackup.getDate() !== today.getDate() ||
    lastBackup.getMonth() !== today.getMonth() ||
    lastBackup.getFullYear() !== today.getFullYear()
  );
}

// 启用自动备份
export function enableAutoBackup(): void {
  const settings = getBackupSettings();
  settings.autoBackupEnabled = true;
  saveBackupSettings(settings);
}

// 禁用自动备份
export function disableAutoBackup(): void {
  const settings = getBackupSettings();
  settings.autoBackupEnabled = false;
  saveBackupSettings(settings);
}

// 格式化文件大小
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// 获取备份保存路径说明
export function getBackupLocationInfo(): string {
  return "浏览器本地存储 (localStorage)";
}

// 导出备份到文件
export function downloadBackup(backupData: BackupData, filename?: string): void {
  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `spotit-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
