"use client";

import Link from "next/link";
import { useAllHistory, useItems, useContainers, useRooms } from "@/lib/db/hooks";
import type { HistoryAction } from "@/lib/db/types";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Plus, ArrowRight, Package, Clock, Trash2, Edit } from "lucide-react";

const actionLabels: Record<HistoryAction, string> = {
  create: "添加",
  move: "移动",
  lend: "借出",
  return: "归还",
  update: "更新",
  delete: "删除",
};

const actionIcons: Record<HistoryAction, React.ReactNode> = {
  create: <Plus className="size-4" />,
  move: <ArrowRight className="size-4" />,
  lend: <Package className="size-4" />,
  return: <Package className="size-4" />,
  update: <Edit className="size-4" />,
  delete: <Trash2 className="size-4" />,
};

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;

  return new Date(timestamp).toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  });
}

export default function HistoryPage() {
  const history = useAllHistory();
  const items = useItems();
  const containers = useContainers();
  const rooms = useRooms();

  const getItemName = (itemId: string) => {
    return items.find((i) => i.id === itemId)?.name || "已删除物品";
  };

  const getLocationName = (containerId?: string, roomId?: string) => {
    if (containerId) {
      const container = containers.find((c) => c.id === containerId);
      return container?.name || "未知容器";
    }
    if (roomId) {
      const room = rooms.find((r) => r.id === roomId);
      return room?.name || "未知房间";
    }
    return "";
  };

  const getDescription = (record: typeof history[0]) => {
    switch (record.action) {
      case "create":
        return getLocationName(record.toContainerId, record.toRoomId);
      case "move":
        return `${getLocationName(record.fromContainerId, record.fromRoomId)} → ${getLocationName(record.toContainerId, record.toRoomId)}`;
      case "lend":
        return record.lentTo || "";
      case "return":
        return record.lentTo ? `从 ${record.lentTo}` : "";
      case "delete":
        return "";
      default:
        return "";
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
            <h1 className="text-xl font-bold">操作历史</h1>
            <p className="text-sm text-muted-foreground">最近 50 条记录</p>
          </div>
        </header>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
            <Clock className="mb-3 size-10 text-muted-foreground" />
            <p className="mb-1 text-sm font-medium">暂无操作记录</p>
            <p className="text-xs text-muted-foreground">添加物品后会在这里显示操作历史</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((record) => {
              const itemExists = items.some((i) => i.id === record.itemId);
              return (
                <div
                  key={record.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                    {actionIcons[record.action]}
                  </div>
                  <div className="min-w-0 flex-1">
                    {itemExists ? (
                      <Link
                        href={`/items/${record.itemId}`}
                        className="truncate text-sm font-medium hover:underline"
                      >
                        {actionLabels[record.action]} {getItemName(record.itemId)}
                      </Link>
                    ) : (
                      <p className="truncate text-sm font-medium">
                        {actionLabels[record.action]} {getItemName(record.itemId)}
                      </p>
                    )}
                    <p className="truncate text-xs text-muted-foreground">
                      {getDescription(record) || "-"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {formatTime(record.createdAt)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
