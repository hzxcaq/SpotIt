"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db, tagCategoriesRepo } from "@/lib/db";
import type { TagCategory } from "@/lib/db/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ChevronLeft, Plus, Edit, Trash2, Tag as TagIcon } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";

export default function TagManagementPage() {
  const tagCategories = useLiveQuery(() => db.tagCategories.toArray(), []);
  const allItems = useLiveQuery(() => db.items.toArray(), []);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TagCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<TagCategory | null>(null);

  const [categoryName, setCategoryName] = useState("");
  const [keywords, setKeywords] = useState("");
  const [suggestions, setSuggestions] = useState("");

  const tagUsageStats = useLiveQuery(() => {
    return db.items.toArray().then((items) => {
      const stats: Record<string, number> = {};
      items.forEach((item) => {
        item.tags?.forEach((tag) => {
          stats[tag] = (stats[tag] || 0) + 1;
        });
      });
      return Object.entries(stats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);
    });
  }, []);

  const openAddDialog = () => {
    setEditingCategory(null);
    setCategoryName("");
    setKeywords("");
    setSuggestions("");
    setEditDialogOpen(true);
  };

  const openEditDialog = (category: TagCategory) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setKeywords(category.keywords.join(", "));
    setSuggestions(category.suggestions.join(", "));
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!categoryName.trim()) return;

    const keywordsArray = keywords.split(",").map((k) => k.trim()).filter(Boolean);
    const suggestionsArray = suggestions.split(",").map((s) => s.trim()).filter(Boolean);

    if (editingCategory) {
      await tagCategoriesRepo.update(editingCategory.id, {
        name: categoryName.trim(),
        keywords: keywordsArray,
        suggestions: suggestionsArray,
      });
    } else {
      await tagCategoriesRepo.create({
        name: categoryName.trim(),
        keywords: keywordsArray,
        suggestions: suggestionsArray,
        isCustom: true,
      });
    }

    setEditDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    await tagCategoriesRepo.delete(deletingCategory.id);
    setDeleteDialogOpen(false);
    setDeletingCategory(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-lg px-4 py-6">
        <header className="mb-6 flex items-center gap-3">
          <Link href="/settings">
            <Button variant="ghost" size="icon-sm">
              <ChevronLeft className="size-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold">标签管理</h1>
            <p className="text-sm text-muted-foreground">管理标签分类和建议</p>
          </div>
          <Button onClick={openAddDialog} size="sm">
            <Plus className="size-4" />
            添加
          </Button>
        </header>

        <section className="mb-6">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">标签使用统计</h2>
          {tagUsageStats && tagUsageStats.length > 0 ? (
            <div className="rounded-lg border p-4">
              <div className="flex flex-wrap gap-2">
                {tagUsageStats.map(([tag, count]) => (
                  <div key={tag} className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm">
                    <span>{tag}</span>
                    <span className="text-xs text-muted-foreground">×{count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <TagIcon className="mx-auto mb-2 size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">暂无标签使用记录</p>
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            标签分类 ({tagCategories?.length || 0})
          </h2>
          {tagCategories && tagCategories.length > 0 ? (
            <div className="space-y-2">
              {tagCategories.map((category) => (
                <div key={category.id} className="rounded-lg border p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{category.name}</h3>
                        {category.isCustom && (
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">自定义</span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        关键词: {category.keywords.join(", ")}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(category)}>
                        <Edit className="size-4" />
                      </Button>
                      {category.isCustom && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setDeletingCategory(category);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {category.suggestions.map((tag) => (
                      <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <TagIcon className="mx-auto mb-2 size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">暂无标签分类</p>
            </div>
          )}
        </section>
      </main>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "编辑标签分类" : "添加标签分类"}</DialogTitle>
            <DialogDescription>设置分类名称、关键词和建议标签</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="category-name" className="text-sm font-medium">
                分类名称
              </label>
              <Input
                id="category-name"
                placeholder="例如：衣物-上装"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="keywords" className="text-sm font-medium">
                关键词（逗号分隔）
              </label>
              <Input
                id="keywords"
                placeholder="例如：短袖, 长袖, T恤"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">当物品名称包含这些关键词时，会显示建议标签</p>
            </div>
            <div className="space-y-2">
              <label htmlFor="suggestions" className="text-sm font-medium">
                建议标签（逗号分隔）
              </label>
              <Input
                id="suggestions"
                placeholder="例如：上衣, 黑色, 白色"
                value={suggestions}
                onChange={(e) => setSuggestions(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">匹配关键词时，会向用户推荐这些标签</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={!categoryName.trim()}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="确认删除"
        description={`确定要删除标签分类"${deletingCategory?.name}"吗？此操作不可撤销。`}
        confirmText="删除"
        cancelText="取消"
      />
    </div>
  );
}
