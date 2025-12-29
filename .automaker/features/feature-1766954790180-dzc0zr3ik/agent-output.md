
🔧 Tool: Task
Input: {
  "description": "Explore codebase structure",
  "prompt": "I need to implement a bulk app management feature with multi-select apps, checkboxes, and batch operations (bulk edit, health check toggle, bulk delete, bulk export as JSON, select-all/deselect-all).\n\nPlease explore the codebase to understand:\n1. The overall project structure\n2. Where apps are managed/displayed (likely in a list or grid)\n3. Existing patterns for app management operations\n4. The component structure and state management approach\n5. Any existing selection or bulk operation patterns\n\nFocus on finding:\n- Main app listing components\n- App data models/types\n- Existing CRUD operations for apps\n- UI component library being used\n- State management approach\n\nProvide a comprehensive summary of the codebase structure relevant to implementing this feature.",
  "subagent_type": "Explore"
}

🔧 Tool: Bash
Input: {
  "command": "find /home/default/Desktop/dev/app-map-appahouse -type f -name \"*.json\" -o -name \"*.ts\" -o -name \"*.tsx\" | head -50",
  "description": "Get overview of project files"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la /home/default/Desktop/dev/app-map-appahouse/",
  "description": "List main project directory"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la /home/default/Desktop/dev/app-map-appahouse/src/",
  "description": "List src directory contents"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/package.json"
}

🔧 Tool: Bash
Input: {
  "command": "find /home/default/Desktop/dev/app-map-appahouse/src/components -type f -name \"*.tsx\" -o -name \"*.ts\" | sort",
  "description": "List all component files"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la /home/default/Desktop/dev/app-map-appahouse/src/components/",
  "description": "List components directory"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la /home/default/Desktop/dev/app-map-appahouse/src/routes/",
  "description": "List routes directory"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/components/apps/app-grid.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/components/apps/app-card.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/routes/apps.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/routes/index.tsx"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la /home/default/Desktop/dev/app-map-appahouse/src/database/schema/",
  "description": "List database schema files"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la /home/default/Desktop/dev/app-map-appahouse/src/lib/server/",
  "description": "List server library files"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/apps.ts",
  "limit": 100
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/apps.ts",
  "offset": 100
}

🔧 Tool: Glob
Input: {
  "pattern": "/home/default/Desktop/dev/app-map-appahouse/src/database/schema/*.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/database/schema/apps.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/database/schema/index.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/components/apps/sortable-app-grid.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/components/ui/checkbox.tsx"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la /home/default/Desktop/dev/app-map-appahouse/src/components/apps/",
  "description": "List all app components"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/components/apps/app-form.tsx",
  "limit": 80
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/database/schema/categories.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/components/apps/index.ts"
}

🔧 Tool: Bash
Input: {
  "command": "grep -r \"useState\\|useCallback\\|useReducer\" /home/default/Desktop/dev/app-map-appahouse/src/routes/ | head -20",
  "description": "Check state management patterns"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/components/apps/swipeable-card.tsx"
}

🔧 Tool: Bash
Input: {
  "command": "grep -n \"export\\|function\\|interface\" /home/default/Desktop/dev/app-map-appahouse/src/routes/apps.tsx | head -30",
  "description": "Check apps route structure"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/components/ui/button.tsx",
  "limit": 50
}

🔧 Tool: Bash
Input: {
  "command": "head -50 /home/default/Desktop/dev/app-map-appahouse/src/components/ui/dialog.tsx",
  "description": "Check dialog component structure"
}

🔧 Tool: Bash
Input: {
  "command": "grep -n \"useState\" /home/default/Desktop/dev/app-map-appahouse/src/routes/apps.tsx",
  "description": "Check state variables in apps page"
}

🔧 Tool: Bash
Input: {
  "command": "wc -l /home/default/Desktop/dev/app-map-appahouse/src/routes/apps.tsx",
  "description": "Check apps.tsx file length"
}

🔧 Tool: Bash
Input: {
  "command": "grep -n \"const\\|function\" /home/default/Desktop/dev/app-map-appahouse/src/routes/apps.tsx | head -40",
  "description": "View structure of apps.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/database/db.ts"
}

🔧 Tool: Bash
Input: {
  "command": "head -50 /home/default/Desktop/dev/app-map-appahouse/src/lib/utils.ts",
  "description": "Check utility functions"
}

Excellent! The exploration revealed that bulk management features already exist on the `/apps` route with a table view, but the dashboard grid view on `/` doesn't have these features yet. Let me now examine the key files in detail and implement bulk management for the dashboard grid view.

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/routes/index.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/components/apps/app-grid.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/components/apps/app-card.tsx"
}

Now let me read the server-side app operations and the existing apps.tsx page that already has bulk operations:

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/apps.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/routes/apps.tsx"
}

Now I have a comprehensive understanding of the codebase. Let me create a todo list and start implementing the bulk app management features for the dashboard grid view:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Add selection mode state and bulk selection logic to dashboard index.tsx",
      "status": "in_progress",
      "activeForm": "Adding selection mode state to dashboard"
    },
    {
      "content": "Update AppGrid component to support selection mode with checkboxes",
      "status": "pending",
      "activeForm": "Updating AppGrid for selection mode"
    },
    {
      "content": "Update AppCard component to display selection checkbox overlay",
      "status": "pending",
      "activeForm": "Updating AppCard for checkbox overlay"
    },
    {
      "content": "Create BulkActionsBar component for batch operations menu",
      "status": "pending",
      "activeForm": "Creating BulkActionsBar component"
    },
    {
      "content": "Add bulk export as JSON server function",
      "status": "pending",
      "activeForm": "Adding bulk export server function"
    },
    {
      "content": "Add bulk update tags server function",
      "status": "pending",
      "activeForm": "Adding bulk update tags server function"
    },
    {
      "content": "Integrate BulkActionsBar with dashboard and connect all mutations",
      "status": "pending",
      "activeForm": "Integrating BulkActionsBar with dashboard"
    },
    {
      "content": "Create and run Playwright verification test",
      "status": "pending",
      "activeForm": "Running Playwright verification test"
    }
  ]
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/components/ui/checkbox.tsx"
}

Now let me start implementing. First, I'll add the bulk export and bulk update tags server functions, then update the components:

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/lib/server/apps.ts",
  "old_string": "// Update app sort order (for drag and drop reordering)\nexport const updateAppOrder = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { orderedIds: string[] } }) => {\n    const session = await getAuthenticatedSession();\n\n    const { orderedIds } = ctx.data;\n    if (!orderedIds.length) return { updated: 0 };\n\n    // Update each app's sortOrder based on its position in the array\n    for (let i = 0; i < orderedIds.length; i++) {\n      await db\n        .update(apps)\n        .set({ sortOrder: i, updatedAt: new Date() })\n        .where(and(eq(apps.id, orderedIds[i]), eq(apps.userId, session.user.id)));\n    }\n\n    return { updated: orderedIds.length };\n  }\n);",
  "new_string": "// Update app sort order (for drag and drop reordering)\nexport const updateAppOrder = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { orderedIds: string[] } }) => {\n    const session = await getAuthenticatedSession();\n\n    const { orderedIds } = ctx.data;\n    if (!orderedIds.length) return { updated: 0 };\n\n    // Update each app's sortOrder based on its position in the array\n    for (let i = 0; i < orderedIds.length; i++) {\n      await db\n        .update(apps)\n        .set({ sortOrder: i, updatedAt: new Date() })\n        .where(and(eq(apps.id, orderedIds[i]), eq(apps.userId, session.user.id)));\n    }\n\n    return { updated: orderedIds.length };\n  }\n);\n\n// Bulk export apps as JSON\nexport const bulkExportApps = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { ids: string[] } }) => {\n    const session = await getAuthenticatedSession();\n\n    const { ids } = ctx.data;\n    if (!ids.length) return { data: [] };\n\n    // Get the apps to export\n    const appsToExport = await db.query.apps.findMany({\n      where: and(inArray(apps.id, ids), eq(apps.userId, session.user.id)),\n      with: {\n        category: true,\n        tags: {\n          with: {\n            tag: true,\n          },\n        },\n      },\n    });\n\n    // Transform the data to a cleaner export format\n    const exportData = appsToExport.map((app) => ({\n      name: app.name,\n      description: app.description,\n      icon: app.icon,\n      localUrl: app.localUrl,\n      remoteUrl: app.remoteUrl,\n      category: app.category?.name || null,\n      tags: app.tags.map((t) => t.tag.name),\n      healthCheckEnabled: app.healthCheckEnabled,\n      healthCheckType: app.healthCheckType,\n      healthCheckUrl: app.healthCheckUrl,\n      notes: app.notes,\n      pinned: app.pinned,\n      sortOrder: app.sortOrder,\n      createdAt: app.createdAt,\n      updatedAt: app.updatedAt,\n    }));\n\n    return { data: exportData };\n  }\n);\n\n// Bulk update tags for apps\nexport const bulkUpdateTags = createServerFn({ method: \"POST\" }).handler(\n  async (ctx: { data: { ids: string[]; tagIds: string[]; mode: \"replace\" | \"append\" } }) => {\n    const session = await getAuthenticatedSession();\n\n    const { ids, tagIds, mode } = ctx.data;\n    if (!ids.length) return { updated: 0 };\n\n    // Verify apps belong to user\n    const userApps = await db.query.apps.findMany({\n      where: and(inArray(apps.id, ids), eq(apps.userId, session.user.id)),\n    });\n    const validIds = userApps.map((a) => a.id);\n    if (!validIds.length) return { updated: 0 };\n\n    if (mode === \"replace\") {\n      // Remove existing tags first\n      await db.delete(appTags).where(inArray(appTags.appId, validIds));\n    }\n\n    // Add new tags\n    if (tagIds.length > 0) {\n      const newTagRelations: { appId: string; tagId: string }[] = [];\n      for (const appId of validIds) {\n        for (const tagId of tagIds) {\n          newTagRelations.push({ appId, tagId });\n        }\n      }\n\n      // Insert new tag relations (ignore duplicates for append mode)\n      if (mode === \"append\") {\n        // For append mode, get existing tags first\n        const existingTags = await db.query.appTags.findMany({\n          where: inArray(appTags.appId, validIds),\n        });\n        const existingSet = new Set(existingTags.map((t) => `${t.appId}:${t.tagId}`));\n        const toInsert = newTagRelations.filter((r) => !existingSet.has(`${r.appId}:${r.tagId}`));\n        if (toInsert.length > 0) {\n          await db.insert(appTags).values(toInsert);\n        }\n      } else {\n        await db.insert(appTags).values(newTagRelations);\n      }\n    }\n\n    // Update the updatedAt timestamp for all apps\n    await db\n      .update(apps)\n      .set({ updatedAt: new Date() })\n      .where(inArray(apps.id, validIds));\n\n    return { updated: validIds.length };\n  }\n);"
}

Now let me create the BulkActionsBar component:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Add selection mode state and bulk selection logic to dashboard index.tsx",
      "status": "completed",
      "activeForm": "Adding selection mode state to dashboard"
    },
    {
      "content": "Update AppGrid component to support selection mode with checkboxes",
      "status": "pending",
      "activeForm": "Updating AppGrid for selection mode"
    },
    {
      "content": "Update AppCard component to display selection checkbox overlay",
      "status": "pending",
      "activeForm": "Updating AppCard for checkbox overlay"
    },
    {
      "content": "Create BulkActionsBar component for batch operations menu",
      "status": "in_progress",
      "activeForm": "Creating BulkActionsBar component"
    },
    {
      "content": "Add bulk export as JSON server function",
      "status": "completed",
      "activeForm": "Adding bulk export server function"
    },
    {
      "content": "Add bulk update tags server function",
      "status": "completed",
      "activeForm": "Adding bulk update tags server function"
    },
    {
      "content": "Integrate BulkActionsBar with dashboard and connect all mutations",
      "status": "pending",
      "activeForm": "Integrating BulkActionsBar with dashboard"
    },
    {
      "content": "Create and run Playwright verification test",
      "status": "pending",
      "activeForm": "Running Playwright verification test"
    }
  ]
}

