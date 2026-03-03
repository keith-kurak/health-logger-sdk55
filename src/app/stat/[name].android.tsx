import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Button,
  Card,
  Column,
  Host,
  LazyColumn,
  ListItem,
  Row,
  Text,
  TextInput,
  TextInputRef,
} from '@expo/ui/jetpack-compose';
import { fillMaxSize, fillMaxWidth, paddingAll, weight } from '@expo/ui/jetpack-compose/modifiers';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WeekChart } from '@/components/week-chart';
import { useTheme } from '@/hooks/use-theme';
import {
  Entry,
  STATS,
  StatName,
  addEntry,
  deleteEntry,
  formatStatValue,
  formatTime,
  getEntriesForDay,
  readEntries,
} from '@/lib/stats';

export default function StatDetailScreen() {
  const theme = useTheme();
  const { name, date } = useLocalSearchParams<{ name: StatName; date: string }>();
  const config = STATS.find((s) => s.name === name);

  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [singleValue, setSingleValue] = useState('');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');

  const singleRef = useRef<TextInputRef>(null);
  const systolicRef = useRef<TextInputRef>(null);
  const diastolicRef = useRef<TextInputRef>(null);

  const loadEntries = useCallback(() => {
    setAllEntries(readEntries(name));
  }, [name]);

  useFocusEffect(loadEntries);

  if (!config) return null;

  const dayEntries = getEntriesForDay(allEntries, date).slice().reverse();

  const longDateLabel = (() => {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  })();

  function handleAdd() {
    if (config!.inputType === 'bloodPressure') {
      if (!systolic.trim() || !diastolic.trim()) return;
      addEntry(name, JSON.stringify({ systolic: Number(systolic), diastolic: Number(diastolic) }), date);
      setSystolic('');
      setDiastolic('');
      systolicRef.current?.setText('');
      diastolicRef.current?.setText('');
    } else {
      if (!singleValue.trim()) return;
      addEntry(name, singleValue.trim(), date);
      setSingleValue('');
      singleRef.current?.setText('');
    }
    setAllEntries(readEntries(name));
  }

  function handleDelete(ts: number) {
    deleteEntry(name, ts);
    setAllEntries(readEntries(name));
  }

  const entriesCountLabel =
    dayEntries.length === 0
      ? 'No entries'
      : `${dayEntries.length} ${dayEntries.length === 1 ? 'entry' : 'entries'}`;

  return (
    <>
      <Stack.Screen
        options={{
          title: config.label,
          headerShown: true,
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          headerShadowVisible: false,
        }}
      />
      <ThemedView style={{ flex: 1 }}>
        <SafeAreaView style={styles.flex} edges={['bottom']}>

          {/* React Native section: date label + chart stay outside the Compose Host */}
          <ThemedText type="small" themeColor="textSecondary" style={styles.dateLabel}>
            {longDateLabel}
          </ThemedText>
          <WeekChart config={config} entries={allEntries} />

          {/* Jetpack Compose section: add-entry form + entries list */}
          <Host style={styles.flex}>
            <LazyColumn
              modifiers={[fillMaxSize()]}
              contentPadding={{ top: 16, bottom: 32, start: 16, end: 16 }}
              verticalArrangement={{ spacedBy: 12 }}>

              {/* Add Entry card */}
              <Card modifiers={[fillMaxWidth()]}>
                <Column
                  modifiers={[fillMaxWidth(), paddingAll(16)]}
                  verticalArrangement={{ spacedBy: 8 }}>
                  <Text style={{ typography: 'labelLarge' }}>Add Entry</Text>

                  {config.inputType === 'bloodPressure' ? (
                    <Row
                      verticalAlignment="bottom"
                      horizontalArrangement={{ spacedBy: 8 }}
                      modifiers={[fillMaxWidth()]}>
                      <Column modifiers={[weight(1)]} verticalArrangement={{ spacedBy: 4 }}>
                        <Text style={{ typography: 'labelSmall' }} color={theme.textSecondary}>
                          Systolic
                        </Text>
                        <TextInput
                          ref={systolicRef}
                          onChangeText={setSystolic}
                          keyboardType="numeric"
                          modifiers={[fillMaxWidth()]}
                        />
                      </Column>
                      <Text style={{ typography: 'headlineSmall' }} color={theme.textSecondary}>
                        {'/'}
                      </Text>
                      <Column modifiers={[weight(1)]} verticalArrangement={{ spacedBy: 4 }}>
                        <Text style={{ typography: 'labelSmall' }} color={theme.textSecondary}>
                          Diastolic
                        </Text>
                        <TextInput
                          ref={diastolicRef}
                          onChangeText={setDiastolic}
                          keyboardType="numeric"
                          modifiers={[fillMaxWidth()]}
                        />
                      </Column>
                      <Button
                        onPress={handleAdd}
                        variant="default"
                        leadingIcon="rounded.Add"
                        elementColors={{ containerColor: config.color, contentColor: '#ffffff' }}
                      />
                    </Row>
                  ) : (
                    <Row
                      verticalAlignment="center"
                      horizontalArrangement={{ spacedBy: 8 }}
                      modifiers={[fillMaxWidth()]}>
                      <TextInput
                        ref={singleRef}
                        onChangeText={setSingleValue}
                        keyboardType={config.inputType === 'decimal' ? 'decimal-pad' : 'numeric'}
                        modifiers={[weight(1)]}
                      />
                      <Button
                        onPress={handleAdd}
                        variant="default"
                        leadingIcon="rounded.Add"
                        elementColors={{ containerColor: config.color, contentColor: '#ffffff' }}
                      />
                    </Row>
                  )}
                </Column>
              </Card>

              {/* Entry count label */}
              <Text style={{ typography: 'labelLarge' }} color={theme.textSecondary}>
                {entriesCountLabel}
              </Text>

              {/* Entry rows */}
              {dayEntries.map((entry: Entry) => (
                <ListItem
                  key={entry.ts}
                  headline={formatStatValue(config, entry.value)}
                  supportingText={formatTime(entry.ts)}
                  modifiers={[fillMaxWidth()]}>
                  <ListItem.Trailing>
                    <Button
                      onPress={() => handleDelete(entry.ts)}
                      leadingIcon="rounded.Delete"
                      variant="borderless"
                    />
                  </ListItem.Trailing>
                </ListItem>
              ))}

            </LazyColumn>
          </Host>

        </SafeAreaView>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  dateLabel: {
    paddingHorizontal: 16,
    paddingTop: 8,
    textAlign: 'right',
  },
});
