"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRoom, useContainersByRoom, useItemsByContainer, containersRepo } from "@/lib/db/hooks";
import type { Container } from "@/lib/db/types";
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
import { Plus, ChevronRight, ChevronLeft, Package, Box, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";

interface RoomDetailPageProps {
  params: Promise<{ roomId: string }>;
}

function ContainerItem({
  container,
  onEdit,
  onDelete,
  menuOpenId,
  setMenuOpenId,
}: {
  container: Container;
  onEdit: (container: Container) => void;
  onDelete: (containerId: string) => void;
  menuOpenId: string | null;
  setMenuOpenId: (id: string | null) => void;
}) {
  const items = useItemsByContainer(container.id);

  return (
    <div className="relative flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
      <Link
        href={`/containers/${container.id}`}
        className="flex flex-1 items-center gap-3"
      >
        <div className="flex size-10 items-center justify-center rounded-full bg-muted">
          <Box className="size-5" />
        </div>
        <div>
          <p className="font-medium">{container.name}</p>
          <p className="text-sm text-muted-foreground">
            {items.length > 0 ? `${items.length} 件物品` : "暂无物品"}
            {container.description && ` · ${container.description}`}
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
              setMenuOpenId(menuOpenId === container.id ? null : container.id);
            }}
          >
            <MoreHorizontal className="size-4" />
          </Button>
          {menuOpenId === container.id && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpenId(null)}
              />
              <div className="absolute right-0 top-full z-20 mt-1 w-32 rounded-md border bg-background py-1 shadow-lg">
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                  onClick={() => onEdit(container)}
                >
                  <Edit className="size-4" />
                  编辑
                </button>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted"
                  onClick={() => onDelete(container.id)}
                >
                  <Trash2 className="size-4" />
                  删除
                </button>
              </div>
            </>
          )}
        </div>
        <Link href={`/containers/${container.id}`}>
          <ChevronRight className="size-5 text-muted-foreground" />
        </Link>
      </div>
    </div>
  );
}

export default function RoomDetailPage({ params }: RoomDetailPageProps) {
  const { roomId } = use(params);
  const room = useRoom(roomId);
  const containers = useContainersByRoom(roomId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContainer, setEditingContainer] = useState<Container | null>(null);
  const [containerName, setContainerName] = useState("");
  const [containerDescription, setContainerDescription] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [containerToDelete, setContainerToDelete] = useState<string | null>(null);

  const openCreateDialog = () => {
    setEditingContainer(null);
    setContainerName("");
    setContainerDescription("");
    setDialogOpen(true);
  };

  const openEditDialog = (container: Container) => {
    setEditingContainer(container);
    setContainerName(container.name);
    setContainerDescription(container.description || "");
    setDialogOpen(true);
    setMenuOpenId(null);
  };

  const handleSubmit = async () => {
    if (!containerName.trim()) return;

    if (editingContainer) {
      await containersRepo.update(editingContainer.id, {
        name: containerName.trim(),
        description: containerDescription.trim() || undefined,
      });
    } else {
      await containersRepo.create({
        name: containerName.trim(),
        description: containerDescription.trim() || undefined,
        roomId,
        code: nanoid(8),
      });
    }

    setDialogOpen(false);
    setEditingContainer(null);
    setContainerName("");
    setContainerDescription("");
  };

  const handleDelete = async (containerId: string) => {
    setContainerToDelete(containerId);
    setDeleteConfirmOpen(true);
    setMenuOpenId(null);
  };

  const confirmDelete = async () => {
    if (containerToDelete) {
      await containersRepo.delete(containerToDelete);
      setContainerToDelete(null);
    }
  };

  if (!room) {
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
          <Link href="/rooms">
            <Button variant="ghost" size="icon-sm">
              <ChevronLeft className="size-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">{room.name}</h1>
            <p className="text-sm text-muted-foreground">
              {room.description || "管理此房间的容器和物品"}
            </p>
          </div>
        </header>

        <div className="mb-4 flex justify-end">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openCreateDialog}>
                <Plus className="size-4" />
                新增容器
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingContainer ? "编辑容器" : "新增容器"}</DialogTitle>
                <DialogDescription>
                  {editingContainer
                    ? "修改容器信息"
                    : `在 ${room.name} 中添加一个新的容器（如抽屉、柜子、盒子等）`}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="container-name" className="text-sm font-medium">
                    容器名称
                  </label>
                  <Input
                    id="container-name"
                    placeholder="例如：书柜、抽屉、工具箱"
                    value={containerName}
                    onChange={(e) => setContainerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="container-description" className="text-sm font-medium">
                    描述（可选）
                  </label>
                  <Input
                    id="container-description"
                    placeholder="容器的简要描述"
                    value={containerDescription}
                    onChange={(e) => setContainerDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleSubmit} disabled={!containerName.trim()}>
                  {editingContainer ? "保存" : "创建"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {containers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
            <Package className="mb-3 size-10 text-muted-foreground" />
            <p className="mb-1 text-sm font-medium">暂无容器</p>
            <p className="mb-4 text-xs text-muted-foreground">点击上方按钮添加第一个容器</p>
          </div>
        ) : (
          <div className="space-y-2">
            {containers.map((container) => (
              <ContainerItem
                key={container.id}
                container={container}
                onEdit={openEditDialog}
                onDelete={handleDelete}
                menuOpenId={menuOpenId}
                setMenuOpenId={setMenuOpenId}
              />
            ))}
          </div>
        )}

        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          onConfirm={confirmDelete}
          title="删除容器"
          description="确定要删除此容器吗？容器内的物品将变为未分类状态。"
          confirmText="删除"
          cancelText="取消"
        />
      </main>
    </div>
  );
}
