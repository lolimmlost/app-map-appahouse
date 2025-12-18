import { UserButton } from "@daveyplate/better-auth-ui";
import { Link } from "@tanstack/react-router";
import { Map, Settings, Tags, Layers, Search } from "lucide-react";
import { ModeToggle } from "./mode-toggle";
import { Button } from "./ui/button";
import { CommandPalette } from "./command-palette";

export function Header() {
  return (
    <header className="sticky top-0 z-50 flex h-12 justify-between border-b bg-background/60 px-safe-or-4 backdrop-blur md:h-14 md:px-safe-or-6">
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Map className="h-5 w-5" />
          App Map
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <Layers className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <Link to="/categories">
            <Button variant="ghost" size="sm">
              <Tags className="h-4 w-4 mr-2" />
              Categories
            </Button>
          </Link>
          <Link to="/settings">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <CommandPalette />
        <ModeToggle />
        <UserButton size="icon" />
      </div>
    </header>
  );
}
