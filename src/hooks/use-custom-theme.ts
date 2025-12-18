import { useCallback, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { useAuthenticate } from "@daveyplate/better-auth-ui";
import { getUserSettings, updateUserSettings } from "@/lib/server/user-settings";
import {
  type ThemeColors,
  CSS_VAR_MAP,
  themePresets,
  getPresetById,
  getDefaultColors,
} from "@/lib/theme-presets";

export type CustomThemeData = {
  presetId: string;
  lightOverrides: Partial<ThemeColors>;
  darkOverrides: Partial<ThemeColors>;
};

// Apply CSS variables to the document root
function applyCssVariables(colors: Partial<ThemeColors>, _mode: "light" | "dark") {
  const root = document.documentElement;

  Object.entries(colors).forEach(([key, value]) => {
    if (value && CSS_VAR_MAP[key as keyof ThemeColors]) {
      root.style.setProperty(CSS_VAR_MAP[key as keyof ThemeColors], value);
    }
  });
}

// Clear all custom CSS variables
function clearCssVariables() {
  const root = document.documentElement;
  Object.values(CSS_VAR_MAP).forEach((varName) => {
    root.style.removeProperty(varName);
  });
}

// Parse stored customTheme from database
function parseCustomTheme(stored: Record<string, string> | null | undefined): CustomThemeData {
  if (!stored) {
    return {
      presetId: "default",
      lightOverrides: {},
      darkOverrides: {},
    };
  }

  return {
    presetId: stored.presetId || "default",
    lightOverrides: stored.light ? JSON.parse(stored.light) : {},
    darkOverrides: stored.dark ? JSON.parse(stored.dark) : {},
  };
}

// Serialize customTheme for database storage
function serializeCustomTheme(data: CustomThemeData): Record<string, string> {
  return {
    presetId: data.presetId,
    light: JSON.stringify(data.lightOverrides),
    dark: JSON.stringify(data.darkOverrides),
  };
}

export function useCustomTheme() {
  const { data: session } = useAuthenticate();
  const { resolvedTheme } = useTheme();
  const queryClient = useQueryClient();

  // Fetch user settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["userSettings"],
    queryFn: () => getUserSettings(),
    enabled: !!session?.user,
    staleTime: 30000,
  });

  // Parse the current theme data
  const customThemeData = useMemo(() => {
    return parseCustomTheme(settingsData?.settings?.customTheme as Record<string, string> | undefined);
  }, [settingsData?.settings?.customTheme]);

  // Get the current preset
  const currentPreset = useMemo(() => {
    return getPresetById(customThemeData.presetId) || themePresets[0];
  }, [customThemeData.presetId]);

  // Get the effective colors (preset + overrides)
  const getEffectiveColors = useCallback(
    (mode: "light" | "dark"): ThemeColors => {
      const presetColors = currentPreset[mode];
      const overrides = mode === "light" ? customThemeData.lightOverrides : customThemeData.darkOverrides;

      return {
        ...presetColors,
        ...overrides,
      };
    },
    [currentPreset, customThemeData]
  );

  // Apply theme when it changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mode = resolvedTheme === "dark" ? "dark" : "light";
    const colors = getEffectiveColors(mode);
    applyCssVariables(colors, mode);
  }, [resolvedTheme, getEffectiveColors]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: CustomThemeData) => {
      return updateUserSettings({
        data: {
          customTheme: serializeCustomTheme(data),
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSettings"] });
    },
  });

  // Set a single color override
  const setColorOverride = useCallback(
    (key: keyof ThemeColors, value: string, mode: "light" | "dark") => {
      const newData: CustomThemeData = {
        ...customThemeData,
        ...(mode === "light"
          ? { lightOverrides: { ...customThemeData.lightOverrides, [key]: value } }
          : { darkOverrides: { ...customThemeData.darkOverrides, [key]: value } }),
      };

      // Apply immediately for live preview
      if (typeof window !== "undefined") {
        const currentMode = resolvedTheme === "dark" ? "dark" : "light";
        if (currentMode === mode) {
          applyCssVariables({ [key]: value }, mode);
        }
      }

      return newData;
    },
    [customThemeData, resolvedTheme]
  );

  // Set preset (and clear overrides)
  const setPreset = useCallback(
    (presetId: string, saveImmediately = false) => {
      const newData: CustomThemeData = {
        presetId,
        lightOverrides: {},
        darkOverrides: {},
      };

      // Apply the preset colors immediately
      if (typeof window !== "undefined") {
        const preset = getPresetById(presetId);
        if (preset) {
          const mode = resolvedTheme === "dark" ? "dark" : "light";
          clearCssVariables();
          applyCssVariables(preset[mode], mode);
        }
      }

      if (saveImmediately) {
        saveMutation.mutate(newData);
      }

      return newData;
    },
    [resolvedTheme, saveMutation]
  );

  // Save current theme configuration
  const saveTheme = useCallback(
    (data: CustomThemeData) => {
      saveMutation.mutate(data);
    },
    [saveMutation]
  );

  // Reset to default theme
  const resetTheme = useCallback(() => {
    const defaultData: CustomThemeData = {
      presetId: "default",
      lightOverrides: {},
      darkOverrides: {},
    };

    clearCssVariables();
    const mode = resolvedTheme === "dark" ? "dark" : "light";
    applyCssVariables(getDefaultColors(mode), mode);

    saveMutation.mutate(defaultData);
  }, [resolvedTheme, saveMutation]);

  return {
    // Current state
    customThemeData,
    currentPreset,
    isLoading,
    isSaving: saveMutation.isPending,

    // Computed
    getEffectiveColors,

    // Actions
    setColorOverride,
    setPreset,
    saveTheme,
    resetTheme,

    // All presets
    presets: themePresets,
  };
}
