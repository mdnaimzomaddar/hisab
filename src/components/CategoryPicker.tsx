import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '../types';
import { colors, fontSize, radius, spacing } from '../theme';

interface Props {
  categories: Category[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

export function CategoryPicker({ categories, selectedId, onSelect }: Props) {
  return (
    <View style={styles.grid}>
      {categories.map((c) => {
        const selected = c.id === selectedId;
        return (
          <Pressable key={c.id} style={styles.item} onPress={() => onSelect(c.id)}>
            <View
              style={[
                styles.circle,
                { backgroundColor: c.color + '26' },
                selected && { borderColor: c.color, borderWidth: 2 },
              ]}
            >
              <Ionicons name={c.icon as any} size={24} color={c.color} />
            </View>
            <Text
              style={[styles.name, selected && { color: colors.text, fontWeight: '700' }]}
              numberOfLines={1}
            >
              {c.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  item: { width: '25%', alignItems: 'center', marginBottom: spacing.lg },
  circle: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  name: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.xs, maxWidth: '90%' },
});