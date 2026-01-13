"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRooms, useContainersByRoom, itemsRepo } from "@/lib/db/hooks";
import type { ItemUnit } from "@/lib/db/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Home, Box, Tag } from "lucide-react";

const unitOptions: ItemUnit[] = ["个", "件", "只", "盒", "箱", "包", "袋", "卷", "张", "本", "瓶", "罐", "桶", "套", "组", "对", "米", "厘米", "克", "千克"];

type Step = "room" | "container" | "item";

export default function NewItemPage() {
  const router = useRouter();
  const rooms = useRooms();
  const [step, setStep] = useState<Step>("room");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);
  const containers = useContainersByRoom(selectedRoomId ?? undefined);

  const [itemName, setItemName] = useState("");
  const [itemQuantity, setItemQuantity] = useState("1");
  const [itemUnit, setItemUnit] = useState<ItemUnit>("个");
  const [itemTags, setItemTags] = useState("");
  const [itemNotes, setItemNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
  const selectedContainer = containers.find((c) => c.id === selectedContainerId);

  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
    setSelectedContainerId(null);
    setStep("container");
  };

  const handleContainerSelect = (containerId: string) => {
    setSelectedContainerId(containerId);
    setStep("item");
  };

  const handleBack = () => {
    if (step === "container") {
      setStep("room");
      setSelectedRoomId(null);
    } else if (step === "item") {
      setStep("container");
      setSelectedContainerId(null);
    }
  };

  const handleSubmit = async () => {
    if (!itemName.trim() || !selectedRoomId || !selectedContainerId) return;

    setSubmitting(true);
    try {
      const tags = itemTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const item = await itemsRepo.create({
        name: itemName.trim(),
        quantity: parseInt(itemQuantity, 10) || 1,
        unit: itemUnit,
        tags,
        notes: itemNotes.trim() || undefined,
        containerId: selectedContainerId,
        roomId: selectedRoomId,
        status: "in_stock",
      });

      router.push(`/items/${item.id}`);
    } catch (error) {
      console.error("Failed to create item:", error);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-lg px-4 py-6">
        <header className="mb-6 flex items-center gap-3">
          {step === "room" ? (
            <Link href="/">
              <Button variant="ghost" size="icon-sm">
                <ChevronLeft className="size-5" />
              </Button>
            </Link>
          ) : (
            <Button variant="ghost" size="icon-sm" onClick={handleBack}>
              <ChevronLeft className="size-5" />
            </Button>
          )}
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <Tag className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">添加物品</h1>
              <p className="text-sm text-muted-foreground">
                {step === "room" && "选择存放房间"}
                {step === "container" && `${selectedRoom?.name} · 选择容器`}
                {step === "item" && `${selectedRoom?.name} · ${selectedContainer?.name}`}
              </p>
            </div>
          </div>
        </header>

        {step === "room" && (
          <div className="space-y-2">
            {rooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
                <Home className="mb-3 size-10 text-muted-foreground" />
                <p className="mb-1 text-sm font-medium">暂无房间</p>
                <p className="mb-4 text-xs text-muted-foreground">请先创建房间</p>
                <Link href="/rooms">
                  <Button size="sm">前往创建</Button>
                </Link>
              </div>
            ) : (
              rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => handleRoomSelect(room.id)}
                  className="flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                      <Home className="size-5" />
                    </div>
                    <div>
                      <p className="font-medium">{room.name}</p>
                      {room.description && (
                        <p className="text-sm text-muted-foreground">{room.description}</p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="size-5 text-muted-foreground" />
                </button>
              ))
            )}
          </div>
        )}

        {step === "container" && (
          <div className="space-y-2">
            {containers.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
                <Box className="mb-3 size-10 text-muted-foreground" />
                <p className="mb-1 text-sm font-medium">该房间暂无容器</p>
                <p className="mb-4 text-xs text-muted-foreground">请先在此房间创建容器</p>
                <Link href={`/rooms/${selectedRoomId}`}>
                  <Button size="sm">前往创建</Button>
                </Link>
              </div>
            ) : (
              containers.map((container) => (
                <button
                  key={container.id}
                  onClick={() => handleContainerSelect(container.id)}
                  className="flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                      <Box className="size-5" />
                    </div>
                    <div>
                      <p className="font-medium">{container.name}</p>
                      {container.description && (
                        <p className="text-sm text-muted-foreground">{container.description}</p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="size-5 text-muted-foreground" />
                </button>
              ))
            )}
          </div>
        )}

        {step === "item" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="item-name" className="text-sm font-medium">
                物品名称 <span className="text-destructive">*</span>
              </label>
              <Input
                id="item-name"
                placeholder="例如：螺丝刀、充电器、书籍"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                autoFocus
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

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={!itemName.trim() || submitting}
            >
              {submitting ? "创建中..." : "创建物品"}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
