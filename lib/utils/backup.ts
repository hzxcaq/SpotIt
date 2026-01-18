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
  autoDownloadMode: "prompt" | "auto"; // 新增：下载模式
  fileSystemHandle: string | null; // 新增：文件夹句柄（序列化后的）
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
const FILE_HANDLE_KEY = "spotit_file_handle";

// 检查是否支持 File System Access API
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

// 获取备份设置
export function getBackupSettings(): BackupSettings {
  if (typeof window === "undefined") {
    return {
      autoBackupEnabled: false,
      lastBackupTime: null,
      backupHistory: [],
      autoDownloadMode: "prompt",
      fileSystemHandle: null,
    };
  }

  const stored = localStorage.getItem(BACKUP_SETTINGS_KEY);
  if (!stored) {
    return {
      autoBackupEnabled: false,
      lastBackupTime: null,
      backupHistory: [],
      autoDownloadMode: "prompt",
      fileSystemHandle: null,
    };
  }

  try {
    return JSON.parse(stored);
  } catch {
    return {
      autoBackupEnabled: false,
      lastBackupTime: null,
      backupHistory: [],
      autoDownloadMode: "prompt",
      fileSystemHandle: null,
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

// ============ File System Access API 相关功能 ============

// 选择备份文件夹
export async function selectBackupDirectory(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFileSystemAccessSupported()) {
    return null;
  }

  try {
    // @ts-ignore - File System Access API
    const dirHandle = await window.showDirectoryPicker({
      mode: "readwrite",
      startIn: "downloads",
    });

    // 保存文件夹句柄到 IndexedDB（因为 localStorage 不能存储对象）
    await saveDirectoryHandle(dirHandle);

    return dirHandle;
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      // 用户取消选择
      return null;
    }
    throw error;
  }
}

// 保存文件夹句柄到 IndexedDB
async function saveDirectoryHandle(dirHandle: FileSystemDirectoryHandle): Promise<void> {
  if (!("indexedDB" in window)) return;

  const dbName = "spotit_file_handles";
  const storeName = "handles";

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);

      store.put({ id: FILE_HANDLE_KEY, handle: dirHandle });

      transaction.oncomplete = () => {
        db.close();
        resolve();
      };

      transaction.onerror = () => reject(transaction.error);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: "id" });
      }
    };
  });
}

// 获取保存的文件夹句柄
async function getDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  if (!("indexedDB" in window)) return null;

  const dbName = "spotit_file_handles";
  const storeName = "handles";

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onerror = () => {
      resolve(null);
    };

    request.onsuccess = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(storeName)) {
        db.close();
        resolve(null);
        return;
      }

      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const getRequest = store.get(FILE_HANDLE_KEY);

      getRequest.onsuccess = () => {
        db.close();
        resolve(getRequest.result?.handle || null);
      };

      getRequest.onerror = () => {
        db.close();
        resolve(null);
      };
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: "id" });
      }
    };
  });
}

// 验证文件夹权限
async function verifyPermission(dirHandle: FileSystemDirectoryHandle): Promise<boolean> {
  const options = { mode: "readwrite" as FileSystemPermissionMode };

  // 检查是否已有权限
  // @ts-ignore
  if ((await dirHandle.queryPermission(options)) === "granted") {
    return true;
  }

  // 请求权限
  // @ts-ignore
  if ((await dirHandle.requestPermission(options)) === "granted") {
    return true;
  }

  return false;
}

// 保存备份到文件系统
export async function saveBackupToFileSystem(backupData: BackupData): Promise<boolean> {
  if (!isFileSystemAccessSupported()) {
    return false;
  }

  try {
    const dirHandle = await getDirectoryHandle();
    if (!dirHandle) {
      return false;
    }

    // 验证权限
    const hasPermission = await verifyPermission(dirHandle);
    if (!hasPermission) {
      return false;
    }

    // 生成文件名（只保留最新的一个）
    const filename = "spotit-backup-latest.json";

    // 创建或覆盖文件
    const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();

    // 写入数据
    await writable.write(JSON.stringify(backupData, null, 2));
    await writable.close();

    return true;
  } catch (error) {
    console.error("保存备份到文件系统失败:", error);
    return false;
  }
}

// 获取文件夹路径（用于显示）
export async function getBackupDirectoryPath(): Promise<string | null> {
  if (!isFileSystemAccessSupported()) {
    return null;
  }

  try {
    const dirHandle = await getDirectoryHandle();
    if (!dirHandle) {
      return null;
    }

    return dirHandle.name;
  } catch {
    return null;
  }
}

// 清除文件夹句柄
export async function clearDirectoryHandle(): Promise<void> {
  if (!("indexedDB" in window)) return;

  const dbName = "spotit_file_handles";
  const storeName = "handles";

  return new Promise((resolve) => {
    const request = indexedDB.open(dbName, 1);

    request.onsuccess = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(storeName)) {
        db.close();
        resolve();
        return;
      }

      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);

      store.delete(FILE_HANDLE_KEY);

      transaction.oncomplete = () => {
        db.close();
        resolve();
      };

      transaction.onerror = () => {
        db.close();
        resolve();
      };
    };

    request.onerror = () => {
      resolve();
    };
  });
}

// 设置自动下载模式
export function setAutoDownloadMode(mode: "prompt" | "auto"): void {
  const settings = getBackupSettings();
  settings.autoDownloadMode = mode;
  saveBackupSettings(settings);
}

// 获取自动下载模式
export function getAutoDownloadMode(): "prompt" | "auto" {
  const settings = getBackupSettings();
  return settings.autoDownloadMode || "prompt";
}

// 创建备份并根据设置自动保存
export async function createBackupWithAutoSave(): Promise<{
  record: BackupRecord;
  savedToFile: boolean;
  needsPrompt: boolean;
}> {
  // 创建备份到 localStorage
  const record = await createBackup();

  const settings = getBackupSettings();
  const backupData = getBackupData(record.id);

  if (!backupData) {
    return { record, savedToFile: false, needsPrompt: false };
  }

  // 如果是自动模式且支持文件系统 API
  if (settings.autoDownloadMode === "auto" && isFileSystemAccessSupported()) {
    const savedToFile = await saveBackupToFileSystem(backupData);
    return { record, savedToFile, needsPrompt: false };
  }

  // 提示模式
  return { record, savedToFile: false, needsPrompt: true };
}
