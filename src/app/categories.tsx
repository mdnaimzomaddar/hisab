import { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { SYSTEM_CATEGORY_IDS } from '../defaults';
import { categoryColors, categoryIcons, colors, fontSize, radius, spacing } from '../theme';
import { Category, TransactionType } from '../types';
import { TypeToggle } from '../components/TypeToggle';

interface Draft {
  id?: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  isDefault: boolean;
}

const emptyDraft = (type: TransactionType): Draft => ({
  name: '',
  type,
  icon: categoryIcons[0],
  color: categoryColors[0],
  isDefault: false,
});

export default function CategoriesScreen() {
  const categories = useStore((s) => s.data.categories);
  const addCategory = useStore((s) => s.addCategory);
  const updateCategory = useStore((s) => s.updateCategory);
  const setCategoryArchived = useStore((s) => s.setCategoryArchived);

  const [tab, setTab] = useState<TransactionType>('expense');
  const [draft, setDraft] = useState<Draft | null>(null);

  const list = useMemo(
    () =>
      categories
        .filter((c) => c.type === tab && !SYSTEM_CATEGORY_IDS.includes(c.id))
        .sort((a, b) => Number(a.archived) - Number(b.archived)),
    [categories, tab]
  );

  const openEdit = (c: Category) =>
    setDraft({ id: c.id, name: c.name, type: c.type, icon: c.icon, color: c.color, isDefault: c.isDefault });

  const save = () => {
    if (!draft) return;
    const name = draft.name.trim();
    if (!name) {
      Alert.alert('Name required', 'Enter a category name.');
      return;
    }
    if (draft.id) {
      // ডিফল্ট ক্যাটেগরিতেও নাম, আইকন ও রং বদলানো যাবে; type বদলানো যাবে না
      updateCategory(draft.id, { name, icon: draft.icon, color: draft.color });
    } else {
      addCategory({ name, type: draft.type, icon: draft.icon, color: draft.color });
    }
    setDraft(null);
  };

  const toggleArchive = (c: Category) => {
    if (c.archived) {
      setCategoryArchived(c.id, false);
      return;
    }
    Alert.alert(
      'Hide category?',
      'It will no longer appear when adding transactions. Old transactions keep their category.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Hide', style: 'destructive', onPress: () => setCategoryArchived(c.id, true) },
      ]
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.toggleWrap}>
        <TypeToggle value={tab} onChange={setTab} />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {list.map((c) => (
          <Pressable key={c.id} style={[styles.row, c.archived && { opacity: 0.45 }]} onPress={() => openEdit(c)}>
            <View style={[styles.iconWrap, { backgroundColor: c.color + '26' }]}>
              <Ionicons name={c.icon as any} size={20} color={c.color} />
            </View>
            <Text style={styles.name}>{c.name}</Text>
            {c.isDefault ? (
              <Text style={styles.tag}>Default</Text>
            ) : (
              <Pressable hitSlop={10} onPress={() => toggleArchive(c)}>
                <Ionicons
                  name={c.archived ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={colors.textMuted}
                />
              </Pressable>
            )}
          </Pressable>
        ))}
      </ScrollView>

      <Pressable style={styles.addBtn} onPress={() => setDraft(emptyDraft(tab))}>
        <Ionicons name="add" size={22} color={colors.onAccent} />
        <Text style={styles.addText}>New Category</Text>
      </Pressable>

      <Modal visible={!!draft} transparent animationType="slide" onRequestClose={() => setDraft(null)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.sheetTitle}>{draft?.id ? 'Edit Category' : 'New Category'}</Text>

              {draft && (
                <>
                  <View style={styles.preview}>
                    <View style={[styles.previewCircle, { backgroundColor: draft.color + '26' }]}>
                      <Ionicons name={draft.icon as any} size={32} color={draft.color} />
                    </View>
                  </View>

                  <Text style={styles.label}>Name</Text>
                  <TextInput
                    style={styles.input}
                    value={draft.name}
                    onChangeText={(v) => setDraft({ ...draft, name: v })}
                    placeholder="Category name"
                    placeholderTextColor={colors.textMuted}
                    maxLength={24}
                  />

                  <Text style={styles.label}>Color</Text>
                  <View style={styles.wrapRow}>
                    {categoryColors.map((col) => (
                      <Pressable
                        key={col}
                        onPress={() => setDraft({ ...draft, color: col })}
                        style={[
                          styles.colorDot,
                          { backgroundColor: col },
                          draft.color === col && styles.colorDotActive,
                        ]}
                      />
                    ))}
                  </View>

                  <Text style={styles.label}>Icon</Text>
                  <View style={styles.wrapRow}>
                    {categoryIcons.map((ic) => {
                      const active = draft.icon === ic;
                      return (
                        <Pressable
                          key={ic}
                          onPress={() => setDraft({ ...draft, icon: ic })}
                          style={[
                            styles.iconChoice,
                            active && { backgroundColor: draft.color + '33', borderColor: draft.color },
                          ]}
                        >
                          <Ionicons name={ic as any} size={22} color={active ? draft.color : colors.textMuted} />
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}

              <View style={styles.sheetButtons}>
                <Pressable style={styles.cancelBtn} onPress={() => setDraft(null)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.saveBtn} onPress={save}>
                  <Text style={styles.saveText}>Save</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  toggleWrap: { padding: spacing.lg, paddingBottom: spacing.sm },
  list: { padding: spacing.lg, paddingBottom: 110 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  name: { flex: 1, color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  tag: { color: colors.textMuted, fontSize: fontSize.xs },
  addBtn: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
  },
  addText: { color: colors.onAccent, fontSize: fontSize.md, fontWeight: '800' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surfaceAlt,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: '90%',
  },
  sheetTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '800', marginBottom: spacing.md },
  preview: { alignItems: 'center', marginBottom: spacing.sm },
  previewCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.md, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
  },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  colorDot: { width: 36, height: 36, borderRadius: radius.pill, borderWidth: 3, borderColor: 'transparent' },
  colorDotActive: { borderColor: colors.text },
  iconChoice: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  sheetButtons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl, marginBottom: spacing.sm },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  cancelText: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  saveBtn: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: colors.accent,
  },
  saveText: { color: colors.onAccent, fontSize: fontSize.md, fontWeight: '800' },
});