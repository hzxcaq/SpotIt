"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Home, QrCode, Package, ArrowRight, Clock } from "lucide-react";

const recentActivities = [
  { id: "1", action: "添加", item: "螺丝刀套装", location: "工具箱", time: "5 分钟前" },
  { id: "2", action: "移动", item: "充电器", location: "客厅抽屉", time: "1 小时前" },
  { id: "3", action: "借出", item: "电钻", location: "张三", time: "2 小时前" },
  { id: "4", action: "归还", item: "万用表", location: "工具柜", time: "昨天" },
];

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

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
          <div className="space-y-2">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                  {activity.action === "添加" && <Plus className="size-4" />}
                  {activity.action === "移动" && <ArrowRight className="size-4" />}
                  {activity.action === "借出" && <Package className="size-4" />}
                  {activity.action === "归还" && <Package className="size-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {activity.action} {activity.item}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {activity.location}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  {activity.time}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
