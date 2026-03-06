import {
  Color,
  Stack,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Pressable,
  Text as RNText,
  TextInput as RNTextInput,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  Button,
  Host,
  LazyColumn,
  ListItem,
  Text,
} from "@expo/ui/jetpack-compose";
import { fillMaxSize, fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";

import { WeekChart } from "@/components/week-chart";
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
} from "@/lib/stats";

export default function StatDetailScreen() {
  // Required for dynamic colors to update on theme change
  useColorScheme();

  const { name, date } = useLocalSearchParams<{
    name: StatName;
    date: string;
  }>();
  const config = STATS.find((s) => s.name === name);

  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [singleValue, setSingleValue] = useState("");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");

  const singleRef = useRef<RNTextInput>(null);
  const systolicRef = useRef<RNTextInput>(null);
  const diastolicRef = useRef<RNTextInput>(null);

  const loadEntries = useCallback(() => {
    setAllEntries(readEntries(name));
  }, [name]);

  useFocusEffect(loadEntries);

  if (!config) return null;

  const dayEntries = getEntriesForDay(allEntries, date).slice().reverse();

  const longDateLabel = (() => {
    const [y, m, d] = date.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  })();

  function handleAdd() {
    if (config!.inputType === "bloodPressure") {
      if (!systolic.trim() || !diastolic.trim()) return;
      addEntry(
        name,
        JSON.stringify({
          systolic: Number(systolic),
          diastolic: Number(diastolic),
        }),
        date,
      );
      setSystolic("");
      setDiastolic("");
      systolicRef.current?.clear();
      diastolicRef.current?.clear();
    } else {
      if (!singleValue.trim()) return;
      addEntry(name, singleValue.trim(), date);
      setSingleValue("");
      singleRef.current?.clear();
    }
    setAllEntries(readEntries(name));
  }

  function handleDelete(ts: number) {
    deleteEntry(name, ts);
    setAllEntries(readEntries(name));
  }

  const entriesCountLabel =
    dayEntries.length === 0
      ? "No entries"
      : `${dayEntries.length} ${dayEntries.length === 1 ? "entry" : "entries"}`;

  return (
    <>
      <Stack.Screen
        options={{
          title: config.label,
          headerShown: true,
          headerStyle: {
            backgroundColor: Color.android.dynamic.surface as unknown as string,
          },
          headerTintColor: Color.android.dynamic.onSurface as unknown as string,
          headerShadowVisible: false,
          unstable_sheetFooter: () => (
            <View
              style={[
                styles.footer,
                {
                  backgroundColor: Color.android.dynamic.surfaceContainerHigh,
                  borderTopColor: Color.android.dynamic.outlineVariant,
                },
              ]}
            >
              {config.inputType === "bloodPressure" ? (
                <View style={styles.footerRow}>
                  <View style={styles.bpGroup}>
                    <RNText
                      style={[
                        styles.label,
                        { color: Color.android.dynamic.onSurfaceVariant },
                      ]}
                    >
                      Systolic
                    </RNText>
                    <RNTextInput
                      ref={systolicRef}
                      style={[
                        styles.input,
                        {
                          color: Color.android.dynamic.onSurface,
                          borderColor: Color.android.dynamic.outline,
                        },
                      ]}
                      onChangeText={setSystolic}
                      value={systolic}
                      placeholder="120"
                      placeholderTextColor={Color.android.dynamic.onSurfaceVariant}
                      keyboardType="numeric"
                    />
                  </View>
                  <RNText
                    style={[
                      styles.bpSlash,
                      { color: Color.android.dynamic.onSurfaceVariant },
                    ]}
                  >
                    /
                  </RNText>
                  <View style={styles.bpGroup}>
                    <RNText
                      style={[
                        styles.label,
                        { color: Color.android.dynamic.onSurfaceVariant },
                      ]}
                    >
                      Diastolic
                    </RNText>
                    <RNTextInput
                      ref={diastolicRef}
                      style={[
                        styles.input,
                        {
                          color: Color.android.dynamic.onSurface,
                          borderColor: Color.android.dynamic.outline,
                        },
                      ]}
                      onChangeText={setDiastolic}
                      value={diastolic}
                      placeholder="80"
                      placeholderTextColor={Color.android.dynamic.onSurfaceVariant}
                      keyboardType="numeric"
                    />
                  </View>
                  <Pressable
                    onPress={handleAdd}
                    style={[
                      styles.addButton,
                      { backgroundColor: Color.android.dynamic.primary },
                    ]}
                  >
                    <RNText style={styles.addButtonText}>+</RNText>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.footerRow}>
                  <RNTextInput
                    ref={singleRef}
                    style={[
                      styles.input,
                      styles.inputFlex,
                      {
                        color: Color.android.dynamic.onSurface,
                        borderColor: Color.android.dynamic.outline,
                      },
                    ]}
                    onChangeText={setSingleValue}
                    value={singleValue}
                    placeholder={`Enter ${config.unit}`}
                    placeholderTextColor={Color.android.dynamic.onSurfaceVariant}
                    keyboardType={
                      config.inputType === "decimal" ? "decimal-pad" : "numeric"
                    }
                  />
                  <Pressable
                    onPress={handleAdd}
                    style={[
                      styles.addButton,
                      { backgroundColor: Color.android.dynamic.primary },
                    ]}
                  >
                    <RNText style={styles.addButtonText}>+</RNText>
                  </Pressable>
                </View>
              )}
            </View>
          ),
        }}
      />
      <View
        style={[styles.flex, { backgroundColor: Color.android.dynamic.surface }]}
      >
        <SafeAreaView style={styles.flex} edges={["bottom"]}>
          {/* React Native section: date label + chart stay outside the Compose Host */}
          <RNText
            style={[
              styles.dateLabel,
              { color: Color.android.dynamic.onSurfaceVariant },
            ]}
          >
            {longDateLabel}
          </RNText>
          <WeekChart config={config} entries={allEntries} />

          {/* Jetpack Compose section: entries list */}
          <Host style={styles.flex}>
            <LazyColumn
              modifiers={[fillMaxSize()]}
              contentPadding={{ top: 16, bottom: 32, start: 16, end: 16 }}
              verticalArrangement={{ spacedBy: 12 }}
            >
              {/* Entry count label */}
              <Text style={{ typography: "labelLarge" }}>
                {entriesCountLabel}
              </Text>

              {/* Entry rows */}
              {dayEntries.map((entry: Entry) => (
                <ListItem
                  key={entry.ts}
                  headline={formatStatValue(config, entry.value)}
                  supportingText={formatTime(entry.ts)}
                  modifiers={[fillMaxWidth()]}
                >
                  <ListItem.Trailing>
                    <Button
                      onPress={() => handleDelete(entry.ts)}
                      variant="borderless"
                    >
                      ×
                    </Button>
                  </ListItem.Trailing>
                </ListItem>
              ))}
            </LazyColumn>
          </Host>
        </SafeAreaView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  dateLabel: {
    paddingHorizontal: 16,
    paddingTop: 8,
    textAlign: "right",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  inputFlex: {
    flex: 1,
  },
  bpGroup: {
    flex: 1,
    gap: 2,
  },
  bpSlash: {
    fontSize: 20,
    paddingTop: 16,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
  },
  addButtonText: {
    color: Color.android.dynamic.onPrimary,
    fontSize: 24,
    lineHeight: 26,
  },
});
