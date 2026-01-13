"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
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
import { ChevronLeft, Download, Upload, AlertTriangle, CheckCircle2, Home, Box, Package } from "lucide-react";

interface ExportData {
  version: number;
  exportedAt: string;
  data: {
    rooms: unknown[];
    containers: unknown[];
    items: unknown[];
    images: unknown[];
    history: unknown[];
  };
}

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
  const [pendingImportData, setPendingImportData] = useState<ExportData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const [rooms, containers, items, images, history] = await Promise.all([
        db.rooms.toArray(),
        db.containers.toArray(),
        db.items.toArray(),
        db.images.toArray(),
        db.history.toArray(),
      ]);

      const exportData: ExportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        data: { rooms, containers, items, images, history },
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const a = document.createElement("a");
      a.href = url;
      a.download = `spotit-backup-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setResultDialog({
        open: true,
        success: true,
        message: `成功导出 ${rooms.length} 个房间、${containers.length} 个容器、${items.length} 件物品`,
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text) as ExportData;

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
      await db.transaction("rw", [db.rooms, db.containers, db.items, db.images, db.history], async () => {
        await db.history.clear();
        await db.images.clear();
        await db.items.clear();
        await db.containers.clear();
        await db.rooms.clear();

        const { rooms, containers, items, images, history } = pendingImportData.data;
        if (rooms.length) await db.rooms.bulkAdd(rooms as never[]);
        if (containers.length) await db.containers.bulkAdd(containers as never[]);
        if (items.length) await db.items.bulkAdd(items as never[]);
        if (images.length) await db.images.bulkAdd(images as never[]);
        if (history.length) await db.history.bulkAdd(history as never[]);
      });

      const { rooms, containers, items } = pendingImportData.data;
      setResultDialog({
        open: true,
        success: true,
        message: `成功导入 ${rooms.length} 个房间、${containers.length} 个容器、${items.length} 件物品`,
      });
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
            <p className="text-sm text-muted-foreground">管理应用数据</p>
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
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">数据管理</h2>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={handleExport}
              disabled={exporting}
            >
              <Download className="size-5" />
              <div className="text-left">
                <p className="font-medium">{exporting ? "导出中..." : "导出数据"}</p>
                <p className="text-xs text-muted-foreground">将所有数据备份为 JSON 文件</p>
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
                <p className="font-medium">{importing ? "导入中..." : "导入数据"}</p>
                <p className="text-xs text-muted-foreground">从 JSON 备份文件恢复数据</p>
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
          <div className="rounded-lg border p-4">
            <p className="font-medium">SpotIt</p>
            <p className="text-sm text-muted-foreground">物品定位助手 v0.1.0</p>
            <p className="mt-2 text-xs text-muted-foreground">
              数据存储在本地浏览器中，清除浏览器数据会导致数据丢失。建议定期导出备份。
            </p>
          </div>
        </section>
      </main>

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
