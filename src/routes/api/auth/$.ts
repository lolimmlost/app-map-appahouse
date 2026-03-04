import { createFileRoute } from "@tanstack/react-router"
import { serverLogger } from "@/lib/server/logger"

const log = serverLogger.child({ module: "auth-route" })

export const Route = createFileRoute("/api/auth/$")({
    server: {
        handlers: {
            GET: async ({ request }) => {
                try {
                    const { auth } = await import("@/lib/auth.server")
                    return auth.handler(request)
                } catch (error) {
                    log.logError(error, "Auth GET error")
                    throw error
                }
            },
            POST: async ({ request }) => {
                try {
                    const { auth } = await import("@/lib/auth.server")
                    return auth.handler(request)
                } catch (error) {
                    log.logError(error, "Auth POST error")
                    throw error
                }
            }
        }
    }
})
