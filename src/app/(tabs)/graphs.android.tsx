import { Color, Link, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Box, Host, Icon } from "@expo/ui/jetpack-compose";
import {
  Shapes,
  background,
  clip,
  size,
} from "@expo/ui/jetpack-compose/modifiers";

import { ThemedText } from "@/components/themed-text";
import { WeekChart } from "@/components/week-chart";
import { Spacing } from "@/constants/theme";
import { Entry, STATS, StatName, readEntries } from "@/lib/stats";

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

export default function GraphsScreen() {
  useColorScheme();

  const [allEntries, setAllEntries] = useState<Record<StatName, Entry[]>>(
    () => {
      const init = {} as Record<StatName, Entry[]>;
      for (const s of STATS) init[s.name] = [];
      return init;
    },
  );

  const loadEntries = useCallback(() => {
    const data = {} as Record<StatName, Entry[]>;
    for (const s of STATS) data[s.name] = readEntries(s.name);
    setAllEntries(data);
  }, []);

  useFocusEffect(loadEntries);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: Color.android.dynamic.surface },
      ]}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <ThemedText type="title" style={styles.pageTitle}>
            Trends
          </ThemedText>

          {STATS.map((config) => (
            <Link
              key={config.name}
              href={{
                pathname: "/trend/[name]",
                params: { name: config.name },
              }}
              asChild
            >
              <Pressable>
                <View style={styles.card}>
                  {/* Card header */}
                  <View style={styles.cardHeader}>
                    <Host style={styles.cardIcon}>
                      <Box
                        contentAlignment="center"
                        modifiers={[
                          size(36, 36),
                          clip(Shapes.RoundedCorner(10)),
                          background(Color.android.dynamic.primaryContainer),
                        ]}
                      >
                        <Icon
                          source={ANDROID_ICONS[config.icon.android]}
                          tintColor={Color.android.dynamic.primary}
                          size={18}
                        />
                      </Box>
                    </Host>
                    <View>
                      <ThemedText type="default">{config.label}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {config.unit} · last 7 days
                      </ThemedText>
                    </View>
                  </View>

                  {/* Chart — no outer margin since card handles padding */}
                  <WeekChart
                    config={config}
                    entries={allEntries[config.name]}
                    inCard
                  />
                </View>
              </Pressable>
            </Link>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.four,
    gap: Spacing.two,
  },
  pageTitle: {
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  card: {
    borderRadius: Spacing.three,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    backgroundColor: "transparent",
  },
  cardIcon: {
    width: 36,
    height: 36,
  },
});
