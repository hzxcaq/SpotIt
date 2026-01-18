"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocations, locationsRepo } from "@/lib/db/hooks";
import type { Location } from "@/lib/db/types";
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
import { ChevronLeft, Plus, MapPin, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function LocationsPage() {
  const locations = useLocations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const openCreateDialog = () => {
    setEditingLocation(null);
    setName("");
    setDescription("");
    setDialogOpen(true);
  };

  const openEditDialog = (location: Location) => {
    setEditingLocation(location);
    setName(location.name);
    setDescription(location.description || "");
    setDialogOpen(true);
    setMenuOpenId(null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;

    if (editingLocation) {
      await locationsRepo.update(editingLocation.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
    } else {
      await locationsRepo.create({
        name: name.trim(),
        description: description.trim() || undefined,
      });
    }
    setDialogOpen(false);
    setEditingLocation(null);
    setName("");
    setDescription("");
  };

  const handleDelete = (locationId: string) => {
    setLocationToDelete(locationId);
    setDeleteConfirmOpen(true);
    setMenuOpenId(null);
  };

  const confirmDelete = async () => {
    if (locationToDelete) {
      await locationsRepo.delete(locationToDelete);
      setLocationToDelete(null);
    }
  };

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
            <h1 className="text-xl font-bold">地点管理</h1>
            <p className="text-sm text-muted-foreground">管理多处房产或地点</p>
          </div>
        </header>

        <div className="mb-4 flex justify-end">
          <Button size="sm" onClick={openCreateDialog}>
            <Plus className="size-4" /> 新增地点
          </Button>
        </div>

        <div className="space-y-2">
          {locations.map((loc) => (
            <div key={loc.id} className="relative flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <MapPin className="size-5" />
                </div>
                <div>
                  <p className="font-medium">{loc.name}</p>
                  {loc.description && <p className="text-sm text-muted-foreground">{loc.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => {
                      e.preventDefault();
                      setMenuOpenId(menuOpenId === loc.id ? null : loc.id);
                    }}
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                  {menuOpenId === loc.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setMenuOpenId(null)}
                      />
                      <div className="absolute right-0 top-full z-20 mt-1 w-32 rounded-md border bg-popover p-1 shadow-md">
                        <button
                          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                          onClick={() => openEditDialog(loc)}
                        >
                          <Edit className="size-3.5" />
                          编辑
                        </button>
                        <button
                          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-accent disabled:opacity-50"
                          onClick={() => handleDelete(loc.id)}
                          disabled={locations.length <= 1}
                        >
                          <Trash2 className="size-3.5" />
                          删除
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingLocation ? "编辑地点" : "新增地点"}</DialogTitle>
              <DialogDescription>
                {editingLocation ? "修改地点信息" : "添加新的房产或地点"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">名称</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：家、公司、父母家"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">描述（可选）</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="例如：北京朝阳区"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
              <Button onClick={handleSubmit} disabled={!name.trim()}>
                {editingLocation ? "保存" : "添加"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          onConfirm={confirmDelete}
          title="删除地点"
          description="确定要删除此地点吗？该地点下的所有房间、容器和物品都将被删除，此操作不可撤销。"
          confirmText="删除"
          cancelText="取消"
        />
      </main>
    </div>
  );
}
