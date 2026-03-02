import KVStore from "expo-sqlite/kv-store";

export type StatName =
  | "water"
  | "fruit"
  | "veggies"
  | "cardio"
  | "steps"
  | "weight"
  | "bloodPressure"
  | "sleep";

export type Entry = {
  ts: number; // Unix ms — for ordering and time display
  value: string; // raw value (number string, or BP JSON)
  dateKey: string; // YYYY-MM-DD — which day this entry belongs to
};

export type StatConfig = {
  name: StatName;
  label: string;
  unit: string;
  inputType: "integer" | "decimal" | "bloodPressure";
  aggregate: "sum" | "latest";
  decimalPlaces?: number;
  icon: { ios: string; android: string; web: string };
  color: string; // accent color for this stat
};

export const STATS: StatConfig[] = [
  {
    name: "water",
    label: "Water",
    unit: "servings",
    inputType: "integer",
    aggregate: "sum",
    color: "#3B82F6",
    icon: { ios: "drop.fill", android: "water_drop", web: "water_drop" },
  },
  {
    name: "fruit",
    label: "Fruit",
    unit: "servings",
    inputType: "integer",
    aggregate: "sum",
    color: "#F59E0B",
    icon: { ios: "apple.logo", android: "nutrition", web: "nutrition" },
  },
  {
    name: "veggies",
    label: "Veggies",
    unit: "servings",
    inputType: "integer",
    aggregate: "sum",
    color: "#22C55E",
    icon: { ios: "leaf.fill", android: "eco", web: "eco" },
  },
  {
    name: "cardio",
    label: "Cardio",
    unit: "min",
    inputType: "integer",
    aggregate: "sum",
    color: "#EF4444",
    icon: {
      ios: "figure.run",
      android: "directions_run",
      web: "directions_run",
    },
  },
  {
    name: "steps",
    label: "Steps",
    unit: "steps",
    inputType: "integer",
    aggregate: "sum",
    color: "#A855F7",
    icon: {
      ios: "figure.walk",
      android: "directions_walk",
      web: "directions_walk",
    },
  },
  {
    name: "weight",
    label: "Weight",
    unit: "lbs",
    inputType: "decimal",
    aggregate: "latest",
    color: "#64748B",
    decimalPlaces: 1,
    icon: { ios: "scalemass.fill", android: "scale", web: "scale" },
  },
  {
    name: "bloodPressure",
    label: "Blood Pressure",
    unit: "mmHg",
    inputType: "bloodPressure",
    aggregate: "latest",
    color: "#EC4899",
    icon: {
      ios: "heart.text.square.fill",
      android: "monitor_heart",
      web: "monitor_heart",
    },
  },
  {
    name: "sleep",
    label: "Sleep",
    unit: "hrs",
    inputType: "decimal",
    aggregate: "sum",
    color: "#6366F1",
    decimalPlaces: 1,
    icon: { ios: "moon.fill", android: "bedtime", web: "bedtime" },
  },
];

// --- Date utilities ---

/** YYYY-MM-DD from local date fields (not UTC). */
export function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** New Date offset by n days. */
export function addDays(date: Date, n: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + n);
  return result;
}

/** "Today" / "Yesterday" / "Mon Feb 24" */
export function formatDateLabel(date: Date): string {
  const todayKey = localDateKey(new Date());
  const dateKey = localDateKey(date);
  if (dateKey === todayKey) return "Today";
  const yesterday = addDays(new Date(), -1);
  if (dateKey === localDateKey(yesterday)) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** "2:34 PM" */
export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

// --- Storage ---

const kvKey = (name: StatName) => `health:${name}`;

export function readEntries(name: StatName): Entry[] {
  const raw = KVStore.getItemSync(kvKey(name));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Entry[];
  } catch {
    return [];
  }
}

function writeEntries(name: StatName, entries: Entry[]): void {
  KVStore.setItemSync(kvKey(name), JSON.stringify(entries));
}

