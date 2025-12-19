import { useState } from "react"
import { AuthUIProvider } from "@daveyplate/better-auth-ui"
import { Link, useRouter } from "@tanstack/react-router"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "next-themes"

import { authClient } from "@/lib/auth-client"
import { MetaTheme } from "./meta-theme"
import { CustomThemeLoader } from "./theme/custom-theme-loader"

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                refetchOnWindowFocus: false,
            },
        },
    })
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
    if (typeof window === "undefined") {
        // Server: always make a new query client
        return makeQueryClient()
    }
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
}

export function Providers({ children }: { children: React.ReactNode }) {
    const queryClient = getQueryClient()
    const { navigate } = useRouter()

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                <AuthUIProvider
                    authClient={authClient}
                    navigate={(href) => navigate({ to: href })}
                    replace={(href) => navigate({ to: href, replace: true })}
                    Link={({ href, ...props }) => <Link to={href} {...props} />}
                >
                    {children}

                    <MetaTheme />
                    <CustomThemeLoader />
                </AuthUIProvider>
            </ThemeProvider>
        </QueryClientProvider>
    )
}
