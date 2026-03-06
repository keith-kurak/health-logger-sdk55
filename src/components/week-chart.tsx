import { Color } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import {
  Entry,
  StatConfig,
  addDays,
  getDayChartValue,
  localDateKey,
} from '@/lib/stats';

const BAR_MAX_HEIGHT = 72;
const DAY_LETTERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

type WeekChartProps = {
  config: StatConfig;
  entries: Entry[];
  /** When true, removes horizontal margin (chart sits inside a card that provides padding). */
  inCard?: boolean;
  /** When true, renders with a transparent background (let the parent provide the background). */
  noBackground?: boolean;
};

export function WeekChart({ config, entries, inCard, noBackground }: WeekChartProps) {
  const today = new Date();
  const todayKey = localDateKey(today);

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i - 6);
    const dateKey = localDateKey(date);
    const nv = getDayChartValue(config, entries, dateKey);
    return {
      dateKey,
      dayLetter: DAY_LETTERS[date.getDay()],
      nv,
      isToday: dateKey === todayKey,
    };
  });

  const maxVal = Math.max(...days.map((d) => d.nv ?? 0), 1);

  return (
    <ThemedView
      type="backgroundElement"
      style={[styles.container, inCard && styles.containerInCard, noBackground && styles.transparent]}>
      {days.map((day) => {
        const barH = day.nv !== null ? Math.max((day.nv / maxVal) * BAR_MAX_HEIGHT, 4) : 0;
        // Today: full color; past days: muted variant
        const barColor = Platform.select({
          android: day.isToday
            ? Color.android.dynamic.primary
            : Color.android.dynamic.primaryContainer,
          default: day.isToday ? config.color : config.color + '80',
        });
        return (
          <View key={day.dateKey} style={styles.column}>
            <View style={styles.barTrack}>
              {barH > 0 && (
                <View style={[styles.bar, { height: barH, backgroundColor: barColor }]} />
              )}
            </View>
            <ThemedText
              type="small"
              themeColor={day.isToday ? 'text' : 'textSecondary'}
              style={styles.dayLabel}>
              {day.dayLetter}
            </ThemedText>
          </View>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    marginHorizontal: Spacing.three,
    height: BAR_MAX_HEIGHT + 40,
  },
  containerInCard: {
    marginHorizontal: 0,
    borderRadius: 0,
    borderBottomLeftRadius: Spacing.three,
    borderBottomRightRadius: Spacing.three,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
  },
  barTrack: {
    height: BAR_MAX_HEIGHT,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '55%',
    borderRadius: Spacing.one,
    minWidth: 6,
  },
  dayLabel: {
    fontSize: 11,
    lineHeight: 14,
  },
});
