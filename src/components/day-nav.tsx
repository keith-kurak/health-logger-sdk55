import { SymbolView } from 'expo-symbols';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDateLabel } from '@/lib/stats';

type DayNavProps = {
  date: Date;
  onPrev: () => void;
  onNext: () => void;
  isToday: boolean;
};

export function DayNav({ date, onPrev, onNext, isToday }: DayNavProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <Pressable onPress={onPrev} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        {Platform.OS === 'ios' ? (
          <SymbolView name="chevron.left" size={20} weight="medium" tintColor={theme.text} />
        ) : (
          <Text style={[styles.chevron, { color: theme.text }]}>{'‹'}</Text>
        )}
      </Pressable>

      <ThemedText type="default" style={styles.label}>
        {formatDateLabel(date)}
      </ThemedText>

      <Pressable
        onPress={isToday ? undefined : onNext}
        style={({ pressed }) => [styles.button, isToday ? styles.disabled : pressed && styles.pressed]}>
        {Platform.OS === 'ios' ? (
          <SymbolView name="chevron.right" size={20} weight="medium" tintColor={theme.text} />
        ) : (
          <Text style={[styles.chevron, { color: theme.text }]}>{'›'}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  button: {
    padding: Spacing.two,
  },
  pressed: {
    opacity: 0.5,
  },
  disabled: {
    opacity: 0.3,
  },
  chevron: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '300',
  },
  label: {
    fontWeight: '600',
  },
});