/** Append a new entry. Pass a custom `ts` for back-dating (e.g. seed data). */
export function addEntry(
  name: StatName,
  value: string,
  dateKey: string,
  ts = Date.now(),
): void {
  const entries = readEntries(name);
  entries.push({ ts, value, dateKey });
  writeEntries(name, entries);
}

/** Remove entry by ts. */
export function deleteEntry(name: StatName, ts: number): void {
  const entries = readEntries(name).filter((e) => e.ts !== ts);
  writeEntries(name, entries);
}

/** All entries for a specific date, sorted oldest→newest. */
export function getEntriesForDay(entries: Entry[], dateKey: string): Entry[] {
  return entries
    .filter((e) => e.dateKey === dateKey)
    .sort((a, b) => a.ts - b.ts);
}

/** Latest raw value for a day, or null. */
export function getLatestForDay(
  entries: Entry[],
  dateKey: string,
): string | null {
  const day = getEntriesForDay(entries, dateKey);
  return day.length > 0 ? day[day.length - 1].value : null;
}

// --- Display formatting ---

/** "—" if null, "120/80" for BP, else the raw string. */
export function formatStatValue(
  config: StatConfig,
  raw: string | null,
): string {
  if (raw === null) return "—";
  if (config.inputType === "bloodPressure") {
    try {
      const { systolic, diastolic } = JSON.parse(raw) as {
        systolic: number;
        diastolic: number;
      };
      return `${systolic}/${diastolic}`;
    } catch {
      return "—";
    }
  }
  return raw;
}

/** Extract a numeric value for charting. BP → systolic, others → parseFloat. */
export function numericValue(config: StatConfig, raw: string): number | null {
  if (config.inputType === "bloodPressure") {
    try {
      return JSON.parse(raw).systolic as number;
    } catch {
      return null;
    }
  }
  const n = parseFloat(raw);
  return isNaN(n) ? null : n;
}

/** Numeric value for charting: sum or latest depending on config.aggregate. */
export function getDayChartValue(
  config: StatConfig,
  entries: Entry[],
  dateKey: string,
): number | null {
  const dayEntries = getEntriesForDay(entries, dateKey);
  if (dayEntries.length === 0) return null;
  if (config.aggregate === "sum") {
    return dayEntries.reduce(
      (sum, e) => sum + (numericValue(config, e.value) ?? 0),
      0,
    );
  }
  return numericValue(config, dayEntries[dayEntries.length - 1].value);
}

/** Display string for the dashboard: summed total or latest, already formatted. */
export function getDayDisplayValue(
  config: StatConfig,
  entries: Entry[],
  dateKey: string,
): string {
  const dayEntries = getEntriesForDay(entries, dateKey);
  if (dayEntries.length === 0) return "—";
  if (config.aggregate === "sum") {
    const total = dayEntries.reduce(
      (sum, e) => sum + (numericValue(config, e.value) ?? 0),
      0,
    );
    return config.decimalPlaces !== undefined
      ? total.toFixed(config.decimalPlaces)
      : String(total);
  }
  return formatStatValue(config, dayEntries[dayEntries.length - 1].value);
}

