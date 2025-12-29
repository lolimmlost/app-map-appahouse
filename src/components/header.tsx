import { useState } from "react";
import { UserButton } from "@daveyplate/better-auth-ui";
import { Link } from "@tanstack/react-router";
import { Map, Settings, Tags, Layers, Menu, Plug, LayoutGrid, BarChart3 } from "lucide-react";
import { ModeToggle } from "./mode-toggle";
import { Button } from "./ui/button";
import { CommandPalette } from "./command-palette";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { to: "/", icon: Layers, label: "Dashboard" },
    { to: "/apps", icon: LayoutGrid, label: "Apps" },
    { to: "/categories", icon: Tags, label: "Categories" },
    { to: "/analytics", icon: BarChart3, label: "Analytics" },
    { to: "/integrations", icon: Plug, label: "Integrations" },
    { to: "/settings", icon: Settings, label: "Settings" },
  ];

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 flex h-14 justify-between border-b bg-background/60 px-safe-or-4 backdrop-blur md:h-14 md:px-safe-or-6">
      <div className="flex items-center gap-4 md:gap-6">
        {/* Mobile hamburger menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden h-11 w-11">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] sm:w-[320px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Map className="h-5 w-5" />
                App Map
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={handleNavClick}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground active:bg-accent"
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Map className="h-5 w-5" />
          <span className="hidden sm:inline">App Map</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link key={item.to} to={item.to}>
              <Button variant="ghost" size="sm">
                <item.icon className="h-4 w-4 mr-2" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3 sm:gap-2">
        <CommandPalette />
        <ModeToggle />
        <UserButton size="icon" />
      </div>
    </header>
  );
}
