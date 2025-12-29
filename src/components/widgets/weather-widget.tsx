import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind, Droplets, Settings, MapPin } from "lucide-react";
import { WidgetContainer } from "./widget-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateWidget } from "@/lib/server/widgets.server";
import type { Widget, WidgetConfig } from "@/types/database";

interface WeatherWidgetProps {
  widget: Widget & { config: WidgetConfig };
  onEdit?: (widget: Widget) => void;
  onDelete?: (widget: Widget) => void;
  onResize?: (widget: Widget, size: "small" | "medium" | "large" | "full") => void;
}

type WeatherData = {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  isDay: boolean;
  locationName: string;
};

type GeocodingResult = {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
};

const WMO_CODES: Record<number, { description: string; icon: typeof Sun }> = {
  0: { description: "Clear sky", icon: Sun },
  1: { description: "Mainly clear", icon: Sun },
  2: { description: "Partly cloudy", icon: Cloud },
  3: { description: "Overcast", icon: Cloud },
  45: { description: "Fog", icon: Cloud },
  48: { description: "Depositing rime fog", icon: Cloud },
  51: { description: "Light drizzle", icon: CloudRain },
  53: { description: "Moderate drizzle", icon: CloudRain },
  55: { description: "Dense drizzle", icon: CloudRain },
  56: { description: "Freezing drizzle", icon: CloudSnow },
  57: { description: "Dense freezing drizzle", icon: CloudSnow },
  61: { description: "Slight rain", icon: CloudRain },
  63: { description: "Moderate rain", icon: CloudRain },
  65: { description: "Heavy rain", icon: CloudRain },
  66: { description: "Freezing rain", icon: CloudSnow },
  67: { description: "Heavy freezing rain", icon: CloudSnow },
  71: { description: "Slight snow", icon: CloudSnow },
  73: { description: "Moderate snow", icon: CloudSnow },
  75: { description: "Heavy snow", icon: CloudSnow },
  77: { description: "Snow grains", icon: CloudSnow },
  80: { description: "Slight rain showers", icon: CloudRain },
  81: { description: "Moderate rain showers", icon: CloudRain },
  82: { description: "Violent rain showers", icon: CloudRain },
  85: { description: "Slight snow showers", icon: CloudSnow },
  86: { description: "Heavy snow showers", icon: CloudSnow },
  95: { description: "Thunderstorm", icon: CloudLightning },
  96: { description: "Thunderstorm with hail", icon: CloudLightning },
  99: { description: "Thunderstorm with heavy hail", icon: CloudLightning },
};

async function geocodeLocation(query: string): Promise<GeocodingResult | null> {
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
  );
  const data = await response.json();
  if (data.results && data.results.length > 0) {
    return data.results[0];
  }
  return null;
}

