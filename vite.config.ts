// import { cloudflare } from "@cloudflare/vite-plugin"
import tailwindcss from "@tailwindcss/vite"
import { nitroV2Plugin } from "@tanstack/nitro-v2-vite-plugin"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import devtoolsJson from "vite-plugin-devtools-json"
import viteTsConfigPaths from "vite-tsconfig-paths"
import { envOnlyMacros } from "vite-env-only"

const config = defineConfig({
    plugins: [
        envOnlyMacros(),
        viteTsConfigPaths({
            projects: ["./tsconfig.json"]
        }),
        tailwindcss(),
        tanstackStart(),
        nitroV2Plugin({ preset: "node-server" }),
        viteReact(),
        devtoolsJson()
    ],
    build: {
        rollupOptions: {
            // Prevent Rollup from failing on Node.js built-in SSR imports
            // that leak into the client bundle via @tanstack/router-core
            external: (id) => id.startsWith("node:")
        }
    },
    server: {
        host: true,
        port: 4175,
        allowedHosts: ["dev5.appahouse.com", "localhost"]
    }
})

export default config
