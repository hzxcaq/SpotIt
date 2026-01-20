"use client";

import { use, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useContainer, useRoom, useItemsByContainer, itemsRepo, imagesRepo, useItemImage } from "@/lib/db/hooks";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { processImage } from "@/lib/utils/image";
import { getSuggestedTags } from "@/lib/utils/tag-suggestions";
import { Plus, ChevronRight, ChevronLeft, Package, Box, Tag, MoreHorizontal, Edit, Trash2, Image as ImageIcon, Camera, Upload, Loader2, X } from "lucide-react";

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
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openCreateDialog = () => {
    setEditingItem(null);
    setItemName("");
    setItemQuantity("1");
    setItemUnit("个");
    setItemTags("");
    setItemNotes("");
    setImageFile(null);
    setImagePreview(null);
    setUploadError(null);
    setDialogOpen(true);
  };

  const openEditDialog = (item: Item) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemQuantity(String(item.quantity));
    setItemUnit(item.unit);
    setItemTags(item.tags?.join(", ") || "");
    setItemNotes(item.notes || "");
    setImageFile(null);
    setImagePreview(null);
    setUploadError(null);
    setDialogOpen(true);
    setMenuOpenId(null);
  };

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
      const item = await itemsRepo.create({
        name: itemName.trim(),
        quantity: parseInt(itemQuantity, 10) || 1,
        unit: itemUnit,
        tags,
        notes: itemNotes.trim() || undefined,
        containerId,
        roomId: container.roomId,
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
    }

    setDialogOpen(false);
    setEditingItem(null);
    setItemName("");
    setItemQuantity("1");
    setItemUnit("个");
    setItemTags("");
    setItemNotes("");
    setImageFile(null);
    setImagePreview(null);
    setUploadError(null);
  };

  const handleDelete = async (itemId: string) => {
    setItemToDelete(itemId);
    setDeleteConfirmOpen(true);
    setMenuOpenId(null);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      await itemsRepo.delete(itemToDelete);
      setItemToDelete(null);
    }
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
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
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

                {!editingItem && (
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
                        className="w-full rounded-lg border border-dashed p-6 flex flex-col items-center justify-center gap-2 bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <Camera className="size-10 text-muted-foreground" />
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
                )}

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
            {items.map((item) => {
              const ItemImage = () => {
                const image = useItemImage(item.id);
                return image ? (
                  <img
                    src={image.dataUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Tag className="size-5" />
                );
              };

              return (
                <div
                  key={item.id}
                  className="relative flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <Link
                    href={`/items/${item.id}`}
                    className="flex flex-1 items-center gap-3"
                  >
                    <div className="flex size-12 items-center justify-center rounded-lg bg-muted overflow-hidden shrink-0">
                      <ItemImage />
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
              );
            })}
          </div>
        )}

        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          onConfirm={confirmDelete}
          title="删除物品"
          description="确定要删除此物品吗？此操作无法撤销。"
          confirmText="删除"
          cancelText="取消"
        />
      </main>
    </div>
  );
}
