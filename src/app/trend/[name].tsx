import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { WeekChart } from "@/components/week-chart";
import { Spacing } from "@/constants/theme";
import {
  Entry,
  STATS,
  StatName,
  addDays,
  formatDateLabel,
  getDayDisplayValue,
  localDateKey,
  readEntries,
} from "@/lib/stats";

export default function TrendDetailScreen() {
  const { name } = useLocalSearchParams<{ name: StatName }>();
  const config = STATS.find((s) => s.name === name)!;
  const entries: Entry[] = useMemo(() => readEntries(name), [name]);

  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i - 6);
    const dateKey = localDateKey(date);
    return {
      date,
      dateKey,
      displayValue: getDayDisplayValue(config, entries, dateKey),
    };
  });

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: config.label,
          ...(Platform.OS === "ios" && {
            headerTransparent: true,
            headerBlurEffect: "systemMaterial",
            headerLargeTitle: true,
          }),
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.chartWrapper}>
          <WeekChart config={config} entries={entries} />
        </View>

        <View style={styles.list}>
          {days.map((day) => (
            <ThemedView
              key={day.dateKey}
              type="backgroundElement"
              style={styles.row}
            >
              <ThemedText type="default">
                {formatDateLabel(day.date)}
              </ThemedText>
              <View style={styles.rowRight}>
                <ThemedText type="default" style={{ fontWeight: "600" }}>
                  {day.displayValue}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {config.unit}
                </ThemedText>
              </View>
            </ThemedView>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  chartWrapper: {
    marginTop: 16,
    height: 112, // BAR_MAX_HEIGHT (72) + 40
  },
  scroll: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  list: {
    borderRadius: Spacing.three,
    overflow: "hidden",
    gap: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: Spacing.one,
  },
});
