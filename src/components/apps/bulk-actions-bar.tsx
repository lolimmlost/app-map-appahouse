import { useState } from "react";
import {
  FolderOpen,
  Activity,
  Trash2,
  Download,
  Tag,
  CheckSquare,
  Square,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Category } from "@/types/database";
import type { Tag as TagType } from "@/types/database";

interface BulkActionsBarProps {
  selectedCount: number;
  totalCount: number;
  isAllSelected: boolean;
  categories: Category[];
  tags: TagType[];
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkUpdateCategory: (categoryId: string | null) => void;
  onBulkUpdateTags: (tagIds: string[], mode: "replace" | "append") => void;
  onBulkToggleHealthCheck: (enabled: boolean) => void;
  onBulkDelete: () => void;
  onBulkExport: () => void;
  isLoading?: boolean;
}

export function BulkActionsBar({
  selectedCount,
  totalCount,
  isAllSelected,
  categories,
  tags,
  onSelectAll,
  onClearSelection,
  onBulkUpdateCategory,
  onBulkUpdateTags,
  onBulkToggleHealthCheck,
  onBulkDelete,
  onBulkExport,
  isLoading = false,
}: BulkActionsBarProps) {
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tagMode, setTagMode] = useState<"replace" | "append">("replace");

  const handleCategorySubmit = () => {
    onBulkUpdateCategory(selectedCategoryId === "uncategorized" ? null : selectedCategoryId);
    setCategoryDialogOpen(false);
    setSelectedCategoryId("");
  };

  const handleTagsSubmit = () => {
    onBulkUpdateTags(selectedTagIds, tagMode);
    setTagsDialogOpen(false);
    setSelectedTagIds([]);
    setTagMode("replace");
  };

  const toggleTagSelection = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <Card className="border-primary bg-primary/5" data-testid="bulk-actions-bar">
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Selection info */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={isAllSelected ? onClearSelection : onSelectAll}
                className="h-8 px-2"
                data-testid="select-all-toggle"
              >
                {isAllSelected ? (
                  <CheckSquare className="h-4 w-4 mr-1" />
                ) : (
                  <Square className="h-4 w-4 mr-1" />
                )}
                <span className="hidden sm:inline">{isAllSelected ? "Deselect All" : "Select All"}</span>
              </Button>
              <Badge variant="secondary" className="font-medium" data-testid="selection-count">
                {selectedCount} of {totalCount} selected
              </Badge>
            </div>

            <div className="hidden sm:block h-6 w-px bg-border" />

            {/* Bulk Edit Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  data-testid="bulk-edit-menu"
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Bulk Edit
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setCategoryDialogOpen(true)}>
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Change Category
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTagsDialogOpen(true)}>
                  <Tag className="h-4 w-4 mr-2" />
                  Update Tags
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onBulkToggleHealthCheck(true)}>
                  <Activity className="h-4 w-4 mr-2" />
                  Enable Health Check
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBulkToggleHealthCheck(false)}>
                  <Activity className="h-4 w-4 mr-2" />
                  Disable Health Check
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Export Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkExport}
              disabled={isLoading}
              data-testid="bulk-export"
            >
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Export JSON</span>
              <span className="sm:hidden">Export</span>
            </Button>

            {/* Delete Button */}
            <Button
              variant="destructive"
              size="sm"
              onClick={onBulkDelete}
              disabled={isLoading}
              data-testid="bulk-delete"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>

            {/* Clear Selection */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="ml-auto"
              data-testid="clear-selection"
            >
              <X className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Category</DialogTitle>
            <DialogDescription>
              Assign a category to {selectedCount} selected app(s)
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="bulk-category">Category</Label>
            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger className="mt-2" data-testid="category-select">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uncategorized">Uncategorized</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon && <span className="mr-2">{cat.icon}</span>}
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCategorySubmit}
              disabled={!selectedCategoryId || isLoading}
              data-testid="category-submit"
            >
              Update Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tags Dialog */}
      <Dialog open={tagsDialogOpen} onOpenChange={setTagsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Tags</DialogTitle>
            <DialogDescription>
              Manage tags for {selectedCount} selected app(s)
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Mode</Label>
              <Select value={tagMode} onValueChange={(v: "replace" | "append") => setTagMode(v)}>
                <SelectTrigger data-testid="tag-mode-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="replace">Replace existing tags</SelectItem>
                  <SelectItem value="append">Add to existing tags</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                {tags.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tags available</p>
                ) : (
                  tags.map((tag) => (
                    <div key={tag.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`tag-${tag.id}`}
                        checked={selectedTagIds.includes(tag.id)}
                        onCheckedChange={() => toggleTagSelection(tag.id)}
                      />
                      <Label
                        htmlFor={`tag-${tag.id}`}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color || "#6b7280" }}
                        />
                        {tag.name}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTagsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleTagsSubmit}
              disabled={isLoading}
              data-testid="tags-submit"
            >
              {tagMode === "replace" ? "Replace Tags" : "Add Tags"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
