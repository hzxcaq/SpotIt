"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { db, initializeDefaultTemplate } from "@/lib/db";
import { useStats } from "@/lib/db/hooks";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, Download, Upload, AlertTriangle, CheckCircle2, Home, Box, Package, Clock, Trash2, HardDrive, RefreshCw, FolderOpen, BookOpen, Tag } from "lucide-react";
import {
  getBackupSettings,
  enableAutoBackup,
  disableAutoBackup,
  createBackup,
  restoreBackup,
  deleteBackup,
  getBackupData,
  downloadBackup,
  formatSize,
  getBackupLocationInfo,
  isFileSystemAccessSupported,
  selectBackupDirectory,
  getBackupDirectoryPath,
  clearDirectoryHandle,
  setAutoDownloadMode,
  getAutoDownloadMode,
  type BackupData,
  type BackupRecord,
} from "@/lib/utils/backup";

export default function SettingsPage() {
  const stats = useStats();
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [resultDialog, setResultDialog] = useState<{ open: boolean; success: boolean; message: string }>({
    open: false,
    success: false,
    message: "",
  });
  const [pendingImportData, setPendingImportData] = useState<BackupData | null>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupRecord | null>(null);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [backupHistory, setBackupHistory] = useState<BackupRecord[]>([]);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [autoDownloadMode, setAutoDownloadModeState] = useState<"prompt" | "auto">("prompt");
  const [backupDirPath, setBackupDirPath] = useState<string | null>(null);
  const [fsApiSupported, setFsApiSupported] = useState(false);
  const [deleteBackupDialogOpen, setDeleteBackupDialogOpen] = useState(false);
  const [backupToDelete, setBackupToDelete] = useState<BackupRecord | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 加载备份设置
  useEffect(() => {
    const settings = getBackupSettings();
    setAutoBackupEnabled(settings.autoBackupEnabled);
    setBackupHistory(settings.backupHistory);
    setAutoDownloadModeState(getAutoDownloadMode());
    setFsApiSupported(isFileSystemAccessSupported());

    // 加载备份文件夹路径
    if (isFileSystemAccessSupported()) {
      getBackupDirectoryPath().then(setBackupDirPath);
    }
  }, []);

  // 切换自动备份
  const handleToggleAutoBackup = () => {
    if (autoBackupEnabled) {
      disableAutoBackup();
      setAutoBackupEnabled(false);
      setResultDialog({
        open: true,
        success: true,
        message: "已关闭自动备份",
      });
    } else {
      enableAutoBackup();
      setAutoBackupEnabled(true);
      setResultDialog({
        open: true,
        success: true,
        message: "已开启自动备份，将在每天零点后首次访问时自动备份",
      });
    }
  };

  // 手动创建备份
  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      const record = await createBackup();
      const settings = getBackupSettings();
      setBackupHistory(settings.backupHistory);
      setResultDialog({
        open: true,
        success: true,
        message: `备份创建成功，包含 ${record.itemCount} 件物品`,
      });
    } catch (error) {
      setResultDialog({
        open: true,
        success: false,
        message: error instanceof Error ? error.message : "备份创建失败",
      });
    } finally {
      setCreatingBackup(false);
    }
  };

  // 选择备份文件夹
  const handleSelectDirectory = async () => {
    try {
      const dirHandle = await selectBackupDirectory();
      if (dirHandle) {
        setBackupDirPath(dirHandle.name);
        setAutoDownloadMode("auto");
        setAutoDownloadModeState("auto");
        setResultDialog({
          open: true,
          success: true,
          message: `已选择备份文件夹：${dirHandle.name}`,
        });
      }
    } catch (error) {
      setResultDialog({
        open: true,
        success: false,
        message: error instanceof Error ? error.message : "选择文件夹失败",
      });
    }
  };

  // 切换备份模式
  const handleToggleBackupMode = async (mode: "prompt" | "auto") => {
    if (mode === "auto" && !backupDirPath) {
      // 需要先选择文件夹
      await handleSelectDirectory();
    } else if (mode === "prompt") {
      // 切换到提示模式，清除文件夹
      await clearDirectoryHandle();
      setBackupDirPath(null);
      setAutoDownloadMode(mode);
      setAutoDownloadModeState(mode);
    } else {
      setAutoDownloadMode(mode);
      setAutoDownloadModeState(mode);
    }
  };

  // 恢复备份
  const handleRestoreBackup = (record: BackupRecord) => {
    setSelectedBackup(record);
    setRestoreDialogOpen(true);
  };

  const confirmRestore = async () => {
    if (!selectedBackup) return;

    setRestoreDialogOpen(false);
    setImporting(true);

    try {
      await restoreBackup(selectedBackup.id);
      await initializeDefaultTemplate();

      setResultDialog({
        open: true,
        success: true,
        message: "备份恢复成功",
      });

      // 刷新页面以重新加载数据
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setResultDialog({
        open: true,
        success: false,
        message: error instanceof Error ? error.message : "恢复失败",
      });
    } finally {
      setImporting(false);
      setSelectedBackup(null);
    }
  };

  // 下载备份
  const handleDownloadBackup = (record: BackupRecord) => {
    const backupData = getBackupData(record.id);
    if (!backupData) {
      setResultDialog({
        open: true,
        success: false,
        message: "备份数据不存在",
      });
      return;
    }

    const date = new Date(record.timestamp).toISOString().slice(0, 10).replace(/-/g, "");
    downloadBackup(backupData, `spotit-backup-${date}.json`);
  };

  // 删除备份
  const handleDeleteBackup = (record: BackupRecord) => {
    setBackupToDelete(record);
    setDeleteBackupDialogOpen(true);
  };

  const confirmDeleteBackup = () => {
    if (!backupToDelete) return;

    deleteBackup(backupToDelete.id);
    const settings = getBackupSettings();
    setBackupHistory(settings.backupHistory);
    setDeleteBackupDialogOpen(false);
    setBackupToDelete(null);
    setResultDialog({
      open: true,
      success: true,
      message: "备份已删除",
    });
  };

  // 导出当前数据
  const handleExport = async () => {
    setExporting(true);
    try {
      const [locations, rooms, containers, items, images, history] = await Promise.all([
        db.locations.toArray(),
        db.rooms.toArray(),
        db.containers.toArray(),
        db.items.toArray(),
        db.images.toArray(),
        db.history.toArray(),
      ]);

      const exportData: BackupData = {
        version: 2,
        exportedAt: new Date().toISOString(),
        data: { locations, rooms, containers, items, images, history },
      };

      const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      downloadBackup(exportData, `spotit-backup-${date}.json`);

      setResultDialog({
        open: true,
        success: true,
        message: `成功导出 ${locations.length} 个地点、${rooms.length} 个房间、${containers.length} 个容器、${items.length} 件物品`,
      });
    } catch (error) {
      setResultDialog({
        open: true,
        success: false,
        message: error instanceof Error ? error.message : "导出失败",
      });
    } finally {
      setExporting(false);
    }
  };

  // 从文件导入
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text) as BackupData;

      if (!data.version || !data.data) {
        throw new Error("无效的备份文件格式");
      }

      if (!data.data.rooms || !data.data.containers || !data.data.items) {
        throw new Error("备份文件缺少必要数据");
      }

      setPendingImportData(data);
      setImportDialogOpen(true);
    } catch (error) {
      setResultDialog({
        open: true,
        success: false,
        message: error instanceof Error ? error.message : "文件解析失败",
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImportConfirm = async () => {
    if (!pendingImportData) return;

    setImportDialogOpen(false);
    setImporting(true);

    try {
      await db.transaction("rw", [db.locations, db.rooms, db.containers, db.items, db.images, db.history], async () => {
        await db.history.clear();
        await db.images.clear();
        await db.items.clear();
        await db.containers.clear();
        await db.rooms.clear();
        await db.locations.clear();

        const { locations, rooms, containers, items, images, history } = pendingImportData.data;
        if (locations && locations.length) await db.locations.bulkAdd(locations as never[]);
        if (rooms.length) await db.rooms.bulkAdd(rooms as never[]);
        if (containers.length) await db.containers.bulkAdd(containers as never[]);
        if (items.length) await db.items.bulkAdd(items as never[]);
        if (images && images.length) await db.images.bulkAdd(images as never[]);
        if (history && history.length) await db.history.bulkAdd(history as never[]);
      });

      await initializeDefaultTemplate();

      const { locations, rooms, containers, items } = pendingImportData.data;
      setResultDialog({
        open: true,
        success: true,
        message: `成功导入 ${locations?.length || 0} 个地点、${rooms.length} 个房间、${containers.length} 个容器、${items.length} 件物品`,
      });

      // 刷新页面以重新加载数据
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setResultDialog({
        open: true,
        success: false,
        message: error instanceof Error ? error.message : "导入失败",
      });
    } finally {
      setImporting(false);
      setPendingImportData(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-lg px-4 py-6">
        <header className="mb-6 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon-sm">
              <ChevronLeft className="size-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">设置</h1>
            <p className="text-sm text-muted-foreground">管理应用数据和备份</p>
          </div>
        </header>

        <section className="mb-6">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">数据统计</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center rounded-lg border p-4">
              <Home className="mb-2 size-5 text-muted-foreground" />
              <p className="text-2xl font-bold">{stats.roomCount}</p>
              <p className="text-xs text-muted-foreground">房间</p>
            </div>
            <div className="flex flex-col items-center rounded-lg border p-4">
              <Box className="mb-2 size-5 text-muted-foreground" />
              <p className="text-2xl font-bold">{stats.containerCount}</p>
              <p className="text-xs text-muted-foreground">容器</p>
            </div>
            <div className="flex flex-col items-center rounded-lg border p-4">
              <Package className="mb-2 size-5 text-muted-foreground" />
              <p className="text-2xl font-bold">{stats.itemCount}</p>
              <p className="text-xs text-muted-foreground">物品</p>
            </div>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">自动备份</h2>
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-medium">自动备份</p>
                <p className="text-xs text-muted-foreground">
                  {autoBackupEnabled ? "已开启，每天零点后首次访问时自动备份" : "已关闭"}
                </p>
              </div>
              <Button
                variant={autoBackupEnabled ? "default" : "outline"}
                size="sm"
                onClick={handleToggleAutoBackup}
              >
                {autoBackupEnabled ? "已开启" : "开启"}
              </Button>
            </div>

            {autoBackupEnabled && (
              <div className="space-y-3 mt-4 pt-4 border-t">
                <div>
                  <p className="text-sm font-medium mb-2">备份方式</p>
                  <div className="space-y-2">
                    <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
                      <input
                        type="radio"
                        name="backup-mode"
                        value="prompt"
                        checked={autoDownloadMode === "prompt"}
                        onChange={() => handleToggleBackupMode("prompt")}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">提示下载</p>
                        <p className="text-xs text-muted-foreground">
                          备份后提示下载，兼容所有浏览器
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
                      <input
                        type="radio"
                        name="backup-mode"
                        value="auto"
                        checked={autoDownloadMode === "auto"}
                        onChange={() => handleToggleBackupMode("auto")}
                        disabled={!fsApiSupported}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          自动保存到文件夹
                          {fsApiSupported && " (推荐)"}
                          {!fsApiSupported && " (不支持)"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {fsApiSupported
                            ? "自动保存到指定文件夹，无需手动下载"
                            : "您的浏览器不支持此功能，请使用 Chrome 86+ 或 Edge 86+"}
                        </p>
                        {autoDownloadMode === "auto" && backupDirPath && (
                          <div className="mt-2 flex items-center gap-2">
                            <FolderOpen className="size-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {backupDirPath}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={(e) => {
                                e.preventDefault();
                                handleSelectDirectory();
                              }}
                            >
                              更改
                            </Button>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground mt-3">
              <p className="font-medium mb-1">💡 备份说明：</p>
              <p>• 浏览器备份：保存在 {getBackupLocationInfo()}</p>
              {autoDownloadMode === "auto" && backupDirPath ? (
                <>
                  <p>• 文件备份：自动保存到 {backupDirPath} 文件夹</p>
                  <p>• 文件名：spotit-backup-latest.json（自动覆盖）</p>
                </>
              ) : (
                <p>• 文件备份：需要手动下载到电脑或云盘</p>
              )}
              <p>• 浏览器备份自动保留最近 7 天</p>
              <p>• 清除浏览器数据会同时清除浏览器备份</p>
            </div>
          </div>
        </section>

        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground">备份历史</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateBackup}
              disabled={creatingBackup}
            >
              <RefreshCw className={`size-4 ${creatingBackup ? "animate-spin" : ""}`} />
              {creatingBackup ? "创建中..." : "立即备份"}
            </Button>
          </div>
          {backupHistory.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <HardDrive className="mx-auto mb-2 size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">暂无备份记录</p>
              <p className="text-xs text-muted-foreground mt-1">
                {autoBackupEnabled ? "将在明天零点后自动创建" : "开启自动备份或手动创建"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {backupHistory.slice().reverse().map((record) => (
                <div key={record.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Clock className="size-4 text-muted-foreground" />
                        <p className="text-sm font-medium">
                          {new Date(record.timestamp).toLocaleString("zh-CN")}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {record.itemCount} 件物品 · {formatSize(record.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleRestoreBackup(record)}
                    >
                      <Upload className="size-4" />
                      恢复
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownloadBackup(record)}
                    >
                      <Download className="size-4" />
                      下载
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteBackup(record)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mb-6">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">手动备份与恢复</h2>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={handleExport}
              disabled={exporting}
            >
              <Download className="size-5" />
              <div className="text-left">
                <p className="font-medium">{exporting ? "导出中..." : "导出到文件"}</p>
                <p className="text-xs text-muted-foreground">下载备份文件到电脑或云盘</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
            >
              <Upload className="size-5" />
              <div className="text-left">
                <p className="font-medium">{importing ? "导入中..." : "从文件恢复"}</p>
                <p className="text-xs text-muted-foreground">从备份文件恢复数据</p>
              </div>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">关于</h2>
          <div className="space-y-3">
            <Link href="/settings/tags">
              <div className="rounded-lg border p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Tag className="size-5 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">标签管理</p>
                    <p className="text-xs text-muted-foreground">管理标签分类和查看使用统计</p>
                  </div>
                  <ChevronLeft className="size-5 rotate-180 text-muted-foreground" />
                </div>
              </div>
            </Link>

            <Link href="/help">
              <div className="rounded-lg border p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <BookOpen className="size-5 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">使用指南</p>
                    <p className="text-xs text-muted-foreground">查看完整的使用教程和常见问题</p>
                  </div>
                  <ChevronLeft className="size-5 rotate-180 text-muted-foreground" />
                </div>
              </div>
            </Link>

            <div className="rounded-lg border p-4">
              <p className="font-medium">SpotIt</p>
              <p className="text-sm text-muted-foreground">物品定位助手 v0.2.0</p>
              <p className="mt-2 text-xs text-muted-foreground">
                数据存储在本地浏览器中。建议开启自动备份，并定期下载备份文件到安全位置。
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* 恢复备份确认对话框 */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-yellow-500" />
              确认恢复备份
            </DialogTitle>
            <DialogDescription>
              恢复备份将会清空当前所有数据，然后写入备份中的数据。此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          {selectedBackup && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p>备份时间: {new Date(selectedBackup.timestamp).toLocaleString("zh-CN")}</p>
              <p>物品数量: {selectedBackup.itemCount} 件</p>
              <p>备份大小: {formatSize(selectedBackup.size)}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmRestore}>
              确认恢复
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 从文件导入确认对话框 */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-yellow-500" />
              确认导入
            </DialogTitle>
            <DialogDescription>
              导入将会清空当前所有数据，然后写入备份文件中的数据。此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          {pendingImportData && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p>备份时间: {new Date(pendingImportData.exportedAt).toLocaleString("zh-CN")}</p>
              <p>地点: {pendingImportData.data.locations?.length || 0} 个</p>
              <p>房间: {pendingImportData.data.rooms.length} 个</p>
              <p>容器: {pendingImportData.data.containers.length} 个</p>
              <p>物品: {pendingImportData.data.items.length} 件</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleImportConfirm}>
              确认导入
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除备份确认对话框 */}
      <Dialog open={deleteBackupDialogOpen} onOpenChange={setDeleteBackupDialogOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-yellow-500" />
              确认删除备份
            </DialogTitle>
            <DialogDescription>
              确定要删除这个备份吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          {backupToDelete && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p>备份时间: {new Date(backupToDelete.timestamp).toLocaleString("zh-CN")}</p>
              <p>物品数量: {backupToDelete.itemCount} 件</p>
              <p>备份大小: {formatSize(backupToDelete.size)}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteBackupDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDeleteBackup}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 结果提示对话框 */}
      <Dialog open={resultDialog.open} onOpenChange={(open) => setResultDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {resultDialog.success ? (
                <CheckCircle2 className="size-5 text-green-500" />
              ) : (
                <AlertTriangle className="size-5 text-destructive" />
              )}
              {resultDialog.success ? "操作成功" : "操作失败"}
            </DialogTitle>
            <DialogDescription>{resultDialog.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setResultDialog((prev) => ({ ...prev, open: false }))}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