async function fetchWeather(location: string, units: "metric" | "imperial"): Promise<WeatherData | null> {
  // First geocode the location
  const geo = await geocodeLocation(location);
  if (!geo) return null;

  const tempUnit = units === "imperial" ? "fahrenheit" : "celsius";
  const windUnit = units === "imperial" ? "mph" : "kmh";

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}`
  );
  const data = await response.json();

  if (data.current) {
    return {
      temperature: Math.round(data.current.temperature_2m),
      apparentTemperature: Math.round(data.current.apparent_temperature),
      humidity: data.current.relative_humidity_2m,
      windSpeed: Math.round(data.current.wind_speed_10m),
      weatherCode: data.current.weather_code,
      isDay: data.current.is_day === 1,
      locationName: geo.admin1 ? `${geo.name}, ${geo.admin1}` : `${geo.name}, ${geo.country}`,
    };
  }
  return null;
}

export function WeatherWidget({ widget, onEdit, onDelete, onResize }: WeatherWidgetProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const queryClient = useQueryClient();

  const config = widget.config || {};
  const title = config.title || "Weather";
  const location = config.location || "New York";
  const units = config.units || "metric";

  // Settings form state
  const [formTitle, setFormTitle] = useState(title);
  const [formLocation, setFormLocation] = useState(location);
  const [formUnits, setFormUnits] = useState(units === "imperial");

  // Reset form when opening settings
  useEffect(() => {
    if (settingsOpen) {
      setFormTitle(title);
      setFormLocation(location);
      setFormUnits(units === "imperial");
    }
  }, [settingsOpen, title, location, units]);

  const { data: weather, isLoading, error, refetch } = useQuery({
    queryKey: ["weather", widget.id, location, units],
    queryFn: () => fetchWeather(location, units),
    refetchInterval: (config.refreshInterval || 30) * 60 * 1000, // Default 30 minutes
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });

  const updateMutation = useMutation({
    mutationFn: (newConfig: WidgetConfig) =>
      updateWidget({
        data: {
          id: widget.id,
          config: newConfig,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["widgets"] });
      queryClient.invalidateQueries({ queryKey: ["weather", widget.id] });
      setSettingsOpen(false);
    },
  });

  const handleSaveSettings = () => {
    updateMutation.mutate({
      ...config,
      title: formTitle,
      location: formLocation,
      units: formUnits ? "imperial" : "metric",
    });
  };

  const weatherInfo = weather ? WMO_CODES[weather.weatherCode] || WMO_CODES[0] : WMO_CODES[0];
  const WeatherIcon = weatherInfo.icon;
  const tempUnit = units === "imperial" ? "F" : "C";
  const windUnit = units === "imperial" ? "mph" : "km/h";

  return (
    <>
      <WidgetContainer
        widget={widget}
        title={title}
        icon={<Cloud className="h-4 w-4" />}
        isLoading={isLoading}
        onRefresh={() => refetch()}
        onEdit={onEdit}
        onDelete={onDelete}
        onResize={onResize}
        headerActions={
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="h-3 w-3" />
          </Button>
        }
      >
        {error ? (
          <div className="text-sm text-destructive text-center py-4">
            Failed to load weather data
          </div>
        ) : isLoading && !weather ? (
          <div className="space-y-2 py-4">
            <div className="h-12 bg-muted animate-pulse rounded mx-auto w-24" />
            <div className="h-4 bg-muted animate-pulse rounded mx-auto w-32" />
          </div>
        ) : weather ? (
          <div className="flex flex-col items-center py-2">
            {/* Main temperature display */}
            <div className="flex items-center gap-3">
              <WeatherIcon className="h-12 w-12 text-primary" />
              <div className="text-4xl font-bold">
                {weather.temperature}°{tempUnit}
              </div>
            </div>

            {/* Weather description */}
            <div className="text-sm text-muted-foreground mt-1">
              {weatherInfo.description}
            </div>

            {/* Location */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
              <MapPin className="h-3 w-3" />
              {weather.locationName}
            </div>

            {/* Details */}
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1" title="Feels like">
                <span>Feels {weather.apparentTemperature}°</span>
              </div>
              <div className="flex items-center gap-1" title="Humidity">
                <Droplets className="h-3 w-3" />
                <span>{weather.humidity}%</span>
              </div>
              <div className="flex items-center gap-1" title="Wind speed">
                <Wind className="h-3 w-3" />
                <span>{weather.windSpeed} {windUnit}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center py-4">
            No weather data available
          </div>
        )}
      </WidgetContainer>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Weather Settings</DialogTitle>
            <DialogDescription>
              Configure the weather widget display
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="weather-title">Title</Label>
              <Input
                id="weather-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Weather"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weather-location">Location</Label>
              <Input
                id="weather-location"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                placeholder="City name (e.g., New York, London)"
              />
              <p className="text-xs text-muted-foreground">
                Enter a city name. The widget will auto-detect coordinates.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="weather-units">Use Imperial Units</Label>
                <p className="text-sm text-muted-foreground">
                  Show temperature in Fahrenheit
                </p>
              </div>
              <Switch
                id="weather-units"
                checked={formUnits}
                onCheckedChange={setFormUnits}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSettingsOpen(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