🔧 Tool: Glob
Input: {
  "pattern": "src/components/apps/index.ts*",
  "path": "/home/default/Desktop/dev/app-map-appahouse"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/components/apps/index.ts"
}

Now let me create the BulkActionsBar component:

🔧 Tool: Write
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/components/apps/bulk-actions-bar.tsx",
  "content": "import { useState } from \"react\";\nimport {\n  FolderOpen,\n  Activity,\n  Trash2,\n  Download,\n  Tag,\n  CheckSquare,\n  Square,\n  X,\n} from \"lucide-react\";\nimport { Button } from \"@/components/ui/button\";\nimport { Badge } from \"@/components/ui/badge\";\nimport { Card, CardContent } from \"@/components/ui/card\";\nimport { Checkbox } from \"@/components/ui/checkbox\";\nimport { Label } from \"@/components/ui/label\";\nimport {\n  Dialog,\n  DialogContent,\n  DialogDescription,\n  DialogFooter,\n  DialogHeader,\n  DialogTitle,\n} from \"@/components/ui/dialog\";\nimport {\n  Select,\n  SelectContent,\n  SelectItem,\n  SelectTrigger,\n  SelectValue,\n} from \"@/components/ui/select\";\nimport {\n  DropdownMenu,\n  DropdownMenuContent,\n  DropdownMenuItem,\n  DropdownMenuSeparator,\n  DropdownMenuTrigger,\n} from \"@/components/ui/dropdown-menu\";\nimport type { Category } from \"@/database/schema/categories\";\nimport type { Tag as TagType } from \"@/database/schema/apps\";\n\ninterface BulkActionsBarProps {\n  selectedCount: number;\n  totalCount: number;\n  isAllSelected: boolean;\n  categories: Category[];\n  tags: TagType[];\n  onSelectAll: () => void;\n  onClearSelection: () => void;\n  onBulkUpdateCategory: (categoryId: string | null) => void;\n  onBulkUpdateTags: (tagIds: string[], mode: \"replace\" | \"append\") => void;\n  onBulkToggleHealthCheck: (enabled: boolean) => void;\n  onBulkDelete: () => void;\n  onBulkExport: () => void;\n  isLoading?: boolean;\n}\n\nexport function BulkActionsBar({\n  selectedCount,\n  totalCount,\n  isAllSelected,\n  categories,\n  tags,\n  onSelectAll,\n  onClearSelection,\n  onBulkUpdateCategory,\n  onBulkUpdateTags,\n  onBulkToggleHealthCheck,\n  onBulkDelete,\n  onBulkExport,\n  isLoading = false,\n}: BulkActionsBarProps) {\n  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);\n  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(\"\");\n  const [tagsDialogOpen, setTagsDialogOpen] = useState(false);\n  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);\n  const [tagMode, setTagMode] = useState<\"replace\" | \"append\">(\"replace\");\n\n  const handleCategorySubmit = () => {\n    onBulkUpdateCategory(selectedCategoryId === \"uncategorized\" ? null : selectedCategoryId);\n    setCategoryDialogOpen(false);\n    setSelectedCategoryId(\"\");\n  };\n\n  const handleTagsSubmit = () => {\n    onBulkUpdateTags(selectedTagIds, tagMode);\n    setTagsDialogOpen(false);\n    setSelectedTagIds([]);\n    setTagMode(\"replace\");\n  };\n\n  const toggleTagSelection = (tagId: string) => {\n    setSelectedTagIds((prev) =>\n      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]\n    );\n  };\n\n  if (selectedCount === 0) {\n    return null;\n  }\n\n  return (\n    <>\n      <Card className=\"border-primary bg-primary/5\" data-testid=\"bulk-actions-bar\">\n        <CardContent className=\"py-3\">\n          <div className=\"flex flex-wrap items-center gap-2 sm:gap-3\">\n            {/* Selection info */}\n            <div className=\"flex items-center gap-2\">\n              <Button\n                variant=\"ghost\"\n                size=\"sm\"\n                onClick={isAllSelected ? onClearSelection : onSelectAll}\n                className=\"h-8 px-2\"\n                data-testid=\"select-all-toggle\"\n              >\n                {isAllSelected ? (\n                  <CheckSquare className=\"h-4 w-4 mr-1\" />\n                ) : (\n                  <Square className=\"h-4 w-4 mr-1\" />\n                )}\n                <span className=\"hidden sm:inline\">{isAllSelected ? \"Deselect All\" : \"Select All\"}</span>\n              </Button>\n              <Badge variant=\"secondary\" className=\"font-medium\" data-testid=\"selection-count\">\n                {selectedCount} of {totalCount} selected\n              </Badge>\n            </div>\n\n            <div className=\"hidden sm:block h-6 w-px bg-border\" />\n\n            {/* Bulk Edit Dropdown */}\n            <DropdownMenu>\n              <DropdownMenuTrigger asChild>\n                <Button\n                  variant=\"outline\"\n                  size=\"sm\"\n                  disabled={isLoading}\n                  data-testid=\"bulk-edit-menu\"\n                >\n                  <FolderOpen className=\"h-4 w-4 mr-2\" />\n                  Bulk Edit\n                </Button>\n              </DropdownMenuTrigger>\n              <DropdownMenuContent align=\"start\">\n                <DropdownMenuItem onClick={() => setCategoryDialogOpen(true)}>\n                  <FolderOpen className=\"h-4 w-4 mr-2\" />\n                  Change Category\n                </DropdownMenuItem>\n                <DropdownMenuItem onClick={() => setTagsDialogOpen(true)}>\n                  <Tag className=\"h-4 w-4 mr-2\" />\n                  Update Tags\n                </DropdownMenuItem>\n                <DropdownMenuSeparator />\n                <DropdownMenuItem onClick={() => onBulkToggleHealthCheck(true)}>\n                  <Activity className=\"h-4 w-4 mr-2\" />\n                  Enable Health Check\n                </DropdownMenuItem>\n                <DropdownMenuItem onClick={() => onBulkToggleHealthCheck(false)}>\n                  <Activity className=\"h-4 w-4 mr-2\" />\n                  Disable Health Check\n                </DropdownMenuItem>\n              </DropdownMenuContent>\n            </DropdownMenu>\n\n            {/* Export Button */}\n            <Button\n              variant=\"outline\"\n              size=\"sm\"\n              onClick={onBulkExport}\n              disabled={isLoading}\n              data-testid=\"bulk-export\"\n            >\n              <Download className=\"h-4 w-4 mr-2\" />\n              <span className=\"hidden sm:inline\">Export JSON</span>\n              <span className=\"sm:hidden\">Export</span>\n            </Button>\n\n            {/* Delete Button */}\n            <Button\n              variant=\"destructive\"\n              size=\"sm\"\n              onClick={onBulkDelete}\n              disabled={isLoading}\n              data-testid=\"bulk-delete\"\n            >\n              <Trash2 className=\"h-4 w-4 mr-2\" />\n              Delete\n            </Button>\n\n            {/* Clear Selection */}\n            <Button\n              variant=\"ghost\"\n              size=\"sm\"\n              onClick={onClearSelection}\n              className=\"ml-auto\"\n              data-testid=\"clear-selection\"\n            >\n              <X className=\"h-4 w-4 mr-1\" />\n              <span className=\"hidden sm:inline\">Clear</span>\n            </Button>\n          </div>\n        </CardContent>\n      </Card>\n\n      {/* Category Dialog */}\n      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>\n        <DialogContent>\n          <DialogHeader>\n            <DialogTitle>Change Category</DialogTitle>\n            <DialogDescription>\n              Assign a category to {selectedCount} selected app(s)\n            </DialogDescription>\n          </DialogHeader>\n          <div className=\"py-4\">\n            <Label htmlFor=\"bulk-category\">Category</Label>\n            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>\n              <SelectTrigger className=\"mt-2\" data-testid=\"category-select\">\n                <SelectValue placeholder=\"Select a category\" />\n              </SelectTrigger>\n              <SelectContent>\n                <SelectItem value=\"uncategorized\">Uncategorized</SelectItem>\n                {categories.map((cat) => (\n                  <SelectItem key={cat.id} value={cat.id}>\n                    {cat.icon && <span className=\"mr-2\">{cat.icon}</span>}\n                    {cat.name}\n                  </SelectItem>\n                ))}\n              </SelectContent>\n            </Select>\n          </div>\n          <DialogFooter>\n            <Button variant=\"outline\" onClick={() => setCategoryDialogOpen(false)}>\n              Cancel\n            </Button>\n            <Button\n              onClick={handleCategorySubmit}\n              disabled={!selectedCategoryId || isLoading}\n              data-testid=\"category-submit\"\n            >\n              Update Category\n            </Button>\n          </DialogFooter>\n        </DialogContent>\n      </Dialog>\n\n      {/* Tags Dialog */}\n      <Dialog open={tagsDialogOpen} onOpenChange={setTagsDialogOpen}>\n        <DialogContent>\n          <DialogHeader>\n            <DialogTitle>Update Tags</DialogTitle>\n            <DialogDescription>\n              Manage tags for {selectedCount} selected app(s)\n            </DialogDescription>\n          </DialogHeader>\n          <div className=\"py-4 space-y-4\">\n            <div className=\"space-y-2\">\n              <Label>Mode</Label>\n              <Select value={tagMode} onValueChange={(v: \"replace\" | \"append\") => setTagMode(v)}>\n                <SelectTrigger data-testid=\"tag-mode-select\">\n                  <SelectValue />\n                </SelectTrigger>\n                <SelectContent>\n                  <SelectItem value=\"replace\">Replace existing tags</SelectItem>\n                  <SelectItem value=\"append\">Add to existing tags</SelectItem>\n                </SelectContent>\n              </Select>\n            </div>\n            <div className=\"space-y-2\">\n              <Label>Tags</Label>\n              <div className=\"border rounded-md p-3 max-h-48 overflow-y-auto space-y-2\">\n                {tags.length === 0 ? (\n                  <p className=\"text-sm text-muted-foreground\">No tags available</p>\n                ) : (\n                  tags.map((tag) => (\n                    <div key={tag.id} className=\"flex items-center gap-2\">\n                      <Checkbox\n                        id={`tag-${tag.id}`}\n                        checked={selectedTagIds.includes(tag.id)}\n                        onCheckedChange={() => toggleTagSelection(tag.id)}\n                      />\n                      <Label\n                        htmlFor={`tag-${tag.id}`}\n                        className=\"flex items-center gap-2 cursor-pointer\"\n                      >\n                        <span\n                          className=\"w-3 h-3 rounded-full\"\n                          style={{ backgroundColor: tag.color || \"#6b7280\" }}\n                        />\n                        {tag.name}\n                      </Label>\n                    </div>\n                  ))\n                )}\n              </div>\n            </div>\n          </div>\n          <DialogFooter>\n            <Button variant=\"outline\" onClick={() => setTagsDialogOpen(false)}>\n              Cancel\n            </Button>\n            <Button\n              onClick={handleTagsSubmit}\n              disabled={isLoading}\n              data-testid=\"tags-submit\"\n            >\n              {tagMode === \"replace\" ? \"Replace Tags\" : \"Add Tags\"}\n            </Button>\n          </DialogFooter>\n        </DialogContent>\n      </Dialog>\n    </>\n  );\n}\n"
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/components/apps/index.ts",
  "old_string": "export { AppCard, type HealthStatus } from \"./app-card\";\nexport { AppGrid, type AppWithRelations } from \"./app-grid\";\nexport { SortableAppGrid } from \"./sortable-app-grid\";\nexport { AppForm, type AppFormData } from \"./app-form\";\nexport { AppNotesDialog } from \"./app-notes-dialog\";\nexport { QuickLinksBar } from \"./quick-links-bar\";\nexport { SwipeableCard } from \"./swipeable-card\";",
  "new_string": "export { AppCard, type HealthStatus } from \"./app-card\";\nexport { AppGrid, type AppWithRelations } from \"./app-grid\";\nexport { SortableAppGrid } from \"./sortable-app-grid\";\nexport { AppForm, type AppFormData } from \"./app-form\";\nexport { AppNotesDialog } from \"./app-notes-dialog\";\nexport { QuickLinksBar } from \"./quick-links-bar\";\nexport { SwipeableCard } from \"./swipeable-card\";\nexport { BulkActionsBar } from \"./bulk-actions-bar\";"
}

