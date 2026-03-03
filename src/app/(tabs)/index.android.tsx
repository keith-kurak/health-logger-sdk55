import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Box,
  Host,
  LazyColumn,
  ListItem,
  Text,
} from '@expo/ui/jetpack-compose';
import {
  background,
  clip,
  clickable,
  fillMaxSize,
  fillMaxWidth,
  Shapes,
  size,
} from '@expo/ui/jetpack-compose/modifiers';

import { DayNav } from '@/components/day-nav';
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

      <Host style={{ flex: 1 }}>
        <LazyColumn modifiers={[fillMaxSize()]}>
          {STATS.map((config) => {
            const displayValue = displayValues[config.name];
            const isEmpty = displayValue === '—';
            const abbr =
              config.name === 'bloodPressure' ? 'BP' : config.label.slice(0, 2).toUpperCase();
            return (
              <ListItem
                key={config.name}
                headline={config.label}
                supportingText={config.unit}
                modifiers={[
                  fillMaxWidth(),
                  clickable(() => {
                    router.push({
                      pathname: '/stat/[name]',
                      params: { name: config.name, date: dateKey },
                    });
                  }),
                ]}>
                <ListItem.Leading>
                  <Box
                    contentAlignment="center"
                    modifiers={[
                      size(44, 44),
                      clip(Shapes.RoundedCorner(12)),
                      background('#26' + config.color.slice(1)),
                    ]}>
                    <Text
                      style={{ typography: 'labelLarge', fontWeight: '700' }}
                      color={config.color}>
                      {abbr}
                    </Text>
                  </Box>
                </ListItem.Leading>
                <ListItem.Trailing>
                  <Text
                    style={{ typography: 'titleMedium', fontWeight: '600' }}
                    color={isEmpty ? theme.textSecondary : theme.text}>
                    {displayValue}
                  </Text>
                </ListItem.Trailing>
              </ListItem>
            );
          })}
        </LazyColumn>
      </Host>
    </ThemedView>
  );
}
