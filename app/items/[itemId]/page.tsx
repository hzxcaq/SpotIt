"use client";

import { use, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useItem, useContainer, useRoom, useRooms, useContainersByRoom, itemsRepo, imagesRepo, useItemImage } from "@/lib/db/hooks";
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
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ImageViewer } from "@/components/ui/image-viewer";
import { processImage } from "@/lib/utils/image";
import {
  ChevronLeft,
  Tag,
  Edit,
  Trash2,
  ArrowRightLeft,
  MapPin,
  Box,
  Home,
  Hash,
  FileText,
  User,
  Calendar,
  ChevronRight,
  Image as ImageIcon,
  Upload,
  Camera,
  Loader2,
} from "lucide-react";

interface ItemDetailPageProps {
  params: Promise<{ itemId: string }>;
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

function InfoRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  href?: string;
}) {
  const content = (
    <div className="flex items-start gap-3 py-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm font-medium">{value || "-"}</div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block hover:bg-muted/50 -mx-2 px-2 rounded">
        {content}
      </Link>
    );
  }

  return content;
}

function MoveDialog({
  open,
  onOpenChange,
  currentRoomId,
  currentContainerId,
  onMove,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRoomId?: string;
  currentContainerId?: string;
  onMove: (roomId: string, containerId: string) => void;
}) {
  const rooms = useRooms();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const containers = useContainersByRoom(selectedRoomId ?? undefined);

  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
  };

  const handleContainerSelect = (containerId: string) => {
    if (selectedRoomId) {
      onMove(selectedRoomId, containerId);
      onOpenChange(false);
      setSelectedRoomId(null);
    }
  };

  const handleBack = () => {
    setSelectedRoomId(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedRoomId(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {selectedRoomId ? "选择目标容器" : "选择目标房间"}
          </DialogTitle>
          <DialogDescription>
            {selectedRoomId
              ? "选择要将物品移动到的容器"
              : "先选择房间，再选择容器"}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {!selectedRoomId ? (
            <div className="space-y-2">
              {rooms.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">
                  暂无房间，请先创建房间
                </p>
              ) : (
                rooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => handleRoomSelect(room.id)}
                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 ${
                      room.id === currentRoomId ? "border-primary bg-muted/30" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Home className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{room.name}</p>
                        {room.id === currentRoomId && (
                          <p className="text-xs text-muted-foreground">当前位置</p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3"
              >
                <ChevronLeft className="size-4" />
                返回选择房间
              </button>
              {containers.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">
                  该房间暂无容器，请先创建容器
                </p>
              ) : (
                containers.map((container) => (
                  <button
                    key={container.id}
                    onClick={() => handleContainerSelect(container.id)}
                    disabled={container.id === currentContainerId}
                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                      container.id === currentContainerId
                        ? "border-primary bg-muted/30 opacity-50 cursor-not-allowed"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Box className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{container.name}</p>
                        {container.id === currentContainerId && (
                          <p className="text-xs text-muted-foreground">当前位置</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ItemDetailPage({ params }: ItemDetailPageProps) {
  const { itemId } = use(params);
  const router = useRouter();
  const item = useItem(itemId);
  const container = useContainer(item?.containerId);
  const room = useRoom(container?.roomId ?? item?.roomId);
  const itemImage = useItemImage(itemId);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [itemName, setItemName] = useState("");
  const [itemAlias, setItemAlias] = useState("");
  const [itemQuantity, setItemQuantity] = useState("1");
  const [itemUnit, setItemUnit] = useState<ItemUnit>("个");
  const [itemTags, setItemTags] = useState("");
  const [itemNotes, setItemNotes] = useState("");

  const openEditDialog = () => {
    if (!item) return;
    setItemName(item.name);
    setItemAlias(item.alias || "");
    setItemQuantity(String(item.quantity));
    setItemUnit(item.unit);
    setItemTags(item.tags?.join(", ") || "");
    setItemNotes(item.notes || "");
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!itemName.trim() || !item) return;

    const tags = itemTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    await itemsRepo.update(item.id, {
      name: itemName.trim(),
      alias: itemAlias.trim() || undefined,
      quantity: parseInt(itemQuantity, 10) || 1,
      unit: itemUnit,
      tags,
      notes: itemNotes.trim() || undefined,
    });

    setEditDialogOpen(false);
  };

  const handleDelete = async () => {
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!item) return;
    await itemsRepo.delete(item.id);
    router.push(container ? `/containers/${container.id}` : "/rooms");
  };

  const handleMove = async (newRoomId: string, newContainerId: string) => {
    if (!item) return;
    await itemsRepo.update(item.id, {
      roomId: newRoomId,
      containerId: newContainerId,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !item) return;

    setImageUploading(true);
    setUploadError(null);

    try {
      const result = await processImage(file);

      if (itemImage) {
        await imagesRepo.delete(itemImage.id);
      }

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
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "上传失败");
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleImageDelete = async () => {
    if (!itemImage || !item) return;

    try {
      await imagesRepo.delete(itemImage.id);
      await itemsRepo.update(item.id, {
        imageId: undefined,
      });
    } catch (error) {
      setUploadError("删除失败");
    }
  };

  if (!item) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-lg px-4 py-6">
        <header className="mb-6 flex items-center gap-3">
          <Link href={container ? `/containers/${container.id}` : "/rooms"}>
            <Button variant="ghost" size="icon-sm">
              <ChevronLeft className="size-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <Tag className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{item.name}</h1>
                <span className={`rounded px-1.5 py-0.5 text-xs ${statusColors[item.status]}`}>
                  {statusLabels[item.status]}
                </span>
              </div>
              {item.alias && (
                <p className="text-sm text-muted-foreground">别名：{item.alias}</p>
              )}
            </div>
          </div>
        </header>

        {/* Image Section */}
        <section className="mb-6">
          {itemImage ? (
            <div className="relative rounded-lg border overflow-hidden">
              <button
                onClick={() => setImageViewerOpen(true)}
                className="w-full aspect-square relative bg-muted hover:opacity-90 transition-opacity"
              >
                <img
                  src={itemImage.dataUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </button>
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="bg-background/80 backdrop-blur-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  disabled={imageUploading}
                >
                  {imageUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="bg-background/80 backdrop-blur-sm text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleImageDelete();
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 flex flex-col items-center justify-center gap-3 bg-muted/30">
              <ImageIcon className="size-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">暂无图片</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={imageUploading}
              >
                {imageUploading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    上传中...
                  </>
                ) : (
                  <>
                    <Camera className="size-4" />
                    上传图片
                  </>
                )}
              </Button>
            </div>
          )}
          {uploadError && (
            <p className="mt-2 text-sm text-destructive">{uploadError}</p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </section>

        <div className="mb-6 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={openEditDialog}>
            <Edit className="size-4" />
            编辑
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={() => setMoveDialogOpen(true)}>
            <ArrowRightLeft className="size-4" />
            移动
          </Button>
          <Button variant="outline" size="sm" className="flex-1 text-destructive hover:text-destructive" onClick={handleDelete}>
            <Trash2 className="size-4" />
            删除
          </Button>
        </div>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>编辑物品</DialogTitle>
              <DialogDescription>修改物品信息</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="edit-item-name" className="text-sm font-medium">
                  物品名称
                </label>
                <Input
                  id="edit-item-name"
                  placeholder="物品名称"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-item-alias" className="text-sm font-medium">
                  别名（可选）
                </label>
                <Input
                  id="edit-item-alias"
                  placeholder="物品的别名"
                  value={itemAlias}
                  onChange={(e) => setItemAlias(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="edit-item-quantity" className="text-sm font-medium">
                    数量
                  </label>
                  <Input
                    id="edit-item-quantity"
                    type="number"
                    min="1"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-item-unit" className="text-sm font-medium">
                    单位
                  </label>
                  <select
                    id="edit-item-unit"
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
                <label htmlFor="edit-item-tags" className="text-sm font-medium">
                  标签（逗号分隔）
                </label>
                <Input
                  id="edit-item-tags"
                  placeholder="例如：工具, 电子, 常用"
                  value={itemTags}
                  onChange={(e) => setItemTags(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-item-notes" className="text-sm font-medium">
                  备注
                </label>
                <Input
                  id="edit-item-notes"
                  placeholder="物品的备注信息"
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSave} disabled={!itemName.trim()}>
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <MoveDialog
          open={moveDialogOpen}
          onOpenChange={setMoveDialogOpen}
          currentRoomId={room?.id}
          currentContainerId={container?.id}
          onMove={handleMove}
        />

        <section className="rounded-lg border">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-medium">基本信息</h2>
          </div>
          <div className="divide-y px-4">
            <InfoRow
              icon={Hash}
              label="数量"
              value={`${item.quantity} ${item.unit}`}
            />
            <InfoRow
              icon={MapPin}
              label="位置"
              value={
                <span className="flex items-center gap-1">
                  {room && (
                    <>
                      <Home className="size-3" />
                      {room.name}
                    </>
                  )}
                  {container && (
                    <>
                      <span className="text-muted-foreground mx-1">›</span>
                      <Box className="size-3" />
                      {container.name}
                    </>
                  )}
                  {!room && !container && "未指定"}
                </span>
              }
              href={container ? `/containers/${container.id}` : room ? `/rooms/${room.id}` : undefined}
            />
            {item.tags && item.tags.length > 0 && (
              <InfoRow
                icon={Tag}
                label="标签"
                value={
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-muted px-2 py-0.5 text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                }
              />
            )}
            {item.notes && (
              <InfoRow icon={FileText} label="备注" value={item.notes} />
            )}
          </div>
        </section>

        {item.status === "lent" && item.lentTo && (
          <section className="mt-4 rounded-lg border">
            <div className="border-b px-4 py-3">
              <h2 className="text-sm font-medium">借出信息</h2>
            </div>
            <div className="divide-y px-4">
              <InfoRow icon={User} label="借给" value={item.lentTo} />
              {item.lentAt && (
                <InfoRow
                  icon={Calendar}
                  label="借出时间"
                  value={formatDate(item.lentAt)}
                />
              )}
            </div>
          </section>
        )}

        <section className="mt-4 rounded-lg border">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-medium">时间信息</h2>
          </div>
          <div className="divide-y px-4">
            <InfoRow
              icon={Calendar}
              label="创建时间"
              value={formatDate(item.createdAt)}
            />
            <InfoRow
              icon={Calendar}
              label="更新时间"
              value={formatDate(item.updatedAt)}
            />
          </div>
        </section>

        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          onConfirm={confirmDelete}
          title="删除物品"
          description="确定要删除此物品吗？此操作无法撤销。"
          confirmText="删除"
          cancelText="取消"
        />

        <ImageViewer
          open={imageViewerOpen}
          onOpenChange={setImageViewerOpen}
          imageUrl={itemImage?.dataUrl || ""}
          alt={item.name}
        />
      </main>
    </div>
  );
}
