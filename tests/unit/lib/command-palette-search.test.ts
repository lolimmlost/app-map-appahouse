import { describe, expect, it } from "vitest";
import {
  APP_VALUE_PREFIX,
  MAX_APP_RESULTS,
  commandPaletteFilter,
  rankApps,
  scoreApp,
} from "@/lib/command-palette-search";

const filler = Array.from({ length: 12 }, (_, i) => ({
  name: `Service ${i}`,
  description: null,
  notes: null,
}));
const lubeLogger = { name: "LubeLogger", description: "Vehicle maintenance", notes: null };

describe("rankApps", () => {
  it("finds apps beyond the first 8 (regression: #44)", () => {
    const apps = [...filler, lubeLogger];
    expect(rankApps(apps, "lube")[0]).toBe(lubeLogger);
  });

  it("returns the first N apps unchanged when the query is empty", () => {
    const apps = [...filler, lubeLogger];
    expect(rankApps(apps, "  ")).toEqual(apps.slice(0, MAX_APP_RESULTS));
  });

  it("ranks name matches above description/notes matches", () => {
    const apps = [
      { name: "Garage", description: "uses lube daily", notes: null },
      { name: "Notes App", description: null, notes: "lube schedule" },
      lubeLogger,
    ];
    expect(rankApps(apps, "lube").map((a) => a.name)).toEqual([
      "LubeLogger",
      "Garage",
      "Notes App",
    ]);
  });

  it("matches camelCase word starts and caps results", () => {
    expect(rankApps([lubeLogger], "logger")).toEqual([lubeLogger]);
    const many = Array.from({ length: 20 }, (_, i) => ({ name: `Lube ${i}` }));
    expect(rankApps(many, "lube")).toHaveLength(MAX_APP_RESULTS);
  });

  it("excludes non-matches", () => {
    expect(rankApps([...filler, lubeLogger], "zzzz")).toEqual([]);
  });
});

describe("scoreApp", () => {
  it("orders exact > prefix > word-start > substring", () => {
    const q = "lube";
    const exact = scoreApp({ name: "Lube" }, q);
    const prefix = scoreApp({ name: "LubeLogger" }, q);
    const word = scoreApp({ name: "Car Lube" }, q);
    const sub = scoreApp({ name: "Carlube" }, q);
    expect(exact).toBeGreaterThan(prefix);
    expect(prefix).toBeGreaterThan(word);
    expect(word).toBeGreaterThan(sub);
    expect(sub).toBeGreaterThan(0);
  });
});

describe("commandPaletteFilter", () => {
  it("scores matching apps above other items and web search", () => {
    const app = commandPaletteFilter(`${APP_VALUE_PREFIX}123`, "lube", [
      "LubeLogger",
      "",
      "",
    ]);
    const nav = commandPaletteFilter("lube settings", "lube");
    const web = commandPaletteFilter("websearch-open-lube", "lube");
    expect(app).toBeGreaterThan(1);
    expect(app).toBeGreaterThan(nav);
    expect(web).toBe(0);
  });

  it("returns 0 for non-matching apps", () => {
    expect(
      commandPaletteFilter(`${APP_VALUE_PREFIX}1`, "lube", ["Sonarr", "", ""])
    ).toBe(0);
  });
});
