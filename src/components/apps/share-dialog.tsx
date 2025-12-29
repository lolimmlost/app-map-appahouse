import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  X,
  Search,
  Trash2,
  Eye,
  Edit,
  Activity,
  Globe,
  Home,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  shareApp,
  shareCategory,
  getAppShares,
  getCategoryShares,
  updateShare,
  revokeShare,
  searchUsers,
} from "@/lib/server/sharing.server";
import type { App } from "@/types/database";
import type { Category } from "@/types/database";
import type { SharingPermission, GranularPermissions } from "@/types/database";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  app?: App;
  category?: Category;
  title?: string;
}

const PERMISSION_LABELS: Record<SharingPermission, { label: string; description: string }> = {
  view: { label: "View Only", description: "Can see app name and description only" },
  view_health: { label: "View + Health", description: "Can also see health status" },
  view_urls: { label: "View + URLs", description: "Can also access both URLs" },
  edit: { label: "Edit", description: "Can modify app details (not delete)" },
  full: { label: "Full Access", description: "All permissions except sharing" },
};

export function ShareDialog({
  open,
  onOpenChange,
  app,
  category,
  title,
}: ShareDialogProps) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<SharingPermission>("view");
  const [showCustomPermissions, setShowCustomPermissions] = useState(false);
  const [customPermissions, setCustomPermissions] = useState<GranularPermissions>({
    canView: true,
    canEdit: false,
    canSeeHealth: false,
    canAccessRemoteUrl: false,
    canAccessLocalUrl: false,
    canDelete: false,
  });
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("share");

  // Determine if we're sharing an app or category
  const isApp = !!app;
  const shareTargetId = isApp ? app?.id : category?.id;
  const shareTargetName = isApp ? app?.name : category?.name;

  // Search users query
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["searchUsers", userSearchQuery],
    queryFn: () => searchUsers({ data: { query: userSearchQuery } }),
    enabled: userSearchQuery.length >= 2,
  });

  // Get existing shares
  const { data: sharesData, isLoading: isLoadingShares } = useQuery({
    queryKey: isApp ? ["appShares", shareTargetId] : ["categoryShares", shareTargetId],
    queryFn: () =>
      isApp
        ? getAppShares({ data: { appId: shareTargetId! } })
        : getCategoryShares({ data: { categoryId: shareTargetId! } }),
    enabled: !!shareTargetId && open,
  });

  const shares = sharesData?.shares ?? [];

  // Share mutation
  const shareMutation = useMutation({
    mutationFn: async () => {
      if (isApp) {
        return shareApp({
          data: {
            appId: app!.id,
            sharedWithEmail: email,
            permission,
            customPermissions: showCustomPermissions ? customPermissions : undefined,
          },
        });
      }
      return shareCategory({
        data: {
          categoryId: category!.id,
          sharedWithEmail: email,
          permission,
          customPermissions: showCustomPermissions ? customPermissions : undefined,
        },
      });
    },
    onSuccess: () => {
      setEmail("");
      setError(null);
      queryClient.invalidateQueries({
        queryKey: isApp ? ["appShares", shareTargetId] : ["categoryShares", shareTargetId],
      });
      queryClient.invalidateQueries({ queryKey: ["apps"] });
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // Update share mutation
  const updateShareMutation = useMutation({
    mutationFn: (data: { shareId: string; permission: SharingPermission }) =>
      updateShare({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: isApp ? ["appShares", shareTargetId] : ["categoryShares", shareTargetId],
      });
      queryClient.invalidateQueries({ queryKey: ["apps"] });
    },
  });

  // Revoke share mutation
  const revokeShareMutation = useMutation({
    mutationFn: (shareId: string) => revokeShare({ data: { shareId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: isApp ? ["appShares", shareTargetId] : ["categoryShares", shareTargetId],
      });
      queryClient.invalidateQueries({ queryKey: ["apps"] });
    },
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setEmail("");
      setError(null);
      setUserSearchQuery("");
      setShowCustomPermissions(false);
      setActiveTab("share");
    }
  }, [open]);

  const handleShare = () => {
    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }
    shareMutation.mutate();
  };

  const handleSelectUser = (userEmail: string) => {
    setEmail(userEmail);
    setUserSearchQuery("");
  };

  const handleRevokeShare = (shareId: string) => {
    if (confirm("Are you sure you want to revoke this share?")) {
      revokeShareMutation.mutate(shareId);
    }
  };

  const toggleCustomPermission = (key: keyof GranularPermissions) => {
    setCustomPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {title || `Share "${shareTargetName}"`}
          </DialogTitle>
          <DialogDescription>
            {isApp
              ? "Share this app with other users and control their access permissions."
              : "Share this category and all its apps with other users."}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="share">Share</TabsTrigger>
            <TabsTrigger value="manage">
              Manage ({shares.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="share" className="space-y-4 mt-4">
            {/* Email input with user search */}
            <div className="space-y-2">
              <Label htmlFor="email">User Email</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email or search for a user..."
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setUserSearchQuery(e.target.value);
                    setError(null);
                  }}
                  className="pl-10"
                />
              </div>

              {/* User search results */}
              {userSearchQuery.length >= 2 && (
                <div className="border rounded-md max-h-32 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-2 text-sm text-muted-foreground">Searching...</div>
                  ) : searchResults?.users && searchResults.users.length > 0 ? (
                    searchResults.users.map((user) => (
                      <button
                        key={user.id}
                        className="w-full flex items-center gap-2 p-2 hover:bg-muted text-left"
                        onClick={() => handleSelectUser(user.email)}
                      >
                        {user.image ? (
                          <img
                            src={user.image}
                            alt=""
                            className="h-6 w-6 rounded-full"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{user.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">
                      No users found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Permission level */}
            <div className="space-y-2">
              <Label>Permission Level</Label>
              <Select
                value={permission}
                onValueChange={(value: SharingPermission) => setPermission(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PERMISSION_LABELS).map(([key, { label, description }]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex flex-col">
                        <span>{label}</span>
                        <span className="text-xs text-muted-foreground">
                          {description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom permissions toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="custom-permissions" className="text-sm">
                Customize permissions
              </Label>
              <Switch
                id="custom-permissions"
                checked={showCustomPermissions}
                onCheckedChange={setShowCustomPermissions}
              />
            </div>

            {/* Custom permissions panel */}
            {showCustomPermissions && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Granular Permissions</CardTitle>
                  <CardDescription className="text-xs">
                    Fine-tune exactly what this user can do
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Can View</span>
                    </div>
                    <Switch
                      checked={customPermissions.canView}
                      onCheckedChange={() => toggleCustomPermission("canView")}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Can See Health Status</span>
                    </div>
                    <Switch
                      checked={customPermissions.canSeeHealth}
                      onCheckedChange={() => toggleCustomPermission("canSeeHealth")}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Can Access Local URL</span>
                    </div>
                    <Switch
                      checked={customPermissions.canAccessLocalUrl}
                      onCheckedChange={() => toggleCustomPermission("canAccessLocalUrl")}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Can Access Remote URL</span>
                    </div>
                    <Switch
                      checked={customPermissions.canAccessRemoteUrl}
                      onCheckedChange={() => toggleCustomPermission("canAccessRemoteUrl")}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Edit className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Can Edit</span>
                    </div>
                    <Switch
                      checked={customPermissions.canEdit}
                      onCheckedChange={() => toggleCustomPermission("canEdit")}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Can Delete</span>
                    </div>
                    <Switch
                      checked={customPermissions.canDelete}
                      onCheckedChange={() => toggleCustomPermission("canDelete")}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* Share button */}
            <Button
              onClick={handleShare}
              disabled={!email.trim() || shareMutation.isPending}
              className="w-full"
            >
              {shareMutation.isPending ? "Sharing..." : "Share"}
            </Button>
          </TabsContent>

          <TabsContent value="manage" className="mt-4">
            {isLoadingShares ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Loading shares...
              </div>
            ) : shares.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Not shared with anyone yet
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {shares.map((share) => (
                  <Card key={share.id}>
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {/* User avatar */}
                        {share.sharedWith.image ? (
                          <img
                            src={share.sharedWith.image}
                            alt=""
                            className="h-10 w-10 rounded-full"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                            {share.sharedWith.name.charAt(0).toUpperCase()}
                          </div>
                        )}

                        {/* User info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {share.sharedWith.name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {share.sharedWith.email}
                          </div>
                        </div>

                        {/* Permission badge */}
                        <Badge variant="outline" className="flex-shrink-0">
                          {PERMISSION_LABELS[share.permission as SharingPermission]?.label || share.permission}
                        </Badge>

                        {/* Permission dropdown */}
                        <Select
                          value={share.permission}
                          onValueChange={(value: SharingPermission) =>
                            updateShareMutation.mutate({
                              shareId: share.id,
                              permission: value,
                            })
                          }
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(PERMISSION_LABELS).map(([key, { label }]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Revoke button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleRevokeShare(share.id)}
                          disabled={revokeShareMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Permission indicators */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {share.canView && (
                          <Badge variant="secondary" className="text-xs">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Badge>
                        )}
                        {share.canSeeHealth && (
                          <Badge variant="secondary" className="text-xs">
                            <Activity className="h-3 w-3 mr-1" />
                            Health
                          </Badge>
                        )}
                        {share.canAccessLocalUrl && (
                          <Badge variant="secondary" className="text-xs">
                            <Home className="h-3 w-3 mr-1" />
                            Local
                          </Badge>
                        )}
                        {share.canAccessRemoteUrl && (
                          <Badge variant="secondary" className="text-xs">
                            <Globe className="h-3 w-3 mr-1" />
                            Remote
                          </Badge>
                        )}
                        {share.canEdit && (
                          <Badge variant="secondary" className="text-xs">
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Badge>
                        )}
                        {share.canDelete && (
                          <Badge variant="secondary" className="text-xs">
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
