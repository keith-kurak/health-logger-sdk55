# Plan: SwiftUI iOS Files for Index and Stat/[name] Routes

## Context
The app already has cross-platform React Native implementations for the dashboard (`index.tsx`) and stat detail (`stat/[name].tsx`) screens. The goal is to create iOS-specific `.ios.tsx` variants using `@expo/ui/swift-ui` so iOS gets native SwiftUI rendering, while Android and web continue using the existing files unchanged. The `@expo/ui` package (v55.0.1) is already installed.

---

## Files to Create
- `src/app/(tabs)/index.ios.tsx`
- `src/app/stat/[name].ios.tsx`

## Files Unchanged
- `src/app/(tabs)/index.tsx` (Android/web)
- `src/app/stat/[name].tsx` (Android/web)
- All components in `src/components/` (shared)

---

## 1. `index.ios.tsx` — Dashboard Screen

**Reuse all existing logic** from `index.tsx` verbatim (state, `useFocusEffect`, `loadStats`, `localMidnightToday`). Only the JSX changes.

### Layout structure
```
<ThemedView style={{flex:1}}>               ← RN background container
  <SafeAreaView style={{flex:1}}>
    <Host style={{flex:1}}>                  ← SwiftUI root
      <VStack spacing={0}>
        {/* DayNav replicated in SwiftUI */}
        <HStack padding={{horizontal:8, vertical:8}}>
          <Button onPress={goPrev}>
            <Image systemName="chevron.left" />
          </Button>
          <Spacer />
          <Text font={{weight:'semibold'}}>{formatDateLabel(currentDate)}</Text>
          <Spacer />
          <Button onPress={isToday ? undefined : goNext} disabled={isToday}>
            <Image systemName="chevron.right" />
          </Button>
        </HStack>

        {/* Stats list */}
        <List listStyle="insetGrouped">
          <List.ForEach data={STATS}>
            {(config) => (
              <HStack spacing={12}
                contentShape="rect"
                onTapGesture={() => router.push({pathname:'/stat/[name]', params:{name, date}})}>
                {/* Colored SF Symbol icon */}
                <Image systemName={config.icon}
                  foregroundStyle={config.color}
                  background={config.color + '26'}
                  cornerRadius={12}
                  frame={{width:44, height:44}} />
                {/* Label + unit */}
                <VStack alignment="leading" spacing={2}>
                  <Text>{config.label}</Text>
                  <Text font={{size:13}} foregroundStyle="secondary">{config.unit}</Text>
                </VStack>
                <Spacer />
                {/* Display value */}
                <Text font={{size:22, weight:'semibold'}}
                  foregroundStyle={isEmpty ? 'secondary' : 'primary'}>
                  {displayValues[config.name]}
                </Text>
              </HStack>
            )}
          </List.ForEach>
        </List>
      </VStack>
    </Host>
  </SafeAreaView>
</ThemedView>
```

