import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useAuthenticate } from "@daveyplate/better-auth-ui";
import { Button } from "@/components/ui/button";
import {
  getLinkGroups,
  createLinkGroup,
  updateLinkGroup,
  deleteLinkGroup,
  createLink,
  updateLink,
  deleteLink,
} from "@/lib/server/link-groups.server";
import { LinkGroupSection } from "./link-group-section";
import { LinkGroupFormDialog } from "./link-group-form-dialog";
import { LinkFormDialog } from "./link-form-dialog";
import type { LinkGroup, Link } from "@/types/database";

export function LinksGrid() {
  const { data: session } = useAuthenticate();
  const queryClient = useQueryClient();

  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<LinkGroup | null>(null);
  const [linkFormOpen, setLinkFormOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  const { data: groupsData } = useQuery({
    queryKey: ["linkGroups"],
    queryFn: () => getLinkGroups(),
    enabled: !!session?.user,
    staleTime: 30000,
  });

  const groups = groupsData?.linkGroups ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["linkGroups"] });

  // Group mutations
  const createGroupMutation = useMutation({
    mutationFn: (data: { name: string; icon?: string }) =>
      createLinkGroup({ data }),
    onSuccess: () => {
      invalidate();
      setGroupFormOpen(false);
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: (data: { id: string; name?: string; icon?: string }) =>
      updateLinkGroup({ data }),
    onSuccess: () => {
      invalidate();
      setGroupFormOpen(false);
      setEditingGroup(null);
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (id: string) => deleteLinkGroup({ data: { id } }),
    onSuccess: invalidate,
  });

  // Link mutations
  const createLinkMutation = useMutation({
    mutationFn: (data: { name: string; url: string; icon?: string; description?: string; groupId: string }) =>
      createLink({ data }),
    onSuccess: () => {
      invalidate();
      setLinkFormOpen(false);
      setActiveGroupId(null);
    },
  });

  const updateLinkMutation = useMutation({
    mutationFn: (data: { id: string; name?: string; url?: string; icon?: string; description?: string }) =>
      updateLink({ data }),
    onSuccess: () => {
      invalidate();
      setLinkFormOpen(false);
      setEditingLink(null);
    },
  });

  const deleteLinkMutation = useMutation({
    mutationFn: (id: string) => deleteLink({ data: { id } }),
    onSuccess: invalidate,
  });

  // Handlers
  const handleAddGroup = () => {
    setEditingGroup(null);
    setGroupFormOpen(true);
  };

  const handleEditGroup = (group: LinkGroup) => {
    setEditingGroup(group);
    setGroupFormOpen(true);
  };

  const handleDeleteGroup = (group: LinkGroup) => {
    if (confirm(`Delete "${group.name}" and all its links?`)) {
      deleteGroupMutation.mutate(group.id);
    }
  };

  const handleGroupSubmit = (data: { name: string; icon?: string }) => {
    if (editingGroup) {
      updateGroupMutation.mutate({ id: editingGroup.id, ...data });
    } else {
      createGroupMutation.mutate(data);
    }
  };

  const handleAddLink = (groupId: string) => {
    setEditingLink(null);
    setActiveGroupId(groupId);
    setLinkFormOpen(true);
  };

  const handleEditLink = (link: Link) => {
    setEditingLink(link);
    setActiveGroupId(link.groupId);
    setLinkFormOpen(true);
  };

  const handleDeleteLink = (link: Link) => {
    if (confirm(`Delete "${link.name}"?`)) {
      deleteLinkMutation.mutate(link.id);
    }
  };

  const handleLinkSubmit = (data: { name: string; url: string; icon?: string; description?: string }) => {
    if (editingLink) {
      updateLinkMutation.mutate({ id: editingLink.id, ...data });
    } else if (activeGroupId) {
      createLinkMutation.mutate({ ...data, groupId: activeGroupId });
    }
  };

  // Don't render the section at all if user has no groups and hasn't interacted
  if (groups.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleAddGroup}>
          <Plus className="mr-2 h-4 w-4" />
          Add Link Group
        </Button>

        <LinkGroupFormDialog
          open={groupFormOpen}
          onOpenChange={setGroupFormOpen}
          onSubmit={handleGroupSubmit}
          group={editingGroup}
          isLoading={createGroupMutation.isPending || updateGroupMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground">Links</h2>
        <Button variant="outline" size="sm" onClick={handleAddGroup}>
          <Plus className="mr-2 h-4 w-4" />
          Add Group
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {groups.map((group) => (
          <LinkGroupSection
            key={group.id}
            group={group as LinkGroup & { links: Link[] }}
            onEditGroup={handleEditGroup}
            onDeleteGroup={handleDeleteGroup}
            onAddLink={handleAddLink}
            onEditLink={handleEditLink}
            onDeleteLink={handleDeleteLink}
          />
        ))}
      </div>

      {/* Group form dialog */}
      <LinkGroupFormDialog
        open={groupFormOpen}
        onOpenChange={setGroupFormOpen}
        onSubmit={handleGroupSubmit}
        group={editingGroup}
        isLoading={createGroupMutation.isPending || updateGroupMutation.isPending}
      />

      {/* Link form dialog */}
      <LinkFormDialog
        open={linkFormOpen}
        onOpenChange={setLinkFormOpen}
        onSubmit={handleLinkSubmit}
        link={editingLink}
        isLoading={createLinkMutation.isPending || updateLinkMutation.isPending}
      />
    </div>
  );
}
