import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { useAuthenticate } from "@daveyplate/better-auth-ui";
import { getUserSettings, updateUserSettings } from "@/lib/server/user-settings.server";
import {
  type ThemeColors,
  CSS_VAR_MAP,
  themePresets,
  getPresetById,
  getDefaultColors,
} from "@/lib/theme-presets";

const STORAGE_KEY = "appmap-custom-theme";

export type CustomThemeData = {
  presetId: string;
  lightOverrides: Partial<ThemeColors>;
  darkOverrides: Partial<ThemeColors>;
};

const defaultThemeData: CustomThemeData = {
  presetId: "default",
  lightOverrides: {},
  darkOverrides: {},
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

// Get from localStorage
function getStoredTheme(): CustomThemeData | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error reading theme from localStorage:", e);
  }
  return null;
}

// Save to localStorage
function setStoredTheme(data: CustomThemeData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Error saving theme to localStorage:", e);
  }
}

// Parse stored customTheme from database
function parseCustomTheme(stored: Record<string, string> | null | undefined): CustomThemeData {
  if (!stored) {
    return defaultThemeData;
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

  // Initialize from localStorage immediately
  const [localThemeData, setLocalThemeData] = useState<CustomThemeData>(() => {
    return getStoredTheme() || defaultThemeData;
  });

  // Fetch user settings from database
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["userSettings"],
    queryFn: () => getUserSettings(),
    enabled: !!session?.user,
    staleTime: 30000,
  });

  // Parse the database theme data
  const dbThemeData = useMemo(() => {
    return parseCustomTheme(settingsData?.settings?.customTheme as Record<string, string> | undefined);
  }, [settingsData?.settings?.customTheme]);

  // Sync localStorage with database when database data loads
  useEffect(() => {
    if (settingsData?.settings?.customTheme) {
      // Database has theme data, use it and update localStorage
      setLocalThemeData(dbThemeData);
      setStoredTheme(dbThemeData);
    }
  }, [settingsData?.settings?.customTheme, dbThemeData]);

  // Use localThemeData as the source of truth (it's synced with DB when available)
  const customThemeData = localThemeData;

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

      // Update local state and localStorage immediately for live preview
      setLocalThemeData(newData);
      setStoredTheme(newData);

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

      // Update local state and localStorage immediately
      setLocalThemeData(newData);
      setStoredTheme(newData);

      // Apply the preset colors immediately
      if (typeof window !== "undefined") {
        const preset = getPresetById(presetId);
        if (preset) {
          const mode = resolvedTheme === "dark" ? "dark" : "light";
          clearCssVariables();
          applyCssVariables(preset[mode], mode);
        }
      }

      if (saveImmediately && session?.user) {
        saveMutation.mutate(newData);
      }

      return newData;
    },
    [resolvedTheme, saveMutation, session?.user]
  );

  // Save current theme configuration to database
  const saveTheme = useCallback(
    (data: CustomThemeData) => {
      // Always update localStorage
      setLocalThemeData(data);
      setStoredTheme(data);

      // Save to database if logged in
      if (session?.user) {
        saveMutation.mutate(data);
      }
    },
    [saveMutation, session?.user]
  );

  // Reset to default theme
  const resetTheme = useCallback(() => {
    const defaultData: CustomThemeData = {
      presetId: "default",
      lightOverrides: {},
      darkOverrides: {},
    };

    // Update local state and localStorage
    setLocalThemeData(defaultData);
    setStoredTheme(defaultData);

    clearCssVariables();
    const mode = resolvedTheme === "dark" ? "dark" : "light";
    applyCssVariables(getDefaultColors(mode), mode);

    // Save to database if logged in
    if (session?.user) {
      saveMutation.mutate(defaultData);
    }
  }, [resolvedTheme, saveMutation, session?.user]);

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
