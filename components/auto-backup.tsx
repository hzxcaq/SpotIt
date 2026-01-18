"use client";

import { useEffect, useState } from "react";
import { shouldAutoBackup, createBackupWithAutoSave, getBackupData, downloadBackup } from "@/lib/utils/backup";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Download } from "lucide-react";

export function AutoBackup() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [backupId, setBackupId] = useState<string | null>(null);

  useEffect(() => {
    // 检查是否需要自动备份
    const checkAndBackup = async () => {
      if (shouldAutoBackup()) {
        try {
          const result = await createBackupWithAutoSave();
          console.log("自动备份完成", result);

          // 如果需要提示用户下载
          if (result.needsPrompt) {
            setBackupId(result.record.id);
            setShowPrompt(true);
          }
        } catch (error) {
          console.error("自动备份失败:", error);
        }
      }
    };

    // 页面加载时检查
    checkAndBackup();

    // 每小时检查一次
    const interval = setInterval(checkAndBackup, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleDownload = () => {
    if (!backupId) return;

    const backupData = getBackupData(backupId);
    if (backupData) {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      downloadBackup(backupData, `spotit-backup-${date}.json`);
    }

    setShowPrompt(false);
    setBackupId(null);
  };

  const handleLater = () => {
    setShowPrompt(false);
    setBackupId(null);
  };

  return (
    <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-green-500" />
            自动备份完成
          </DialogTitle>
          <DialogDescription>
            今日备份已创建，建议下载备份文件到电脑或云盘，以防数据丢失。
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          <p className="font-medium mb-1">💡 提示：</p>
          <p>• 备份文件可在设置页面随时下载</p>
          <p>• 建议保存到安全位置（电脑、云盘）</p>
          <p>• 更换浏览器时可用备份文件恢复数据</p>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleLater} className="w-full sm:w-auto">
            稍后下载
          </Button>
          <Button onClick={handleDownload} className="w-full sm:w-auto">
            <Download className="size-4" />
            立即下载
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