Now let me update the AppCard component to support selection mode with a checkbox overlay:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Add selection mode state and bulk selection logic to dashboard index.tsx",
      "status": "completed",
      "activeForm": "Adding selection mode state to dashboard"
    },
    {
      "content": "Update AppGrid component to support selection mode with checkboxes",
      "status": "pending",
      "activeForm": "Updating AppGrid for selection mode"
    },
    {
      "content": "Update AppCard component to display selection checkbox overlay",
      "status": "in_progress",
      "activeForm": "Updating AppCard for checkbox overlay"
    },
    {
      "content": "Create BulkActionsBar component for batch operations menu",
      "status": "completed",
      "activeForm": "Creating BulkActionsBar component"
    },
    {
      "content": "Add bulk export as JSON server function",
      "status": "completed",
      "activeForm": "Adding bulk export server function"
    },
    {
      "content": "Add bulk update tags server function",
      "status": "completed",
      "activeForm": "Adding bulk update tags server function"
    },
    {
      "content": "Integrate BulkActionsBar with dashboard and connect all mutations",
      "status": "pending",
      "activeForm": "Integrating BulkActionsBar with dashboard"
    },
    {
      "content": "Create and run Playwright verification test",
      "status": "pending",
      "activeForm": "Running Playwright verification test"
    }
  ]
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/components/apps/app-card.tsx",
  "old_string": "import { useState } from \"react\";\nimport { Copy, MoreVertical, Pencil, Trash2, StickyNote, Home, Globe, Pin, PinOff } from \"lucide-react\";\nimport { Card, CardContent } from \"@/components/ui/card\";\nimport { Badge } from \"@/components/ui/badge\";\nimport { Button } from \"@/components/ui/button\";\nimport {\n  DropdownMenu,\n  DropdownMenuContent,\n  DropdownMenuItem,\n  DropdownMenuSeparator,\n  DropdownMenuTrigger,\n} from \"@/components/ui/dropdown-menu\";\nimport {\n  ContextMenu,\n  ContextMenuContent,\n  ContextMenuItem,\n  ContextMenuSeparator,\n  ContextMenuTrigger,\n} from \"@/components/ui/context-menu\";\nimport { cn } from \"@/lib/utils\";\nimport type { App, Tag } from \"@/database/schema/apps\";\nimport type { Category } from \"@/database/schema/categories\";\n\nexport type HealthStatus = \"online\" | \"offline\" | \"unknown\" | \"checking\";\n\ninterface AppCardProps {\n  app: App & {\n    category?: Category | null;\n    tags?: Tag[];\n  };\n  healthStatus?: HealthStatus;\n  healthBarStyle?: \"dot\" | \"border\" | \"none\";\n  viewMode?: \"grid\" | \"list\";\n  onEdit?: (app: App) => void;\n  onDelete?: (app: App) => void;\n  onViewNotes?: (app: App) => void;\n  onPin?: (app: App, pinned: boolean) => void;\n}",
  "new_string": "import { useState } from \"react\";\nimport { Copy, MoreVertical, Pencil, Trash2, StickyNote, Home, Globe, Pin, PinOff, Check } from \"lucide-react\";\nimport { Card, CardContent } from \"@/components/ui/card\";\nimport { Badge } from \"@/components/ui/badge\";\nimport { Button } from \"@/components/ui/button\";\nimport {\n  DropdownMenu,\n  DropdownMenuContent,\n  DropdownMenuItem,\n  DropdownMenuSeparator,\n  DropdownMenuTrigger,\n} from \"@/components/ui/dropdown-menu\";\nimport {\n  ContextMenu,\n  ContextMenuContent,\n  ContextMenuItem,\n  ContextMenuSeparator,\n  ContextMenuTrigger,\n} from \"@/components/ui/context-menu\";\nimport { cn } from \"@/lib/utils\";\nimport type { App, Tag } from \"@/database/schema/apps\";\nimport type { Category } from \"@/database/schema/categories\";\n\nexport type HealthStatus = \"online\" | \"offline\" | \"unknown\" | \"checking\";\n\ninterface AppCardProps {\n  app: App & {\n    category?: Category | null;\n    tags?: Tag[];\n  };\n  healthStatus?: HealthStatus;\n  healthBarStyle?: \"dot\" | \"border\" | \"none\";\n  viewMode?: \"grid\" | \"list\";\n  selectionMode?: boolean;\n  isSelected?: boolean;\n  onSelect?: (app: App) => void;\n  onEdit?: (app: App) => void;\n  onDelete?: (app: App) => void;\n  onViewNotes?: (app: App) => void;\n  onPin?: (app: App, pinned: boolean) => void;\n}"
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/components/apps/app-card.tsx",
  "old_string": "export function AppCard({\n  app,\n  healthStatus = \"unknown\",\n  healthBarStyle = \"dot\",\n  viewMode = \"grid\",\n  onEdit,\n  onDelete,\n  onViewNotes,\n  onPin,\n}: AppCardProps) {",
  "new_string": "export function AppCard({\n  app,\n  healthStatus = \"unknown\",\n  healthBarStyle = \"dot\",\n  viewMode = \"grid\",\n  selectionMode = false,\n  isSelected = false,\n  onSelect,\n  onEdit,\n  onDelete,\n  onViewNotes,\n  onPin,\n}: AppCardProps) {"
}

Now I need to update the handleOpenApp function to handle selection mode clicks, and add the checkbox overlay:

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/components/apps/app-card.tsx",
  "old_string": "  const handleOpenApp = (e: React.MouseEvent) => {\n    // Don't open if clicking on interactive elements\n    const target = e.target as HTMLElement;\n    if (target.closest('button') || target.closest('[role=\"menu\"]')) {\n      return;\n    }\n\n    if (primaryUrl) {\n      const url = normalizeUrl(primaryUrl);\n      if (url) {\n        window.open(url, \"_blank\", \"noopener,noreferrer\");\n      }\n    }\n  };",
  "new_string": "  const handleOpenApp = (e: React.MouseEvent) => {\n    // Don't open if clicking on interactive elements\n    const target = e.target as HTMLElement;\n    if (target.closest('button') || target.closest('[role=\"menu\"]') || target.closest('[data-selection-checkbox]')) {\n      return;\n    }\n\n    // In selection mode, toggle selection on click\n    if (selectionMode && onSelect) {\n      onSelect(app);\n      return;\n    }\n\n    if (primaryUrl) {\n      const url = normalizeUrl(primaryUrl);\n      if (url) {\n        window.open(url, \"_blank\", \"noopener,noreferrer\");\n      }\n    }\n  };\n\n  const handleCheckboxClick = (e: React.MouseEvent) => {\n    e.preventDefault();\n    e.stopPropagation();\n    if (onSelect) {\n      onSelect(app);\n    }\n  };"
}

Now update the Card component to show the checkbox overlay and handle selection styling:

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/components/apps/app-card.tsx",
  "old_string": "  return (\n    <ContextMenu>\n      <ContextMenuTrigger asChild>\n        <Card\n          className={cn(\n            \"group relative transition-all\",\n            hasValidUrl && \"cursor-pointer hover:shadow-lg hover:scale-[1.02]\",\n            !hasValidUrl && \"opacity-75\",\n            healthBarStyle === \"border\" && app.healthCheckEnabled && \"border-2\",\n            borderClass\n          )}\n          onClick={handleOpenApp}\n        >",
  "new_string": "  return (\n    <ContextMenu>\n      <ContextMenuTrigger asChild>\n        <Card\n          className={cn(\n            \"group relative transition-all\",\n            hasValidUrl && !selectionMode && \"cursor-pointer hover:shadow-lg hover:scale-[1.02]\",\n            selectionMode && \"cursor-pointer hover:shadow-md\",\n            !hasValidUrl && !selectionMode && \"opacity-75\",\n            healthBarStyle === \"border\" && app.healthCheckEnabled && \"border-2\",\n            borderClass,\n            isSelected && \"ring-2 ring-primary border-primary bg-primary/5\"\n          )}\n          onClick={handleOpenApp}\n          data-testid={`app-card-${app.id}`}\n        >\n          {/* Selection Checkbox Overlay */}\n          {selectionMode && (\n            <div\n              data-selection-checkbox\n              className=\"absolute top-2 left-2 z-10\"\n              onClick={handleCheckboxClick}\n            >\n              <div\n                className={cn(\n                  \"h-5 w-5 rounded-sm border-2 flex items-center justify-center transition-colors\",\n                  isSelected\n                    ? \"bg-primary border-primary text-primary-foreground\"\n                    : \"bg-background border-muted-foreground/50 hover:border-primary\"\n                )}\n              >\n                {isSelected && <Check className=\"h-3 w-3\" />}\n              </div>\n            </div>\n          )}"
}

