import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useStore } from '../store';
import { loanPaid } from '../selectors';
import { colors, fontSize, radius, spacing } from '../theme';
import { todayString } from '../utils/date';
import { formatMoney } from '../utils/money';
import { LoanDirection } from '../types';
import { DateField } from '../components/DateField';
import { ensureNotificationPermission, refreshReminder } from '../notifications';
import { lazyStyles } from '../theme';
export default function AddLoan() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id, direction: dirParam } = useLocalSearchParams<{ id?: string; direction?: string }>();

  const loans = useStore((s) => s.data.loans);
  const currency = useStore((s) => s.data.currency);
  const addLoan = useStore((s) => s.addLoan);
  const updateLoan = useStore((s) => s.updateLoan);

  const editing = useMemo(() => (id ? loans.find((l) => l.id === id) : undefined), [id, loans]);

  const [direction, setDirection] = useState<LoanDirection>(
    editing?.direction ?? (dirParam === 'borrowed' ? 'borrowed' : 'lent')
  );
  const [person, setPerson] = useState(editing?.person ?? '');
  const [amount, setAmount] = useState(editing ? String(editing.principal) : '');
  const [date, setDate] = useState(editing?.date ?? todayString());
  const [dueDate, setDueDate] = useState(editing?.dueDate ?? '');
  const [note, setNote] = useState(editing?.note ?? '');

  useEffect(() => {
    navigation.setOptions({ title: editing ? 'Edit Loan' : 'Add Loan' });
  }, [navigation, editing]);

  const save = async () => {
    const name = person.trim();
    const value = parseFloat(amount.replace(/,/g, ''));

    if (!name) return Alert.alert('Name required', 'Enter the person’s name.');
    if (!value || value <= 0) return Alert.alert('Invalid amount', 'Enter an amount greater than 0.');
    if (dueDate && dueDate < date) {
      return Alert.alert('Check dates', 'Due date cannot be before the loan date.');
    }
    if (editing) {
      const paid = loanPaid(editing);
      if (value < paid) {
        return Alert.alert('Amount too low', `${formatMoney(paid, currency)} has already been paid back.`);
      }
    }

    let loanId: string;
    if (editing) {
      updateLoan(editing.id, {
        person: name,
        principal: value,
        date,
        dueDate: dueDate || undefined,
        note: note.trim(),
      });
      loanId = editing.id;
    } else {
      loanId = addLoan({
        direction,
        person: name,
        principal: value,
        date,
        dueDate: dueDate || undefined,
        note: note.trim(),
      });
    }

    if (dueDate) {
      const ok = await ensureNotificationPermission();
      if (!ok) {
        Alert.alert(
          'Reminder not set',
          'Notification permission is off. Turn it on in phone Settings > Apps > Hisab > Notifications to get reminders.'
        );
      }
    }
    await refreshReminder(loanId);
    router.back();
  };

  if (id && !editing) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Loan not found</Text>
      </View>
    );
  }

  const isLent = direction === 'lent';

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {editing ? (
        <Text style={styles.fixedType}>{isLent ? 'Money you lent' : 'Money you borrowed'}</Text>
      ) : (
        <View style={styles.toggle}>
          {([['lent', 'I lent', colors.income], ['borrowed', 'I borrowed', colors.warning]] as const).map(
            ([key, label, color]) => (
              <Pressable
                key={key}
                style={[styles.toggleItem, direction === key && { backgroundColor: color }]}
                onPress={() => setDirection(key)}
              >
                <Text style={[styles.toggleText, direction === key && { color: colors.onAccent }]}>{label}</Text>
              </Pressable>
            )
          )}
        </View>
      )}

      <Text style={styles.label}>{isLent ? 'Who did you lend to?' : 'Who did you borrow from?'}</Text>
      <TextInput
        style={styles.input}
        value={person}
        onChangeText={setPerson}
        placeholder="Name"
        placeholderTextColor={colors.textMuted}
        maxLength={40}
      />

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
        />
      </View>

      <DateField label={isLent ? 'Date lent' : 'Date borrowed'} value={date} onChange={(v) => v && setDate(v)} />
      <DateField label="Due date (optional, sets a reminder)" value={dueDate} onChange={setDueDate} allowClear />

      <Text style={styles.label}>Note (optional)</Text>
      <TextInput
        style={styles.input}
        value={note}
        onChangeText={setNote}
        placeholder="e.g. For rent"
        placeholderTextColor={colors.textMuted}
      />

      <Pressable style={styles.saveBtn} onPress={save}>
        <Text style={styles.saveText}>{editing ? 'Save Changes' : 'Save'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = lazyStyles(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 60 },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  muted: { color: colors.textMuted },
  fixedType: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center' },
  toggle: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.pill, padding: 4 },
  toggleItem: { flex: 1, paddingVertical: spacing.sm + 2, borderRadius: radius.pill, alignItems: 'center' },
  toggleText: { color: colors.textMuted, fontSize: fontSize.md, fontWeight: '700' },
  label: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.lg, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
  },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
  },
  currency: { color: colors.textMuted, fontSize: fontSize.xl, marginRight: spacing.sm },
  amountInput: { flex: 1, color: colors.text, fontSize: fontSize.xl, fontWeight: '700', paddingVertical: spacing.md },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveText: { color: colors.onAccent, fontSize: fontSize.md, fontWeight: '800' },
}));