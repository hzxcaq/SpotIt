"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRoomsByLocation, useContainersByRoom, itemsRepo, imagesRepo } from "@/lib/db/hooks";
import type { ItemUnit } from "@/lib/db/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { processImage } from "@/lib/utils/image";
import { getSuggestedTags } from "@/lib/utils/tag-suggestions";
import { useLocationContext } from "@/components/location-provider";
import { ChevronLeft, ChevronRight, Home, Box, Tag, Camera, Upload, Loader2, X } from "lucide-react";

const unitOptions: ItemUnit[] = ["个", "件", "只", "盒", "箱", "包", "袋", "卷", "张", "本", "瓶", "罐", "桶", "套", "组", "对", "米", "厘米", "克", "千克"];

type Step = "room" | "container" | "item";

export default function NewItemPage() {
  const router = useRouter();
  const { currentLocationId } = useLocationContext();
  const rooms = useRoomsByLocation(currentLocationId);
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
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
  const selectedContainer = containers.find((c) => c.id === selectedContainerId);

  useEffect(() => {
    if (step === "room") {
      console.log("Current locationId:", currentLocationId);
      console.log("Rooms:", rooms);
    }
  }, [step, currentLocationId, rooms]);

  useEffect(() => {
    const capturedPhoto = sessionStorage.getItem("capturedPhoto");
    if (capturedPhoto) {
      setImagePreview(capturedPhoto);
      sessionStorage.removeItem("capturedPhoto");

      fetch(capturedPhoto)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], "captured-photo.jpg", { type: "image/jpeg" });
          setImageFile(file);
        })
        .catch(console.error);
    }
  }, []);

  useEffect(() => {
    getSuggestedTags(itemName).then(setSuggestedTags);
  }, [itemName]);

  const handleAddTag = (tag: string) => {
    const currentTags = itemTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (!currentTags.includes(tag)) {
      const newTags = [...currentTags, tag].join(", ");
      setItemTags(newTags);
    }
  };

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

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    setUploadError(null);

    try {
      const result = await processImage(file);
      setImageFile(file);
      setImagePreview(result.dataUrl);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "图片处理失败");
      setImageFile(null);
      setImagePreview(null);
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setUploadError(null);
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

      if (imagePreview) {
        const result = await processImage(imageFile!);
        const newImage = await imagesRepo.create({
          itemId: item.id,
          dataUrl: result.dataUrl,
          mimeType: result.mimeType,
          size: result.size,
          width: result.width,
          height: result.height,
        });

        await itemsRepo.update(item.id, {
          imageId: newImage.id,
        });
      }

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
              <label className="text-sm font-medium">
                物品图片（可选）
              </label>
              {imagePreview ? (
                <div className="relative rounded-lg border overflow-hidden">
                  <div className="w-full aspect-square relative bg-muted">
                    <img
                      src={imagePreview}
                      alt="预览"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      className="bg-background/80 backdrop-blur-sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={imageUploading}
                      type="button"
                    >
                      {imageUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      className="bg-background/80 backdrop-blur-sm text-destructive hover:text-destructive"
                      onClick={handleRemoveImage}
                      type="button"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageUploading}
                  className="w-full rounded-lg border border-dashed p-8 flex flex-col items-center justify-center gap-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <Camera className="size-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {imageUploading ? "处理中..." : "点击上传图片"}
                  </p>
                </button>
              )}
              {uploadError && (
                <p className="text-sm text-destructive">{uploadError}</p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
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
              {suggestedTags.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">建议标签（点击添加）：</p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleAddTag(tag)}
                        className="rounded-full bg-muted px-2.5 py-1 text-xs hover:bg-muted/80 active:bg-muted/60 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
