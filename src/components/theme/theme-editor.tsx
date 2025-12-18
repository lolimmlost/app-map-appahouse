import { useState, useCallback, useEffect } from "react";
import { useTheme } from "next-themes";
import { Check, RotateCcw, Save, Sun, Moon, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useCustomTheme, type CustomThemeData } from "@/hooks/use-custom-theme";
import {
  type ThemeColors,
  COLOR_LABELS,
  COLOR_GROUPS,
} from "@/lib/theme-presets";

// Color swatch preview for a theme
function ThemePreview({ colors, className }: { colors: ThemeColors; className?: string }) {
  return (
    <div className={cn("flex gap-0.5 rounded overflow-hidden", className)}>
      <div
        className="w-4 h-6"
        style={{ backgroundColor: colors.background }}
        title="Background"
      />
      <div
        className="w-4 h-6"
        style={{ backgroundColor: colors.primary }}
        title="Primary"
      />
      <div
        className="w-4 h-6"
        style={{ backgroundColor: colors.secondary }}
        title="Secondary"
      />
      <div
        className="w-4 h-6"
        style={{ backgroundColor: colors.accent }}
        title="Accent"
      />
    </div>
  );
}

// Single color input with picker
function ColorInput({
  label,
  value,
  onChange,
  presetValue,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  presetValue: string;
}) {
  const hasOverride = value !== presetValue;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <div className="flex items-center gap-2 mt-1">
          <div
            className="w-8 h-8 rounded border border-border shrink-0 cursor-pointer relative overflow-hidden"
            style={{ backgroundColor: value }}
          >
            <input
              type="color"
              value={oklchToHex(value)}
              onChange={(e) => onChange(hexToOklch(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 text-xs font-mono"
            placeholder="oklch(0.5 0.1 180)"
          />
          {hasOverride && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => onChange(presetValue)}
              title="Reset to preset"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Convert OKLCH to approximate hex (for color picker preview)
function oklchToHex(oklch: string): string {
  // Simple approximation - extract values and convert
  const match = oklch.match(/oklch\(([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)/);
  if (!match) return "#808080";

  const l = parseFloat(match[1]);
  const c = parseFloat(match[2]);
  const h = parseFloat(match[3]);

  // Convert to approximate RGB (simplified)
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);

  // L to Y
  const y = l;

  // Approximate conversion
  let r = y + 0.4 * a;
  let g = y - 0.2 * a - 0.1 * b;
  let bl = y + 0.5 * b;

  // Clamp and convert to hex
  r = Math.max(0, Math.min(1, r));
  g = Math.max(0, Math.min(1, g));
  bl = Math.max(0, Math.min(1, bl));

  const toHex = (v: number) =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
}

// Convert hex to approximate OKLCH
function hexToOklch(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  // Approximate L (lightness)
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  // Approximate chroma and hue
  const a = r - g;
  const bVal = (r + g) / 2 - b;
  const c = Math.sqrt(a * a + bVal * bVal) * 0.5;
  let h = (Math.atan2(bVal, a) * 180) / Math.PI;
  if (h < 0) h += 360;

  return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`;
}

export function ThemeEditor() {
  const { resolvedTheme } = useTheme();
  const {
    customThemeData,
    currentPreset,
    isSaving,
    getEffectiveColors,
    setColorOverride,
    setPreset,
    saveTheme,
    resetTheme,
    presets,
  } = useCustomTheme();

  const [localData, setLocalData] = useState<CustomThemeData>(customThemeData);
  const [editMode, setEditMode] = useState<"light" | "dark">(
    resolvedTheme === "dark" ? "dark" : "light"
  );
  const [hasChanges, setHasChanges] = useState(false);

  // Sync localData when customThemeData changes from database
  useEffect(() => {
    if (!hasChanges) {
      setLocalData(customThemeData);
    }
  }, [customThemeData, hasChanges]);

  // Get colors for the current edit mode
  const currentColors = getEffectiveColors(editMode);
  const presetColors = currentPreset[editMode];

  // Handle preset selection
  const handlePresetSelect = useCallback(
    (presetId: string) => {
      const newData = setPreset(presetId, false);
      setLocalData(newData);
      setHasChanges(true);
    },
    [setPreset]
  );

  // Handle color change
  const handleColorChange = useCallback(
    (key: keyof ThemeColors, value: string) => {
      setColorOverride(key, value, editMode);
      setLocalData((prev) => ({
        ...prev,
        ...(editMode === "light"
          ? { lightOverrides: { ...prev.lightOverrides, [key]: value } }
          : { darkOverrides: { ...prev.darkOverrides, [key]: value } }),
      }));
      setHasChanges(true);
    },
    [setColorOverride, editMode]
  );

  // Save changes
  const handleSave = useCallback(() => {
    saveTheme(localData);
    setHasChanges(false);
  }, [saveTheme, localData]);

  // Reset to default
  const handleReset = useCallback(() => {
    resetTheme();
    setLocalData({
      presetId: "default",
      lightOverrides: {},
      darkOverrides: {},
    });
    setHasChanges(false);
  }, [resetTheme]);

  return (
    <div className="space-y-6">
      {/* Preset Selection */}
      <div className="space-y-3">
        <Label>Theme Preset</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {presets.map((preset) => {
            const isSelected = localData.presetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset.id)}
                className={cn(
                  "relative flex flex-col items-start gap-2 p-3 rounded-lg border text-left transition-colors",
                  isSelected
                    ? "border-primary bg-accent"
                    : "border-border hover:border-primary/50 hover:bg-accent/50"
                )}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                )}
                <ThemePreview
                  colors={resolvedTheme === "dark" ? preset.dark : preset.light}
                />
                <div>
                  <div className="font-medium text-sm">{preset.name}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">
                    {preset.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex flex-col gap-2 pb-2 border-b sm:flex-row sm:items-center">
        <span className="text-sm text-muted-foreground">Editing colors for:</span>
        <div className="flex gap-1">
          <Button
            variant={editMode === "light" ? "default" : "outline"}
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => setEditMode("light")}
          >
            <Sun className="h-4 w-4 mr-1" />
            Light
          </Button>
          <Button
            variant={editMode === "dark" ? "default" : "outline"}
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => setEditMode("dark")}
          >
            <Moon className="h-4 w-4 mr-1" />
            Dark
          </Button>
        </div>
      </div>

      {/* Color Groups */}
      <div className="space-y-2">
        {COLOR_GROUPS.map((group) => (
          <Collapsible key={group.name} defaultOpen={group.name === "Background"}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
              <span className="font-medium text-sm">{group.name}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid gap-4 p-4 pt-2">
                {group.keys.map((key) => (
                  <ColorInput
                    key={key}
                    label={COLOR_LABELS[key]}
                    value={currentColors[key]}
                    presetValue={presetColors[key]}
                    onChange={(value) => handleColorChange(key, value)}
                  />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-4 border-t sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" onClick={handleReset} className="w-full sm:w-auto">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Default
        </Button>
        <Button onClick={handleSave} disabled={!hasChanges || isSaving} className="w-full sm:w-auto">
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Theme"}
        </Button>
      </div>
    </div>
  );
}
