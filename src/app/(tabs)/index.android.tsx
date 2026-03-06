import { Color, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  Box,
  Host,
  Icon,
  LazyColumn,
  ListItem,
  Text,
} from "@expo/ui/jetpack-compose";
import {
  Shapes,
  background,
  clickable,
  clip,
  fillMaxSize,
  fillMaxWidth,
  size,
} from "@expo/ui/jetpack-compose/modifiers";

import { DayNav } from "@/components/day-nav";
import {
  STATS,
  StatName,
  addDays,
  getDayDisplayValue,
  localDateKey,
  readEntries,
  seedTodayIfNeeded,
} from "@/lib/stats";

/* eslint-disable @typescript-eslint/no-require-imports */
const ANDROID_ICONS: Record<string, ReturnType<typeof require>> = {
  water_drop: require("../../assets/icons/water_drop.xml"),
  nutrition: require("../../assets/icons/nutrition.xml"),
  eco: require("../../assets/icons/eco.xml"),
  directions_run: require("../../assets/icons/directions_run.xml"),
  directions_walk: require("../../assets/icons/directions_walk.xml"),
  scale: require("../../assets/icons/scale.xml"),
  monitor_heart: require("../../assets/icons/monitor_heart.xml"),
  bedtime: require("../../assets/icons/bedtime.xml"),
};
/* eslint-enable @typescript-eslint/no-require-imports */

function localMidnightToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function DashboardScreen() {
  useColorScheme();
  const router = useRouter();
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

  const loadStats = useCallback(() => {
    seedTodayIfNeeded();
    const snapshot = {} as Record<StatName, string>;
    for (const s of STATS) {
      snapshot[s.name] = getDayDisplayValue(s, readEntries(s.name), dateKey);
    }
    setDisplayValues(snapshot);
  }, [dateKey]);

  useFocusEffect(loadStats);

  return (
    <View style={{ flex: 1, backgroundColor: Color.android.dynamic.surface }}>
      <SafeAreaView
        edges={["top"]}
        style={{ backgroundColor: Color.android.dynamic.surface }}
      >
        <DayNav
          date={currentDate}
          onPrev={() => setCurrentDate((d) => addDays(d, -1))}
          onNext={() => setCurrentDate((d) => addDays(d, 1))}
          isToday={isToday}
        />
      </SafeAreaView>

      <Host style={{ flex: 1 }}>
        <LazyColumn modifiers={[fillMaxSize()]}>
          {STATS.map((config) => {
            const displayValue = displayValues[config.name];
            const isEmpty = displayValue === "—";
            return (
              <ListItem
                key={config.name}
                headline={config.label}
                supportingText={config.unit}
                modifiers={[
                  fillMaxWidth(),
                  clickable(() => {
                    router.push({
                      pathname: "/stat/[name]",
                      params: { name: config.name, date: dateKey },
                    });
                  }),
                ]}
              >
                <ListItem.Leading>
                  <Box
                    contentAlignment="center"
                    modifiers={[
                      size(44, 44),
                      clip(Shapes.RoundedCorner(12)),
                      background(Color.android.dynamic.primaryContainer),
                    ]}
                  >
                    <Icon
                      source={ANDROID_ICONS[config.icon.android]}
                      tintColor={Color.android.dynamic.primary}
                      size={22}
                    />
                  </Box>
                </ListItem.Leading>
                <ListItem.Trailing>
                  <Text
                    style={{ typography: "titleMedium", fontWeight: "600" }}
                    color={
                      isEmpty
                        ? (Color.android.dynamic.onSurfaceVariant as unknown as string)
                        : (Color.android.dynamic.onSurface as unknown as string)
                    }
                  >
                    {displayValue}
                  </Text>
                </ListItem.Trailing>
              </ListItem>
            );
          })}
        </LazyColumn>
      </Host>
    </View>
  );
}
