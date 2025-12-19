import { useEffect } from "react"
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
        ],
        style: [
            {
                children: `
                    /* Loading overlay - completely hides page until ready */
                    #app-loader {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        width: 100%;
                        height: 100%;
                        z-index: 2147483647;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        background: #09090b;
                        overflow: hidden;
                        transition: opacity 0.4s ease-out, visibility 0.4s ease-out;
                    }
                    /* Fallback: auto-hide loader after 5 seconds in case React fails to mount */
                    @keyframes app-loader-fallback-hide {
                        to { opacity: 0; visibility: hidden; pointer-events: none; }
                    }
                    #app-loader {
                        animation: app-loader-fallback-hide 0.4s ease-out 5s forwards;
                    }
                    #app-loader.hidden {
                        animation: none;
                        opacity: 0;
                        visibility: hidden;
                        pointer-events: none;
                    }
                    #app-loader .loader-icon {
                        width: 64px;
                        height: 64px;
                        margin-bottom: 24px;
                        color: #a1a1aa;
                    }
                    #app-loader .loader-spinner {
                        width: 48px;
                        height: 48px;
                        border: 3px solid #27272a;
                        border-top-color: #3b82f6;
                        border-radius: 50%;
                        animation: app-loader-spin 0.8s linear infinite;
                    }
                    #app-loader .loader-text {
                        margin-top: 20px;
                        font-size: 18px;
                        font-weight: 600;
                        color: #fafafa;
                        letter-spacing: 0.05em;
                    }
                    #app-loader .loader-subtext {
                        margin-top: 8px;
                        font-size: 13px;
                        color: #71717a;
                    }
                    @keyframes app-loader-spin {
                        to { transform: rotate(360deg); }
                    }
                    /* Prevent body scroll and completely hide content until hydrated */
                    html:not(.hydrated),
                    body:not(.hydrated) {
                        overflow: hidden !important;
                    }
                    body:not(.hydrated) > *:not(#app-loader):not(script) {
                        visibility: hidden !important;
                        opacity: 0 !important;
                    }
                `
            }
        ]
    }),

    component: RootDocument
})

function RootDocument() {
    // Mark as hydrated and hide loader after mount
    useEffect(() => {
        const timeout = setTimeout(() => {
            document.documentElement.classList.add('hydrated')
            document.body.classList.add('hydrated')
            const loader = document.getElementById('app-loader')
            if (loader) {
                loader.classList.add('hidden')
                setTimeout(() => loader.remove(), 400)
            }
        }, 50)
        return () => clearTimeout(timeout)
    }, [])

    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <HeadContent />
            </head>

            <body className="min-h-screen flex flex-col">
                {/* Loading overlay - completely hides page until ready */}
                <div id="app-loader" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 2147483647,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#09090b',
                }}>
                    {/* Layout Grid Icon */}
                    <svg className="loader-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                    <div className="loader-spinner" />
                    <div className="loader-text">App Map</div>
                    <div className="loader-subtext">Homelab Dashboard</div>
                </div>
                {/* Set loader height dynamically for mobile browsers */}
                <script dangerouslySetInnerHTML={{ __html: `
                    (function() {
                        var loader = document.getElementById('app-loader');
                        if (loader) {
                            loader.style.height = window.innerHeight + 'px';
                            loader.style.minHeight = window.innerHeight + 'px';
                        }
                    })();
                `}} />

                <Providers>
                    <Header />

                    <Outlet />
                </Providers>

                <Scripts />
            </body>
        </html>
    )
}