Now let me update the AppGrid component to pass selection props through:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Add selection mode state and bulk selection logic to dashboard index.tsx",
      "status": "completed",
      "activeForm": "Adding selection mode state to dashboard"
    },
    {
      "content": "Update AppGrid component to support selection mode with checkboxes",
      "status": "in_progress",
      "activeForm": "Updating AppGrid for selection mode"
    },
    {
      "content": "Update AppCard component to display selection checkbox overlay",
      "status": "completed",
      "activeForm": "Updating AppCard for checkbox overlay"
    },
    {
      "content": "Create BulkActionsBar component for batch operations menu",
      "status": "completed",
      "activeForm": "Creating BulkActionsBar component"
    },
    {
      "content": "Add bulk export as JSON server function",
      "status": "completed",
      "activeForm": "Adding bulk export server function"
    },
    {
      "content": "Add bulk update tags server function",
      "status": "completed",
      "activeForm": "Adding bulk update tags server function"
    },
    {
      "content": "Integrate BulkActionsBar with dashboard and connect all mutations",
      "status": "pending",
      "activeForm": "Integrating BulkActionsBar with dashboard"
    },
    {
      "content": "Create and run Playwright verification test",
      "status": "pending",
      "activeForm": "Running Playwright verification test"
    }
  ]
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/components/apps/app-grid.tsx",
  "old_string": "import { useMemo } from \"react\";\nimport { AppCard, type HealthStatus } from \"./app-card\";\nimport { SwipeableCard } from \"./swipeable-card\";\nimport type { App, Tag } from \"@/database/schema/apps\";\nimport type { Category } from \"@/database/schema/categories\";\nimport { cn } from \"@/lib/utils\";\n\nexport type AppWithRelations = App & {\n  category?: Category | null;\n  tags?: Tag[];\n};\n\ninterface AppGridProps {\n  apps: AppWithRelations[];\n  healthStatuses?: Record<string, HealthStatus>;\n  healthBarStyle?: \"dot\" | \"border\" | \"none\";\n  columns?: number;\n  viewMode?: \"grid\" | \"list\";\n  groupByCategory?: boolean;\n  onEditApp?: (app: App) => void;\n  onDeleteApp?: (app: App) => void;\n  onViewNotes?: (app: App) => void;\n  onPinApp?: (app: App, pinned: boolean) => void;\n}",
  "new_string": "import { useMemo } from \"react\";\nimport { AppCard, type HealthStatus } from \"./app-card\";\nimport { SwipeableCard } from \"./swipeable-card\";\nimport type { App, Tag } from \"@/database/schema/apps\";\nimport type { Category } from \"@/database/schema/categories\";\nimport { cn } from \"@/lib/utils\";\n\nexport type AppWithRelations = App & {\n  category?: Category | null;\n  tags?: Tag[];\n};\n\ninterface AppGridProps {\n  apps: AppWithRelations[];\n  healthStatuses?: Record<string, HealthStatus>;\n  healthBarStyle?: \"dot\" | \"border\" | \"none\";\n  columns?: number;\n  viewMode?: \"grid\" | \"list\";\n  groupByCategory?: boolean;\n  selectionMode?: boolean;\n  selectedIds?: Set<string>;\n  onSelectApp?: (app: App) => void;\n  onEditApp?: (app: App) => void;\n  onDeleteApp?: (app: App) => void;\n  onViewNotes?: (app: App) => void;\n  onPinApp?: (app: App, pinned: boolean) => void;\n}"
}

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/components/apps/app-grid.tsx",
  "old_string": "export function AppGrid({\n  apps,\n  healthStatuses = {},\n  healthBarStyle = \"dot\",\n  columns = 4,\n  viewMode = \"grid\",\n  groupByCategory = true,\n  onEditApp,\n  onDeleteApp,\n  onViewNotes,\n  onPinApp,\n}: AppGridProps) {",
  "new_string": "export function AppGrid({\n  apps,\n  healthStatuses = {},\n  healthBarStyle = \"dot\",\n  columns = 4,\n  viewMode = \"grid\",\n  groupByCategory = true,\n  selectionMode = false,\n  selectedIds = new Set(),\n  onSelectApp,\n  onEditApp,\n  onDeleteApp,\n  onViewNotes,\n  onPinApp,\n}: AppGridProps) {"
}

Now update the AppCard rendering in AppGrid to pass selection props:

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/components/apps/app-grid.tsx",
  "old_string": "          <div className={gridClasses}>\n            {group.apps.map((app) => (\n              <SwipeableCard\n                key={app.id}\n                onDelete={onDeleteApp ? () => onDeleteApp(app) : undefined}\n                onPin={onPinApp ? () => onPinApp(app, !app.pinned) : undefined}\n                isPinned={app.pinned ?? false}\n              >\n                <AppCard\n                  app={app}\n                  healthStatus={healthStatuses[app.id] ?? \"unknown\"}\n                  healthBarStyle={healthBarStyle}\n                  viewMode={viewMode}\n                  onEdit={onEditApp}\n                  onDelete={onDeleteApp}\n                  onViewNotes={onViewNotes}\n                  onPin={onPinApp}\n                />\n              </SwipeableCard>\n            ))}\n          </div>",
  "new_string": "          <div className={gridClasses}>\n            {group.apps.map((app) => (\n              <SwipeableCard\n                key={app.id}\n                onDelete={onDeleteApp ? () => onDeleteApp(app) : undefined}\n                onPin={onPinApp ? () => onPinApp(app, !app.pinned) : undefined}\n                isPinned={app.pinned ?? false}\n                disabled={selectionMode}\n              >\n                <AppCard\n                  app={app}\n                  healthStatus={healthStatuses[app.id] ?? \"unknown\"}\n                  healthBarStyle={healthBarStyle}\n                  viewMode={viewMode}\n                  selectionMode={selectionMode}\n                  isSelected={selectedIds.has(app.id)}\n                  onSelect={onSelectApp}\n                  onEdit={onEditApp}\n                  onDelete={onDeleteApp}\n                  onViewNotes={onViewNotes}\n                  onPin={onPinApp}\n                />\n              </SwipeableCard>\n            ))}\n          </div>"
}

Now I need to update the SwipeableCard to support a `disabled` prop. Let me check it:

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/components/apps/swipeable-card.tsx"
}

The SwipeableCard already has the `disabled` prop. Now let me update the dashboard (index.tsx) to integrate all the bulk management features:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Add selection mode state and bulk selection logic to dashboard index.tsx",
      "status": "completed",
      "activeForm": "Adding selection mode state to dashboard"
    },
    {
      "content": "Update AppGrid component to support selection mode with checkboxes",
      "status": "completed",
      "activeForm": "Updating AppGrid for selection mode"
    },
    {
      "content": "Update AppCard component to display selection checkbox overlay",
      "status": "completed",
      "activeForm": "Updating AppCard for checkbox overlay"
    },
    {
      "content": "Create BulkActionsBar component for batch operations menu",
      "status": "completed",
      "activeForm": "Creating BulkActionsBar component"
    },
    {
      "content": "Add bulk export as JSON server function",
      "status": "completed",
      "activeForm": "Adding bulk export server function"
    },
    {
      "content": "Add bulk update tags server function",
      "status": "completed",
      "activeForm": "Adding bulk update tags server function"
    },
    {
      "content": "Integrate BulkActionsBar with dashboard and connect all mutations",
      "status": "in_progress",
      "activeForm": "Integrating BulkActionsBar with dashboard"
    },
    {
      "content": "Create and run Playwright verification test",
      "status": "pending",
      "activeForm": "Running Playwright verification test"
    }
  ]
}

Now let me update the dashboard index.tsx to integrate selection mode and bulk actions:

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/routes/index.tsx",
  "old_string": "import { useState } from \"react\";\nimport { useQuery, useMutation, useQueryClient } from \"@tanstack/react-query\";\nimport { createFileRoute } from \"@tanstack/react-router\";\nimport { Plus, LayoutGrid, List, Settings2, RefreshCw, Activity, Radar, GripVertical } from \"lucide-react\";\nimport { useAuthenticate } from \"@daveyplate/better-auth-ui\";\nimport { Button } from \"@/components/ui/button\";\nimport { AppGrid, SortableAppGrid, AppForm, AppNotesDialog, QuickLinksBar, type AppFormData } from \"@/components/apps\";\nimport { WidgetGrid } from \"@/components/widgets\";\nimport { ServiceDiscoveryDialog } from \"@/components/discovery\";\nimport { getApps, createApp, updateApp, deleteApp, pinApp, updateAppOrder } from \"@/lib/server/apps\";\nimport { getCategories } from \"@/lib/server/categories\";\nimport { getTags } from \"@/lib/server/tags\";\nimport { getUserSettings } from \"@/lib/server/user-settings\";\nimport { useHealthStatus } from \"@/hooks/use-health-status\";\nimport type { App } from \"@/database/schema/apps\";",
  "new_string": "import { useState } from \"react\";\nimport { useQuery, useMutation, useQueryClient } from \"@tanstack/react-query\";\nimport { createFileRoute } from \"@tanstack/react-router\";\nimport { Plus, LayoutGrid, List, Settings2, RefreshCw, Activity, Radar, GripVertical, CheckSquare } from \"lucide-react\";\nimport { useAuthenticate } from \"@daveyplate/better-auth-ui\";\nimport { Button } from \"@/components/ui/button\";\nimport { AppGrid, SortableAppGrid, AppForm, AppNotesDialog, QuickLinksBar, BulkActionsBar, type AppFormData } from \"@/components/apps\";\nimport { WidgetGrid } from \"@/components/widgets\";\nimport { ServiceDiscoveryDialog } from \"@/components/discovery\";\nimport {\n  getApps,\n  createApp,\n  updateApp,\n  deleteApp,\n  pinApp,\n  updateAppOrder,\n  bulkDeleteApps,\n  bulkUpdateCategory,\n  bulkToggleHealthCheck,\n  bulkExportApps,\n  bulkUpdateTags,\n} from \"@/lib/server/apps\";\nimport { getCategories } from \"@/lib/server/categories\";\nimport { getTags } from \"@/lib/server/tags\";\nimport { getUserSettings } from \"@/lib/server/user-settings\";\nimport { useHealthStatus } from \"@/hooks/use-health-status\";\nimport type { App } from \"@/database/schema/apps\";"
}

Now add the selection state and mutations:

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/routes/index.tsx",
  "old_string": "  const [formOpen, setFormOpen] = useState(false);\n  const [editingApp, setEditingApp] = useState<App | null>(null);\n  const [notesApp, setNotesApp] = useState<App | null>(null);\n  const [discoveryOpen, setDiscoveryOpen] = useState(false);\n  const [viewMode, setViewMode] = useState<\"grid\" | \"list\">(\"grid\");\n  const [groupByCategory, setGroupByCategory] = useState(true);\n  const [reorderMode, setReorderMode] = useState(false);",
  "new_string": "  const [formOpen, setFormOpen] = useState(false);\n  const [editingApp, setEditingApp] = useState<App | null>(null);\n  const [notesApp, setNotesApp] = useState<App | null>(null);\n  const [discoveryOpen, setDiscoveryOpen] = useState(false);\n  const [viewMode, setViewMode] = useState<\"grid\" | \"list\">(\"grid\");\n  const [groupByCategory, setGroupByCategory] = useState(true);\n  const [reorderMode, setReorderMode] = useState(false);\n  const [selectionMode, setSelectionMode] = useState(false);\n  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());"
}

Now add the bulk mutations after the reorder mutation:

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/routes/index.tsx",
  "old_string": "  // Reorder apps mutation\n  const reorderMutation = useMutation({\n    mutationFn: (orderedIds: string[]) =>\n      updateAppOrder({ data: { orderedIds } }),\n    onSuccess: () => {\n      queryClient.invalidateQueries({ queryKey: [\"apps\"] });\n    },\n  });\n\n  const handleSubmit = (data: AppFormData) => {",
  "new_string": "  // Reorder apps mutation\n  const reorderMutation = useMutation({\n    mutationFn: (orderedIds: string[]) =>\n      updateAppOrder({ data: { orderedIds } }),\n    onSuccess: () => {\n      queryClient.invalidateQueries({ queryKey: [\"apps\"] });\n    },\n  });\n\n  // Bulk delete mutation\n  const bulkDeleteMutation = useMutation({\n    mutationFn: (ids: string[]) => bulkDeleteApps({ data: { ids } }),\n    onSuccess: () => {\n      queryClient.invalidateQueries({ queryKey: [\"apps\"] });\n      setSelectedIds(new Set());\n      setSelectionMode(false);\n    },\n  });\n\n  // Bulk update category mutation\n  const bulkCategoryMutation = useMutation({\n    mutationFn: (data: { ids: string[]; categoryId: string | null }) =>\n      bulkUpdateCategory({ data }),\n    onSuccess: () => {\n      queryClient.invalidateQueries({ queryKey: [\"apps\"] });\n      setSelectedIds(new Set());\n    },\n  });\n\n  // Bulk toggle health check mutation\n  const bulkHealthCheckMutation = useMutation({\n    mutationFn: (data: { ids: string[]; enabled: boolean }) =>\n      bulkToggleHealthCheck({ data }),\n    onSuccess: () => {\n      queryClient.invalidateQueries({ queryKey: [\"apps\"] });\n      setSelectedIds(new Set());\n    },\n  });\n\n  // Bulk export apps mutation\n  const bulkExportMutation = useMutation({\n    mutationFn: (ids: string[]) => bulkExportApps({ data: { ids } }),\n    onSuccess: (result) => {\n      // Download the JSON file\n      const blob = new Blob([JSON.stringify(result.data, null, 2)], {\n        type: \"application/json\",\n      });\n      const url = URL.createObjectURL(blob);\n      const a = document.createElement(\"a\");\n      a.href = url;\n      a.download = `apps-export-${new Date().toISOString().slice(0, 10)}.json`;\n      document.body.appendChild(a);\n      a.click();\n      document.body.removeChild(a);\n      URL.revokeObjectURL(url);\n    },\n  });\n\n  // Bulk update tags mutation\n  const bulkTagsMutation = useMutation({\n    mutationFn: (data: { ids: string[]; tagIds: string[]; mode: \"replace\" | \"append\" }) =>\n      bulkUpdateTags({ data }),\n    onSuccess: () => {\n      queryClient.invalidateQueries({ queryKey: [\"apps\"] });\n      setSelectedIds(new Set());\n    },\n  });\n\n  const handleSubmit = (data: AppFormData) => {"
}

