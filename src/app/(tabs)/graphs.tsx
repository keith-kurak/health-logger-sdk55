import { SymbolView } from 'expo-symbols';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WeekChart } from '@/components/week-chart';
import { Spacing } from '@/constants/theme';
import { Entry, STATS, StatName, readEntries } from '@/lib/stats';

export default function GraphsScreen() {
  const [allEntries, setAllEntries] = useState<Record<StatName, Entry[]>>(() => {
    const init = {} as Record<StatName, Entry[]>;
    for (const s of STATS) init[s.name] = [];
    return init;
  });

  const loadEntries = useCallback(() => {
    const data = {} as Record<StatName, Entry[]>;
    for (const s of STATS) data[s.name] = readEntries(s.name);
    setAllEntries(data);
  }, []);

  useFocusEffect(loadEntries);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <ThemedText type="title" style={styles.pageTitle}>
            Trends
          </ThemedText>

          {STATS.map((config) => (
            <View key={config.name} style={styles.card}>
              {/* Card header */}
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: config.color + '26' }]}>
                  <SymbolView
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    name={config.icon as any}
                    size={18}
                    tintColor={config.color}
                  />
                </View>
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
          ))}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
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
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    backgroundColor: 'transparent',
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
