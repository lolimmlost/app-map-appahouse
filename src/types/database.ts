/**
 * Database types for client-side use
 * These are manually defined to avoid importing drizzle-orm/pg-core on the client
 * Keep in sync with src/database/schema/*.ts
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
export type IntegrationType = "uptime_kuma" | "docker" | "truenas" | "portainer" | "sonarr" | "radarr" | "lidarr" | "jellyfin" | "glances" | "proxmox"

export interface Integration {
    id: string
    name: string
    type: IntegrationType
    url: string
    apiKey: string | null
    username: string | null
    password: string | null
    enabled: boolean | null
    allowInsecure: boolean | null
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
    enabled?: boolean | null
    allowInsecure?: boolean | null
    userId: string
}

// User settings types
export type DefaultUrlType = "local" | "remote"

export interface UserSettings {
    userId: string
    theme: string | null
    customTheme: unknown | null
    defaultView: "grid" | "list" | "compact" | null
    gridColumns: number | null
    showHealthDots: boolean | null
    healthBarStyle: "dot" | "border" | "none" | null
    sidebarCollapsed: boolean | null
}

// Alert types
export type AlertTriggerType = "status_change" | "consecutive_failures" | "response_time" | "integration_status"
export type AlertSeverity = "info" | "warning" | "critical"
export type AlertStatus = "active" | "resolved" | "acknowledged" | "silenced"

export interface AlertConditions {
    fromStatus?: "online" | "offline" | "unknown"
    toStatus?: "online" | "offline" | "unknown"
    failureThreshold?: number
    responseTimeThreshold?: number
    integrationTypes?: string[]
}

export interface AlertChannels {
    email?: boolean
    webhook?: boolean
    inApp?: boolean
}

export interface NotificationsSent {
    email?: { sent: boolean; sentAt?: string; error?: string }
    webhook?: { sent: boolean; sentAt?: string; error?: string; statusCode?: number }
    inApp?: { sent: boolean; sentAt?: string }
}

export interface AlertDetails {
    previousStatus?: string
    currentStatus?: string
    consecutiveFailures?: number
    responseTime?: number
    error?: string
}

export interface AlertRule {
    id: string
    name: string
    description: string | null
    enabled: boolean | null
    triggerType: AlertTriggerType
    appId: string | null
    integrationId: string | null
    userId: string
    conditions: AlertConditions | null
    severity: AlertSeverity | null
    channels: AlertChannels | null
    cooldownMinutes: number | null
    lastTriggeredAt: Date | null
    createdAt: Date
    updatedAt: Date
    app?: App | null
    integration?: Integration | null
}

export interface AlertHistory {
    id: string
    alertRuleId: string | null
    appId: string | null
    userId: string
    alertName: string
    triggerType: AlertTriggerType
    severity: AlertSeverity
    appName: string | null
    integrationId: string | null
    integrationName: string | null
    status: AlertStatus | null
    message: string
    details: AlertDetails | null
    resolvedAt: Date | null
    resolvedBy: string | null
    acknowledgedAt: Date | null
    notificationsSent: NotificationsSent | null
    triggeredAt: Date
    createdAt: Date
    updatedAt: Date
}

export interface InAppNotification {
    id: string
    alertHistoryId: string | null
    userId: string
    title: string
    message: string
    severity: AlertSeverity | null
    linkType: string | null
    linkId: string | null
    read: boolean | null
    readAt: Date | null
    dismissed: boolean | null
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
    size?: "small" | "medium" | "large" | "full"
    // Clock
    timezone?: string
    showSeconds?: boolean
    format24h?: boolean
    dateFormat?: "full" | "long" | "medium" | "short" | "none"
    // Weather
    location?: string
    units?: "metric" | "imperial"
    // Uptime Kuma
    statusPageSlug?: string
    showOnlyDown?: boolean
    showHeartbeatGraph?: boolean
    showIncidents?: boolean
    showResponseTime?: boolean
    displayMode?: "auto" | "detailed" | "compact"
    // *arr widgets
    showQueue?: boolean
    showCalendar?: boolean
    showDiskSpace?: boolean
    showHealth?: boolean
    defaultExpanded?: boolean
    maxItems?: number
    // Jellyfin
    showNowPlaying?: boolean
    showRecentlyAdded?: boolean
    showLibraryStats?: boolean
    showServerInfo?: boolean
    // Docker
    showContainers?: string[]
    showAllContainers?: boolean
    showHostInfo?: boolean
    // Iframe
    url?: string
    // Bookmarks
    bookmarks?: Array<{ name: string; url: string; icon?: string }>
    // Notes
    content?: string
    // System Stats
    showCpu?: boolean
    showRam?: boolean
    showDisk?: boolean
    showNetwork?: boolean
    showTemperatures?: boolean
    showProcesses?: boolean
    diskPaths?: string[]
    // TrueNAS
    showPools?: boolean
    showDisks?: boolean
    showApps?: boolean
    showNetworkInterfaces?: boolean
    [key: string]: unknown
}

export interface Widget {
    id: string
    type: WidgetType
    position: WidgetPosition
    config: WidgetConfig
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
    position?: WidgetPosition
    config?: WidgetConfig | null
    integrationId?: string | null
    userId: string
    sortOrder?: number | null
}

// Saved views types
export interface SearchViewFilters {
    searchQuery?: string
    categoryIds?: string[]
    tagIds?: string[]
    healthStatus?: "all" | "enabled" | "disabled"
    pinnedOnly?: boolean
    discoverySource?: string | null
}

export interface SavedView {
    id: string
    name: string
    description: string | null
    filters: SearchViewFilters
    isDefault: boolean | null
    userId: string
    createdAt: Date
    updatedAt: Date
}

// Sharing types
export type SharingPermission = "view" | "view_health" | "view_urls" | "edit" | "full"

export interface GranularPermissions {
    canView: boolean
    canEdit: boolean
    canSeeHealth: boolean
    canAccessRemoteUrl: boolean
    canAccessLocalUrl: boolean
    canDelete: boolean
}

export interface AppShare {
    id: string
    shareType: "app" | "category"
    appId: string | null
    categoryId: string | null
    ownerId: string
    sharedWithId: string
    permission: SharingPermission
    canView: boolean
    canEdit: boolean
    canSeeHealth: boolean
    canAccessRemoteUrl: boolean
    canAccessLocalUrl: boolean
    canDelete: boolean
    createdAt: Date
    updatedAt: Date
}
