/**
 * Network Scanner
 *
 * Finds web UIs on the LAN by TCP-probing a curated port list across the
 * configured subnets, then confirming each open port answers HTTP(S) and
 * reading its <title> to name it. Used by service discovery for hosts that
 * have no Docker/TrueNAS integration (plain servers, appliances, HA add-ons).
 */

import net from "node:net"

/**
 * Ports that commonly serve a web UI in a homelab. A full 65k sweep of a /24
 * is far too slow for an interactive dialog, so this trades completeness for
 * speed; TrueNAS's high-numbered app ports come from its own integration.
 */
export const DEFAULT_SCAN_PORTS = [
    80, 81, 443, 2283, 2368, 3000, 3001, 3002, 3003, 3004, 3005, 3210, 3333,
    3334, 4173, 4174, 4175, 4533, 5000, 5001, 5055, 5173, 5678, 7878, 8000,
    8006, 8080, 8081, 8083, 8086, 8088, 8095, 8096, 8097, 8123, 8181, 8384,
    8443, 8686, 8888, 8989, 9000, 9090, 9443, 9696, 10000
]

const TLS_FIRST_PORTS = new Set([443, 8006, 8443, 9443, 10000])
const MAX_HOSTS = 1024

export interface NetworkService {
    host: string
    port: number
    url: string
    title: string | null
    status: number
}

/** Expand IPv4 CIDRs ("10.0.0.0/24") or bare IPs into host addresses */
export function expandCidrs(cidrs: string[]): string[] {
    const hosts = new Set<string>()
    for (const raw of cidrs) {
        const [ip, bitsStr] = raw.trim().split("/")
        const octets = ip.split(".").map(Number)
        if (
            octets.length !== 4 ||
            octets.some((o) => !Number.isInteger(o) || o < 0 || o > 255)
        ) {
            throw new Error(`Invalid network "${raw}"`)
        }
        const bits = bitsStr === undefined ? 32 : Number(bitsStr)
        if (!Number.isInteger(bits) || bits < 22 || bits > 32) {
            throw new Error(`Network "${raw}" must be between /22 and /32`)
        }

        const base =
            ((octets[0] << 24) |
                (octets[1] << 16) |
                (octets[2] << 8) |
                octets[3]) >>>
            0
        const size = 2 ** (32 - bits)
        const network = (base & ~(size - 1)) >>> 0
        // Skip network and broadcast addresses for anything bigger than a /31
        const [first, last] =
            size > 2
                ? [network + 1, network + size - 2]
                : [network, network + size - 1]
        for (let n = first; n <= last; n++) {
            hosts.add(
                [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".")
            )
        }
    }
    if (hosts.size > MAX_HOSTS)
        throw new Error(`Refusing to scan more than ${MAX_HOSTS} hosts`)
    return [...hosts]
}

/** Pull a readable name out of an HTML page's <title> */
export function extractTitle(html: string): string | null {
    const match = html.match(/<title[^>]*>([^<]*)<\/title>/i)
    if (!match) return null
    const title = match[1]
        .replace(/&amp;/g, "&")
        .replace(/&#39;|&apos;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, " ")
        .trim()
    return title || null
}

const GENERIC_TITLE_PARTS = new Set([
    "sign in",
    "login",
    "log in",
    "home",
    "dashboard",
    "welcome"
])

/**
 * Turn a page title into an app name: "Sign In - Jellyseerr" -> "Jellyseerr",
 * "Indigo Sun Florals | Custom Floral Arrangements" -> "Indigo Sun Florals"
 */
export function shortTitle(title: string): string {
    const parts = title
        .replace(/^\[[^\]]*\]\s*/, "") // "[Coolify] Coolify" -> "Coolify"
        .split(/\s+[|\-–—:]\s+/)
        .map((p) => p.trim())
        .filter(Boolean)
    return (
        parts.find((p) => !GENERIC_TITLE_PARTS.has(p.toLowerCase())) ??
        parts[0] ??
        title
    )
}

function isPortOpen(
    host: string,
    port: number,
    timeoutMs: number
): Promise<boolean> {
    return new Promise((resolve) => {
        const socket = net.connect({ host, port })
        const done = (open: boolean) => {
            socket.destroy()
            resolve(open)
        }
        socket.setTimeout(timeoutMs, () => done(false))
        socket.once("connect", () => done(true))
        socket.once("error", () => done(false))
    })
}

async function readTitle(response: Response): Promise<string | null> {
    if (!(response.headers.get("content-type") || "").includes("html"))
        return null
    // The fetch timeout only covers headers, so cap the body read separately
    const body = await Promise.race([
        response.text(),
        new Promise<string>((resolve) => setTimeout(() => resolve(""), 3000))
    ])
    return extractTitle(body.slice(0, 64 * 1024))
}

async function probeHttp(
    host: string,
    port: number
): Promise<NetworkService | null> {
    const { fetchWithTimeout } = await import("./integration-client.server")
    const schemes = TLS_FIRST_PORTS.has(port)
        ? ["https", "http"]
        : ["http", "https"]
    const get = (url: string) =>
        fetchWithTimeout(url, {
            method: "GET",
            timeout: 3000,
            allowInsecure: true, // self-signed certs are the norm on a LAN
            redirect: "manual"
        })

    for (const scheme of schemes) {
        const url = `${scheme}://${host}:${port}`
        try {
            let response = await get(`${url}/`)
            let title = await readTitle(response)

            // nginx answers plain HTTP on a TLS port with a 400 page - not the real UI
            if (response.status === 400 && title?.includes("HTTPS port"))
                continue

            // Follow one same-host redirect (e.g. "/" -> "/login") so the title is the
            // app's rather than "Redirecting...", but never chase redirects off the LAN host
            const location = response.headers.get("location")
            if (location && response.status >= 300 && response.status < 400) {
                const target = new URL(location, `${url}/`)
                if (target.hostname === host) {
                    response = await get(target.toString())
                    title = await readTitle(response)
                }
            }
            // An untitled error page (stream endpoints, bare proxies) isn't a UI worth listing
            if (!title && response.status >= 400) return null
            return { host, port, url, title, status: response.status }
        } catch {
            // Not this scheme (or not HTTP at all) - try the next one
        }
    }
    return null
}

/** Run `task` over `items` with at most `limit` in flight */
async function mapWithConcurrency<T, R>(
    items: T[],
    limit: number,
    task: (item: T) => Promise<R>
): Promise<R[]> {
    const results: R[] = new Array(items.length)
    let next = 0
    const workers = Array.from(
        { length: Math.min(limit, items.length) },
        async () => {
            while (next < items.length) {
                const i = next++
                results[i] = await task(items[i])
            }
        }
    )
    await Promise.all(workers)
    return results
}

export async function scanNetwork(options: {
    cidrs: string[]
    ports?: number[]
    connectTimeoutMs?: number
    concurrency?: number
}): Promise<NetworkService[]> {
    const hosts = expandCidrs(options.cidrs)
    const ports = options.ports?.length ? options.ports : DEFAULT_SCAN_PORTS
    const targets = hosts.flatMap((host) =>
        ports.map((port) => ({ host, port }))
    )

    const open = await mapWithConcurrency(
        targets,
        options.concurrency ?? 512,
        async (t) =>
            (await isPortOpen(t.host, t.port, options.connectTimeoutMs ?? 400))
                ? t
                : null
    )

    const services = await mapWithConcurrency(
        open.filter((t): t is { host: string; port: number } => t !== null),
        32,
        (t) => probeHttp(t.host, t.port)
    )
    return services.filter((s): s is NetworkService => s !== null)
}
