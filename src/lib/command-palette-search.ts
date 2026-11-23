import { defaultFilter } from "cmdk";

/** Max number of app matches shown in the command palette. */
export const MAX_APP_RESULTS = 8;

/** cmdk item value prefixes used by the command palette. */
export const APP_VALUE_PREFIX = "app-";
const WEB_VALUE_PREFIXES = ["websearch-", "searxng-"];

export interface SearchableApp {
  name: string;
  description?: string | null;
  notes?: string | null;
}

/** Split a name into lowercase words, honoring separators and camelCase ("LubeLogger" -> ["lube", "logger"]). */
function nameWords(name: string): string[] {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/**
 * Score how well an app matches a query. 0 means no match; higher is better.
 * Name matches always outrank description/notes matches.
 */
export function scoreApp(app: SearchableApp, rawQuery: string): number {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return 0;

  const name = app.name.toLowerCase();
  if (name === query) return 100;
  if (name.startsWith(query)) return 90;
  if (nameWords(app.name).some((word) => word.startsWith(query))) return 80;
  if (name.includes(query)) return 70;

  const description = (app.description ?? "").toLowerCase();
  if (description.includes(query)) return 40;

  const notes = (app.notes ?? "").toLowerCase();
  if (notes.includes(query)) return 30;

  // Loose fuzzy match on the name only (e.g. "lblg" -> "LubeLogger").
  const fuzzy = defaultFilter(app.name, query);
  return fuzzy > 0 ? 10 * fuzzy : 0;
}

/**
 * Return the apps to render in the palette. With no query, the first
 * `limit` apps in their existing order; otherwise the best `limit` matches.
 * The limit is applied AFTER matching so apps late in the list are still found.
 */
export function rankApps<T extends SearchableApp>(
  apps: T[],
  query: string,
  limit = MAX_APP_RESULTS
): T[] {
  if (!query.trim()) return apps.slice(0, limit);
  return apps
    .map((app, index) => ({ app, index, score: scoreApp(app, query) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.app)
    .slice(0, limit);
}

/**
 * cmdk `filter` for the command palette. cmdk sorts items and groups by this
 * score, so:
 *  - app items (keywords = [name, description, notes]) score above everything else,
 *  - web search items score 0 (they are force-mounted, so they still render, last),
 *  - everything else uses cmdk's default scoring (0..1).
 */
export function commandPaletteFilter(
  value: string,
  search: string,
  keywords?: string[]
): number {
  if (WEB_VALUE_PREFIXES.some((prefix) => value.startsWith(prefix))) return 0;
  if (value.startsWith(APP_VALUE_PREFIX)) {
    const [name = "", description = "", notes = ""] = keywords ?? [];
    const score = scoreApp({ name, description, notes }, search);
    return score > 0 ? 1 + score / 100 : 0;
  }
  return defaultFilter(value, search, keywords);
}
