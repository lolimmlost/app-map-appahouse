/** URL + time helpers for the porttracker-style app table. */

export function normalizeUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  const fullUrl =
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("tcp://")
      ? trimmed
      : `http://${trimmed}`;
  try {
    new URL(fullUrl);
    return fullUrl;
  } catch {
    return null;
  }
}

export interface HostParts {
  protocol: string | null;
  host: string;
  port: string | null;
  path: string;
}

/** Split a URL into protocol / host / port / path for the split host:port column. */
export function hostParts(url: string | null | undefined): HostParts | null {
  const normalized = normalizeUrl(url);
  if (!normalized) return null;
  try {
    const u = new URL(normalized);
    return {
      protocol: u.protocol.replace(":", "") || null,
      host: u.hostname,
      port: u.port || null,
      path: u.pathname === "/" ? "" : u.pathname,
    };
  } catch {
    return null;
  }
}

/**
 * Canonical uptime → semantic level, shared across the table, widgets, status
 * page and analytics so thresholds don't drift. >=99% healthy, >=95% degraded,
 * below that unhealthy; null when there's no data.
 */
export type UptimeLevel = "success" | "warning" | "error";

export function uptimeLevel(uptime: number | null | undefined): UptimeLevel | null {
  if (uptime == null || Number.isNaN(uptime)) return null;
  if (uptime >= 99) return "success";
  if (uptime >= 95) return "warning";
  return "error";
}

// Literal class strings (not interpolated) so Tailwind's scanner keeps them.
const UPTIME_TEXT: Record<UptimeLevel, string> = {
  success: "text-success",
  warning: "text-warning",
  error: "text-error",
};
const UPTIME_BG: Record<UptimeLevel, string> = {
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
};

/** `text-*` class for an uptime %; muted when there's no data. */
export function uptimeTextClass(uptime: number | null | undefined): string {
  const level = uptimeLevel(uptime);
  return level ? UPTIME_TEXT[level] : "text-muted-foreground";
}

/** `bg-*` class for an uptime % (bars/fills); muted when there's no data. */
export function uptimeBgClass(uptime: number | null | undefined): string {
  const level = uptimeLevel(uptime);
  return level ? UPTIME_BG[level] : "bg-muted-foreground";
}

/** Compact relative time, e.g. "2m ago", "3h ago". */
export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
