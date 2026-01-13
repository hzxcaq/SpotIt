"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAllHistory, useItems, useContainers } from "@/lib/db/hooks";
import type { HistoryAction } from "@/lib/db/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Home, QrCode, Package, ArrowRight, Clock, Edit, Trash2 } from "lucide-react";

const actionLabels: Record<HistoryAction, string> = {
  create: "添加",
  move: "移动",
  lend: "借出",
  return: "归还",
  update: "更新",
  delete: "删除",
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

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const history = useAllHistory();
  const items = useItems();
  const containers = useContainers();

  const recentHistory = history.slice(0, 4);

  const getItemName = (itemId: string) => {
    return items.find((i) => i.id === itemId)?.name || "已删除物品";
  };

  const getLocationName = (containerId?: string) => {
    if (containerId) {
      const container = containers.find((c) => c.id === containerId);
      return container?.name || "";
    }
    return "";
  };

  const getDescription = (record: typeof history[0]) => {
    switch (record.action) {
      case "create":
        return getLocationName(record.toContainerId);
      case "move":
        return getLocationName(record.toContainerId);
      case "lend":
        return record.lentTo || "";
      case "return":
        return record.lentTo ? `从 ${record.lentTo}` : "";
      default:
        return "";
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/search");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-lg px-4 py-6">
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight">SpotIt</h1>
          <p className="text-sm text-muted-foreground">物品定位助手</p>
        </header>

        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="搜索物品、容器或房间..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">搜索</Button>
          </div>
        </form>

        <section className="mb-6">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">快捷操作</h2>
          <div className="grid grid-cols-3 gap-3">
            <Link href="/items/new" className="block">
              <Button variant="outline" className="h-20 w-full flex-col gap-2">
                <Plus className="size-5" />
                <span className="text-xs">添加物品</span>
              </Button>
            </Link>
            <Link href="/rooms" className="block">
              <Button variant="outline" className="h-20 w-full flex-col gap-2">
                <Home className="size-5" />
                <span className="text-xs">按房间浏览</span>
              </Button>
            </Link>
            <Link href="/scan" className="block">
              <Button variant="outline" className="h-20 w-full flex-col gap-2">
                <QrCode className="size-5" />
                <span className="text-xs">扫码</span>
              </Button>
            </Link>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">最近操作</h2>
            <Link href="/history" className="text-xs text-muted-foreground hover:text-foreground">
              查看全部
            </Link>
          </div>
          {recentHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8">
              <Clock className="mb-2 size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">暂无操作记录</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentHistory.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                    {record.action === "create" && <Plus className="size-4" />}
                    {record.action === "move" && <ArrowRight className="size-4" />}
                    {record.action === "lend" && <Package className="size-4" />}
                    {record.action === "return" && <Package className="size-4" />}
                    {record.action === "update" && <Edit className="size-4" />}
                    {record.action === "delete" && <Trash2 className="size-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {actionLabels[record.action]} {getItemName(record.itemId)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {getDescription(record) || "-"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {formatTime(record.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
