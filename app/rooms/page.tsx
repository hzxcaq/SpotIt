"use client";

import { useState } from "react";
import Link from "next/link";
import { useRoomsByLocation, useLocations, roomsRepo } from "@/lib/db/hooks";
import type { Room } from "@/lib/db/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Plus, ChevronRight, Home, ChevronLeft, MoreHorizontal, Edit, Trash2, MapPin, ChevronDown, Settings } from "lucide-react";
import { useLocationContext } from "@/components/location-provider";

export default function RoomsPage() {
  const { currentLocationId, setCurrentLocationId } = useLocationContext();
  const rooms = useRoomsByLocation(currentLocationId);
  const locations = useLocations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomName, setRoomName] = useState("");
  const [roomDescription, setRoomDescription] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set());
  const [batchDeleteConfirmOpen, setBatchDeleteConfirmOpen] = useState(false);

  const currentLocation = locations.find(l => l.id === currentLocationId);

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
    if (!currentLocationId && !editingRoom) return;
    if (saving) return;

    setSaving(true);
    setError(null);
    try {
      if (editingRoom) {
        await roomsRepo.update(editingRoom.id, {
          name: roomName.trim(),
          description: roomDescription.trim() || undefined,
        });
      } else {
        const locationId = currentLocationId;
        if (!locationId) return;
        await roomsRepo.create({
          name: roomName.trim(),
          description: roomDescription.trim() || undefined,
          locationId,
        });
      }

      setDialogOpen(false);
      setEditingRoom(null);
      setRoomName("");
      setRoomDescription("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败");
      return;
    } finally {
      setSaving(false);
    }
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

  const toggleBatchMode = () => {
    setBatchMode(!batchMode);
    setSelectedRooms(new Set());
  };

  const toggleRoomSelection = (roomId: string) => {
    const newSelected = new Set(selectedRooms);
    if (newSelected.has(roomId)) {
      newSelected.delete(roomId);
    } else {
      newSelected.add(roomId);
    }
    setSelectedRooms(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedRooms.size === rooms.length) {
      setSelectedRooms(new Set());
    } else {
      setSelectedRooms(new Set(rooms.map(r => r.id)));
    }
  };

  const handleBatchDelete = () => {
    if (selectedRooms.size > 0) {
      setBatchDeleteConfirmOpen(true);
    }
  };

  const confirmBatchDelete = async () => {
    for (const roomId of selectedRooms) {
      await roomsRepo.delete(roomId);
    }
    setSelectedRooms(new Set());
    setBatchMode(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-lg px-4 py-6">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon-sm">
                <ChevronLeft className="size-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{currentLocation?.name || "房间管理"}</h1>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1"
                  onClick={() => setLocationPickerOpen(true)}
                >
                  <ChevronDown className="size-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">当前地点下的所有房间</p>
            </div>
          </div>
          <Link href="/locations">
            <Button variant="ghost" size="icon-sm">
              <Settings className="size-5" />
            </Button>
          </Link>
        </header>

        <div className="mb-4 flex justify-between items-center">
          {batchMode ? (
            <>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                  {selectedRooms.size === rooms.length ? "取消全选" : "全选"}
                </Button>
                <span className="text-sm text-muted-foreground">
                  已选 {selectedRooms.size} 项
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBatchDelete}
                  disabled={selectedRooms.size === 0}
                >
                  <Trash2 className="size-4" />
                  删除
                </Button>
                <Button variant="outline" size="sm" onClick={toggleBatchMode}>
                  取消
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={toggleBatchMode}>
                批量管理
              </Button>
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
                  {error && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                      取消
                    </Button>
                    <Button onClick={handleSubmit} disabled={!roomName.trim() || saving}>
                      {saving ? "保存中..." : editingRoom ? "保存" : "创建"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
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
                {batchMode && (
                  <div className="flex items-center mr-3">
                    <Checkbox
                      checked={selectedRooms.has(room.id)}
                      onCheckedChange={() => toggleRoomSelection(room.id)}
                    />
                  </div>
                )}
                <Link
                  href={`/rooms/${room.id}`}
                  className="flex flex-1 items-center gap-3"
                  onClick={(e) => {
                    if (batchMode) {
                      e.preventDefault();
                      toggleRoomSelection(room.id);
                    }
                  }}
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
                {!batchMode && (
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
                )}
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

        <ConfirmDialog
          open={batchDeleteConfirmOpen}
          onOpenChange={setBatchDeleteConfirmOpen}
          onConfirm={confirmBatchDelete}
          title="批量删除房间"
          description={`确定要删除选中的 ${selectedRooms.size} 个房间吗？房间内的容器也会被删除，物品将变为未分类状态。`}
          confirmText="删除"
          cancelText="取消"
        />

        <Dialog open={locationPickerOpen} onOpenChange={setLocationPickerOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>切换地点</DialogTitle>
              <DialogDescription>选择要查看的地点</DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-4">
              {locations.map(loc => (
                <Button
                  key={loc.id}
                  variant={loc.id === currentLocationId ? "secondary" : "ghost"}
                  className="justify-start"
                  onClick={() => {
                    setCurrentLocationId(loc.id);
                    setLocationPickerOpen(false);
                  }}
                >
                  <MapPin className="mr-2 size-4" /> {loc.name}
                </Button>
              ))}
              <Link href="/locations" className="mt-2 block">
                <Button variant="outline" className="w-full">
                  <Settings className="mr-2 size-4" />
                  管理地点
                </Button>
              </Link>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
