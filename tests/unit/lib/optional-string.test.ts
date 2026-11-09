import { describe, expect, it } from "vitest"
import { optionalString } from "@/lib/validation/schemas/common"
import { createIntegrationSchema } from "@/lib/validation/schemas/integration"

describe("optionalString", () => {
    it("turns blank, null and missing values into null", () => {
        expect(optionalString.parse("  ")).toBeNull()
        expect(optionalString.parse(null)).toBeNull()
        expect(optionalString.parse(undefined)).toBeNull()
    })

    it("trims real values", () => {
        expect(optionalString.parse("  token ")).toBe("token")
    })
})

describe("createIntegrationSchema", () => {
    it("accepts a token-only integration with null username and password", () => {
        const result = createIntegrationSchema.safeParse({
            type: "home_assistant",
            name: "My home",
            url: "http://10.0.0.246",
            apiKey: "abc",
            username: null,
            password: null,
            enabled: true,
            allowInsecure: false
        })
        expect(result.success).toBe(true)
    })
})