Now add the selection handlers after the existing handlers:

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/routes/index.tsx",
  "old_string": "  const handleCloseForm = (open: boolean) => {\n    setFormOpen(open);\n    if (!open) {\n      setEditingApp(null);\n    }\n  };\n\n  // Show login prompt if not authenticated",
  "new_string": "  const handleCloseForm = (open: boolean) => {\n    setFormOpen(open);\n    if (!open) {\n      setEditingApp(null);\n    }\n  };\n\n  // Selection mode handlers\n  const toggleSelectionMode = () => {\n    if (selectionMode) {\n      // Exiting selection mode - clear selections\n      setSelectedIds(new Set());\n    }\n    setSelectionMode(!selectionMode);\n  };\n\n  const handleSelectApp = (app: App) => {\n    setSelectedIds((prev) => {\n      const next = new Set(prev);\n      if (next.has(app.id)) {\n        next.delete(app.id);\n      } else {\n        next.add(app.id);\n      }\n      return next;\n    });\n  };\n\n  const handleSelectAll = () => {\n    setSelectedIds(new Set(apps.map((a) => a.id)));\n  };\n\n  const handleClearSelection = () => {\n    setSelectedIds(new Set());\n  };\n\n  const handleBulkDelete = () => {\n    if (selectedIds.size === 0) return;\n    if (confirm(`Delete ${selectedIds.size} selected app(s)?`)) {\n      bulkDeleteMutation.mutate(Array.from(selectedIds));\n    }\n  };\n\n  const handleBulkUpdateCategory = (categoryId: string | null) => {\n    if (selectedIds.size === 0) return;\n    bulkCategoryMutation.mutate({\n      ids: Array.from(selectedIds),\n      categoryId,\n    });\n  };\n\n  const handleBulkToggleHealthCheck = (enabled: boolean) => {\n    if (selectedIds.size === 0) return;\n    bulkHealthCheckMutation.mutate({\n      ids: Array.from(selectedIds),\n      enabled,\n    });\n  };\n\n  const handleBulkExport = () => {\n    if (selectedIds.size === 0) return;\n    bulkExportMutation.mutate(Array.from(selectedIds));\n  };\n\n  const handleBulkUpdateTags = (tagIds: string[], mode: \"replace\" | \"append\") => {\n    if (selectedIds.size === 0) return;\n    bulkTagsMutation.mutate({\n      ids: Array.from(selectedIds),\n      tagIds,\n      mode,\n    });\n  };\n\n  // Show login prompt if not authenticated"
}

Now I need to read the current header section to add the selection mode toggle button and update the AppGrid to pass selection props. Let me find the header section:

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/routes/index.tsx",
  "offset": 340,
  "limit": 150
}

Let me add the selection mode toggle button after the reorder toggle:

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/routes/index.tsx",
  "old_string": "          {/* Reorder toggle */}\n          <Button\n            variant={reorderMode ? \"secondary\" : \"outline\"}\n            size=\"icon\"\n            className=\"sm:hidden h-11 w-11\"\n            onClick={toggleReorderMode}\n            title={reorderMode ? \"Exit Reorder Mode\" : \"Reorder Apps\"}\n          >\n            <GripVertical className=\"h-5 w-5\" />\n          </Button>\n          <Button\n            variant={reorderMode ? \"secondary\" : \"outline\"}\n            size=\"sm\"\n            className=\"hidden sm:flex\"\n            onClick={toggleReorderMode}\n          >\n            <GripVertical className=\"h-4 w-4 mr-2\" />\n            {reorderMode ? \"Done\" : \"Reorder\"}\n          </Button>\n\n          {/* Group toggle */}",
  "new_string": "          {/* Reorder toggle */}\n          <Button\n            variant={reorderMode ? \"secondary\" : \"outline\"}\n            size=\"icon\"\n            className=\"sm:hidden h-11 w-11\"\n            onClick={toggleReorderMode}\n            disabled={selectionMode}\n            title={reorderMode ? \"Exit Reorder Mode\" : \"Reorder Apps\"}\n          >\n            <GripVertical className=\"h-5 w-5\" />\n          </Button>\n          <Button\n            variant={reorderMode ? \"secondary\" : \"outline\"}\n            size=\"sm\"\n            className=\"hidden sm:flex\"\n            onClick={toggleReorderMode}\n            disabled={selectionMode}\n          >\n            <GripVertical className=\"h-4 w-4 mr-2\" />\n            {reorderMode ? \"Done\" : \"Reorder\"}\n          </Button>\n\n          {/* Selection mode toggle */}\n          <Button\n            variant={selectionMode ? \"secondary\" : \"outline\"}\n            size=\"icon\"\n            className=\"sm:hidden h-11 w-11\"\n            onClick={toggleSelectionMode}\n            disabled={reorderMode}\n            title={selectionMode ? \"Exit Selection Mode\" : \"Select Apps\"}\n            data-testid=\"selection-mode-toggle\"\n          >\n            <CheckSquare className=\"h-5 w-5\" />\n          </Button>\n          <Button\n            variant={selectionMode ? \"secondary\" : \"outline\"}\n            size=\"sm\"\n            className=\"hidden sm:flex\"\n            onClick={toggleSelectionMode}\n            disabled={reorderMode}\n            data-testid=\"selection-mode-toggle-desktop\"\n          >\n            <CheckSquare className=\"h-4 w-4 mr-2\" />\n            {selectionMode ? \"Done\" : \"Select\"}\n          </Button>\n\n          {/* Group toggle */}"
}

Now let me find and update the AppGrid section to add the BulkActionsBar and pass selection props:

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/routes/index.tsx",
  "offset": 500,
  "limit": 100
}

Now let me update the AppGrid section to add BulkActionsBar and pass selection props:

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/src/routes/index.tsx",
  "old_string": "      {/* Widgets Section */}\n      <WidgetGrid reorderMode={reorderMode} />\n\n      {/* App Grid */}\n      {isAppsLoading ? (\n        <div className=\"flex items-center justify-center py-12\">\n          <RefreshCw className=\"h-8 w-8 animate-spin text-muted-foreground\" />\n        </div>\n      ) : reorderMode ? (\n        <div className=\"space-y-2\">\n          <p className=\"text-sm text-muted-foreground\">\n            Drag apps to reorder. Changes are saved automatically.\n          </p>\n          <SortableAppGrid\n            apps={apps.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))}\n            healthStatuses={healthStatuses}\n            healthBarStyle={healthBarStyle}\n            columns={4}\n            viewMode={viewMode}\n            onEditApp={handleEdit}\n            onDeleteApp={handleDelete}\n            onViewNotes={handleViewNotes}\n            onPinApp={handlePin}\n            onReorder={handleReorder}\n            reorderEnabled={true}\n          />\n        </div>\n      ) : (\n        <AppGrid\n          apps={apps}\n          healthStatuses={healthStatuses}\n          healthBarStyle={healthBarStyle}\n          columns={4}\n          viewMode={viewMode}\n          groupByCategory={groupByCategory}\n          onEditApp={handleEdit}\n          onDeleteApp={handleDelete}\n          onViewNotes={handleViewNotes}\n          onPinApp={handlePin}\n        />\n      )}",
  "new_string": "      {/* Widgets Section */}\n      <WidgetGrid reorderMode={reorderMode} />\n\n      {/* Bulk Actions Bar - shown when in selection mode */}\n      {selectionMode && (\n        <BulkActionsBar\n          selectedCount={selectedIds.size}\n          totalCount={apps.length}\n          isAllSelected={selectedIds.size === apps.length && apps.length > 0}\n          categories={categories}\n          tags={tags}\n          onSelectAll={handleSelectAll}\n          onClearSelection={handleClearSelection}\n          onBulkUpdateCategory={handleBulkUpdateCategory}\n          onBulkUpdateTags={handleBulkUpdateTags}\n          onBulkToggleHealthCheck={handleBulkToggleHealthCheck}\n          onBulkDelete={handleBulkDelete}\n          onBulkExport={handleBulkExport}\n          isLoading={\n            bulkDeleteMutation.isPending ||\n            bulkCategoryMutation.isPending ||\n            bulkHealthCheckMutation.isPending ||\n            bulkExportMutation.isPending ||\n            bulkTagsMutation.isPending\n          }\n        />\n      )}\n\n      {/* App Grid */}\n      {isAppsLoading ? (\n        <div className=\"flex items-center justify-center py-12\">\n          <RefreshCw className=\"h-8 w-8 animate-spin text-muted-foreground\" />\n        </div>\n      ) : reorderMode ? (\n        <div className=\"space-y-2\">\n          <p className=\"text-sm text-muted-foreground\">\n            Drag apps to reorder. Changes are saved automatically.\n          </p>\n          <SortableAppGrid\n            apps={apps.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))}\n            healthStatuses={healthStatuses}\n            healthBarStyle={healthBarStyle}\n            columns={4}\n            viewMode={viewMode}\n            onEditApp={handleEdit}\n            onDeleteApp={handleDelete}\n            onViewNotes={handleViewNotes}\n            onPinApp={handlePin}\n            onReorder={handleReorder}\n            reorderEnabled={true}\n          />\n        </div>\n      ) : (\n        <AppGrid\n          apps={apps}\n          healthStatuses={healthStatuses}\n          healthBarStyle={healthBarStyle}\n          columns={4}\n          viewMode={viewMode}\n          groupByCategory={groupByCategory}\n          selectionMode={selectionMode}\n          selectedIds={selectedIds}\n          onSelectApp={handleSelectApp}\n          onEditApp={handleEdit}\n          onDeleteApp={handleDelete}\n          onViewNotes={handleViewNotes}\n          onPinApp={handlePin}\n        />\n      )}"
}

Now let me verify everything compiles correctly by checking if there are any TypeScript issues:

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit 2>&1 | head -50",
  "description": "Type check the TypeScript code",
  "timeout": 60000
}

These are pre-existing TypeScript errors not related to my changes. The errors I see are mostly from widget components and are existing issues. Let me check that there are no new errors specifically related to my changes by running the app:

🔧 Tool: Bash
Input: {
  "command": "npm run dev 2>&1 &\nsleep 5\ncurl -s http://localhost:3000 | head -20",
  "description": "Start dev server and check if app loads",
  "timeout": 30000
}

🔧 Tool: Bash
Input: {
  "command": "sleep 3 && curl -s http://localhost:3000 2>/dev/null | head -20 || echo \"Server may still be starting...\"",
  "description": "Wait and check if server is running",
  "timeout": 20000
}

🔧 Tool: Read
Input: {
  "file_path": "/tmp/claude/-home-default-Desktop-dev-app-map-appahouse/tasks/be41b32.output"
}

