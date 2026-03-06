# Plan: Jetpack Compose Android Files for Index and Stat/[name] Routes

## Context
Mirror of the SwiftUI iOS plan (`swiftui-ios-routes.md`), but targeting Android using `@expo/ui/jetpack-compose` (Material 3). Creates `.android.tsx` files so Android gets native Compose rendering while iOS uses the SwiftUI files and web/other platforms use the base `.tsx` files. `@expo/ui` is already installed.

**Key differences from the SwiftUI plan:**
- No built-in swipe-to-delete — `LazyColumn` has no `onDelete`; use a trailing `IconButton` instead
- `TextInput` is uncontrolled (`defaultValue` + `ref.setText()` to clear), not value-controlled
- No `RNHostView` confirmed in the Jetpack Compose bindings — `WeekChart` is rendered as a React Native component *outside* the `Host`, above it in the view hierarchy
- Icons: `SymbolView` (RN) can't be embedded without `RNHostView`; use a colored `Box` rounded rectangle as the icon placeholder (see note below)
- Modifiers are passed via the `modifiers` prop array, not as inline JSX props

**Icon note:** If `RNHostView` is available in `@expo/ui/jetpack-compose` (check the package exports before implementing), wrap `SymbolView` in it for the icon box. If not, use a solid colored `Box` with rounded corners and no icon — it still communicates the stat color clearly.

---

## Files to Create
- `src/app/(tabs)/index.android.tsx`
- `src/app/stat/[name].android.tsx`

## Files Unchanged
- `src/app/(tabs)/index.tsx` (web)
- `src/app/(tabs)/index.ios.tsx` (iOS)
- `src/app/stat/[name].tsx` (web)
- `src/app/stat/[name].ios.tsx` (iOS)
- All components in `src/components/` (shared)

---

## 1. `index.android.tsx` — Dashboard Screen

**Reuse all existing logic** from `index.tsx` verbatim (state, `useFocusEffect`, `loadStats`, `localMidnightToday`). Only the JSX changes.

### Layout structure
```
<ThemedView style={{flex:1}}>
  <SafeAreaView style={{flex:1}}>
    <Host style={{flex:1}}>
      <Column modifiers={[fillMaxSize()]}>

        {/* DayNav in Compose */}
        <Row
          verticalAlignment="center"
          horizontalArrangement="spaceBetween"
          modifiers={[fillMaxWidth(), paddingAll(8)]}>
          <IconButton icon="rounded.ChevronLeft" onPress={goPrev} />
          <Text style={{typography:'titleMedium', fontWeight:'600'}}>
            {formatDateLabel(currentDate)}
          </Text>
          <IconButton
            icon="rounded.ChevronRight"
            onPress={isToday ? undefined : goNext}
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
                onPress={() => router.push({
                  pathname: '/stat/[name]',
                  params: { name: config.name, date: dateKey },
                })}
                modifiers={[fillMaxWidth()]}>
                <ListItem.Leading>
                  {/* Colored icon box — see Icon note above re: SymbolView */}
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
                    style={{typography: 'titleMedium', fontWeight:'600'}}
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
```

**Key notes:**
- `IconButton` with `modifiers={[alpha(0.3)]}` visually disables the forward chevron when `isToday` (no `disabled` prop on `IconButton` — use `alpha` + guard in `onPress`)
- `ListItem` provides `headline` + `supportingText` + `Leading`/`Trailing` slots — no need to build rows manually
- `LazyColumn` efficiently renders the stats list
- `Spacer` is not needed here — `ListItem` handles its own internal layout

---

## 2. `stat/[name].android.tsx` — Stat Detail Screen

**Reuse all existing logic** from `[name].tsx` verbatim. The main structural difference: `WeekChart` (React Native) is rendered *outside* the `Host` as a native RN view above the Compose section. The `Host` handles only the add-entry form and entries list.

