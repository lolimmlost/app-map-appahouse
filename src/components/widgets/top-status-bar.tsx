import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Clock,
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  MapPin,
  Droplets,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Widget, WidgetConfig } from "@/types/database";

type WidgetWithConfig = Widget & { config: WidgetConfig };

interface TopStatusBarProps {
  clockWidget?: WidgetWithConfig | null;
  weatherWidget?: WidgetWithConfig | null;
  className?: string;
}

// Weather code mapping
const WMO_CODES: Record<number, { description: string; icon: typeof Sun }> = {
  0: { description: "Clear", icon: Sun },
  1: { description: "Clear", icon: Sun },
  2: { description: "Partly cloudy", icon: Cloud },
  3: { description: "Overcast", icon: Cloud },
  45: { description: "Fog", icon: Cloud },
  48: { description: "Fog", icon: Cloud },
  51: { description: "Drizzle", icon: CloudRain },
  53: { description: "Drizzle", icon: CloudRain },
  55: { description: "Drizzle", icon: CloudRain },
  61: { description: "Rain", icon: CloudRain },
  63: { description: "Rain", icon: CloudRain },
  65: { description: "Heavy rain", icon: CloudRain },
  71: { description: "Snow", icon: CloudSnow },
  73: { description: "Snow", icon: CloudSnow },
  75: { description: "Heavy snow", icon: CloudSnow },
  95: { description: "Thunderstorm", icon: CloudLightning },
  96: { description: "Thunderstorm", icon: CloudLightning },
  99: { description: "Thunderstorm", icon: CloudLightning },
};

type WeatherData = {
  temperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  locationName: string;
};

async function fetchWeather(location: string, units: "metric" | "imperial"): Promise<WeatherData | null> {
  try {
    // Geocode
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
    );
    const geoData = await geoRes.json();
    if (!geoData.results?.length) return null;
    const geo = geoData.results[0];

    // Weather
    const tempUnit = units === "imperial" ? "fahrenheit" : "celsius";
    const windUnit = units === "imperial" ? "mph" : "kmh";
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}`
    );
    const weatherData = await weatherRes.json();

    if (weatherData.current) {
      return {
        temperature: Math.round(weatherData.current.temperature_2m),
        humidity: weatherData.current.relative_humidity_2m,
        windSpeed: Math.round(weatherData.current.wind_speed_10m),
        weatherCode: weatherData.current.weather_code,
        locationName: geo.admin1 ? `${geo.name}, ${geo.admin1}` : geo.name,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function InlineClock({ widget }: { widget: WidgetWithConfig }) {
  const [time, setTime] = useState(new Date());
  const config = widget.config || {};
  const showSeconds = config.showSeconds ?? false;
  const format24h = config.format24h ?? false;
  const timezone = config.timezone || "";

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      second: showSeconds ? "2-digit" : undefined,
      hour12: !format24h,
      timeZone: timezone || undefined,
    };
    return date.toLocaleTimeString(undefined, options);
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: timezone || undefined,
    };
    return date.toLocaleDateString(undefined, options);
  };

  return (
    <div className="flex items-center gap-3">
      <Clock className="h-4 w-4 text-muted-foreground" />
      <div className="flex flex-col">
        <span className="text-lg font-semibold tabular-nums leading-tight">
          {formatTime(time)}
        </span>
        <span className="text-xs text-muted-foreground leading-tight">
          {formatDate(time)}
        </span>
      </div>
    </div>
  );
}

function InlineWeather({ widget }: { widget: WidgetWithConfig }) {
  const config = widget.config || {};
  const location = config.location || "New York";
  const units = config.units || "metric";

  const { data: weather, isLoading } = useQuery({
    queryKey: ["weather-inline", widget.id, location, units],
    queryFn: () => fetchWeather(location, units),
    refetchInterval: 30 * 60 * 1000,
    staleTime: 10 * 60 * 1000,
    retry: 2,
  });

  if (isLoading && !weather) {
    return (
      <div className="flex items-center gap-2">
        <Cloud className="h-4 w-4 text-muted-foreground animate-pulse" />
        <div className="h-4 w-16 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  const weatherInfo = WMO_CODES[weather.weatherCode] || WMO_CODES[0];
  const WeatherIcon = weatherInfo.icon;
  const tempUnit = units === "imperial" ? "F" : "C";

  return (
    <div className="flex items-center gap-3">
      <WeatherIcon className="h-5 w-5 text-primary" />
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold leading-tight">
            {weather.temperature}°{tempUnit}
          </span>
          <span className="text-xs text-muted-foreground">
            {weatherInfo.description}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground leading-tight">
          <span className="flex items-center gap-0.5">
            <MapPin className="h-3 w-3" />
            {weather.locationName}
          </span>
          <span className="flex items-center gap-0.5">
            <Droplets className="h-3 w-3" />
            {weather.humidity}%
          </span>
        </div>
      </div>
    </div>
  );
}

export function TopStatusBar({ clockWidget, weatherWidget, className }: TopStatusBarProps) {
  // Don't render if no widgets
  if (!clockWidget && !weatherWidget) {
    return null;
  }

  return (
    <div
      className={cn(
        "inline-flex flex-wrap items-center gap-6 px-3 py-2 rounded-lg bg-card border",
        className
      )}
    >
      {clockWidget && <InlineClock widget={clockWidget} />}
      {weatherWidget && <InlineWeather widget={weatherWidget} />}
    </div>
  );
}
