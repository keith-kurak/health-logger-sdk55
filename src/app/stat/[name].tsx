import { SymbolView } from 'expo-symbols';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WeekChart } from '@/components/week-chart';
import { Spacing } from '@/constants/theme';
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

  const loadEntries = useCallback(() => {
    setAllEntries(readEntries(name));
  }, [name]);

  useFocusEffect(loadEntries);

  if (!config) return null;

  const dayEntries = getEntriesForDay(allEntries, date).slice().reverse();

  function handleAdd() {
    if (config!.inputType === 'bloodPressure') {
      if (!systolic.trim() || !diastolic.trim()) return;
      addEntry(name, JSON.stringify({ systolic: Number(systolic), diastolic: Number(diastolic) }), date);
      setSystolic('');
      setDiastolic('');
    } else {
      if (!singleValue.trim()) return;
      addEntry(name, singleValue.trim(), date);
      setSingleValue('');
    }
    setAllEntries(readEntries(name));
  }

  function handleDelete(ts: number) {
    deleteEntry(name, ts);
    setAllEntries(readEntries(name));
  }

  const inputStyle = [
    styles.input,
    {
      backgroundColor: theme.backgroundElement,
      color: theme.text,
      borderColor: theme.backgroundSelected,
    },
  ];

  const addButton = (
    <Pressable
      onPress={handleAdd}
      style={({ pressed }) => [
        styles.addButton,
        { backgroundColor: config!.color },
        pressed && styles.pressed,
      ]}>
      <SymbolView
        name={{ ios: 'plus', android: 'add', web: 'add' }}
        size={22}
        tintColor="white"
      />
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Native stack header — title + back button */}
      <Stack.Screen
        options={{
          title: config.label,
          headerShown: true,
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          headerShadowVisible: false,
        }}
      />

      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scroll}>

            {/* Long-form date, right-justified */}
            <ThemedText type="small" themeColor="textSecondary" style={styles.dateLabel}>
              {(() => {
                const [y, m, d] = date.split('-').map(Number);
                return new Date(y, m - 1, d).toLocaleDateString('en-US', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                });
              })()}
            </ThemedText>

            {/* Week chart */}
            <WeekChart config={config} entries={allEntries} />

            {/* Add entry form */}
            <View style={styles.section}>
              <ThemedText type="smallBold" style={styles.sectionLabel}>
                Add Entry
              </ThemedText>

              {config.inputType === 'bloodPressure' ? (
                <View style={styles.bpRow}>
                  <View style={styles.bpField}>
                    <ThemedText type="small" themeColor="textSecondary">
                      Systolic
                    </ThemedText>
                    <TextInput
                      style={inputStyle}
                      value={systolic}
                      onChangeText={setSystolic}
                      keyboardType="number-pad"
                      placeholder="120"
                      placeholderTextColor={theme.textSecondary}
                      returnKeyType="next"
                    />
                  </View>
                  <ThemedText type="subtitle" themeColor="textSecondary" style={styles.bpSlash}>
                    /
                  </ThemedText>
                  <View style={styles.bpField}>
                    <ThemedText type="small" themeColor="textSecondary">
                      Diastolic
                    </ThemedText>
                    <TextInput
                      style={inputStyle}
                      value={diastolic}
                      onChangeText={setDiastolic}
                      keyboardType="number-pad"
                      placeholder="80"
                      placeholderTextColor={theme.textSecondary}
                      returnKeyType="done"
                      onSubmitEditing={handleAdd}
                    />
                  </View>
                  {addButton}
                </View>
              ) : (
                <View style={styles.singleRow}>
                  <TextInput
                    style={[inputStyle, styles.singleInput]}
                    value={singleValue}
                    onChangeText={setSingleValue}
                    keyboardType={config.inputType === 'decimal' ? 'decimal-pad' : 'number-pad'}
                    placeholder={`Enter ${config.unit}`}
                    placeholderTextColor={theme.textSecondary}
                    returnKeyType="done"
                    onSubmitEditing={handleAdd}
                  />
                  {addButton}
                </View>
              )}
            </View>

            {/* Entry list for the selected date */}
            <View style={styles.section}>
              <ThemedText type="smallBold" style={styles.sectionLabel}>
                {dayEntries.length === 0
                  ? 'No entries'
                  : `${dayEntries.length} ${dayEntries.length === 1 ? 'entry' : 'entries'}`}
              </ThemedText>

              {dayEntries.map((entry) => (
                <ThemedView key={entry.ts} type="backgroundElement" style={styles.entryRow}>
                  <View style={styles.entryInfo}>
                    <ThemedText type="default" style={styles.entryValue}>
                      {formatStatValue(config, entry.value)}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {formatTime(entry.ts)}
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={() => handleDelete(entry.ts)}
                    style={({ pressed }) => [styles.deleteBtn, pressed && styles.pressed]}>
                    <SymbolView
                      name={{ ios: 'trash', android: 'delete', web: 'delete' }}
                      size={16}
                      tintColor={theme.textSecondary}
                    />
                  </Pressable>
                </ThemedView>
              ))}
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  pressed: { opacity: 0.6 },

  scroll: {
    paddingBottom: Spacing.six,
    gap: Spacing.four,
  },

  dateLabel: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    textAlign: 'right',
  },

  section: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  sectionLabel: {
    marginBottom: Spacing.one,
  },

  input: {
    fontSize: 20,
    fontWeight: '500',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  singleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  singleInput: {
    flex: 1,
  },
  bpRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  bpField: {
    flex: 1,
    gap: Spacing.one,
  },
  bpSlash: {
    paddingBottom: Spacing.two,
  },

  addButton: {
    width: 48,
    height: 48,
    borderRadius: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
  },

  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  entryInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  entryValue: {
    fontWeight: '600',
  },
  deleteBtn: {
    padding: Spacing.two,
  },
});
