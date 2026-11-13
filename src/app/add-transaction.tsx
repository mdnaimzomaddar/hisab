import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useStore } from '../store';
import { SYSTEM_CATEGORY_IDS } from '../defaults';
import { colors, fontSize, radius, spacing } from '../theme';
import { todayString } from '../utils/date';
import { TransactionType } from '../types';
import { CategoryPicker } from '../components/CategoryPicker';
import { DateField } from '../components/DateField';
import { TypeToggle } from '../components/TypeToggle';

export default function AddTransaction() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const categories = useStore((s) => s.data.categories);
  const transactions = useStore((s) => s.data.transactions);
  const currency = useStore((s) => s.data.currency);
  const addTransaction = useStore((s) => s.addTransaction);
  const updateTransaction = useStore((s) => s.updateTransaction);
  const deleteTransaction = useStore((s) => s.deleteTransaction);

  const editing = useMemo(() => (id ? transactions.find((t) => t.id === id) : undefined), [id, transactions]);

  const [type, setType] = useState<TransactionType>(editing?.type ?? 'expense');
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
  const [categoryId, setCategoryId] = useState<string | undefined>(editing?.categoryId);
  const [note, setNote] = useState(editing?.note ?? '');
  const [date, setDate] = useState(editing?.date ?? todayString());

  useEffect(() => {
    navigation.setOptions({ title: editing ? 'Edit Transaction' : 'Add Transaction' });
  }, [navigation, editing]);

  // সিস্টেম (ধার) ক্যাটেগরি ও লুকানো ক্যাটেগরি বাদ। তবে এডিটের সময় নিজের বর্তমান ক্যাটেগরি লুকানো থাকলেও দেখাবে
  const visible = useMemo(
    () =>
      categories.filter(
        (c) =>
          c.type === type &&
          !SYSTEM_CATEGORY_IDS.includes(c.id) &&
          (!c.archived || c.id === editing?.categoryId)
      ),
    [categories, type, editing]
  );

  const changeType = (t: TransactionType) => {
    setType(t);
    setCategoryId(undefined); // ধরন বদলালে ক্যাটেগরি আবার বাছতে হবে
  };

  const save = () => {
    const value = parseFloat(amount.replace(/,/g, ''));
    if (!value || value <= 0) {
      Alert.alert('Invalid amount', 'Enter an amount greater than 0.');
      return;
    }
    if (!categoryId) {
      Alert.alert('Select a category', 'Please choose a category.');
      return;
    }
    const payload = { type, amount: value, categoryId, note: note.trim(), date };
    if (editing) updateTransaction(editing.id, payload);
    else addTransaction(payload);
    router.back();
  };

  const remove = () => {
    if (!editing) return;
    Alert.alert('Delete transaction?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteTransaction(editing.id);
          router.back();
        },
      },
    ]);
  };

  if (id && !editing) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Transaction not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <TypeToggle value={type} onChange={changeType} />

      <Text style={styles.label}>Amount</Text>
      <View style={styles.amountBox}>
        <Text style={styles.currency}>{currency}</Text>
        <TextInput
          style={styles.amountInput}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={colors.textMuted}
          autoFocus={!editing}
        />
      </View>

      <Text style={[styles.label, { marginBottom: spacing.md }]}>Category</Text>
      <CategoryPicker categories={visible} selectedId={categoryId} onSelect={setCategoryId} />

      <DateField label="Date" value={date} onChange={(v) => v && setDate(v)} />

      <Text style={styles.label}>Note (optional)</Text>
      <TextInput
        style={styles.input}
        value={note}
        onChangeText={setNote}
        placeholder="e.g. Lunch with friends"
        placeholderTextColor={colors.textMuted}
      />

      <Pressable style={styles.saveBtn} onPress={save}>
        <Text style={styles.saveText}>{editing ? 'Save Changes' : 'Save'}</Text>
      </Pressable>

      {editing && (
        <Pressable style={styles.deleteBtn} onPress={remove}>
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 60 },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  muted: { color: colors.textMuted },
  label: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.lg, marginBottom: spacing.xs },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
  },
  currency: { color: colors.textMuted, fontSize: fontSize.xl, marginRight: spacing.sm },
  amountInput: { flex: 1, color: colors.text, fontSize: fontSize.xl, fontWeight: '700', paddingVertical: spacing.md },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveText: { color: colors.onAccent, fontSize: fontSize.md, fontWeight: '800' },
  deleteBtn: { alignItems: 'center', paddingVertical: spacing.lg, marginTop: spacing.sm },
  deleteText: { color: colors.expense, fontSize: fontSize.md, fontWeight: '700' },
});