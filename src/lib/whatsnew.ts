/**
 * "What's new" changelog — the single source for the header changelog dialog.
 *
 * To update: add a new entry at the TOP of the array (newest first). Keep items
 * short and user-facing. Mirror the newest entry in README.md if you keep one.
 * Shared pattern with the other AppaHouse apps (friend-profile, Virtual TV).
 */
export type WhatsNewEntry = {
  /** Human date, e.g. "August 7, 2026" */
  date: string;
  items: string[];
};

export const WHATS_NEW: WhatsNewEntry[] = [
  {
    date: "August 7, 2026",
    items: [
      "Semantic status colours — online/offline/degraded now read at a glance, in light and dark",
      "Wired-in status dots and denser, border-led panels across widgets and status pages",
      "Overlays (dialogs, menus, popovers) sit clearly above the page",
      "New: this What's new changelog, and the AppaHouse mark in the header",
    ],
  },
  {
    date: "August 5, 2026",
    items: [
      "Compact clock/weather status bar merged into the widget header row",
      "Link groups collapse into inline pills to match quick-links density",
    ],
  },
];