**Key notes:**
- DayNav is rebuilt in SwiftUI (no `RNHostView` needed — it's just chevrons + text)
- `contentShape` + `onTapGesture` on the row `HStack` for full-width tappability
- `disabled` prop on the forward chevron `Button` when `isToday`
- Icon: `Image` with `systemName`, `foregroundStyle`, `background`, `cornerRadius`, `frame` modifiers
- Confirm exact modifier API via https://docs.expo.dev/versions/v55.0.0/sdk/ui/swift-ui/modifiers/index.md before implementing

---

## 2. `stat/[name].ios.tsx` — Stat Detail Screen

**Reuse all existing logic** from `[name].tsx` verbatim (state, `useFocusEffect`, `handleAdd`, `handleDelete`, `dayEntries`).

### Layout structure
```
<>
  <Stack.Screen options={{title: config.label, headerShown:true, ...}} />  ← RN nav header
  <ThemedView style={{flex:1}}>
    <Host style={{flex:1}}>
      <List listStyle="insetGrouped" scrollDismissesKeyboard="interactively">

        {/* Section 1: Date + Chart */}
        <Section header={<Text foregroundStyle="secondary" font={{size:13}}>{longDateLabel}</Text>}>
          <RNHostView matchContents>
            <WeekChart config={config} entries={allEntries} />
          </RNHostView>
        </Section>

        {/* Section 2: Add Entry */}
        <Section header={<Text>Add Entry</Text>}>
          {config.inputType === 'bloodPressure' ? (
            <HStack spacing={8}>
              <VStack alignment="leading">
                <Text foregroundStyle="secondary" font={{size:12}}>Systolic</Text>
                <TextField ref={systolicRef} value={systolic} onChangeText={setSystolic}
                  placeholder="120" keyboardType="number-pad" />
              </VStack>
              <Text font={{size:20}}>  /  </Text>
              <VStack alignment="leading">
                <Text foregroundStyle="secondary" font={{size:12}}>Diastolic</Text>
                <TextField ref={diastolicRef} value={diastolic} onChangeText={setDiastolic}
                  placeholder="80" keyboardType="number-pad" />
              </VStack>
              <Button onPress={handleAdd} buttonStyle="borderedProminent" tint={config.color}>
                <Image systemName="plus" />
              </Button>
            </HStack>
          ) : (
            <HStack spacing={8}>
              <TextField ref={singleRef} value={singleValue} onChangeText={setSingleValue}
                placeholder={`Enter ${config.unit}`}
                keyboardType={config.inputType === 'decimal' ? 'decimal-pad' : 'number-pad'} />
              <Button onPress={handleAdd} buttonStyle="borderedProminent" tint={config.color}>
                <Image systemName="plus" />
              </Button>
            </HStack>
          )}
        </Section>

        {/* Section 3: Entry list with swipe-to-delete */}
        <Section header={<Text>{entriesCountLabel}</Text>}>
          <List.ForEach
            data={dayEntries}
            onDelete={(indices) => handleDelete(dayEntries[indices[0]].ts)}>
            {(entry) => (
              <HStack>
                <Text font={{weight:'semibold'}}>{formatStatValue(config, entry.value)}</Text>
                <Spacer />
                <Text foregroundStyle="secondary" font={{size:13}}>{formatTime(entry.ts)}</Text>
              </HStack>
            )}
          </List.ForEach>
        </Section>

      </List>
    </Host>
  </ThemedView>
</>
```

**Key notes:**
- `Stack.Screen` stays as React Native (outside `Host`) — it controls the native nav header
- `WeekChart` is React Native → embed with `<RNHostView matchContents>`
- `TextFieldRef` (`useRef<TextFieldRef>`) for programmatic field clearing after `handleAdd`
- Swipe-to-delete via `List.ForEach` `onDelete` prop — eliminates the explicit trash button
- `scrollDismissesKeyboard="interactively"` replaces `KeyboardAvoidingView`
- Long date label lives in the chart section's header rather than as a standalone row
- `tint` modifier on `Button` sets the stat's color for the add button

---

## Imports Reference

### index.ios.tsx
```ts
import { Host, VStack, HStack, List, Spacer, Text, Image, Button } from '@expo/ui/swift-ui';
import { background, contentShape, cornerRadius, font, foregroundStyle, frame, onTapGesture, padding } from '@expo/ui/swift-ui/modifiers';
// plus: useFocusEffect, useRouter, useState, useCallback, SafeAreaView, ThemedView
// plus: STATS, StatName, addDays, getDayDisplayValue, localDateKey, readEntries, seedTodayIfNeeded, formatDateLabel
```

### stat/[name].ios.tsx
```ts
import { Host, VStack, HStack, List, Section, Spacer, Text, Image, Button, TextField, TextFieldRef, RNHostView } from '@expo/ui/swift-ui';
import { buttonStyle, font, foregroundStyle, listStyle, scrollDismissesKeyboard, tint } from '@expo/ui/swift-ui/modifiers';
// plus: Stack, useFocusEffect, useLocalSearchParams, useRef, useState, useCallback, ThemedView
// plus: WeekChart, Entry, STATS, StatName, addEntry, deleteEntry, formatStatValue, formatTime, getEntriesForDay, readEntries
```

---

## Verification
1. Run `npx expo run:ios` (native rebuild not needed — package already installed)
2. On iOS simulator: dashboard should render SwiftUI inset-grouped list with DayNav
3. Tap a stat row → stat detail screen opens with SwiftUI list, native text fields
4. Swipe left on an entry → delete action appears (native iOS swipe-to-delete)
5. On Android/web: existing screens render unchanged
6. Date navigation (prev/next) works; next button disabled on today
