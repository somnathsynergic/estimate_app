import { Platform, useColorScheme } from "react-native"
import { MD3LightTheme, MD3DarkTheme, configureFonts } from "react-native-paper"

export const usePaperColorScheme = () => {
  const colorScheme = useColorScheme()
  const fontConfig = {
    default: {
      fontFamily: "ProductSans-Medium",
    },
    labelSmall: {
      fontFamily: "ProductSans-Medium",
      fontSize: 15,
    },
    labelMedium: {
      fontFamily: "ProductSans-Medium",
      fontSize: 15,
    },
    labelLarge: {
      fontFamily: "ProductSans-Medium",
      fontSize: 15,
    },
    titleLarge: {
      fontFamily: "ProductSans-Bold",
      fontSize: 20,
    },
    bodyMedium: {
      fontFamily: "ProductSans-Medium",
      fontSize: 15,
    },
    bodyLarge: {
      fontFamily: "ProductSans-Medium",
      fontSize: 17,
    },
    bodySmall: {
      fontFamily: "ProductSans-Medium",
      // fontSize: 17,
    },
    displayMedium: {
      fontFamily: "ProductSans-Medium",
      fontSize: 40,
    },
    displaySmall: {
      fontFamily: "ProductSans-Medium",
      fontSize: 28,
    },
    headlineMedium: {
      fontFamily: "ProductSans-Medium",
      fontSize: 20,
    },
    headlineLarge: {
      fontFamily: "ProductSans-Medium",
      fontSize: 24,
    },
  }

  return colorScheme === "dark"
    ? {
      ...MD3DarkTheme,
      colors: {
        ...MD3DarkTheme.colors,
        // Highly Premium Blue & White Dark Theme
        primary: "#3B82F6", // Vibrant Blue
        onPrimary: "#FFFFFF",
        primaryContainer: "#1E3A8A",
        onPrimaryContainer: "#DBEAFE",
        secondary: "#60A5FA", // Light Blue
        onSecondary: "#FFFFFF",
        secondaryContainer: "#1E40AF",
        onSecondaryContainer: "#EFF6FF",
        tertiary: "#93C5FD", // Ice Blue
        onTertiary: "#0F172A",
        tertiaryContainer: "#2563EB",
        onTertiaryContainer: "#FFFFFF",
        error: "#F87171",
        onError: "#450A0A",
        errorContainer: "#7F1D1D",
        onErrorContainer: "#FECACA",
        
        // Deep Navy/Slate Backgrounds
        background: "#020617", // Ultra Dark Navy Black
        onBackground: "#F8FAFC", // Crisp White
        surface: "#0F172A", // Dark Slate Blue Card
        onSurface: "#F1F5F9",
        surfaceVariant: "#1E293B", // Elevated Slate Blue
        onSurfaceVariant: "#CBD5E1",
        outline: "#475569",
        outlineVariant: "#334155",
        shadow: "#000000",
        scrim: "#000000",
        inverseSurface: "#F8FAFC",
        inverseOnSurface: "#020617",
        inversePrimary: "#2563EB",
        elevation: {
          level0: "transparent",
          level1: "#0F172A",
          level2: "#1E293B",
          level3: "#334155",
          level4: "#475569",
          level5: "#64748B",
        },
        surfaceDisabled: "rgba(248, 250, 252, 0.12)",
        onSurfaceDisabled: "rgba(248, 250, 252, 0.38)",
        backdrop: "rgba(2, 6, 23, 0.6)",

        // Unified Blue/White Custom Colors
        green: "#38BDF8", // Cyan Blue
        onGreen: "#FFFFFF",
        greenContainer: "#075985",
        onGreenContainer: "#E0F2FE",
        greenTertiary: "#7DD3FC",
        onGreenTertiary: "#082F49",
        greenContainerTertiary: "#0369A1",
        onGreenContainerTertiary: "#BAE6FD",

        orange: "#818CF8", // Indigo Blue
        onOrange: "#FFFFFF",
        orangeContainer: "#3730A3",
        onOrangeContainer: "#E0E7FF",

        pink: "#A78BFA", // Violet Blue
        onPink: "#FFFFFF",
        pinkContainer: "#4C1D95",
        onPinkContainer: "#EDE9FE",

        purple: "#2563EB", // Royal Blue
        onPurple: "#FFFFFF",
        purpleContainer: "#1E3A8A",
        onPurpleContainer: "#DBEAFE",

        teal: "#0EA5E9", // Ocean Blue
        onTeal: "#FFFFFF",
        tealContainer: "#0C4A6E",
        onTealContainer: "#E0F2FE",

        peach: "#93C5FD", // Soft Blue
        onPeach: "#0F172A",
        peachContainer: "#1E3A8A",
        onPeachContainer: "#DBEAFE",
        peachTertiary: "#BFDBFE",
        onPeachTertiary: "#0F172A",
        peachTertiaryContainer: "#1E40AF",
        onPeachTertiaryContainer: "#EFF6FF",

        vanilla: "#bcd063",
        onVanilla: "#2b3400",
        vanillaContainer: "#404c00",
        onVanillaContainer: "#d8ed7c",
        vanillaSecondary: "#c5c9a8",
        onVanillaSecondary: "#2e331b",
        vanillaSecondaryContainer: "#45492f",
        onVanillaSecondaryContainer: "#e1e6c3",
        vanillaTertiary: "#a1d0c4",
        onVanillaTertiary: "#04372f",
        vanillaTertiaryContainer: "#214e45",
        onVanillaTertiaryContainer: "#bdece0",
        vanillaSurface: "#13140d",
        vanillaSurfaceLow: "#1b1c15"
      },
      fonts: configureFonts({ config: fontConfig }),
    }
    : {
      ...MD3LightTheme,
      colors: {
        ...MD3LightTheme.colors,
        // Highly Premium Blue & White Light Theme
        primary: "#2563EB", // Royal Blue
        onPrimary: "#FFFFFF",
        primaryContainer: "#DBEAFE",
        onPrimaryContainer: "#1E3A8A",
        secondary: "#3B82F6", // Bright Blue
        onSecondary: "#FFFFFF",
        secondaryContainer: "#EFF6FF",
        onSecondaryContainer: "#1E40AF",
        tertiary: "#0284C7", // Ocean Blue
        onTertiary: "#FFFFFF",
        tertiaryContainer: "#E0F2FE",
        onTertiaryContainer: "#0C4A6E",
        error: "#DC2626",
        onError: "#FFFFFF",
        errorContainer: "#FEE2E2",
        onErrorContainer: "#7F1D1D",
        
        // Crisp White Light Backgrounds
        background: "#FFFFFF", // True Crisp White
        onBackground: "#0F172A", // Deep Navy Text
        surface: "#F8FAFC", // Ice Blue/White Card
        onSurface: "#0F172A",
        surfaceVariant: "#F1F5F9",
        onSurfaceVariant: "#334155",
        outline: "#94A3B8",
        outlineVariant: "#CBD5E1",
        shadow: "#000000",
        scrim: "#000000",
        inverseSurface: "#0F172A",
        inverseOnSurface: "#F8FAFC",
        inversePrimary: "#60A5FA",
        elevation: {
          level0: "transparent",
          level1: "#FFFFFF",
          level2: "#F8FAFC",
          level3: "#F1F5F9",
          level4: "#E2E8F0",
          level5: "#CBD5E1",
        },
        surfaceDisabled: "rgba(15, 23, 42, 0.12)",
        onSurfaceDisabled: "rgba(15, 23, 42, 0.38)",
        backdrop: "rgba(15, 23, 42, 0.4)",

        // Unified Blue/White Custom Colors
        green: "#0284C7", // Azure
        onGreen: "#FFFFFF",
        greenContainer: "#E0F2FE",
        onGreenContainer: "#0C4A6E",
        greenTertiary: "#0369A1",
        onGreenTertiary: "#FFFFFF",
        greenContainerTertiary: "#BAE6FD",
        onGreenContainerTertiary: "#082F49",

        orange: "#4F46E5", // Indigo
        onOrange: "#FFFFFF",
        orangeContainer: "#E0E7FF",
        onOrangeContainer: "#312E81",

        pink: "#7C3AED", // Violet
        onPink: "#FFFFFF",
        pinkContainer: "#EDE9FE",
        onPinkContainer: "#4C1D95",

        purple: "#2563EB", // Royal Blue
        onPurple: "#FFFFFF",
        purpleContainer: "#DBEAFE",
        onPurpleContainer: "#1E3A8A",

        teal: "#0891B2", // Cyan
        onTeal: "#FFFFFF",
        tealContainer: "#CFFAFE",
        onTealContainer: "#164E63",

        peach: "#3B82F6", // Bright Blue
        onPeach: "#FFFFFF",
        peachContainer: "#EFF6FF",
        onPeachContainer: "#1E40AF",
        peachTertiary: "#2563EB",
        onPeachTertiary: "#FFFFFF",
        peachTertiaryContainer: "#DBEAFE",
        onPeachTertiaryContainer: "#1E3A8A",

        vanilla: "#65A30D",
        onVanilla: "#FFFFFF",
        vanillaContainer: "#ECFCCB",
        onVanillaContainer: "#3F6212",
        vanillaSecondary: "#4D7C0F",
        onVanillaSecondary: "#FFFFFF",
        vanillaSecondaryContainer: "#D9F99D",
        onVanillaSecondaryContainer: "#365314",
        vanillaTertiary: "#15803D",
        onVanillaTertiary: "#FFFFFF",
        vanillaTertiaryContainer: "#DCFCE7",
        onVanillaTertiaryContainer: "#14532D",
        vanillaSurface: "#F7FEE7",
        vanillaSurfaceLow: "#F0FDF4"
      },
      fonts: configureFonts({ config: fontConfig }),
    }
}