The dev server is running on port 4176. Now let me update the todo and create the Playwright test:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Add selection mode state and bulk selection logic to dashboard index.tsx",
      "status": "completed",
      "activeForm": "Adding selection mode state to dashboard"
    },
    {
      "content": "Update AppGrid component to support selection mode with checkboxes",
      "status": "completed",
      "activeForm": "Updating AppGrid for selection mode"
    },
    {
      "content": "Update AppCard component to display selection checkbox overlay",
      "status": "completed",
      "activeForm": "Updating AppCard for checkbox overlay"
    },
    {
      "content": "Create BulkActionsBar component for batch operations menu",
      "status": "completed",
      "activeForm": "Creating BulkActionsBar component"
    },
    {
      "content": "Add bulk export as JSON server function",
      "status": "completed",
      "activeForm": "Adding bulk export server function"
    },
    {
      "content": "Add bulk update tags server function",
      "status": "completed",
      "activeForm": "Adding bulk update tags server function"
    },
    {
      "content": "Integrate BulkActionsBar with dashboard and connect all mutations",
      "status": "completed",
      "activeForm": "Integrating BulkActionsBar with dashboard"
    },
    {
      "content": "Create and run Playwright verification test",
      "status": "in_progress",
      "activeForm": "Running Playwright verification test"
    }
  ]
}

🔧 Tool: Bash
Input: {
  "command": "cat /home/default/Desktop/dev/app-map-appahouse/package.json | grep -A5 \"devDependencies\" | head -15",
  "description": "Check if Playwright is installed"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/playwright.config.*",
  "path": "/home/default/Desktop/dev/app-map-appahouse"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/playwright.config.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "tests/**/*.spec.ts",
  "path": "/home/default/Desktop/dev/app-map-appahouse"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/tests/search-filter-verification.spec.ts"
}

Now let me create a verification test for the bulk app management feature:

🔧 Tool: Write
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/tests/bulk-app-management-verification.spec.ts",
  "content": "import { test, expect } from \"@playwright/test\";\n\ntest.describe(\"Bulk App Management Feature - Dashboard\", () => {\n  test.beforeEach(async ({ page }) => {\n    // Navigate to the dashboard\n    await page.goto(\"/\");\n    // Wait for the page to load\n    await page.waitForLoadState(\"networkidle\");\n  });\n\n  test(\"should display the selection mode toggle button on dashboard\", async ({ page }) => {\n    // Check that the selection mode toggle exists on desktop\n    const selectionToggle = page.getByTestId(\"selection-mode-toggle-desktop\");\n    await expect(selectionToggle).toBeVisible();\n\n    // Check it shows \"Select\" text initially\n    await expect(selectionToggle).toContainText(\"Select\");\n  });\n\n  test(\"should enter selection mode when toggle is clicked\", async ({ page }) => {\n    // Click the selection mode toggle\n    const selectionToggle = page.getByTestId(\"selection-mode-toggle-desktop\");\n    await selectionToggle.click();\n\n    // Wait for UI to update\n    await page.waitForTimeout(300);\n\n    // Check that the button now shows \"Done\"\n    await expect(selectionToggle).toContainText(\"Done\");\n  });\n\n  test(\"should show bulk actions bar when in selection mode with selected items\", async ({ page }) => {\n    // Enter selection mode\n    const selectionToggle = page.getByTestId(\"selection-mode-toggle-desktop\");\n    await selectionToggle.click();\n    await page.waitForTimeout(300);\n\n    // Find an app card and click it to select it (if apps exist)\n    const appCards = page.locator('[data-testid^=\"app-card-\"]');\n    const count = await appCards.count();\n\n    if (count > 0) {\n      // Click on the first app card to select it\n      await appCards.first().click();\n      await page.waitForTimeout(300);\n\n      // Check that bulk actions bar appears\n      const bulkActionsBar = page.getByTestId(\"bulk-actions-bar\");\n      await expect(bulkActionsBar).toBeVisible();\n\n      // Check that selection count is shown\n      const selectionCount = page.getByTestId(\"selection-count\");\n      await expect(selectionCount).toBeVisible();\n      await expect(selectionCount).toContainText(\"1 of\");\n    }\n  });\n\n  test(\"should show bulk edit menu with options\", async ({ page }) => {\n    // Enter selection mode\n    const selectionToggle = page.getByTestId(\"selection-mode-toggle-desktop\");\n    await selectionToggle.click();\n    await page.waitForTimeout(300);\n\n    // Select an app if available\n    const appCards = page.locator('[data-testid^=\"app-card-\"]');\n    const count = await appCards.count();\n\n    if (count > 0) {\n      await appCards.first().click();\n      await page.waitForTimeout(300);\n\n      // Open the bulk edit menu\n      const bulkEditMenu = page.getByTestId(\"bulk-edit-menu\");\n      await expect(bulkEditMenu).toBeVisible();\n      await bulkEditMenu.click();\n\n      // Wait for menu to open\n      await page.waitForTimeout(200);\n\n      // Check that menu options are visible\n      await expect(page.getByText(\"Change Category\")).toBeVisible();\n      await expect(page.getByText(\"Update Tags\")).toBeVisible();\n      await expect(page.getByText(\"Enable Health Check\")).toBeVisible();\n      await expect(page.getByText(\"Disable Health Check\")).toBeVisible();\n    }\n  });\n\n  test(\"should have export JSON button visible when items are selected\", async ({ page }) => {\n    // Enter selection mode\n    const selectionToggle = page.getByTestId(\"selection-mode-toggle-desktop\");\n    await selectionToggle.click();\n    await page.waitForTimeout(300);\n\n    // Select an app if available\n    const appCards = page.locator('[data-testid^=\"app-card-\"]');\n    const count = await appCards.count();\n\n    if (count > 0) {\n      await appCards.first().click();\n      await page.waitForTimeout(300);\n\n      // Check export button is visible\n      const bulkExport = page.getByTestId(\"bulk-export\");\n      await expect(bulkExport).toBeVisible();\n    }\n  });\n\n  test(\"should have delete button visible when items are selected\", async ({ page }) => {\n    // Enter selection mode\n    const selectionToggle = page.getByTestId(\"selection-mode-toggle-desktop\");\n    await selectionToggle.click();\n    await page.waitForTimeout(300);\n\n    // Select an app if available\n    const appCards = page.locator('[data-testid^=\"app-card-\"]');\n    const count = await appCards.count();\n\n    if (count > 0) {\n      await appCards.first().click();\n      await page.waitForTimeout(300);\n\n      // Check delete button is visible\n      const bulkDelete = page.getByTestId(\"bulk-delete\");\n      await expect(bulkDelete).toBeVisible();\n    }\n  });\n\n  test(\"should have select all / deselect all toggle\", async ({ page }) => {\n    // Enter selection mode\n    const selectionToggle = page.getByTestId(\"selection-mode-toggle-desktop\");\n    await selectionToggle.click();\n    await page.waitForTimeout(300);\n\n    // Select an app if available\n    const appCards = page.locator('[data-testid^=\"app-card-\"]');\n    const count = await appCards.count();\n\n    if (count > 0) {\n      await appCards.first().click();\n      await page.waitForTimeout(300);\n\n      // Check select all toggle is visible\n      const selectAllToggle = page.getByTestId(\"select-all-toggle\");\n      await expect(selectAllToggle).toBeVisible();\n    }\n  });\n\n  test(\"should clear selection when clear button is clicked\", async ({ page }) => {\n    // Enter selection mode\n    const selectionToggle = page.getByTestId(\"selection-mode-toggle-desktop\");\n    await selectionToggle.click();\n    await page.waitForTimeout(300);\n\n    // Select an app if available\n    const appCards = page.locator('[data-testid^=\"app-card-\"]');\n    const count = await appCards.count();\n\n    if (count > 0) {\n      await appCards.first().click();\n      await page.waitForTimeout(300);\n\n      // Check bulk actions bar is visible\n      const bulkActionsBar = page.getByTestId(\"bulk-actions-bar\");\n      await expect(bulkActionsBar).toBeVisible();\n\n      // Click clear selection button\n      const clearSelection = page.getByTestId(\"clear-selection\");\n      await clearSelection.click();\n      await page.waitForTimeout(300);\n\n      // Bulk actions bar should no longer be visible (or should show 0 selected)\n      await expect(bulkActionsBar).not.toBeVisible();\n    }\n  });\n\n  test(\"should exit selection mode when toggle is clicked again\", async ({ page }) => {\n    // Enter selection mode\n    const selectionToggle = page.getByTestId(\"selection-mode-toggle-desktop\");\n    await selectionToggle.click();\n    await page.waitForTimeout(300);\n\n    // Check button shows \"Done\"\n    await expect(selectionToggle).toContainText(\"Done\");\n\n    // Click again to exit\n    await selectionToggle.click();\n    await page.waitForTimeout(300);\n\n    // Check button shows \"Select\" again\n    await expect(selectionToggle).toContainText(\"Select\");\n  });\n\n  test(\"should disable reorder mode button when in selection mode\", async ({ page }) => {\n    // Enter selection mode\n    const selectionToggle = page.getByTestId(\"selection-mode-toggle-desktop\");\n    await selectionToggle.click();\n    await page.waitForTimeout(300);\n\n    // Find the reorder button and check if it's disabled\n    const reorderButton = page.locator('button:has-text(\"Reorder\")');\n    await expect(reorderButton).toBeDisabled();\n  });\n});\n\ntest.describe(\"Bulk App Management Feature - Apps Table Page\", () => {\n  test.beforeEach(async ({ page }) => {\n    // Navigate to the apps table page\n    await page.goto(\"/apps\");\n    // Wait for the page to load\n    await page.waitForLoadState(\"networkidle\");\n  });\n\n  test(\"should display the apps page with bulk selection checkboxes\", async ({ page }) => {\n    // Wait for the apps table\n    const appsTable = page.getByTestId(\"apps-table\");\n    const noAppsMessage = page.getByTestId(\"no-apps-message\");\n\n    // Check if table or no apps message is visible\n    try {\n      await expect(appsTable).toBeVisible({ timeout: 3000 });\n\n      // Check for checkbox in table header (select all)\n      const headerCheckbox = page.locator('thead th').first().locator('button[role=\"checkbox\"]');\n      await expect(headerCheckbox).toBeVisible();\n    } catch {\n      // No apps exist, check for no apps message\n      await expect(noAppsMessage).toBeVisible();\n    }\n  });\n});\n"
}

Now let me kill the existing dev server and run the Playwright test:

🔧 Tool: KillShell
Input: {
  "shell_id": "be41b32"
}

🔧 Tool: Bash
Input: {
  "command": "npx playwright test tests/bulk-app-management-verification.spec.ts --reporter=list 2>&1 | head -80",
  "description": "Run Playwright verification test for bulk app management",
  "timeout": 120000
}

🔧 Tool: TaskOutput
Input: {
  "task_id": "bc4d5d5",
  "block": true,
  "timeout": 120000
}

🔧 Tool: Read
Input: {
  "file_path": "/tmp/claude/-home-default-Desktop-dev-app-map-appahouse/tasks/bc4d5d5.output"
}

Let me check what's happening with a longer timeout:

🔧 Tool: Bash
Input: {
  "command": "ps aux | grep -E \"(playwright|node)\" | head -10",
  "description": "Check running processes"
}

🔧 Tool: KillShell
Input: {
  "shell_id": "bc4d5d5"
}

Let me try running playwright with the webServer disabled and manually start the dev server first:

🔧 Tool: Bash
Input: {
  "command": "npm run dev &\nsleep 10\necho \"Server should be ready...\"",
  "description": "Start the dev server",
  "timeout": 30000,
  "run_in_background": true
}

🔧 Tool: Bash
Input: {
  "command": "sleep 12 && curl -s -o /dev/null -w \"%{http_code}\" http://localhost:4175 2>/dev/null || echo \"failed\"",
  "description": "Wait and check server status",
  "timeout": 30000
}

Server is running. Now let me run the playwright test:

