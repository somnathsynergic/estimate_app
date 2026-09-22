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
        // Highly Premium Sober Light Slate Theme (Unified high legibility)
        primary: "#090446", // Custom Luxury Navy Blue
        onPrimary: "#FFFFFF",
        primaryContainer: "#EFF2F9",
        onPrimaryContainer: "#090446",
        secondary: "#546A7B", // Sober Royal Blue
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

        // Premium Sober Light Slate Backgrounds
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
        backdrop: "rgba(9, 4, 70, 0.4)",

        // Unified Blue/White Custom Colors (Clean, Sober Light Mappings)
        green: "#090446",
        onGreen: "#FFFFFF",
        greenContainer: "#EFF2F9",
        onGreenContainer: "#090446",
        greenTertiary: "#93C5FD",
        onGreenTertiary: "#090446",
        greenContainerTertiary: "#EFF2F9",
        onGreenContainerTertiary: "#090446",

        orange: "#546A7B",
        onOrange: "#FFFFFF",
        orangeContainer: "#EFF6FF",
        onOrangeContainer: "#1E40AF",

        pink: "#0284C7",
        onPink: "#FFFFFF",
        pinkContainer: "#E0F2FE",
        onPinkContainer: "#0C4A6E",

        purple: "#090446",
        onPurple: "#FFFFFF",
        purpleContainer: "#EFF2F9",
        onPurpleContainer: "#090446",

        teal: "#546A7B",
        onTeal: "#FFFFFF",
        tealContainer: "#EFF6FF",
        onTealContainer: "#1E40AF",

        peach: "#090446",
        onPeach: "#FFFFFF",
        peachContainer: "#EFF2F9",
        onPeachContainer: "#090446",
        peachTertiary: "#93C5FD",
        onPeachTertiary: "#090446",
        peachTertiaryContainer: "#EFF2F9",
        onPeachTertiaryContainer: "#090446",

        vanilla: "#090446", // Custom Luxury Navy Blue
        onVanilla: "#FFFFFF",
        vanillaContainer: "#EFF2F9",
        onVanillaContainer: "#090446",
        vanillaSecondary: "#546A7B",
        onVanillaSecondary: "#FFFFFF",
        vanillaSecondaryContainer: "#EFF6FF",
        onVanillaSecondaryContainer: "#1E40AF",
        vanillaTertiary: "#93C5FD",
        onVanillaTertiary: "#090446",
        vanillaTertiaryContainer: "#EFF2F9",
        onVanillaTertiaryContainer: "#090446",
        vanillaSurface: "#FFFFFF",
        vanillaSurfaceLow: "#F8FAFC"
      },
      fonts: configureFonts({ config: fontConfig }),
    }
    : {
      ...MD3LightTheme,
      colors: {
        ...MD3LightTheme.colors,
        // Highly Premium Blue & White Light Theme
        primary: "#090446", // Custom Luxury Navy Blue
        onPrimary: "#FFFFFF",
        primaryContainer: "#EFF2F9",
        onPrimaryContainer: "#090446",
        secondary: "#546A7B", // Bright Blue
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

        purple: "#090446", // Custom Luxury Navy Blue
        onPurple: "#FFFFFF",
        purpleContainer: "#EFF2F9",
        onPurpleContainer: "#090446",

        teal: "#0891B2", // Cyan
        onTeal: "#FFFFFF",
        tealContainer: "#CFFAFE",
        onTealContainer: "#164E63",

        peach: "#546A7B", // Bright Blue
        onPeach: "#FFFFFF",
        peachContainer: "#EFF6FF",
        onPeachContainer: "#1E40AF",
        peachTertiary: "#2563EB",
        onPeachTertiary: "#FFFFFF",
        peachTertiaryContainer: "#DBEAFE",
        onPeachTertiaryContainer: "#1E3A8A",

        vanilla: "#090446", // Custom Luxury Navy Blue
        onVanilla: "#FFFFFF",
        vanillaContainer: "#EFF2F9", // Ice Blue/White
        onVanillaContainer: "#090446", // Slate Blue
        vanillaSecondary: "#546A7B", // Bright Blue
        onVanillaSecondary: "#FFFFFF",
        vanillaSecondaryContainer: "#DBEAFE",
        onVanillaSecondaryContainer: "#1E3A8A",
        vanillaTertiary: "#0284C7", // Ocean Blue
        onVanillaTertiary: "#FFFFFF",
        vanillaTertiaryContainer: "#E0F2FE",
        onVanillaTertiaryContainer: "#0C4A6E",
        vanillaSurface: "#FFFFFF",
        vanillaSurfaceLow: "#F8FAFC"
      },
      fonts: configureFonts({ config: fontConfig }),
    }
}
