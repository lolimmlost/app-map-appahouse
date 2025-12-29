import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { useAuthenticate } from "@daveyplate/better-auth-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/lib/server/categories.server";
import { getTags, createTag, updateTag, deleteTag } from "@/lib/server/tags.server";
import type { Category } from "@/types/database";
import type { Tag } from "@/types/database";

export const Route = createFileRoute("/categories")({ component: CategoriesPage });

type CategoryFormData = {
  name: string;
  icon: string;
  color: string;
};

type TagFormData = {
  name: string;
  color: string;
};

function CategoriesPage() {
  const { data: session, isPending: isSessionPending } = useAuthenticate();
  const queryClient = useQueryClient();

  // Category state
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({
    name: "",
    icon: "",
    color: "#6366f1",
  });

  // Tag state
  const [tagFormOpen, setTagFormOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [tagForm, setTagForm] = useState<TagFormData>({
    name: "",
    color: "#6b7280",
  });

  // Fetch categories
  const { data: categoriesData, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
    enabled: !!session?.user,
  });

  // Fetch tags
  const { data: tagsData, isLoading: isTagsLoading } = useQuery({
    queryKey: ["tags"],
    queryFn: () => getTags(),
    enabled: !!session?.user,
  });

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: (data: CategoryFormData) =>
      createCategory({
        data: {
          name: data.name,
          icon: data.icon || null,
          color: data.color || null,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      closeCategoryForm();
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryFormData }) =>
      updateCategory({
        id,
        data: {
          name: data.name,
          icon: data.icon || null,
          color: data.color || null,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      closeCategoryForm();
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => deleteCategory({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  // Tag mutations
  const createTagMutation = useMutation({
    mutationFn: (data: TagFormData) =>
      createTag({
        data: {
          name: data.name,
          color: data.color || null,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      closeTagForm();
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TagFormData }) =>
      updateTag({
        id,
        data: {
          name: data.name,
          color: data.color || null,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      closeTagForm();
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: (id: string) => deleteTag({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });

  // Category handlers
  const openCategoryForm = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        icon: category.icon ?? "",
        color: category.color ?? "#6366f1",
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: "", icon: "", color: "#6366f1" });
    }
    setCategoryFormOpen(true);
  };

  const closeCategoryForm = () => {
    setCategoryFormOpen(false);
    setEditingCategory(null);
    setCategoryForm({ name: "", icon: "", color: "#6366f1" });
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: categoryForm });
    } else {
      createCategoryMutation.mutate(categoryForm);
    }
  };

  const handleDeleteCategory = (category: Category) => {
    if (confirm(`Delete category "${category.name}"? Apps in this category will become uncategorized.`)) {
      deleteCategoryMutation.mutate(category.id);
    }
  };

  // Tag handlers
  const openTagForm = (tag?: Tag) => {
    if (tag) {
      setEditingTag(tag);
      setTagForm({
        name: tag.name,
        color: tag.color ?? "#6b7280",
      });
    } else {
      setEditingTag(null);
      setTagForm({ name: "", color: "#6b7280" });
    }
    setTagFormOpen(true);
  };

  const closeTagForm = () => {
    setTagFormOpen(false);
    setEditingTag(null);
    setTagForm({ name: "", color: "#6b7280" });
  };

  const handleTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTag) {
      updateTagMutation.mutate({ id: editingTag.id, data: tagForm });
    } else {
      createTagMutation.mutate(tagForm);
    }
  };

  const handleDeleteTag = (tag: Tag) => {
    if (confirm(`Delete tag "${tag.name}"?`)) {
      deleteTagMutation.mutate(tag.id);
    }
  };

  // Show login prompt if not authenticated
  if (!isSessionPending && !session?.user) {
    return (
      <main className="container mx-auto flex flex-col items-center justify-center gap-6 p-6 min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Categories & Tags</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to manage categories and tags
          </p>
        </div>
      </main>
    );
  }

  const categories = categoriesData?.categories ?? [];
  const tags = tagsData?.tags ?? [];

  return (
    <main className="container mx-auto flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Categories & Tags</h1>
        <p className="text-muted-foreground">Organize your apps with categories and tags</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Categories Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg">Categories</CardTitle>
            <Button size="sm" onClick={() => openCategoryForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </CardHeader>
          <CardContent>
            {isCategoriesLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No categories yet</p>
            ) : (
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      {category.icon && <span className="text-xl">{category.icon}</span>}
                      <span className="font-medium">{category.name}</span>
                      {category.color && (
                        <div
                          className="h-4 w-4 rounded-full border"
                          style={{ backgroundColor: category.color }}
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openCategoryForm(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteCategory(category)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tags Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg">Tags</CardTitle>
            <Button size="sm" onClick={() => openTagForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tag
            </Button>
          </CardHeader>
          <CardContent>
            {isTagsLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : tags.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tags yet</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-card"
                    style={tag.color ? { borderColor: tag.color } : undefined}
                  >
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: tag.color ?? "#6b7280" }}
                    />
                    <span className="text-sm font-medium">{tag.name}</span>
                    <div className="flex items-center gap-0.5 ml-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => openTagForm(tag)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteTag(tag)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Form Dialog */}
      <Dialog open={categoryFormOpen} onOpenChange={(open) => !open && closeCategoryForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
            <DialogDescription>
              Categories help you group related apps together.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCategorySubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="Media, Networking, etc."
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category-icon">Icon (emoji)</Label>
                <Input
                  id="category-icon"
                  value={categoryForm.icon}
                  onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                  placeholder="Enter emoji"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="category-color"
                    type="color"
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                    className="w-12 h-9 p-1 cursor-pointer"
                  />
                  <Input
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                    className="flex-1"
                    placeholder="#6366f1"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeCategoryForm}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!categoryForm.name || createCategoryMutation.isPending || updateCategoryMutation.isPending}
              >
                {editingCategory ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Tag Form Dialog */}
      <Dialog open={tagFormOpen} onOpenChange={(open) => !open && closeTagForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTag ? "Edit Tag" : "Add Tag"}</DialogTitle>
            <DialogDescription>
              Tags allow you to add multiple labels to your apps for filtering.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTagSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">Name</Label>
              <Input
                id="tag-name"
                value={tagForm.name}
                onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
                placeholder="important, docker, etc."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tag-color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="tag-color"
                  type="color"
                  value={tagForm.color}
                  onChange={(e) => setTagForm({ ...tagForm, color: e.target.value })}
                  className="w-12 h-9 p-1 cursor-pointer"
                />
                <Input
                  value={tagForm.color}
                  onChange={(e) => setTagForm({ ...tagForm, color: e.target.value })}
                  className="flex-1"
                  placeholder="#6b7280"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeTagForm}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!tagForm.name || createTagMutation.isPending || updateTagMutation.isPending}
              >
                {editingTag ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
