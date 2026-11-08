import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { House, Settings } from "lucide-react"
import { useMemo, useState } from "react"
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    getHomeAssistantHistory,
    getHomeAssistantSensors,
    type HomeAssistantSensor
} from "@/lib/server/widget-proxy.server"
import { updateWidget } from "@/lib/server/widgets.server"
import { cn } from "@/lib/utils"
import type { Widget, WidgetConfig } from "@/types/database"
import { WidgetContainer } from "./widget-container"

interface HomeAssistantWidgetProps {
    widget: Widget & { config: WidgetConfig }
    onEdit?: (widget: Widget) => void
    onDelete?: (widget: Widget) => void
    onResize?: (
        widget: Widget,
        size: "small" | "medium" | "large" | "full"
    ) => void
}

/** Sensor device classes charted when no sensors are picked explicitly */
const TREND_DEVICE_CLASSES = ["temperature", "humidity", "power"]

const RANGES = [
    { hours: 6, label: "6h" },
    { hours: 24, label: "24h" },
    { hours: 48, label: "48h" },
    { hours: 168, label: "7d" }
]

const GROUP_LABELS: Record<string, string> = {
    temperature: "Temperature",
    humidity: "Humidity",
    power: "Power"
}

const LINE_COLORS = [
    "hsl(221, 83%, 53%)",
    "hsl(142, 76%, 36%)",
    "hsl(38, 92%, 50%)",
    "hsl(280, 65%, 60%)",
    "hsl(0, 72%, 51%)",
    "hsl(190, 80%, 42%)"
]

function groupKey(sensor: HomeAssistantSensor) {
    return sensor.deviceClass ?? sensor.unit ?? "other"
}

function formatTick(ms: number, hours: number) {
    const d = new Date(ms)
    return hours > 48
        ? d.toLocaleDateString([], { weekday: "short" })
        : d.toLocaleTimeString([], { hour: "numeric" })
}

