import { useCustomTheme } from "@/hooks/use-custom-theme";

// This component loads the custom theme from the database and applies it
// It doesn't render anything visible, just handles theme application
export function CustomThemeLoader() {
  // The hook handles loading and applying the theme automatically
  useCustomTheme();
  return null;
}