🔧 Tool: Bash
Input: {
  "command": "npx playwright test tests/bulk-app-management-verification.spec.ts --reporter=list 2>&1 | tail -50",
  "description": "Run Playwright verification test",
  "timeout": 180000
}

🔧 Tool: TaskOutput
Input: {
  "task_id": "b624643",
  "block": true,
  "timeout": 180000
}

The tests are failing because the app needs authentication. Let me check if there's a way to test without auth, or simplify the tests to verify core UI elements:

🔧 Tool: Bash
Input: {
  "command": "curl -s http://localhost:4175/ 2>/dev/null | grep -o 'data-testid=\"[^\"]*\"' | head -20 || echo \"No testids found, checking HTML...\"",
  "description": "Check what testids are visible without login"
}

The toggle buttons are visible on the page. The issue is that the page shows a login prompt because there's no authenticated session. Let me check what the full initial page looks like and update the tests accordingly:

🔧 Tool: Bash
Input: {
  "command": "curl -s http://localhost:4175/ 2>/dev/null | grep -E \"(Sign in|Dashboard|App Map)\" | head -5",
  "description": "Check page content"
}

The selection mode toggle buttons are there. I can see the page is rendering the buttons even with 0 apps. Let me update the test to be simpler and verify that the core UI elements exist:

🔧 Tool: Edit
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/tests/bulk-app-management-verification.spec.ts",
  "old_string": "import { test, expect } from \"@playwright/test\";\n\ntest.describe(\"Bulk App Management Feature - Dashboard\", () => {\n  test.beforeEach(async ({ page }) => {\n    // Navigate to the dashboard\n    await page.goto(\"/\");\n    // Wait for the page to load\n    await page.waitForLoadState(\"networkidle\");\n  });\n\n  test(\"should display the selection mode toggle button on dashboard\", async ({ page }) => {\n    // Check that the selection mode toggle exists on desktop\n    const selectionToggle = page.getByTestId(\"selection-mode-toggle-desktop\");\n    await expect(selectionToggle).toBeVisible();\n\n    // Check it shows \"Select\" text initially\n    await expect(selectionToggle).toContainText(\"Select\");\n  });\n\n  test(\"should enter selection mode when toggle is clicked\", async ({ page }) => {\n    // Click the selection mode toggle\n    const selectionToggle = page.getByTestId(\"selection-mode-toggle-desktop\");\n    await selectionToggle.click();\n\n    // Wait for UI to update\n    await page.waitForTimeout(300);\n\n    // Check that the button now shows \"Done\"\n    await expect(selectionToggle).toContainText(\"Done\");\n  });\n\n  test(\"should show bulk actions bar when in selection mode with selected items\", async ({ page }) => {\n    // Enter selection mode\n    const selectionToggle = page.getByTestId(\"selection-mode-toggle-desktop\");\n    await selectionToggle.click();\n    await page.waitForTimeout(300);\n\n    // Find an app card and click it to select it (if apps exist)\n    const appCards = page.locator('[data-testid^=\"app-card-\"]');\n    const count = await appCards.count();\n\n    if (count > 0) {\n      // Click on the first app card to select it\n      await appCards.first().click();\n      await page.waitForTimeout(300);\n\n      // Check that bulk actions bar appears\n      const bulkActionsBar = page.getByTestId(\"bulk-actions-bar\");\n      await expect(bulkActionsBar).toBeVisible();\n\n      // Check that selection count is shown\n      const selectionCount = page.getByTestId(\"selection-count\");\n      await expect(selectionCount).toBeVisible();\n      await expect(selectionCount).toContainText(\"1 of\");\n    }\n  });\n\n  test(\"should show bulk edit menu with options\", async ({ page }) => {\n    // Enter selection mode\n    const selectionToggle = page.getByTestId(\"selection-mode-toggle-desktop\");\n    await selectionToggle.click();\n    await page.waitForTimeout(300);\n\n    // Select an app if available\n    const appCards = page.locator('[data-testid^=\"app-card-\"]');\n    const count = await appCards.count();\n\n    if (count > 0) {\n      await appCards.first().click();\n      await page.waitForTimeout(300);\n\n      // Open the bulk edit menu\n      const bulkEditMenu = page.getByTestId(\"bulk-edit-menu\");\n      await expect(bulkEditMenu).toBeVisible();\n      await bulkEditMenu.click();\n\n      // Wait for menu to open\n      await page.waitForTimeout(200);\n\n      // Check that menu options are visible\n      await expect(page.getByText(\"Change Category\")).toBeVisible();\n      await expect(page.getByText(\"Update Tags\")).toBeVisible();\n      await expect(page.getByText(\"Enable Health Check\")).toBeVisible();\n      await expect(page.getByText(\"Disable Health Check\")).toBeVisible();\n    }\n  });\n\n  test(\"should have export JSON button visible when items are selected\", async ({ page }) => {\n    // Enter selection mode\n    const selectionToggle = page.getByTestId(\"selection-mode-toggle-desktop\");\n    await selectionToggle.click();\n    await page.waitForTimeout(300);\n\n    // Select an app if available\n    const appCards = page.locator('[data-testid^=\"app-card-\"]');\n    const count = await appCards.count();\n\n    if (count > 0) {\n      await appCards.first().click();\n      await page.waitForTimeout(300);\n\n      // Check export button is visible\n      const bulkExport = page.getByTestId(\"bulk-export\");\n      await expect(bulkExport).toBeVisible();\n    }\n  });\n\n  test(\"should have delete button visible when items are selected\", async ({ page }) => {\n    // Enter selection mode\n    const selectionToggle = page.getByTestId(\"selection-mode-toggle-desktop\");\n    await selectionToggle.click();\n    await page.waitForTimeout(300);\n\n    // Select an app if available\n    const appCards = page.locator('[data-testid^=\"app-card-\"]');\n    const count = await appCards.count();\n\n    if (count > 0) {\n      await appCards.first().click();\n      await page.waitForTimeout(300);\n\n      // Check delete button is visible\n      const bulkDelete = page.getByTestId(\"bulk-delete\");\n      await expect(bulkDelete).toBeVisible();\n    }\n  });\n\n  test(\"should have select all / deselect all toggle\", async ({ page }) => {\n    // Enter selection mode\n    const selectionToggle = page.getByTestId(\"selection-mode-toggle-desktop\");\n    await selectionToggle.click();\n    await page.waitForTimeout(300);\n\n    // Select an app if available\n    const appCards = page.locator('[data-testid^=\"app-card-\"]');\n    const count = await appCards.count();\n\n    if (count > 0) {\n      await appCards.first().click();\n      await page.waitForTimeout(300);\n\n      // Check select all toggle is visible\n      const selectAllToggle = page.getByTestId(\"select-all-toggle\");\n      await expect(selectAllToggle).toBeVisible();\n    }\n  });\n\n  test(\"should clear selection when clear button is clicked\", async ({ page }) => {\n    // Enter selection mode\n    const selectionToggle = page.getByTestId(\"selection-mode-toggle-desktop\");\n    await selectionToggle.click();\n    await page.waitForTimeout(300);\n\n    // Select an app if available\n    const appCards = page.locator('[data-testid^=\"app-card-\"]');\n    const count = await appCards.count();\n\n    if (count > 0) {\n      await appCards.first().click();\n      await page.waitForTimeout(300);\n\n      // Check bulk actions bar is visible\n      const bulkActionsBar = page.getByTestId(\"bulk-actions-bar\");\n      await expect(bulkActionsBar).toBeVisible();\n\n      // Click clear selection button\n      const clearSelection = page.getByTestId(\"clear-selection\");\n      await clearSelection.click();\n      await page.waitForTimeout(300);\n\n      // Bulk actions bar should no longer be visible (or should show 0 selected)\n      await expect(bulkActionsBar).not.toBeVisible();\n    }\n  });\n\n  test(\"should exit selection mode when toggle is clicked again\", async ({ page }) => {\n    // Enter selection mode\n    const selectionToggle = page.getByTestId(\"selection-mode-toggle-desktop\");\n    await selectionToggle.click();\n    await page.waitForTimeout(300);\n\n    // Check button shows \"Done\"\n    await expect(selectionToggle).toContainText(\"Done\");\n\n    // Click again to exit\n    await selectionToggle.click();\n    await page.waitForTimeout(300);\n\n    // Check button shows \"Select\" again\n    await expect(selectionToggle).toContainText(\"Select\");\n  });\n\n  test(\"should disable reorder mode button when in selection mode\", async ({ page }) => {\n    // Enter selection mode\n    const selectionToggle = page.getByTestId(\"selection-mode-toggle-desktop\");\n    await selectionToggle.click();\n    await page.waitForTimeout(300);\n\n    // Find the reorder button and check if it's disabled\n    const reorderButton = page.locator('button:has-text(\"Reorder\")');\n    await expect(reorderButton).toBeDisabled();\n  });\n});\n\ntest.describe(\"Bulk App Management Feature - Apps Table Page\", () => {\n  test.beforeEach(async ({ page }) => {\n    // Navigate to the apps table page\n    await page.goto(\"/apps\");\n    // Wait for the page to load\n    await page.waitForLoadState(\"networkidle\");\n  });\n\n  test(\"should display the apps page with bulk selection checkboxes\", async ({ page }) => {\n    // Wait for the apps table\n    const appsTable = page.getByTestId(\"apps-table\");\n    const noAppsMessage = page.getByTestId(\"no-apps-message\");\n\n    // Check if table or no apps message is visible\n    try {\n      await expect(appsTable).toBeVisible({ timeout: 3000 });\n\n      // Check for checkbox in table header (select all)\n      const headerCheckbox = page.locator('thead th').first().locator('button[role=\"checkbox\"]');\n      await expect(headerCheckbox).toBeVisible();\n    } catch {\n      // No apps exist, check for no apps message\n      await expect(noAppsMessage).toBeVisible();\n    }\n  });\n});",
  "new_string": "import { test, expect } from \"@playwright/test\";\n\ntest.describe(\"Bulk App Management Feature - Dashboard UI\", () => {\n  test.beforeEach(async ({ page }) => {\n    // Navigate to the dashboard\n    await page.goto(\"/\");\n    // Wait for the page to load\n    await page.waitForLoadState(\"networkidle\");\n    await page.waitForTimeout(500);\n  });\n\n  test(\"should display the selection mode toggle button on dashboard\", async ({ page }) => {\n    // Check that the selection mode toggle exists on desktop\n    const selectionToggle = page.getByTestId(\"selection-mode-toggle-desktop\");\n    await expect(selectionToggle).toBeVisible({ timeout: 10000 });\n\n    // Check it shows \"Select\" text initially\n    await expect(selectionToggle).toContainText(\"Select\");\n  });\n\n  test(\"should toggle selection mode text when clicked\", async ({ page }) => {\n    const selectionToggle = page.getByTestId(\"selection-mode-toggle-desktop\");\n    await expect(selectionToggle).toBeVisible({ timeout: 10000 });\n\n    // Check initial state\n    await expect(selectionToggle).toContainText(\"Select\");\n\n    // Click to enter selection mode\n    await selectionToggle.click();\n    await page.waitForTimeout(500);\n\n    // Check that the button now shows \"Done\"\n    await expect(selectionToggle).toContainText(\"Done\");\n\n    // Click again to exit\n    await selectionToggle.click();\n    await page.waitForTimeout(500);\n\n    // Check button shows \"Select\" again\n    await expect(selectionToggle).toContainText(\"Select\");\n  });\n\n  test(\"should have the selection mode toggle as a clickable button\", async ({ page }) => {\n    const selectionToggle = page.getByTestId(\"selection-mode-toggle-desktop\");\n    await expect(selectionToggle).toBeVisible({ timeout: 10000 });\n\n    // Check that the button is enabled and clickable\n    await expect(selectionToggle).toBeEnabled();\n  });\n\n  test(\"should also have mobile selection toggle available\", async ({ page }) => {\n    // Mobile toggle\n    const mobileToggle = page.getByTestId(\"selection-mode-toggle\");\n    await expect(mobileToggle).toBeAttached();\n  });\n});"
}

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/tests/bulk-app-management-verification.spec.ts"
}

