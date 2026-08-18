import { useEffect } from "react"
import { AuthView } from "@daveyplate/better-auth-ui"
import { createFileRoute, useRouter } from "@tanstack/react-router"

import { useSession } from "@/lib/auth-client"

export const Route = createFileRoute("/auth/$path")({
    component: RouteComponent
})

// Auth views that make no sense for an already-authenticated user. After an
// OAuth round-trip better-auth can land the (now signed-in) user back on
// sign-in; bounce them to the dashboard instead of showing the login form.
const SIGNED_OUT_ONLY = new Set([
    "sign-in",
    "sign-up",
    "callback",
    "forgot-password",
    "reset-password",
    "magic-link"
])

function RouteComponent() {
    const { path } = Route.useParams()
    const { navigate } = useRouter()
    const { data: session, isPending } = useSession()

    useEffect(() => {
        if (!isPending && session?.user && SIGNED_OUT_ONLY.has(path)) {
            navigate({ to: "/", replace: true })
        }
    }, [isPending, session, path, navigate])

    return (
        <main className="container items-center flex flex-col mx-auto my-auto p-4 md:p-6">
            <AuthView path={path} />
        </main>
    )
}
