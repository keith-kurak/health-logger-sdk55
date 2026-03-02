import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import React from "react";
import { useColorScheme } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { seedDataIfNeeded, seedTodayIfNeeded } from "@/lib/stats";

// Both calls are synchronous and run before any screen renders
seedDataIfNeeded(); // past 7 days, once ever
seedTodayIfNeeded(); // today, on every app load if no entries yet

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack
        screenOptions={{
          headerShown: false,
          headerBackButtonDisplayMode: "minimal",
        }}
      />
    </ThemeProvider>
  );
}