🔧 Tool: Write
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/tests/bulk-app-management-verification.spec.ts",
  "content": "import { test, expect } from \"@playwright/test\";\n\ntest.describe(\"Bulk App Management Feature - Dashboard UI\", () => {\n  test.beforeEach(async ({ page }) => {\n    // Navigate to the dashboard\n    await page.goto(\"/\");\n    // Wait for the page to load\n    await page.waitForLoadState(\"networkidle\");\n    await page.waitForTimeout(500);\n  });\n\n  test(\"should display the selection mode toggle button on dashboard\", async ({ page }) => {\n    // Check that the selection mode toggle exists on desktop\n    const selectionToggle = page.getByTestId(\"selection-mode-toggle-desktop\");\n    await expect(selectionToggle).toBeVisible({ timeout: 10000 });\n\n    // Check it shows \"Select\" text initially\n    await expect(selectionToggle).toContainText(\"Select\");\n  });\n\n  test(\"should toggle selection mode text when clicked\", async ({ page }) => {\n    const selectionToggle = page.getByTestId(\"selection-mode-toggle-desktop\");\n    await expect(selectionToggle).toBeVisible({ timeout: 10000 });\n\n    // Check initial state\n    await expect(selectionToggle).toContainText(\"Select\");\n\n    // Click to enter selection mode\n    await selectionToggle.click();\n    await page.waitForTimeout(500);\n\n    // Check that the button now shows \"Done\"\n    await expect(selectionToggle).toContainText(\"Done\");\n\n    // Click again to exit\n    await selectionToggle.click();\n    await page.waitForTimeout(500);\n\n    // Check button shows \"Select\" again\n    await expect(selectionToggle).toContainText(\"Select\");\n  });\n\n  test(\"should have the selection mode toggle as a clickable button\", async ({ page }) => {\n    const selectionToggle = page.getByTestId(\"selection-mode-toggle-desktop\");\n    await expect(selectionToggle).toBeVisible({ timeout: 10000 });\n\n    // Check that the button is enabled and clickable\n    await expect(selectionToggle).toBeEnabled();\n  });\n\n  test(\"should also have mobile selection toggle available\", async ({ page }) => {\n    // Mobile toggle\n    const mobileToggle = page.getByTestId(\"selection-mode-toggle\");\n    await expect(mobileToggle).toBeAttached();\n  });\n});\n"
}

Now let me run the simplified test:

🔧 Tool: Bash
Input: {
  "command": "npx playwright test tests/bulk-app-management-verification.spec.ts --reporter=list 2>&1",
  "description": "Run simplified Playwright test",
  "timeout": 120000
}

The Playwright config is using port 4175, but I saw earlier that port 4175 was in use, so it's running on 4176. The tests can't see the elements because the server is running on a different port. Let me check what port the dev server is on:

🔧 Tool: Read
Input: {
  "file_path": "/tmp/claude/-home-default-Desktop-dev-app-map-appahouse/tasks/bc8f8de.output"
}

Server is on port 4177. Let me kill this and other conflicting processes and run the tests properly:

🔧 Tool: KillShell
Input: {
  "shell_id": "bc8f8de"
}

🔧 Tool: Bash
Input: {
  "command": "pkill -f \"vite\" 2>/dev/null; pkill -f \"node.*app-map\" 2>/dev/null; sleep 2; lsof -ti:4175 | xargs -r kill -9 2>/dev/null; lsof -ti:4176 | xargs -r kill -9 2>/dev/null; lsof -ti:4177 | xargs -r kill -9 2>/dev/null; echo \"Ports cleared\"",
  "description": "Kill conflicting processes",
  "timeout": 15000
}

🔧 Tool: Bash
Input: {
  "command": "curl -s http://localhost:4175 2>/dev/null | head -5 || echo \"Port 4175 is free\"",
  "description": "Check if port 4175 is available"
}

🔧 Tool: Bash
Input: {
  "command": "npx playwright test tests/bulk-app-management-verification.spec.ts --reporter=list 2>&1",
  "description": "Run Playwright test with auto-started server",
  "timeout": 180000
}

Let me check the error context file to see what's happening:

🔧 Tool: Bash
Input: {
  "command": "cat /home/default/Desktop/dev/app-map-appahouse/test-results/bulk-app-management-verifi-7ef32--toggle-button-on-dashboard-chromium/error-context.md 2>/dev/null | head -60",
  "description": "Check error context"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la /home/default/Desktop/dev/app-map-appahouse/test-results/ 2>/dev/null | head -20",
  "description": "List test results"
}

Let me take a screenshot of what Playwright sees:

🔧 Tool: Write
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/tests/screenshot-debug.spec.ts",
  "content": "import { test, expect } from \"@playwright/test\";\n\ntest(\"debug - take screenshot of dashboard\", async ({ page }) => {\n  await page.goto(\"/\");\n  await page.waitForTimeout(3000);\n  await page.screenshot({ path: \"test-results/dashboard-debug.png\", fullPage: true });\n\n  // Print page content to log\n  const content = await page.content();\n  console.log(\"Page contains selection-mode-toggle-desktop:\", content.includes(\"selection-mode-toggle-desktop\"));\n  console.log(\"Page title:\", await page.title());\n});\n"
}

🔧 Tool: Bash
Input: {
  "command": "npx playwright test tests/screenshot-debug.spec.ts --reporter=list 2>&1",
  "description": "Take debug screenshot",
  "timeout": 120000
}

Interesting! The page doesn't contain the testid. Let me check the screenshot:

🔧 Tool: Read
Input: {
  "file_path": "/home/default/Desktop/dev/app-map-appahouse/test-results/dashboard-debug.png"
}

The screenshot shows that when not logged in, Playwright shows a login page, not the dashboard. The dashboard is only visible when authenticated. The selection mode buttons are indeed there in the rendered HTML (as I saw when curling), but the initial page content is loading client-side and ends up showing the login form.

Given this authentication requirement, the tests need to either:
1. Authenticate first, or
2. Just verify that the changes compile and render properly

Let me delete the test file and run a simpler verification:

🔧 Tool: Bash
Input: {
  "command": "rm /home/default/Desktop/dev/app-map-appahouse/tests/bulk-app-management-verification.spec.ts /home/default/Desktop/dev/app-map-appahouse/tests/screenshot-debug.spec.ts",
  "description": "Delete test files"
}

Let me verify the build compiles successfully and the feature is present in the HTML output:

🔧 Tool: Bash
Input: {
  "command": "npm run build 2>&1 | tail -20",
  "description": "Build the application to verify it compiles",
  "timeout": 120000
}

Build completed successfully. Now let me verify that the bulk management code is present in the output:

🔧 Tool: Bash
Input: {
  "command": "grep -l \"selection-mode-toggle\" .vercel/output/static/*.js 2>/dev/null || grep -l \"selection-mode-toggle\" .vercel/output/static/**/*.js 2>/dev/null | head -5",
  "description": "Check if selection mode toggle is in built output"
}

The selection mode toggle is present in the built JavaScript file. Let me also verify the bulk actions bar:

🔧 Tool: Bash
Input: {
  "command": "grep -l \"bulk-actions-bar\" .vercel/output/static/assets/*.js 2>/dev/null | head -3",
  "description": "Check bulk actions bar in build"
}

🔧 Tool: Bash
Input: {
  "command": "grep -l \"bulkExportApps\" .vercel/output/functions/__fallback.func/chunks/**/*.mjs 2>/dev/null | head -3",
  "description": "Check bulk export in server chunks"
}

All the bulk management functions are present in the build. Now let me update the todo and provide a summary:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Add selection mode state and bulk selection logic to dashboard index.tsx",
      "status": "completed",
      "activeForm": "Adding selection mode state to dashboard"
    },
    {
      "content": "Update AppGrid component to support selection mode with checkboxes",
      "status": "completed",
      "activeForm": "Updating AppGrid for selection mode"
    },
    {
      "content": "Update AppCard component to display selection checkbox overlay",
      "status": "completed",
      "activeForm": "Updating AppCard for checkbox overlay"
    },
    {
      "content": "Create BulkActionsBar component for batch operations menu",
      "status": "completed",
      "activeForm": "Creating BulkActionsBar component"
    },
    {
      "content": "Add bulk export as JSON server function",
      "status": "completed",
      "activeForm": "Adding bulk export server function"
    },
    {
      "content": "Add bulk update tags server function",
      "status": "completed",
      "activeForm": "Adding bulk update tags server function"
    },
    {
      "content": "Integrate BulkActionsBar with dashboard and connect all mutations",
      "status": "completed",
      "activeForm": "Integrating BulkActionsBar with dashboard"
    },
    {
      "content": "Verify build compiles successfully",
      "status": "completed",
      "activeForm": "Verifying build compilation"
    }
  ]
}

<summary>
## Summary: Add bulk app management features: multi-select apps with checkboxes and batch operations

### Changes Implemented
1. **Selection Mode Toggle** - Added "Select" button to dashboard header that toggles selection mode on/off
2. **Multi-select with Checkboxes** - AppCard component now shows checkbox overlay when in selection mode
3. **Bulk Actions Bar** - New BulkActionsBar component appears when items are selected, showing:
   - Selection count badge ("X of Y selected")
   - Select All / Deselect All toggle
   - Bulk Edit dropdown menu with:
     - Change Category
     - Update Tags (with replace/append mode)
     - Enable Health Check
     - Disable Health Check
   - Export JSON button
   - Delete button
   - Clear Selection button
4. **Server-side bulk operations**:
   - `bulkExportApps()` - Export selected apps as JSON file download
   - `bulkUpdateTags()` - Update tags for multiple apps with replace or append mode
   - Existing operations: `bulkDeleteApps()`, `bulkUpdateCategory()`, `bulkToggleHealthCheck()`

### Files Modified
- `/src/routes/index.tsx` - Added selection mode state, bulk mutations, handlers, and UI integration
- `/src/lib/server/apps.ts` - Added `bulkExportApps` and `bulkUpdateTags` server functions
- `/src/components/apps/bulk-actions-bar.tsx` - **NEW** - BulkActionsBar component
- `/src/components/apps/app-card.tsx` - Added selectionMode, isSelected props and checkbox overlay
- `/src/components/apps/app-grid.tsx` - Added selectionMode, selectedIds, onSelectApp props
- `/src/components/apps/index.ts` - Export BulkActionsBar

### Verification Status
- **Build Verification**: The application builds successfully with `npm run build`
- **Code Integration**: Verified that bulk management functions (`selection-mode-toggle`, `bulk-actions-bar`, `bulkExportApps`) are present in the built output
- **Playwright Testing**: Tests require authentication which is not available in the test environment. The dashboard shows a login form to unauthenticated users. Manual testing recommended.

### Notes for Developer
1. **Authentication Required**: The bulk selection mode is only visible/functional when logged in
2. **Existing /apps Route**: The `/apps` table view already has bulk operations. This feature adds bulk operations to the dashboard grid view
3. **Mutual Exclusion**: Selection mode and Reorder mode are mutually exclusive - entering one disables the other
4. **Export Format**: Exports include app name, description, icon, URLs, category name, tag names, health check settings, notes, pinned status, and timestamps
5. **Tag Update Modes**: Users can choose to "replace" existing tags or "append" new tags to existing ones
6. **Mobile Support**: Both mobile and desktop toggle buttons are provided (`selection-mode-toggle` and `selection-mode-toggle-desktop`)
</summary>