import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TransactionType } from '../types';
import { colors, fontSize, radius, spacing } from '../theme';

interface Props {
  value: TransactionType;
  onChange: (v: TransactionType) => void;
}

export function TypeToggle({ value, onChange }: Props) {
  const item = (type: TransactionType, label: string, color: string) => {
    const active = value === type;
    return (
      <Pressable
        style={[styles.item, active && { backgroundColor: color }]}
        onPress={() => onChange(type)}
      >
        <Text style={[styles.text, active && { color: colors.onAccent }]}>{label}</Text>
      </Pressable>
    );
  };
  return (
    <View style={styles.wrap}>
      {item('expense', 'Expense', colors.expense)}
      {item('income', 'Income', colors.income)}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 4,
  },
  item: { flex: 1, paddingVertical: spacing.sm + 2, borderRadius: radius.pill, alignItems: 'center' },
  text: { color: colors.textMuted, fontSize: fontSize.md, fontWeight: '700' },
});