### Layout structure
```
<>
  {/* Native nav header — stays RN */}
  <Stack.Screen options={{title: config.label, headerShown: true, ...}} />

  <ThemedView style={{flex:1}}>
    <SafeAreaView style={{flex:1, gap:0}} edges={['bottom']}>

      {/* === React Native section (above Compose) === */}

      {/* Long-form date label */}
      <ThemedText type="small" themeColor="textSecondary" style={styles.dateLabel}>
        {longDateLabel}
      </ThemedText>

      {/* 7-day chart — stays React Native */}
      <WeekChart config={config} entries={allEntries} />

      {/* === Jetpack Compose section === */}
      <Host style={{flex:1}}>
        <LazyColumn
          modifiers={[fillMaxSize()]}
          contentPadding={{top: 16, bottom: 32, start: 16, end: 16}}
          verticalArrangement={{spacedBy: 12}}>

          {/* Add Entry card */}
          <Card modifiers={[fillMaxWidth()]}>
            <Column modifiers={[fillMaxWidth(), paddingAll(16)]}
              verticalArrangement={{spacedBy:8}}>
              <Text style={{typography:'labelLarge'}}>Add Entry</Text>

              {config.inputType === 'bloodPressure' ? (
                <Row verticalAlignment="bottom" horizontalArrangement={{spacedBy:8}}
                  modifiers={[fillMaxWidth()]}>
                  <Column modifiers={[weight(1)]} verticalArrangement={{spacedBy:4}}>
                    <Text style={{typography:'labelSmall'}} color={theme.textSecondary}>
                      Systolic
                    </Text>
                    <TextInput
                      ref={systolicRef}
                      defaultValue={systolic}
                      onChangeText={setSystolic}
                      keyboardType="numeric"
                      modifiers={[fillMaxWidth()]}
                    />
                  </Column>
                  <Text style={{typography:'headlineSmall'}} color={theme.textSecondary}>
                    /
                  </Text>
                  <Column modifiers={[weight(1)]} verticalArrangement={{spacedBy:4}}>
                    <Text style={{typography:'labelSmall'}} color={theme.textSecondary}>
                      Diastolic
                    </Text>
                    <TextInput
                      ref={diastolicRef}
                      defaultValue={diastolic}
                      onChangeText={setDiastolic}
                      keyboardType="numeric"
                      modifiers={[fillMaxWidth()]}
                    />
                  </Column>
                  <Button
                    onPress={handleAdd}
                    variant="default"
                    leadingIcon="rounded.Add"
                    elementColors={{containerColor: config.color, contentColor: '#ffffff'}}
                  />
                </Row>
              ) : (
                <Row verticalAlignment="center" horizontalArrangement={{spacedBy:8}}
                  modifiers={[fillMaxWidth()]}>
                  <TextInput
                    ref={singleRef}
                    defaultValue={singleValue}
                    onChangeText={setSingleValue}
                    keyboardType={config.inputType === 'decimal' ? 'decimal-pad' : 'numeric'}
                    modifiers={[weight(1)]}
                  />
                  <Button
                    onPress={handleAdd}
                    variant="default"
                    leadingIcon="rounded.Add"
                    elementColors={{containerColor: config.color, contentColor: '#ffffff'}}
                  />
                </Row>
              )}
            </Column>
          </Card>

          {/* Entry count label */}
          <Text style={{typography:'labelLarge'}} color={theme.textSecondary}>
            {dayEntries.length === 0
              ? 'No entries'
              : `${dayEntries.length} ${dayEntries.length === 1 ? 'entry' : 'entries'}`}
          </Text>

          {/* Entry rows */}
          {dayEntries.map((entry) => (
            <ListItem
              key={entry.ts}
              headline={formatStatValue(config, entry.value)}
              supportingText={formatTime(entry.ts)}
              modifiers={[fillMaxWidth()]}>
              <ListItem.Trailing>
                <IconButton
                  icon="rounded.Delete"
                  onPress={() => handleDelete(entry.ts)}
                />
              </ListItem.Trailing>
            </ListItem>
          ))}

        </LazyColumn>
      </Host>

    </SafeAreaView>
  </ThemedView>
</>
```

**Key notes:**
- `WeekChart` and date label live *above* the `Host` as plain React Native — no embedding needed
- `TextInput` uses `defaultValue` (uncontrolled); call `ref.current?.setText('')` to clear after `handleAdd`, alongside resetting local state
- `Button` with `elementColors.containerColor` applies the stat color to the add button
- Delete uses `ListItem.Trailing` `IconButton` — no swipe-to-dismiss
- `weight(1)` on `TextInput` in the single-value row makes it fill remaining space next to the button
- `contentPadding` on `LazyColumn` adds safe spacing from screen edges and bottom

---

## Imports Reference

### index.android.tsx
```ts
import { Host, Column, Row, LazyColumn, ListItem, IconButton, Text, Box, Divider } from '@expo/ui/jetpack-compose';
import { alpha, background, clip, fillMaxSize, fillMaxWidth, paddingAll, size } from '@expo/ui/jetpack-compose/modifiers';
import { Shapes } from '@expo/ui/jetpack-compose'; // for RoundedCorner
// plus: useFocusEffect, useRouter, useState, useCallback, SafeAreaView, ThemedView
// plus: STATS, StatName, addDays, getDayDisplayValue, localDateKey, readEntries, seedTodayIfNeeded, formatDateLabel
// plus: useTheme (for theme.textSecondary / theme.text colors)
```

### stat/[name].android.tsx
```ts
import { Host, Column, Row, LazyColumn, ListItem, Card, Button, IconButton, TextInput, TextInputRef, Text } from '@expo/ui/jetpack-compose';
import { fillMaxSize, fillMaxWidth, paddingAll, weight } from '@expo/ui/jetpack-compose/modifiers';
// plus: Stack, useFocusEffect, useLocalSearchParams, useRef, useState, useCallback, StyleSheet
// plus: SafeAreaView, ThemedView, ThemedText, WeekChart
// plus: Entry, STATS, StatName, addEntry, deleteEntry, formatStatValue, formatTime, getEntriesForDay, readEntries
// plus: useTheme
```

---

## handleAdd changes for TextInput ref clearing

Since `TextInput` is uncontrolled, `handleAdd` needs to call `.setText('')` via refs after saving:

```ts
function handleAdd() {
  if (config!.inputType === 'bloodPressure') {
    if (!systolic.trim() || !diastolic.trim()) return;
    addEntry(name, JSON.stringify({ systolic: Number(systolic), diastolic: Number(diastolic) }), date);
    setSystolic(''); diastolicRef.current?.setText(''); systolicRef.current?.setText('');
  } else {
    if (!singleValue.trim()) return;
    addEntry(name, singleValue.trim(), date);
    setSingleValue(''); singleRef.current?.setText('');
  }
  setAllEntries(readEntries(name));
}
```

---

## Verification
1. Run `npx expo run:android`
2. On Android emulator: dashboard renders a `LazyColumn` of `ListItem` rows with DayNav above
3. Tap a stat row → stat detail opens; date label + chart render as RN above the Compose list
4. Add entry: tap add button → entry appears in list, inputs clear
5. Tap trash icon on an entry → entry removed
6. On iOS: SwiftUI files used; on web: base `.tsx` files used
