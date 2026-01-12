"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useContainer, useRoom, useItemsByContainer, itemsRepo } from "@/lib/db/hooks";
import type { Item, ItemUnit } from "@/lib/db/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, ChevronRight, ChevronLeft, Package, Box, Tag, MoreHorizontal, Edit, Trash2 } from "lucide-react";

interface ContainerDetailPageProps {
  params: Promise<{ containerId: string }>;
}

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

const unitOptions: ItemUnit[] = ["个", "件", "只", "盒", "箱", "包", "袋", "卷", "张", "本", "瓶", "罐", "桶", "套", "组", "对", "米", "厘米", "克", "千克"];

export default function ContainerDetailPage({ params }: ContainerDetailPageProps) {
  const { containerId } = use(params);
  const container = useContainer(containerId);
  const room = useRoom(container?.roomId);
  const items = useItemsByContainer(containerId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemQuantity, setItemQuantity] = useState("1");
  const [itemUnit, setItemUnit] = useState<ItemUnit>("个");
  const [itemTags, setItemTags] = useState("");
  const [itemNotes, setItemNotes] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const openCreateDialog = () => {
    setEditingItem(null);
    setItemName("");
    setItemQuantity("1");
    setItemUnit("个");
    setItemTags("");
    setItemNotes("");
    setDialogOpen(true);
  };

  const openEditDialog = (item: Item) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemQuantity(String(item.quantity));
    setItemUnit(item.unit);
    setItemTags(item.tags?.join(", ") || "");
    setItemNotes(item.notes || "");
    setDialogOpen(true);
    setMenuOpenId(null);
  };

  const handleSubmit = async () => {
    if (!itemName.trim() || !container) return;

    const tags = itemTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingItem) {
      await itemsRepo.update(editingItem.id, {
        name: itemName.trim(),
        quantity: parseInt(itemQuantity, 10) || 1,
        unit: itemUnit,
        tags,
        notes: itemNotes.trim() || undefined,
      });
    } else {
      await itemsRepo.create({
        name: itemName.trim(),
        quantity: parseInt(itemQuantity, 10) || 1,
        unit: itemUnit,
        tags,
        notes: itemNotes.trim() || undefined,
        containerId,
        roomId: container.roomId,
        status: "in_stock",
      });
    }

    setDialogOpen(false);
    setEditingItem(null);
    setItemName("");
    setItemQuantity("1");
    setItemUnit("个");
    setItemTags("");
    setItemNotes("");
  };

  const handleDelete = async (itemId: string) => {
    if (confirm("确定要删除此物品吗？")) {
      await itemsRepo.delete(itemId);
    }
    setMenuOpenId(null);
  };

  if (!container) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-lg px-4 py-6">
        <header className="mb-6 flex items-center gap-3">
          <Link href={room ? `/rooms/${room.id}` : "/rooms"}>
            <Button variant="ghost" size="icon-sm">
              <ChevronLeft className="size-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <Box className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{container.name}</h1>
              <p className="text-sm text-muted-foreground">
                {room?.name || "未知房间"}
                {container.description && ` · ${container.description}`}
              </p>
            </div>
          </div>
        </header>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            共 {items.length} 件物品
          </p>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openCreateDialog}>
                <Plus className="size-4" />
                新增物品
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingItem ? "编辑物品" : "新增物品"}</DialogTitle>
                <DialogDescription>
                  {editingItem ? "修改物品信息" : `在 ${container.name} 中添加一个新物品`}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="item-name" className="text-sm font-medium">
                    物品名称
                  </label>
                  <Input
                    id="item-name"
                    placeholder="例如：螺丝刀、充电器、书籍"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="item-quantity" className="text-sm font-medium">
                      数量
                    </label>
                    <Input
                      id="item-quantity"
                      type="number"
                      min="1"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="item-unit" className="text-sm font-medium">
                      单位
                    </label>
                    <select
                      id="item-unit"
                      value={itemUnit}
                      onChange={(e) => setItemUnit(e.target.value as ItemUnit)}
                      className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
                    >
                      {unitOptions.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="item-tags" className="text-sm font-medium">
                    标签（可选，逗号分隔）
                  </label>
                  <Input
                    id="item-tags"
                    placeholder="例如：工具, 电子, 常用"
                    value={itemTags}
                    onChange={(e) => setItemTags(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="item-notes" className="text-sm font-medium">
                    备注（可选）
                  </label>
                  <Input
                    id="item-notes"
                    placeholder="物品的备注信息"
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleSubmit} disabled={!itemName.trim()}>
                  {editingItem ? "保存" : "创建"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
            <Package className="mb-3 size-10 text-muted-foreground" />
            <p className="mb-1 text-sm font-medium">暂无物品</p>
            <p className="mb-4 text-xs text-muted-foreground">点击上方按钮添加第一个物品</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="relative flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <Link
                  href={`/items/${item.id}`}
                  className="flex flex-1 items-center gap-3"
                >
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
                      {item.lentTo && ` · 借给 ${item.lentTo}`}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-1">
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        setMenuOpenId(menuOpenId === item.id ? null : item.id);
                      }}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                    {menuOpenId === item.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setMenuOpenId(null)}
                        />
                        <div className="absolute right-0 top-full z-20 mt-1 w-32 rounded-md border bg-background py-1 shadow-lg">
                          <button
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                            onClick={() => openEditDialog(item)}
                          >
                            <Edit className="size-4" />
                            编辑
                          </button>
                          <button
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="size-4" />
                            删除
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  <Link href={`/items/${item.id}`}>
                    <ChevronRight className="size-5 text-muted-foreground" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
