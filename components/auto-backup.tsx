"use client";

import { useEffect } from "react";
import { shouldAutoBackup, createBackup } from "@/lib/utils/backup";

export function AutoBackup() {
  useEffect(() => {
    // 检查是否需要自动备份
    const checkAndBackup = async () => {
      if (shouldAutoBackup()) {
        try {
          await createBackup();
          console.log("自动备份完成");
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

  return null;
}
