import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router"
import { Header } from "@/components/header"
import { Providers } from "@/components/providers"
import appCss from "../styles/styles.css?url"

export const Route = createRootRoute({
    head: () => ({
        meta: [
            { title: "App Map - Homelab Dashboard" },
            { charSet: "utf-8" },
            {
                name: "viewport",
                content: "width=device-width, initial-scale=1"
            },
            {
                name: "theme-color",
                content: "var(--bg-background)"
            }
        ],
        links: [
            {
                rel: "stylesheet",
                href: appCss
            }
        ]
    }),

    component: RootDocument
})

function RootDocument() {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <HeadContent />
            </head>

            <body className="min-h-screen flex flex-col">
                <Providers>
                    <Header />

                    <Outlet />
                </Providers>

                <Scripts />
            </body>
        </html>
    )
}
