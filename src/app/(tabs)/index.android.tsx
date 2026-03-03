import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Box,
  Button,
  Column,
  Divider,
  Host,
  LazyColumn,
  ListItem,
  Row,
  Text,
} from '@expo/ui/jetpack-compose';
import {
  alpha,
  background,
  clip,
  fillMaxSize,
  fillMaxWidth,
  paddingAll,
  Shapes,
  size,
} from '@expo/ui/jetpack-compose/modifiers';

import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
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
      <SafeAreaView style={{ flex: 1 }}>
        <Host style={{ flex: 1 }}>
          <Column modifiers={[fillMaxSize()]}>

            {/* DayNav in Compose */}
            <Row
              verticalAlignment="center"
              horizontalArrangement="spaceBetween"
              modifiers={[fillMaxWidth(), paddingAll(8)]}>
              <Button
                onPress={() => setCurrentDate((d) => addDays(d, -1))}
                leadingIcon="rounded.ChevronLeft"
                variant="borderless"
              />
              <Text style={{ typography: 'titleMedium', fontWeight: '600' }}>
                {formatDateLabel(currentDate)}
              </Text>
              <Button
                onPress={isToday ? undefined : () => setCurrentDate((d) => addDays(d, 1))}
                leadingIcon="rounded.ChevronRight"
                variant="borderless"
                disabled={isToday}
                modifiers={[alpha(isToday ? 0.3 : 1.0)]}
              />
            </Row>

            <Divider modifiers={[fillMaxWidth()]} />

            {/* Stats list */}
            <LazyColumn modifiers={[fillMaxSize()]}>
              {STATS.map((config) => {
                const displayValue = displayValues[config.name];
                const isEmpty = displayValue === '—';
                return (
                  <ListItem
                    key={config.name}
                    headline={config.label}
                    supportingText={config.unit}
                    onPress={() =>
                      router.push({
                        pathname: '/stat/[name]',
                        params: { name: config.name, date: dateKey },
                      })
                    }
                    modifiers={[fillMaxWidth()]}>
                    <ListItem.Leading>
                      {/* Colored rounded box — stat's brand color */}
                      <Box
                        contentAlignment="center"
                        modifiers={[
                          size(44, 44),
                          clip(Shapes.RoundedCorner(12)),
                          background(config.color + '26'),
                        ]}
                      />
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

          </Column>
        </Host>
      </SafeAreaView>
    </ThemedView>
  );
}
