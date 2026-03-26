import { ExternalLink, MoreVertical, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LinkGroup, Link } from "@/types/database";

interface LinkGroupSectionProps {
  group: LinkGroup & { links: Link[] };
  onEditGroup: (group: LinkGroup) => void;
  onDeleteGroup: (group: LinkGroup) => void;
  onAddLink: (groupId: string) => void;
  onEditLink: (link: Link) => void;
  onDeleteLink: (link: Link) => void;
}

export function LinkGroupSection({
  group,
  onEditGroup,
  onDeleteGroup,
  onAddLink,
  onEditLink,
  onDeleteLink,
}: LinkGroupSectionProps) {
  const handleOpenUrl = (url: string) => {
    const normalized = url.startsWith("http://") || url.startsWith("https://")
      ? url
      : `http://${url}`;
    window.open(normalized, "_blank", "noopener,noreferrer");
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            {group.icon && (
              group.icon.startsWith("http") ? (
                <img src={group.icon} alt="" className="h-4 w-4 object-contain" />
              ) : (
                <span>{group.icon}</span>
              )
            )}
            {group.name}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onAddLink(group.id)}
              title="Add link"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEditGroup(group)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Group
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDeleteGroup(group)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Group
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {group.links.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">
            No links yet
          </p>
        ) : (
          <div className="space-y-0.5">
            {group.links.map((link) => (
              <div
                key={link.id}
                className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent cursor-pointer"
                onClick={() => handleOpenUrl(link.url)}
              >
                <div className="flex-shrink-0">
                  {link.icon ? (
                    link.icon.startsWith("http") ? (
                      <img src={link.icon} alt="" className="h-4 w-4 object-contain" />
                    ) : (
                      <span className="text-sm">{link.icon}</span>
                    )
                  ) : (
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate block">{link.name}</span>
                  {link.description && (
                    <span className="text-xs text-muted-foreground truncate block">
                      {link.description}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditLink(link);
                    }}
                    title="Edit link"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteLink(link);
                    }}
                    title="Delete link"
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
  );
}
