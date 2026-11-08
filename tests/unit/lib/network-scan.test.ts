import { describe, expect, it } from "vitest"
import { expandCidrs, extractTitle, shortTitle } from "@/lib/server/network-scan.server"

describe("expandCidrs", () => {
    it("skips the network and broadcast addresses of a /24", () => {
        const hosts = expandCidrs(["10.0.0.0/24"])
        expect(hosts).toHaveLength(254)
        expect(hosts[0]).toBe("10.0.0.1")
        expect(hosts.at(-1)).toBe("10.0.0.254")
    })

    it("accepts bare IPs and de-duplicates overlapping ranges", () => {
        expect(expandCidrs(["10.0.0.246", "10.0.0.246/32"])).toEqual([
            "10.0.0.246"
        ])
    })

    it("rejects networks that are too large or malformed", () => {
        expect(() => expandCidrs(["10.0.0.0/16"])).toThrow()
        expect(() => expandCidrs(["10.0.0/24"])).toThrow()
    })
})

describe("extractTitle", () => {
    it("decodes entities and collapses whitespace", () => {
        expect(
            extractTitle("<html><title>\n  Tom &amp; Jerry \n</title>")
        ).toBe("Tom & Jerry")
    })

    it("returns null when there is no usable title", () => {
        expect(extractTitle("<html><body>hi</body></html>")).toBeNull()
        expect(extractTitle("<title>   </title>")).toBeNull()
    })
})

describe("shortTitle", () => {
  it.each([
    ["Sign In - Jellyseerr", "Jellyseerr"],
    ["Indigo Sun Florals | Custom Floral Arrangements", "Indigo Sun Florals"],
    ["AppaHouse | Juan - Full-Stack Developer | TanStack Start & Docker Expert", "AppaHouse"],
    ["[Coolify] Coolify", "Coolify"],
    ["Navidrome", "Navidrome"],
    ["Self-Hosted Wiki", "Self-Hosted Wiki"],
  ])("%s -> %s", (title, expected) => {
    expect(shortTitle(title)).toBe(expected)
  })
})
