import { createServerFn } from "@tanstack/react-start";

export type SearxngResult = {
  title: string;
  url: string;
  content: string;
  engine: string;
};

type SearchSearxngData = {
  data: { query: string };
};

// Proxy search requests to user's SearXNG instance
export const searchSearxng = createServerFn({ method: "GET" }).handler(
  async (ctx: SearchSearxngData) => {
    const { getDb } = await import("./get-db");
    const { eq } = await import("drizzle-orm");
    const { getOptionalSession } = await import("./auth-utils.server");
    const { userSettings } = await import("@/database/schema/user-settings");

    const session = await getOptionalSession();
    if (!session) return { results: [] as SearxngResult[] };

    const db = await getDb();
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, session.user.id))
      .limit(1);

    if (!settings?.searxngEnabled || !settings?.searxngUrl) {
      return { results: [] as SearxngResult[] };
    }

    const { query } = ctx.data;
    if (!query || query.trim().length < 2) {
      return { results: [] as SearxngResult[] };
    }

    try {
      const url = new URL("/search", settings.searxngUrl);
      url.searchParams.set("q", query.trim());
      url.searchParams.set("format", "json");

      const response = await fetch(url.toString(), {
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) return { results: [] as SearxngResult[] };

      const data = await response.json();
      const results: SearxngResult[] = (data.results || [])
        .slice(0, 5)
        .map((r: { title?: string; url?: string; content?: string; engine?: string }) => ({
          title: r.title || "",
          url: r.url || "",
          content: r.content || "",
          engine: r.engine || "",
        }));

      return { results };
    } catch {
      return { results: [] as SearxngResult[] };
    }
  }
);