export function HomeAssistantWidget({
    widget,
    onEdit,
    onDelete,
    onResize
}: HomeAssistantWidgetProps) {
    const config = widget.config || {}
    const title = config.title || "Home Assistant"
    const hours = config.haHours ?? 24
    const integrationId = widget.integrationId
    const queryClient = useQueryClient()
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [draftEntities, setDraftEntities] = useState<string[]>([])

    const { data: sensors = [], isLoading: sensorsLoading } = useQuery({
        queryKey: ["ha-sensors", integrationId],
        queryFn: () =>
            getHomeAssistantSensors({
                data: { integrationId: integrationId! }
            }),
        enabled: !!integrationId,
        refetchInterval: 60_000
    })

    // No explicit selection = chart every temperature, humidity and power sensor
    const entityIds = useMemo(() => {
        if (config.haEntities?.length) return config.haEntities
        return sensors
            .filter(
                (s) =>
                    s.deviceClass !== null &&
                    TREND_DEVICE_CLASSES.includes(s.deviceClass)
            )
            .map((s) => s.entityId)
    }, [config.haEntities, sensors])

    const {
        data: history,
        isLoading: historyLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ["ha-history", integrationId, entityIds, hours],
        queryFn: () =>
            getHomeAssistantHistory({
                data: { integrationId: integrationId!, entityIds, hours }
            }),
        enabled: !!integrationId && entityIds.length > 0,
        refetchInterval: (config.refreshInterval || 60) * 1000
    })

    const updateMutation = useMutation({
        mutationFn: (newConfig: WidgetConfig) =>
            updateWidget({ data: { id: widget.id, config: newConfig } }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["widgets"] })
            setSettingsOpen(false)
        }
    })

    const sensorById = useMemo(
        () => new Map(sensors.map((s) => [s.entityId, s])),
        [sensors]
    )

    // One chart per device class (or unit) so °F, % and W never share an axis
    const groups = useMemo(() => {
        if (!history) return []
        const map = new Map<
            string,
            { key: string; unit: string | null; entityIds: string[] }
        >()
        for (const { entityId } of history.series) {
            const sensor = sensorById.get(entityId)
            if (!sensor) continue
            const key = groupKey(sensor)
            if (!map.has(key))
                map.set(key, { key, unit: sensor.unit, entityIds: [] })
            map.get(key)!.entityIds.push(entityId)
        }
        return [...map.values()].map((group) => ({
            ...group,
            rows: history.times.map((t, i) => {
                const row: Record<string, number | null> = { t }
                for (const s of history.series) {
                    if (group.entityIds.includes(s.entityId))
                        row[s.entityId] = s.values[i]
                }
                return row
            })
        }))
    }, [history, sensorById])

    const openSettings = () => {
        setDraftEntities(entityIds)
        setSettingsOpen(true)
    }

    const toggleDraft = (entityId: string, checked: boolean) => {
        setDraftEntities((prev) =>
            checked ? [...prev, entityId] : prev.filter((id) => id !== entityId)
        )
    }

    const pickerGroups = useMemo(() => {
        const map = new Map<string, HomeAssistantSensor[]>()
        for (const s of sensors) {
            const key = groupKey(s)
            map.set(key, [...(map.get(key) ?? []), s])
        }
        return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
    }, [sensors])

    const isLoading = sensorsLoading || historyLoading

    return (
        <>
            <WidgetContainer
                widget={widget}
                title={title}
                icon={<House className="h-4 w-4" />}
                isLoading={isLoading}
                onRefresh={() => refetch()}
                onEdit={onEdit}
                onDelete={onDelete}
                onResize={onResize}
                headerActions={
                    <div className="flex items-center gap-1">
                        {RANGES.map((range) => (
                            <Button
                                key={range.hours}
                                variant={
                                    hours === range.hours
                                        ? "secondary"
                                        : "ghost"
                                }
                                size="sm"
                                className="h-6 px-1.5 text-xs"
                                onClick={() =>
                                    updateMutation.mutate({
                                        ...config,
                                        haHours: range.hours
                                    })
                                }
                            >
                                {range.label}
                            </Button>
                        ))}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={openSettings}
                        >
                            <Settings className="h-3 w-3" />
                        </Button>
                    </div>
                }
            >
                {!integrationId ? (
                    <div className="text-sm text-muted-foreground text-center py-4">
                        No Home Assistant integration selected
                    </div>
                ) : error ? (
                    <div className="text-sm text-destructive text-center py-4">
                        Failed to load Home Assistant history
                    </div>
                ) : isLoading && !history ? (
                    <div className="h-40 bg-muted animate-pulse rounded" />
                ) : entityIds.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4">
                        No temperature, humidity or power sensors found. Pick
                        sensors in settings.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {groups.map((group) => (
                            <div key={group.key}>
                                <div className="mb-1 flex items-baseline justify-between gap-2">
                                    <span className="text-xs font-medium">
                                        {GROUP_LABELS[group.key] ?? group.key}
                                        {group.unit ? ` (${group.unit})` : ""}
                                    </span>
                                    <span className="flex flex-wrap justify-end gap-x-3 text-xs text-muted-foreground">
                                        {group.entityIds.map((id) => {
                                            const sensor = sensorById.get(id)
                                            return (
                                                <span
                                                    key={id}
                                                    className="tabular-nums"
                                                >
                                                    {sensor?.name}:{" "}
                                                    <span className="text-foreground">
                                                        {sensor?.state ?? "–"}
                                                    </span>
                                                </span>
                                            )
                                        })}
                                    </span>
                                </div>
                                <ResponsiveContainer width="100%" height={160}>
                                    <LineChart
                                        data={group.rows}
                                        margin={{
                                            top: 5,
                                            right: 8,
                                            left: -12,
                                            bottom: 0
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            className="stroke-border"
                                        />
                                        <XAxis
                                            dataKey="t"
                                            type="number"
                                            domain={["dataMin", "dataMax"]}
                                            tickFormatter={(t) =>
                                                formatTick(t, hours)
                                            }
                                            tick={{ fontSize: 10 }}
                                            minTickGap={24}
                                        />
                                        <YAxis
                                            domain={["auto", "auto"]}
                                            tick={{ fontSize: 10 }}
                                            width={44}
                                        />
                                        <Tooltip
                                            labelFormatter={(t) =>
                                                new Date(
                                                    t as number
                                                ).toLocaleString()
                                            }
                                            formatter={(value, name) => [
                                                `${value}${group.unit ? ` ${group.unit}` : ""}`,
                                                sensorById.get(name as string)
                                                    ?.name ?? name
                                            ]}
                                            contentStyle={{
                                                backgroundColor:
                                                    "hsl(var(--card))",
                                                border: "1px solid hsl(var(--border))",
                                                borderRadius: "var(--radius)",
                                                fontSize: 12
                                            }}
                                            labelStyle={{
                                                color: "hsl(var(--foreground))"
                                            }}
                                        />
                                        {group.entityIds.length > 1 && (
                                            <Legend
                                                formatter={(id) =>
                                                    sensorById.get(id as string)
                                                        ?.name ?? id
                                                }
                                                wrapperStyle={{ fontSize: 11 }}
                                            />
                                        )}
                                        {group.entityIds.map((id, i) => (
                                            <Line
                                                key={id}
                                                dataKey={id}
                                                stroke={
                                                    LINE_COLORS[
                                                        i % LINE_COLORS.length
                                                    ]
                                                }
                                                dot={false}
                                                strokeWidth={2}
                                                connectNulls
                                                isAnimationActive={false}
                                                type={
                                                    group.key === "power"
                                                        ? "stepAfter"
                                                        : "monotone"
                                                }
                                            />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        ))}
                    </div>
                )}
            </WidgetContainer>

            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogContent className="max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Home Assistant sensors</DialogTitle>
                        <DialogDescription>
                            Choose which sensors to chart. Sensors with the same
                            type share a chart.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {pickerGroups.map(([key, groupSensors]) => (
                            <div key={key} className="space-y-2">
                                <div className="text-xs font-medium uppercase text-muted-foreground">
                                    {GROUP_LABELS[key] ?? key}
                                </div>
                                {groupSensors.map((s) => (
                                    <div
                                        key={s.entityId}
                                        className="flex items-center gap-2"
                                    >
                                        <Checkbox
                                            id={`${widget.id}-${s.entityId}`}
                                            checked={draftEntities.includes(
                                                s.entityId
                                            )}
                                            onCheckedChange={(checked) =>
                                                toggleDraft(
                                                    s.entityId,
                                                    checked === true
                                                )
                                            }
                                        />
                                        <Label
                                            htmlFor={`${widget.id}-${s.entityId}`}
                                            className={cn("flex-1 font-normal")}
                                        >
                                            {s.name}
                                        </Label>
                                        <span className="text-xs text-muted-foreground tabular-nums">
                                            {s.state ?? "–"} {s.unit}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="ghost"
                            onClick={() =>
                                updateMutation.mutate({
                                    ...config,
                                    haEntities: []
                                })
                            }
                            disabled={updateMutation.isPending}
                        >
                            Reset to auto
                        </Button>
                        <Button
                            onClick={() =>
                                updateMutation.mutate({
                                    ...config,
                                    haEntities: draftEntities
                                })
                            }
                            disabled={updateMutation.isPending}
                        >
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
