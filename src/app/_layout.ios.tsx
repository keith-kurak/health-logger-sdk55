import {
  HStack,
  Host,
  Image,
  List,
  Spacer,
  Text,
  VStack,
} from "@expo/ui/swift-ui";
import {
  background,
  contentShape,
  font,
  foregroundStyle,
  frame,
  listStyle,
  onTapGesture,
  shapes,
} from "@expo/ui/swift-ui/modifiers";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import { SplitView } from "expo-router/unstable-split-view";
import React, { useCallback, useRef, useState } from "react";
import { Platform, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { SplitHostCommands } from "react-native-screens/experimental";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { DayNav } from "@/components/day-nav";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import {
  STATS,
  StatName,
  addDays,
  getDayDisplayValue,
  localDateKey,
  readEntries,
  seedDataIfNeeded,
  seedTodayIfNeeded,
} from "@/lib/stats";

seedDataIfNeeded();
seedTodayIfNeeded();

function localMidnightToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function TrackerSidebar({
  splitRef,
}: {
  splitRef: React.RefObject<SplitHostCommands | null>;
}) {
  const router = useRouter();
  const theme = useTheme();
  const [currentDate, setCurrentDate] = useState<Date>(localMidnightToday);
  const [displayValues, setDisplayValues] = useState<Record<StatName, string>>(
    () => {
      const empty = {} as Record<StatName, string>;
      for (const s of STATS) empty[s.name] = "—";
      return empty;
    },
  );

  const dateKey = localDateKey(currentDate);
  const isToday = dateKey === localDateKey(localMidnightToday());

  // Reload stats whenever sidebar is visible
  const loadStats = useCallback(() => {
    seedTodayIfNeeded();
    const snapshot = {} as Record<StatName, string>;
    for (const s of STATS) {
      snapshot[s.name] = getDayDisplayValue(s, readEntries(s.name), dateKey);
    }
    setDisplayValues(snapshot);
  }, [dateKey]);

  // Load on mount and when dateKey changes
  React.useEffect(loadStats, [loadStats]);

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView
        edges={["top"]}
        style={{ backgroundColor: theme.background }}
      >
        <DayNav
          date={currentDate}
          onPrev={() => setCurrentDate((d) => addDays(d, -1))}
          onNext={() => setCurrentDate((d) => addDays(d, 1))}
          isToday={isToday}
        />
      </SafeAreaView>

      <Host style={{ flex: 1 }}>
        <List modifiers={[listStyle("insetGrouped")]}>
          {STATS.map((config) => {
            const displayValue = displayValues[config.name];
            const isEmpty = displayValue === "—";
            return (
              <HStack
                key={config.name}
                spacing={12}
                modifiers={[
                  contentShape(shapes.rectangle()),
                  onTapGesture(() => {
                    router.push({
                      pathname: "/stat/[name]",
                      params: { name: config.name, date: dateKey },
                    });
                  }),
                ]}
              >
                <Image
                  systemName={config.icon.ios as any}
                  size={22}
                  color={config.color}
                  modifiers={[
                    frame({ width: 44, height: 44 }),
                    background(
                      config.color + "26",
                      shapes.roundedRectangle({ cornerRadius: 12 }),
                    ),
                  ]}
                />
                <VStack alignment="leading" spacing={2}>
                  <Text>{config.label}</Text>
                  <Text
                    modifiers={[
                      font({ size: 13 }),
                      foregroundStyle("secondaryLabel"),
                    ]}
                  >
                    {config.unit}
                  </Text>
                </VStack>
                <Spacer />
                <Text
                  modifiers={[
                    font({ size: 22, weight: "semibold" }),
                    foregroundStyle(isEmpty ? "tertiaryLabel" : "label"),
                  ]}
                >
                  {displayValue}
                </Text>
              </HStack>
            );
          })}
        </List>
      </Host>
    </ThemedView>
  );
}

function iPadLayout() {
  const splitRef = useRef<SplitHostCommands>(null);

  return (
    <SplitView ref={splitRef}>
      <SplitView.Column>
        <TrackerSidebar splitRef={splitRef} />
      </SplitView.Column>
    </SplitView>
  );
}

function iPhoneLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="stat/[name]"
        options={{
          presentation: "formSheet",
          sheetAllowedDetents: [0.5, 1],
          sheetGrabberVisible: true,
          sheetCornerRadius: 20,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      {Platform.isPad ? iPadLayout() : iPhoneLayout()}
    </ThemeProvider>
  );
}
