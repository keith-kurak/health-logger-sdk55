import { SymbolView } from 'expo-symbols';
import KVStore from 'expo-sqlite/kv-store';
import { useState } from 'react';
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
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Units = 'metric' | 'imperial';
type Sex = 'male' | 'female' | 'other';

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'male',   label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other',  label: 'Other' },
];

const INFO_ROWS = [
  { label: 'Version',  value: '1.0.0' },
  { label: 'Storage',  value: 'Local (on-device)' },
  { label: 'Platform', value: 'Expo SDK 55' },
];

export default function SettingsScreen() {
  const theme = useTheme();

  const [name,  setName]  = useState(() => KVStore.getItemSync('settings:name')  ?? '');
  const [units, setUnits] = useState<Units>(() => (KVStore.getItemSync('settings:units') as Units) ?? 'imperial');
  const [sex,   setSex]   = useState<Sex | null>(() => (KVStore.getItemSync('settings:sex') as Sex) ?? null);

  function saveName(value: string) {
    KVStore.setItemSync('settings:name', value);
  }

  function saveUnits(value: Units) {
    setUnits(value);
    KVStore.setItemSync('settings:units', value);
  }

  function saveSex(value: Sex) {
    setSex(value);
    KVStore.setItemSync('settings:sex', value);
  }

  const divider = { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.backgroundSelected };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scroll}>

            <ThemedText type="title" style={styles.pageTitle}>Settings</ThemedText>

            {/* ── Profile ── */}
            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionHeader}>
              PROFILE
            </ThemedText>
            <ThemedView type="backgroundElement" style={styles.card}>
              <View style={[styles.row, divider]}>
                <ThemedText type="default">Name</ThemedText>
                <TextInput
                  style={[styles.textInput, { color: theme.text }]}
                  value={name}
                  onChangeText={setName}
                  onBlur={() => saveName(name)}
                  placeholder="Your name"
                  placeholderTextColor={theme.textSecondary}
                  returnKeyType="done"
                />
              </View>

              {/* Sex */}
              <View style={styles.stackedRow}>
                <ThemedText type="default">Sex</ThemedText>
                <View style={[styles.segmentedBar, { borderColor: theme.backgroundSelected }]}>
                  {SEX_OPTIONS.map((opt, i) => (
                    <Pressable
                      key={opt.value}
                      onPress={() => saveSex(opt.value)}
                      style={({ pressed }) => [
                        styles.segment,
                        i < SEX_OPTIONS.length - 1 && { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: theme.backgroundSelected },
                        sex === opt.value && { backgroundColor: theme.backgroundSelected },
                        pressed && styles.pressed,
                      ]}>
                      <ThemedText
                        type="small"
                        themeColor={sex === opt.value ? 'text' : 'textSecondary'}>
                        {opt.label}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ThemedView>

            {/* ── Preferences ── */}
            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionHeader}>
              PREFERENCES
            </ThemedText>
            <ThemedView type="backgroundElement" style={styles.card}>
              <View style={styles.stackedRow}>
                <ThemedText type="default">Units</ThemedText>
                <View style={[styles.segmentedBar, { borderColor: theme.backgroundSelected }]}>
                  {(['metric', 'imperial'] as Units[]).map((opt, i) => (
                    <Pressable
                      key={opt}
                      onPress={() => saveUnits(opt)}
                      style={({ pressed }) => [
                        styles.segment,
                        i === 0 && { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: theme.backgroundSelected },
                        units === opt && { backgroundColor: theme.backgroundSelected },
                        pressed && styles.pressed,
                      ]}>
                      <ThemedText
                        type="small"
                        themeColor={units === opt ? 'text' : 'textSecondary'}>
                        {opt[0].toUpperCase() + opt.slice(1)}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ThemedView>

            {/* ── About ── */}
            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionHeader}>
              ABOUT
            </ThemedText>
            <ThemedView type="backgroundElement" style={styles.card}>
              {INFO_ROWS.map((row, i) => (
                <View
                  key={row.label}
                  style={[styles.row, i < INFO_ROWS.length - 1 && divider]}>
                  <ThemedText type="default">{row.label}</ThemedText>
                  <ThemedText type="default" themeColor="textSecondary">{row.value}</ThemedText>
                </View>
              ))}
            </ThemedView>

            {/* Privacy note */}
            <ThemedView type="backgroundElement" style={styles.card}>
              <View style={styles.aboutRow}>
                <SymbolView
                  name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
                  size={14}
                  tintColor={theme.textSecondary}
                />
                <ThemedText type="small" themeColor="textSecondary" style={styles.aboutText}>
                  All data is stored privately on your device using SQLite. Nothing is sent to any server.
                </ThemedText>
              </View>
            </ThemedView>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea:  { flex: 1 },
  flex:      { flex: 1 },

  scroll: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.two,
  },
  pageTitle: {
    paddingTop: Spacing.three,
    paddingBottom: Spacing.one,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.one,
    paddingTop: Spacing.two,
    fontSize: 12,
    letterSpacing: 0.5,
  },

  card: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },

  // Horizontal row: label ← → value/control
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.three,
  },

  // Vertical stack: label on top, control full-width below
  stackedRow: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },

  textInput: {
    flex: 1,
    fontSize: 16,
    textAlign: 'right',
  },

  // Segmented control
  segmentedBar: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  pressed: { opacity: 0.6 },

  aboutRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  aboutText: { flex: 1 },
});
