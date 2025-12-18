import { AuthUIProvider } from "@daveyplate/better-auth-ui"
import { Link, useRouter } from "@tanstack/react-router"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "next-themes"

import { authClient } from "@/lib/auth-client"
import { MetaTheme } from "./meta-theme"

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
            refetchOnWindowFocus: false,
        },
    },
})

export function Providers({ children }: { children: React.ReactNode }) {
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
                </AuthUIProvider>
            </ThemeProvider>
        </QueryClientProvider>
    )
}
