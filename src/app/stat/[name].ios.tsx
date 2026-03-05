import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, Dimensions, Share, View } from 'react-native';

import {
  Button,
  HStack,
  Host,
  List,
  RNHostView,
  Section,
  Spacer,
  Text,
  TextField,
  TextFieldRef,
  VStack,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  controlSize,
  font,
  foregroundStyle,
  labelStyle,
  listStyle,
  scrollDismissesKeyboard,
  tint,
} from '@expo/ui/swift-ui/modifiers';

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
  getDayDisplayValue,
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

  const [showAddEntry, setShowAddEntry] = useState(false);

  const singleRef = useRef<TextFieldRef>(null);
  const systolicRef = useRef<TextFieldRef>(null);
  const diastolicRef = useRef<TextFieldRef>(null);

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
    setShowAddEntry(false);
  }

  function handleShare() {
    const total = getDayDisplayValue(config!, allEntries, date);
    Share.share({ message: `${config!.label}: ${total} ${config!.unit} on ${longDateLabel}` });
  }

  function handleClearDay() {
    if (dayEntries.length === 0) return;
    Alert.alert('Clear All Entries', `Delete all ${config!.label.toLowerCase()} entries for today?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          for (const entry of dayEntries) deleteEntry(name, entry.ts);
          setAllEntries(readEntries(name));
        },
      },
    ]);
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
      <Stack.Toolbar placement="bottom">
        <Stack.Toolbar.Button icon="square.and.arrow.up" onPress={handleShare}>
          Share
        </Stack.Toolbar.Button>
        <Stack.Toolbar.Spacer />
        <Stack.Toolbar.Button icon="plus" tintColor={config.color} onPress={() => setShowAddEntry((v) => !v)}>
          Add
        </Stack.Toolbar.Button>
        <Stack.Toolbar.Spacer />
        <Stack.Toolbar.Button icon="trash" tintColor="red" onPress={handleClearDay}>
          Clear Day
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <ThemedView style={{ flex: 1 }}>
        <Host style={{ flex: 1 }}>
          <List
            modifiers={[listStyle('insetGrouped'), scrollDismissesKeyboard('interactively')]}>

            {/* Section 1: Date label + week chart */}
            <Section
              header={
                <Text modifiers={[foregroundStyle('secondaryLabel'), font({ size: 13 })]}>
                  {longDateLabel}
                </Text>
              }>
              <RNHostView matchContents>
                <View style={{ width: Dimensions.get('window').width - 32, height: 112 }}>
                  <WeekChart config={config} entries={allEntries} inCard noBackground />
                </View>
              </RNHostView>
            </Section>

            {/* Section 2: Add Entry (shown when toolbar Add button is pressed) */}
            {showAddEntry && (
              <Section header={<Text>Add Entry</Text>}>
                {config.inputType === 'bloodPressure' ? (
                  <HStack spacing={8}>
                    <VStack alignment="leading" spacing={4}>
                      <Text modifiers={[foregroundStyle('secondaryLabel'), font({ size: 12 })]}>
                        Systolic
                      </Text>
                      <TextField
                        ref={systolicRef}
                        autoFocus
                        onChangeText={setSystolic}
                        placeholder="120"
                        keyboardType="numeric"
                      />
                    </VStack>
                    <Text modifiers={[font({ size: 20 })]}>{'  /  '}</Text>
                    <VStack alignment="leading" spacing={4}>
                      <Text modifiers={[foregroundStyle('secondaryLabel'), font({ size: 12 })]}>
                        Diastolic
                      </Text>
                      <TextField
                        ref={diastolicRef}
                        onChangeText={setDiastolic}
                        placeholder="80"
                        keyboardType="numeric"
                      />
                    </VStack>
                    <Button
                      label="Add"
                      systemImage="plus"
                      onPress={handleAdd}
                      modifiers={[buttonStyle('borderedProminent'), tint(config.color), labelStyle('iconOnly'), controlSize('regular')]}
                    />
                  </HStack>
                ) : (
                  <HStack spacing={8}>
                    <TextField
                      ref={singleRef}
                      autoFocus
                      onChangeText={setSingleValue}
                      placeholder={`Enter ${config.unit}`}
                      keyboardType={config.inputType === 'decimal' ? 'decimal-pad' : 'numeric'}
                    />
                    <Button
                      label="Add"
                      systemImage="plus"
                      onPress={handleAdd}
                      modifiers={[buttonStyle('borderedProminent'), tint(config.color), labelStyle('iconOnly'), controlSize('regular')]}
                    />
                  </HStack>
                )}
              </Section>
            )}

            {/* Section 3: Entry list with swipe-to-delete */}
            <Section header={<Text>{entriesCountLabel}</Text>}>
              <List.ForEach onDelete={(indices) => handleDelete(dayEntries[indices[0]].ts)}>
                {dayEntries.map((entry) => (
                  <HStack key={entry.ts} spacing={6}>
                    <Text modifiers={[font({ weight: 'semibold' })]}>
                      {formatStatValue(config, entry.value)}
                    </Text>
                    <Text modifiers={[foregroundStyle('secondaryLabel'), font({ size: 13 })]}>
                      {config.unit}
                    </Text>
                    <Spacer />
                    <Text modifiers={[foregroundStyle('secondaryLabel'), font({ size: 13 })]}>
                      {formatTime(entry.ts)}
                    </Text>
                  </HStack>
                ))}
              </List.ForEach>
            </Section>

          </List>
        </Host>
      </ThemedView>
    </>
  );
}
