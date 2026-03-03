import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HStack, Host, Image, List, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  background,
  contentShape,
  font,
  foregroundStyle,
  frame,
  listStyle,
  onTapGesture,
  shapes,
} from '@expo/ui/swift-ui/modifiers';

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
      {/* RN header — matches native nav bar appearance */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.background }}>
        <DayNav
          date={currentDate}
          onPrev={() => setCurrentDate((d) => addDays(d, -1))}
          onNext={() => setCurrentDate((d) => addDays(d, 1))}
          isToday={isToday}
        />
      </SafeAreaView>

      {/* SwiftUI stats list */}
      <Host style={{ flex: 1 }}>
        <List modifiers={[listStyle('insetGrouped')]}>
          {STATS.map((config) => {
            const displayValue = displayValues[config.name];
            const isEmpty = displayValue === '—';
            return (
              <HStack
                key={config.name}
                spacing={12}
                modifiers={[
                  contentShape(shapes.rectangle()),
                  onTapGesture(() =>
                    router.push({
                      pathname: '/stat/[name]',
                      params: { name: config.name, date: dateKey },
                    })
                  ),
                ]}>
                {/* Colored SF Symbol icon */}
                <Image
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  systemName={config.icon.ios as any}
                  size={22}
                  color={config.color}
                  modifiers={[
                    frame({ width: 44, height: 44 }),
                    background(config.color + '26', shapes.roundedRectangle({ cornerRadius: 12 })),
                  ]}
                />
                {/* Label + unit */}
                <VStack alignment="leading" spacing={2}>
                  <Text>{config.label}</Text>
                  <Text modifiers={[font({ size: 13 }), foregroundStyle('secondaryLabel')]}>
                    {config.unit}
                  </Text>
                </VStack>
                <Spacer />
                {/* Display value */}
                <Text
                  modifiers={[
                    font({ size: 22, weight: 'semibold' }),
                    foregroundStyle(isEmpty ? 'tertiaryLabel' : 'label'),
                  ]}>
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
