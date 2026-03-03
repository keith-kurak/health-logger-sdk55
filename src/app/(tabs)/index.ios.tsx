import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Button, HStack, Host, Image, List, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  background,
  buttonStyle,
  contentShape,
  font,
  foregroundStyle,
  frame,
  labelStyle,
  listStyle,
  onTapGesture,
  padding,
  shapes,
} from '@expo/ui/swift-ui/modifiers';

import { ThemedView } from '@/components/themed-view';
import {
  STATS,
  StatName,
  addDays,
  formatDateLabel,
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
      <Host style={{ flex: 1 }}>
        <VStack spacing={0}>
          {/* DayNav in SwiftUI */}
          <HStack modifiers={[padding({ horizontal: 8, vertical: 8 })]}>
            <Button
              label="Previous day"
              systemImage="chevron.left"
              onPress={() => setCurrentDate((d) => addDays(d, -1))}
              modifiers={[buttonStyle('plain'), labelStyle('iconOnly')]}
            />
            <Spacer />
            <Text modifiers={[font({ weight: 'semibold' })]}>{formatDateLabel(currentDate)}</Text>
            <Spacer />
            <Button
              label="Next day"
              systemImage="chevron.right"
              onPress={isToday ? undefined : () => setCurrentDate((d) => addDays(d, 1))}
              modifiers={[
                buttonStyle('plain'),
                labelStyle('iconOnly'),
                foregroundStyle(isToday ? 'tertiaryLabel' : 'label'),
              ]}
            />
          </HStack>

          {/* Stats list */}
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
        </VStack>
      </Host>
    </ThemedView>
  );
}