// --- Seed data ---

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Seed one day's worth of realistic entries into the store. */
function seedDay(date: Date): void {
  const dk = localDateKey(date);
  const Y = date.getFullYear(),
    M = date.getMonth(),
    D = date.getDate();
  const ts = (h: number, m: number) => new Date(Y, M, D, h, m).getTime();

  // Water: 3 entries throughout the day (morning / afternoon / evening)
  addEntry("water", String(rand(1, 3)), dk, ts(8, rand(0, 30)));
  addEntry("water", String(rand(1, 3)), dk, ts(13, rand(0, 30)));
  addEntry("water", String(rand(1, 2)), dk, ts(19, rand(0, 30)));

  // Fruit: 1–2 entries
  addEntry("fruit", String(rand(1, 3)), dk, ts(9, rand(0, 30)));
  if (rand(0, 1)) addEntry("fruit", "1", dk, ts(15, rand(0, 30)));

  // Veggies: 1–2 entries
  addEntry("veggies", String(rand(2, 4)), dk, ts(12, rand(0, 30)));
  if (rand(0, 1))
    addEntry("veggies", String(rand(1, 3)), dk, ts(18, rand(0, 30)));

  // Cardio: skip some days (index into array to control distribution)
  const mins = [0, 0, 20, 30, 30, 45, 60][rand(0, 6)];
  if (mins > 0) addEntry("cardio", String(mins), dk, ts(6, rand(30, 59)));

  // Steps: single daily total
  addEntry("steps", String(rand(4500, 11000)), dk, ts(21, rand(0, 30)));

  // Weight: morning weigh-in
  addEntry(
    "weight",
    (171 + rand(0, 4) + rand(0, 9) / 10).toFixed(1),
    dk,
    ts(7, rand(0, 15)),
  );

  // Blood pressure: morning reading
  addEntry(
    "bloodPressure",
    JSON.stringify({ systolic: rand(115, 130), diastolic: rand(70, 82) }),
    dk,
    ts(8, rand(0, 20)),
  );

  // Sleep: logged in the morning for the previous night
  addEntry("sleep", (6 + rand(0, 30) / 10).toFixed(1), dk, ts(7, rand(20, 50)));
}

const SEED_KEY = "app:seeded";

/** Seeds the past 7 days once (guarded by a KV flag). */
export function seedDataIfNeeded(): void {
  if (KVStore.getItemSync(SEED_KEY)) return;
  const today = new Date();
  for (let daysAgo = 7; daysAgo >= 1; daysAgo--) {
    seedDay(addDays(today, -daysAgo));
  }
  KVStore.setItemSync(SEED_KEY, "1");
}

/** Seeds today's data on every app load, checking each stat independently. */
export function seedTodayIfNeeded(): void {
  const today = new Date();
  const dk = localDateKey(today);
  const Y = today.getFullYear(),
    M = today.getMonth(),
    D = today.getDate();
  const ts = (h: number, m: number) => new Date(Y, M, D, h, m).getTime();
  const missing = (n: StatName) =>
    getEntriesForDay(readEntries(n), dk).length === 0;

  if (missing("water")) {
    addEntry("water", String(rand(1, 3)), dk, ts(8, rand(0, 30)));
    addEntry("water", String(rand(1, 3)), dk, ts(13, rand(0, 30)));
    addEntry("water", String(rand(1, 2)), dk, ts(19, rand(0, 30)));
  }
  if (missing("fruit")) {
    addEntry("fruit", String(rand(1, 3)), dk, ts(9, rand(0, 30)));
    if (rand(0, 1)) addEntry("fruit", "1", dk, ts(15, rand(0, 30)));
  }
  if (missing("veggies")) {
    addEntry("veggies", String(rand(2, 4)), dk, ts(12, rand(0, 30)));
    if (rand(0, 1))
      addEntry("veggies", String(rand(1, 3)), dk, ts(18, rand(0, 30)));
  }
  if (missing("cardio")) {
    const mins = [0, 0, 20, 30, 30, 45, 60][rand(0, 6)];
    if (mins > 0) addEntry("cardio", String(mins), dk, ts(6, rand(30, 59)));
  }
  if (missing("steps")) {
    addEntry("steps", String(rand(4500, 11000)), dk, ts(21, rand(0, 30)));
  }
  if (missing("weight")) {
    addEntry(
      "weight",
      (171 + rand(0, 4) + rand(0, 9) / 10).toFixed(1),
      dk,
      ts(7, rand(0, 15)),
    );
  }
  if (missing("bloodPressure")) {
    addEntry(
      "bloodPressure",
      JSON.stringify({ systolic: rand(115, 130), diastolic: rand(70, 82) }),
      dk,
      ts(8, rand(0, 20)),
    );
  }
  if (missing("sleep")) {
    addEntry(
      "sleep",
      (6 + rand(0, 30) / 10).toFixed(1),
      dk,
      ts(7, rand(20, 50)),
    );
  }
}
