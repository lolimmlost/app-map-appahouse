import { ExternalLink, MoreVertical, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
    <div className="flex items-center gap-1.5 sm:gap-1">
      {/* Group label + menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1 rounded-md border bg-card px-2 py-1 sm:py-0.5 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors shrink-0">
            {group.icon && (
              group.icon.startsWith("http") ? (
                <img src={group.icon} alt="" className="h-3.5 w-3.5 object-contain" />
              ) : (
                <span className="text-xs">{group.icon}</span>
              )
            )}
            {group.name}
            <MoreVertical className="h-3 w-3 ml-0.5 opacity-50" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => onAddLink(group.id)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEditGroup(group)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Group
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => onDeleteGroup(group)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Group
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Link pills */}
      {group.links.map((link) => (
        <div
          key={link.id}
          className="group relative flex items-center gap-1 sm:gap-0.5 rounded-lg border bg-card p-1 sm:p-1 shadow-sm overflow-hidden"
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-10 sm:h-8 px-2.5 sm:px-2 gap-2 sm:gap-1.5 min-w-0"
            onClick={() => handleOpenUrl(link.url)}
            title={link.description || link.url}
          >
            {link.icon ? (
              link.icon.startsWith("http") ? (
                <img src={link.icon} alt="" className="h-5 w-5 sm:h-4 sm:w-4 object-contain" />
              ) : (
                <span className="text-base sm:text-sm">{link.icon}</span>
              )
            ) : (
              <ExternalLink className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
            )}
            <span className="text-sm sm:text-xs font-medium truncate sm:max-w-[100px]">
              {link.name}
            </span>
          </Button>

          {/* Edit/delete on hover via dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="absolute right-0.5 top-0.5 opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded bg-background/80 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-3 w-3 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditLink(link)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Link
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDeleteLink(link)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </div>
  );
}
