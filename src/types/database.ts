/**
 * Database types for client-side use
 * These are manually defined to avoid importing drizzle-orm/pg-core on the client
 */

// App types
export interface App {
    id: string
    name: string
    description: string | null
    icon: string | null
    localUrl: string | null
    remoteUrl: string | null
    categoryId: string | null
    userId: string
    sortOrder: number | null
    pinned: boolean | null
    healthCheckEnabled: boolean | null
    healthCheckType: "http" | "tcp" | "uptime_kuma" | null
    healthCheckUrl: string | null
    healthCheckTTL: number | null
    uptimeKumaMonitorId: string | null
    dockerContainerId: string | null
    truenasAppId: string | null
    discoverySource: string | null
    notes: string | null
    createdAt: Date
    updatedAt: Date
    category?: Category | null
    tags?: { tag: Tag }[]
}

export interface NewApp {
    id?: string
    name: string
    description?: string | null
    icon?: string | null
    localUrl?: string | null
    remoteUrl?: string | null
    categoryId?: string | null
    userId: string
    sortOrder?: number | null
    pinned?: boolean | null
    healthCheckEnabled?: boolean | null
    healthCheckType?: "http" | "tcp" | "uptime_kuma" | null
    healthCheckUrl?: string | null
    healthCheckTTL?: number | null
    uptimeKumaMonitorId?: string | null
    dockerContainerId?: string | null
    truenasAppId?: string | null
    discoverySource?: string | null
    notes?: string | null
}

// Tag types
export interface Tag {
    id: string
    name: string
    color: string | null
    userId: string
    createdAt: Date
}

export interface NewTag {
    id?: string
    name: string
    color?: string | null
    userId: string
}

// Category types
export interface Category {
    id: string
    name: string
    icon: string | null
    color: string | null
    sortOrder: number | null
    userId: string
    createdAt: Date
}

export interface NewCategory {
    id?: string
    name: string
    icon?: string | null
    color?: string | null
    sortOrder?: number | null
    userId: string
}

// Integration types
export type IntegrationType = "uptime_kuma" | "docker" | "truenas" | "portainer" | "sonarr" | "radarr" | "lidarr" | "jellyfin" | "glances"

export interface Integration {
    id: string
    name: string
    type: IntegrationType
    url: string
    apiKey: string | null
    username: string | null
    password: string | null
    isDefault: boolean | null
    userId: string
    createdAt: Date
    updatedAt: Date
}

export interface NewIntegration {
    id?: string
    name: string
    type: IntegrationType
    url: string
    apiKey?: string | null
    username?: string | null
    password?: string | null
    isDefault?: boolean | null
    userId: string
}

// User settings types
export type DefaultUrlType = "local" | "remote"

export interface UserSettings {
    id: string
    userId: string
    defaultUrlType: DefaultUrlType | null
    showHealthStatus: boolean | null
    enableNotifications: boolean | null
    healthCheckInterval: number | null
    theme: string | null
    widgetLayout: unknown | null
    createdAt: Date
    updatedAt: Date
}

// Alert types
export type AlertSeverity = "info" | "warning" | "critical"
export type AlertStatus = "pending" | "triggered" | "acknowledged" | "resolved"

export interface AlertConditions {
    type: "status_change" | "response_time" | "downtime_duration"
    operator?: "gt" | "lt" | "eq" | "gte" | "lte"
    value?: number
    fromStatus?: string
    toStatus?: string
}

export interface AlertChannels {
    inApp?: boolean
    email?: boolean
    webhook?: {
        url: string
        headers?: Record<string, string>
    }
    integration?: {
        id: string
        type: string
    }
}

export interface AlertRule {
    id: string
    name: string
    appId: string | null
    userId: string
    enabled: boolean | null
    severity: AlertSeverity | null
    conditions: AlertConditions
    channels: AlertChannels
    cooldownMinutes: number | null
    createdAt: Date
    updatedAt: Date
    app?: App | null
}

export interface AlertHistory {
    id: string
    alertRuleId: string
    appId: string | null
    userId: string
    status: AlertStatus | null
    severity: AlertSeverity | null
    message: string | null
    metadata: unknown | null
    triggeredAt: Date
    acknowledgedAt: Date | null
    resolvedAt: Date | null
}

export interface InAppNotification {
    id: string
    alertHistoryId: string | null
    userId: string
    title: string
    message: string | null
    read: boolean | null
    createdAt: Date
}

// Widget types
export type WidgetType = "clock" | "weather" | "notes" | "bookmarks" | "iframe" | "uptime_kuma" | "docker" | "system_stats" | "sonarr" | "radarr" | "lidarr" | "jellyfin" | "truenas"

export interface WidgetPosition {
    x: number
    y: number
    w: number
    h: number
}

export interface WidgetConfig {
    title?: string
    refreshInterval?: number
    [key: string]: unknown
}

export interface Widget {
    id: string
    type: WidgetType
    title: string | null
    position: WidgetPosition
    config: WidgetConfig | null
    integrationId: string | null
    userId: string
    sortOrder: number | null
    createdAt: Date
    updatedAt: Date
    integration?: Integration | null
}

export interface NewWidget {
    id?: string
    type: WidgetType
    title?: string | null
    position: WidgetPosition
    config?: WidgetConfig | null
    integrationId?: string | null
    userId: string
    sortOrder?: number | null
}

// Saved views types
export interface SearchViewFilters {
    search?: string
    categoryId?: string
    tags?: string[]
    healthStatus?: string
    pinned?: boolean
}

export interface SavedView {
    id: string
    name: string
    filters: SearchViewFilters
    isDefault: boolean | null
    userId: string
    createdAt: Date
}

// Sharing types
export type SharingPermission = "view" | "interact" | "edit" | "admin"

export interface GranularPermissions {
    canViewHealth?: boolean
    canViewNotes?: boolean
    canEditNotes?: boolean
    canLaunch?: boolean
    canReorder?: boolean
}

export interface AppShare {
    id: string
    appId: string | null
    categoryId: string | null
    ownerId: string
    sharedWithId: string
    permission: SharingPermission | null
    granularPermissions: GranularPermissions | null
    createdAt: Date
    updatedAt: Date
}
