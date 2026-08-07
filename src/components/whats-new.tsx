import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { WHATS_NEW } from "@/lib/whatsnew";

const SEEN_KEY = "appmap:whatsnew-seen";
const latestDate = WHATS_NEW[0]?.date ?? "";

/** The shared "by AppaHouse" brand mark — same lockup across AppaHouse apps. */
export function AppaHouseMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`select-none text-center font-extrabold uppercase leading-none ${className}`}
      aria-label="by AppaHouse"
    >
      <span className="block text-[9px] tracking-[0.2em] text-muted-foreground opacity-60">
        by
      </span>
      <span className="appa-neon block text-[13px] tracking-[0.1em]">AppaHouse</span>
    </span>
  );
}

/** Header changelog: a dialog listing recent "What's new" entries, with an
 *  unseen indicator based on the newest entry's date. */
export function WhatsNew() {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(true); // default seen to avoid SSR flash

  useEffect(() => {
    try {
      setSeen(localStorage.getItem(SEEN_KEY) === latestDate);
    } catch {
      /* localStorage unavailable — treat as seen */
    }
  }, []);

  const markSeen = () => {
    setSeen(true);
    try {
      localStorage.setItem(SEEN_KEY, latestDate);
    } catch {
      /* ignore */
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) markSeen();
      }}
    >
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9"
        title="What's new"
        onClick={() => setOpen(true)}
      >
        <Sparkles className="h-4 w-4" />
        {!seen && (
          <span className="absolute right-1.5 top-1.5 status-dot size-1.5 text-info" />
        )}
        <span className="sr-only">What's new</span>
      </Button>

      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>What's new</DialogTitle>
          <DialogDescription>Recent changes to App Map.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          {WHATS_NEW.map((entry) => (
            <div key={entry.date} className="space-y-2">
              <p className="panel-label">{entry.date}</p>
              <ul className="flex flex-col gap-1.5">
                {entry.items.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm leading-relaxed">
                    <span className="text-muted-foreground">·</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
