import { SymbolView } from 'expo-symbols';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DayNav } from '@/components/day-nav';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  STATS,
  StatName,
  addDays,
  getDayDisplayValue,
  localDateKey,
  readEntries,
} from '@/lib/stats';

function localMidnightToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function DashboardScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [currentDate, setCurrentDate] = useState<Date>(localMidnightToday);
  const [displayValues, setDisplayValues] = useState<Record<StatName, string>>(() => {
    const empty = {} as Record<StatName, string>;
    for (const s of STATS) empty[s.name] = '—';
    return empty;
  });

  const dateKey = localDateKey(currentDate);
  const isToday = dateKey === localDateKey(localMidnightToday());

  const loadStats = useCallback(() => {
    const snapshot = {} as Record<StatName, string>;
    for (const s of STATS) {
      snapshot[s.name] = getDayDisplayValue(s, readEntries(s.name), dateKey);
    }
    setDisplayValues(snapshot);
  }, [dateKey]);

  useFocusEffect(loadStats);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <DayNav
          date={currentDate}
          onPrev={() => setCurrentDate((d) => addDays(d, -1))}
          onNext={() => setCurrentDate((d) => addDays(d, 1))}
          isToday={isToday}
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {STATS.map((config, index) => {
            const displayValue = displayValues[config.name];
            const isEmpty = displayValue === '—';
            const isLast = index === STATS.length - 1;

            return (
              <Pressable
                key={config.name}
                onPress={() =>
                  router.push({
                    pathname: '/stat/[name]',
                    params: { name: config.name, date: dateKey },
                  })
                }
                style={({ pressed }) => [pressed && styles.pressed]}>
                <View
                  style={[
                    styles.row,
                    !isLast && {
                      borderBottomColor: theme.backgroundElement,
                      borderBottomWidth: StyleSheet.hairlineWidth,
                    },
                  ]}>
                  {/* Colored icon */}
                  <View style={[styles.iconBox, { backgroundColor: config.color + '26' }]}>
                    <SymbolView
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      name={config.icon as any}
                      size={22}
                      tintColor={config.color}
                    />
                  </View>

                  {/* Label + unit */}
                  <View style={styles.labelCol}>
                    <ThemedText type="default">{config.label}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {config.unit}
                    </ThemedText>
                  </View>

                  {/* Value */}
                  <ThemedText
                    type="subtitle"
                    themeColor={isEmpty ? 'textSecondary' : 'text'}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={styles.value}>
                    {displayValue}
                  </ThemedText>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingTop: Spacing.two },
  list: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.four },
  pressed: { opacity: 0.6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelCol: { flex: 1, gap: 2 },
  value: {
    fontSize: 24,
    lineHeight: 30,
    minWidth: 70,
    textAlign: 'right',
  },
});
