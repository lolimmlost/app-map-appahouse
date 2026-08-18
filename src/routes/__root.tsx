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
                        background: linear-gradient(135deg, #09090b 0%, #0c0c14 50%, #09090b 100%);
                        overflow: hidden;
                        transition: opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                    }
                    /* Background grid pattern */
                    #app-loader::before {
                        content: '';
                        position: absolute;
                        inset: 0;
                        background-image:
                            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
                        background-size: 50px 50px;
                        animation: loader-grid-move 20s linear infinite;
                    }
                    @keyframes loader-grid-move {
                        0% { transform: translate(0, 0); }
                        100% { transform: translate(50px, 50px); }
                    }
                    /* Ambient glow */
                    #app-loader::after {
                        content: '';
                        position: absolute;
                        width: 600px;
                        height: 600px;
                        background: radial-gradient(circle, rgba(255, 217, 61, 0.10) 0%, rgba(255, 107, 107, 0.07) 30%, transparent 70%);
                        border-radius: 50%;
                        animation: loader-glow-pulse 4s ease-in-out infinite;
                    }
                    @keyframes loader-glow-pulse {
                        0%, 100% { transform: scale(1); opacity: 0.6; }
                        50% { transform: scale(1.15); opacity: 1; }
                    }
                    /* Fallback: auto-hide loader after 5 seconds in case React fails to mount */
                    @keyframes app-loader-fallback-hide {
                        to { opacity: 0; visibility: hidden; pointer-events: none; }
                    }
                    #app-loader {
                        animation: app-loader-fallback-hide 0.5s cubic-bezier(0.4, 0, 0.2, 1) 5s forwards;
                    }
                    #app-loader.hidden {
                        animation: none;
                        opacity: 0;
                        visibility: hidden;
                        pointer-events: none;
                    }
                    /* Logo container */
                    #app-loader .loader-logo-container {
                        position: relative;
                        z-index: 1;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        animation: loader-content-fade-in 0.8s ease-out;
                    }
                    @keyframes loader-content-fade-in {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    /* Grid icon with animated tiles */
                    #app-loader .loader-grid-icon {
                        width: 88px;
                        height: 88px;
                        display: grid;
                        grid-template-columns: 38px 38px;
                        grid-template-rows: 38px 38px;
                        gap: 8px;
                        margin-bottom: 32px;
                    }
                    #app-loader .loader-tile {
                        width: 38px;
                        height: 38px;
                        min-width: 38px;
                        min-height: 38px;
                        border-radius: 10px;
                        background: linear-gradient(135deg, #FFD93D 0%, #FF6B6B 100%);
                        box-shadow: 0 0 20px rgba(255, 107, 107, 0.35), inset 0 1px 0 rgba(255,255,255,0.1);
                        animation: loader-tile-pulse 2s ease-in-out infinite;
                    }
                    #app-loader .loader-tile:nth-child(1) { animation-delay: 0s; }
                    #app-loader .loader-tile:nth-child(2) { animation-delay: 0.15s; }
                    #app-loader .loader-tile:nth-child(3) { animation-delay: 0.3s; }
                    #app-loader .loader-tile:nth-child(4) { animation-delay: 0.45s; }
                    @keyframes loader-tile-pulse {
                        0%, 100% { transform: scale(1); opacity: 0.7; }
                        50% { transform: scale(0.92); opacity: 1; }
                    }
                    /* Progress bar */
                    #app-loader .loader-progress-container {
                        width: 180px;
                        height: 6px;
                        background: rgba(255, 255, 255, 0.15);
                        border-radius: 6px;
                        overflow: hidden;
                        margin-bottom: 28px;
                    }
                    #app-loader .loader-progress-bar {
                        height: 100%;
                        width: 100%;
                        background: linear-gradient(90deg, #FFD93D, #FF6B6B);
                        border-radius: 6px;
                        transform-origin: left center;
                        animation: loader-progress-fill 500ms ease-out forwards;
                    }
                    @keyframes loader-progress-fill {
                        from { transform: scaleX(0); }
                        to { transform: scaleX(1); }
                    }
                    /* App name with gradient */
                    #app-loader .loader-text {
                        font-size: 28px;
                        font-weight: 700;
                        background: linear-gradient(135deg, #fafafa 0%, #a1a1aa 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                        letter-spacing: 0.02em;
                        margin-bottom: 8px;
                    }
                    #app-loader .loader-subtext {
                        font-size: 14px;
                        color: #71717a;
                        letter-spacing: 0.1em;
                        text-transform: uppercase;
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
                    background: 'linear-gradient(135deg, #09090b 0%, #0c0c14 50%, #09090b 100%)',
                }}>
                    <div className="loader-logo-container" style={{
                        position: 'relative',
                        zIndex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}>
                        {/* Animated grid tiles */}
                        <div className="loader-grid-icon" style={{
                            width: '88px',
                            height: '88px',
                            display: 'grid',
                            gridTemplateColumns: '38px 38px',
                            gridTemplateRows: '38px 38px',
                            gap: '8px',
                            marginBottom: '32px',
                        }}>
                            <div className="loader-tile" style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #FFD93D 0%, #FF6B6B 100%)' }}></div>
                            <div className="loader-tile" style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #FFD93D 0%, #FF6B6B 100%)' }}></div>
                            <div className="loader-tile" style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #FFD93D 0%, #FF6B6B 100%)' }}></div>
                            <div className="loader-tile" style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #FFD93D 0%, #FF6B6B 100%)' }}></div>
                        </div>
                        {/* Progress bar */}
                        <div style={{
                            width: '180px',
                            height: '6px',
                            background: 'rgba(255, 255, 255, 0.15)',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            marginBottom: '28px',
                        }}>
                            <div id="loader-progress" style={{
                                height: '6px',
                                width: '100%',
                                background: 'linear-gradient(90deg, #FFD93D, #FF6B6B)',
                                borderRadius: '6px',
                                transformOrigin: 'left center',
                                transform: 'scaleX(0)',
                                transition: 'transform 500ms ease-out',
                            }}></div>
                        </div>
                        <div className="loader-text" style={{
                            fontSize: '28px',
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #fafafa 0%, #a1a1aa 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            letterSpacing: '0.02em',
                            marginBottom: '8px',
                        }}>App Map</div>
                        <div className="loader-subtext" style={{
                            fontSize: '14px',
                            color: '#71717a',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                        }}>Homelab Dashboard</div>
                        {/* Shared "by AppaHouse" mark — brand moment on the splash. */}
                        <div style={{
                            marginTop: '22px',
                            textAlign: 'center',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            lineHeight: 1,
                        }}>
                            <span style={{ display: 'block', fontSize: '9px', letterSpacing: '0.2em', color: '#71717a', opacity: 0.6 }}>by</span>
                            <span style={{
                                fontSize: '13px',
                                letterSpacing: '0.1em',
                                color: '#e0a500',
                                textShadow: '0 0 8px rgba(255,217,61,0.6), 0 0 22px rgba(255,107,107,0.4)',
                            }}>AppaHouse</span>
                        </div>
                    </div>
                </div>
                {/* Set loader height and trigger progress bar animation */}
                <script dangerouslySetInnerHTML={{ __html: `
                    (function() {
                        var loader = document.getElementById('app-loader');
                        if (loader) {
                            loader.style.height = window.innerHeight + 'px';
                            loader.style.minHeight = window.innerHeight + 'px';
                        }
                        // Trigger progress bar animation after a brief delay
                        var progress = document.getElementById('loader-progress');
                        if (progress) {
                            // Force a reflow to ensure the initial state is rendered
                            progress.offsetHeight;
                            // Use requestAnimationFrame for reliable animation start
                            requestAnimationFrame(function() {
                                requestAnimationFrame(function() {
                                    progress.style.transform = 'scaleX(1)';
                                });
                            });
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
