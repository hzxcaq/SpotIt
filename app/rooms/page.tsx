"use client";

import { useState } from "react";
import Link from "next/link";
import { useRooms, roomsRepo } from "@/lib/db/hooks";
import type { Room } from "@/lib/db/types";
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
import { Plus, ChevronRight, Home, ChevronLeft, MoreHorizontal, Edit, Trash2 } from "lucide-react";

export default function RoomsPage() {
  const rooms = useRooms();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomName, setRoomName] = useState("");
  const [roomDescription, setRoomDescription] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);

  const openCreateDialog = () => {
    setEditingRoom(null);
    setRoomName("");
    setRoomDescription("");
    setDialogOpen(true);
  };

  const openEditDialog = (room: Room) => {
    setEditingRoom(room);
    setRoomName(room.name);
    setRoomDescription(room.description || "");
    setDialogOpen(true);
    setMenuOpenId(null);
  };

  const handleSubmit = async () => {
    if (!roomName.trim()) return;

    if (editingRoom) {
      await roomsRepo.update(editingRoom.id, {
        name: roomName.trim(),
        description: roomDescription.trim() || undefined,
      });
    } else {
      await roomsRepo.create({
        name: roomName.trim(),
        description: roomDescription.trim() || undefined,
      });
    }

    setDialogOpen(false);
    setEditingRoom(null);
    setRoomName("");
    setRoomDescription("");
  };

  const handleDelete = async (roomId: string) => {
    setRoomToDelete(roomId);
    setDeleteConfirmOpen(true);
    setMenuOpenId(null);
  };

  const confirmDelete = async () => {
    if (roomToDelete) {
      await roomsRepo.delete(roomToDelete);
      setRoomToDelete(null);
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
            <h1 className="text-xl font-bold">房间管理</h1>
            <p className="text-sm text-muted-foreground">按房间浏览和管理物品</p>
          </div>
        </header>

        <div className="mb-4 flex justify-end">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openCreateDialog}>
                <Plus className="size-4" />
                新增房间
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingRoom ? "编辑房间" : "新增房间"}</DialogTitle>
                <DialogDescription>
                  {editingRoom ? "修改房间信息" : "添加一个新的房间来组织您的物品"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="room-name" className="text-sm font-medium">
                    房间名称
                  </label>
                  <Input
                    id="room-name"
                    placeholder="例如：客厅、卧室、书房"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="room-description" className="text-sm font-medium">
                    描述（可选）
                  </label>
                  <Input
                    id="room-description"
                    placeholder="房间的简要描述"
                    value={roomDescription}
                    onChange={(e) => setRoomDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleSubmit} disabled={!roomName.trim()}>
                  {editingRoom ? "保存" : "创建"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
            <Home className="mb-3 size-10 text-muted-foreground" />
            <p className="mb-1 text-sm font-medium">暂无房间</p>
            <p className="mb-4 text-xs text-muted-foreground">点击上方按钮添加第一个房间</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="relative flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <Link
                  href={`/rooms/${room.id}`}
                  className="flex flex-1 items-center gap-3"
                >
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                    <Home className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium">{room.name}</p>
                    {room.description && (
                      <p className="text-sm text-muted-foreground">{room.description}</p>
                    )}
                  </div>
                </Link>
                <div className="flex items-center gap-1">
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        setMenuOpenId(menuOpenId === room.id ? null : room.id);
                      }}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                    {menuOpenId === room.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setMenuOpenId(null)}
                        />
                        <div className="absolute right-0 top-full z-20 mt-1 w-32 rounded-md border bg-background py-1 shadow-lg">
                          <button
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                            onClick={() => openEditDialog(room)}
                          >
                            <Edit className="size-4" />
                            编辑
                          </button>
                          <button
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted"
                            onClick={() => handleDelete(room.id)}
                          >
                            <Trash2 className="size-4" />
                            删除
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  <Link href={`/rooms/${room.id}`}>
                    <ChevronRight className="size-5 text-muted-foreground" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          onConfirm={confirmDelete}
          title="删除房间"
          description="确定要删除此房间吗？房间内的容器也会被删除，物品将变为未分类状态。"
          confirmText="删除"
          cancelText="取消"
        />
      </main>
    </div>
  );
}
