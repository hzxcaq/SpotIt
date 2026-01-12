"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useItems, useContainers, useRooms } from "@/lib/db/hooks";
import type { Item } from "@/lib/db/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Search, Tag, Box, Home, ChevronRight } from "lucide-react";

const statusLabels: Record<Item["status"], string> = {
  in_stock: "在库",
  lent: "已借出",
  consumed: "已消耗",
  disposed: "已处置",
  lost: "遗失",
};

const statusColors: Record<Item["status"], string> = {
  in_stock: "bg-green-100 text-green-800",
  lent: "bg-yellow-100 text-yellow-800",
  consumed: "bg-gray-100 text-gray-800",
  disposed: "bg-red-100 text-red-800",
  lost: "bg-red-100 text-red-800",
};

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);

  const items = useItems();
  const containers = useContainers();
  const rooms = useRooms();

  const containerMap = useMemo(() => {
    const map = new Map<string, { name: string; roomId: string }>();
    containers.forEach((c) => map.set(c.id, { name: c.name, roomId: c.roomId }));
    return map;
  }, [containers]);

  const roomMap = useMemo(() => {
    const map = new Map<string, string>();
    rooms.forEach((r) => map.set(r.id, r.name));
    return map;
  }, [rooms]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return items.filter((item) => {
      const nameMatch = item.name.toLowerCase().includes(q);
      const aliasMatch = item.alias?.toLowerCase().includes(q);
      const tagsMatch = item.tags?.some((tag) => tag.toLowerCase().includes(q));
      const notesMatch = item.notes?.toLowerCase().includes(q);
      return nameMatch || aliasMatch || tagsMatch || notesMatch;
    });
  }, [items, query]);

  const getLocation = (item: Item) => {
    const container = item.containerId ? containerMap.get(item.containerId) : null;
    const roomId = container?.roomId ?? item.roomId;
    const roomName = roomId ? roomMap.get(roomId) : null;
    return {
      roomName,
      containerName: container?.name,
    };
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
            <h1 className="text-xl font-bold">搜索</h1>
            <p className="text-sm text-muted-foreground">搜索物品、容器或房间</p>
          </div>
        </header>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="输入关键字搜索..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
        </div>

        {query.trim() === "" ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Search className="mb-3 size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">输入关键字开始搜索</p>
            <p className="text-xs text-muted-foreground mt-1">
              支持搜索物品名称、别名、标签、备注
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Search className="mb-3 size-10 text-muted-foreground" />
            <p className="text-sm font-medium">未找到匹配结果</p>
            <p className="text-xs text-muted-foreground mt-1">
              尝试使用其他关键字
            </p>
          </div>
        ) : (
          <div>
            <p className="mb-3 text-sm text-muted-foreground">
              找到 {filteredItems.length} 个结果
            </p>
            <div className="space-y-2">
              {filteredItems.map((item) => {
                const location = getLocation(item);
                return (
                  <Link
                    key={item.id}
                    href={`/items/${item.id}`}
                    className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                        <Tag className="size-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{item.name}</p>
                          <span className={`rounded px-1.5 py-0.5 text-xs ${statusColors[item.status]}`}>
                            {statusLabels[item.status]}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} {item.unit}
                          {(location.roomName || location.containerName) && (
                            <span className="ml-2">
                              {location.roomName && (
                                <span className="inline-flex items-center gap-0.5">
                                  <Home className="size-3" />
                                  {location.roomName}
                                </span>
                              )}
                              {location.containerName && (
                                <span className="inline-flex items-center gap-0.5 ml-1">
                                  <Box className="size-3" />
                                  {location.containerName}
                                </span>
                              )}
                            </span>
                          )}
                        </p>
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="rounded bg-muted px-1.5 py-0.5 text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                            {item.tags.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{item.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="size-5 text-muted-foreground" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
