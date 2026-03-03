import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DayNav } from '@/components/day-nav';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import {
  STATS,
  StatName,
  addDays,
  getDayDisplayValue,
  localDateKey,
  readEntries,
  seedTodayIfNeeded,
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
    seedTodayIfNeeded();
    const snapshot = {} as Record<StatName, string>;
    for (const s of STATS) {
      snapshot[s.name] = getDayDisplayValue(s, readEntries(s.name), dateKey);
    }
    setDisplayValues(snapshot);
  }, [dateKey]);

  useFocusEffect(loadStats);

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.background }}>
        <DayNav
          date={currentDate}
          onPrev={() => setCurrentDate((d) => addDays(d, -1))}
          onNext={() => setCurrentDate((d) => addDays(d, 1))}
          isToday={isToday}
        />
      </SafeAreaView>

      <ScrollView style={{ flex: 1 }}>
        {STATS.map((config) => {
          const displayValue = displayValues[config.name];
          const isEmpty = displayValue === '—';
          const abbr =
            config.name === 'bloodPressure' ? 'BP' : config.label.slice(0, 2).toUpperCase();

          return (
            <Pressable
              key={config.name}
              onPress={() =>
                router.push({
                  pathname: '/stat/[name]',
                  params: { name: config.name, date: dateKey },
                })
              }
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
              {/* Icon box */}
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: config.color + '26' },
                ]}>
                <ThemedText style={[styles.abbr, { color: config.color }]}>{abbr}</ThemedText>
              </View>

              {/* Label + unit */}
              <View style={styles.labelCol}>
                <ThemedText style={styles.label}>{config.label}</ThemedText>
                <ThemedText style={[styles.unit, { color: theme.textSecondary }]}>
                  {config.unit}
                </ThemedText>
              </View>

              {/* Display value */}
              <ThemedText
                style={[styles.value, { color: isEmpty ? theme.textSecondary : theme.text }]}>
                {displayValue}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  abbr: {
    fontSize: 13,
    fontWeight: '700',
  },
  labelCol: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 16,
  },
  unit: {
    fontSize: 13,
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
  },
});
