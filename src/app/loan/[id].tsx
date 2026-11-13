import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store';
import { loanPaid, loanRemaining } from '../../selectors';
import { colors, fontSize, radius, spacing } from '../../theme';
import { formatDisplay, todayString } from '../../utils/date';
import { formatMoney } from '../../utils/money';
import { useToday } from '../../utils/useToday';
import { dueInfo } from '../../utils/dueInfo';
import { DateField } from '../../components/DateField';
import { cancelReminder, refreshReminder } from '../../notifications';

export default function LoanDetail() {
  const router = useRouter();
  const navigation = useNavigation();
  const today = useToday();
  const { id } = useLocalSearchParams<{ id: string }>();

  const loan = useStore((s) => s.data.loans.find((l) => l.id === id));
  const currency = useStore((s) => s.data.currency);
  const addPayment = useStore((s) => s.addPayment);
  const deletePayment = useStore((s) => s.deletePayment);
  const deleteLoan = useStore((s) => s.deleteLoan);

  const [sheet, setSheet] = useState(false);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayString());
  const [note, setNote] = useState('');

  useEffect(() => {
    navigation.setOptions({ title: loan?.person ?? 'Loan' });
  }, [navigation, loan?.person]);

  const payments = useMemo(
    () =>
      loan
        ? [...loan.payments].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
        : [],
    [loan]
  );

  if (!loan) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Loan not found</Text>
      </View>
    );
  }

  const isLent = loan.direction === 'lent';
  const accent = isLent ? colors.income : colors.warning;
  const paid = loanPaid(loan);
  const remaining = loanRemaining(loan);
  const settled = remaining <= 0;
  const pct = Math.min(100, Math.round((paid / loan.principal) * 100));
  const due = settled ? null : dueInfo(loan.dueDate, today);

  const openSheet = () => {
    setAmount(String(remaining));
    setDate(todayString());
    setNote('');
    setSheet(true);
  };

  const submitPayment = () => {
    const value = parseFloat(amount.replace(/,/g, ''));
    if (!value || value <= 0) {
      Alert.alert('Invalid amount', 'Enter an amount greater than 0.');
      return;
    }
    if (value > remaining + 0.001) {
      Alert.alert('Too much', `Only ${formatMoney(remaining, currency)} is remaining.`);
      return;
    }
    addPayment(loan.id, { amount: value, date, note: note.trim() });
    setSheet(false);
    void refreshReminder(loan.id); // পুরো শোধ হলে রিমাইন্ডার বাতিল হবে
  };

  const removePayment = (paymentId: string) => {
    Alert.alert('Delete payment?', 'The balance will be adjusted back.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deletePayment(loan.id, paymentId);
          void refreshReminder(loan.id);
        },
      },
    ]);
  };

  const removeLoan = () => {
    Alert.alert(
      'Delete this loan?',
      'Its transactions and payments are removed too, and your balance goes back to what it was before this loan.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await cancelReminder(loan.reminderId);
            deleteLoan(loan.id);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>{isLent ? 'Remaining to receive' : 'Remaining to pay'}</Text>
          <Text style={[styles.big, { color: settled ? colors.textMuted : accent }]}>
            {formatMoney(Math.max(0, remaining), currency)}
          </Text>
          {settled && <Text style={styles.settled}>Settled ✓</Text>}

          <View style={styles.track}>
            <View style={[styles.fill, { width: `${pct}%`, backgroundColor: accent }]} />
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>
              {isLent ? 'Received' : 'Paid'} {formatMoney(paid, currency)}
            </Text>
            <Text style={styles.label}>of {formatMoney(loan.principal, currency)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Info label={isLent ? 'Lent on' : 'Borrowed on'} value={formatDisplay(loan.date)} />
          <Info
            label="Due date"
            value={loan.dueDate ? formatDisplay(loan.dueDate) : 'Not set'}
            extra={due?.text}
            extraColor={due?.color}
          />
          {!!loan.note && <Info label="Note" value={loan.note} />}
        </View>

        {!settled && (
          <Pressable style={[styles.primaryBtn, { backgroundColor: accent }]} onPress={openSheet}>
            <Text style={styles.primaryText}>{isLent ? 'Record payment received' : 'Record payment made'}</Text>
          </Pressable>
        )}

        <Text style={styles.section}>Payments</Text>
        {payments.length === 0 ? (
          <Text style={styles.empty}>No payments yet</Text>
        ) : (
          payments.map((p) => (
            <View key={p.id} style={styles.payRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.payAmount}>{formatMoney(p.amount, currency)}</Text>
                <Text style={styles.label}>
                  {formatDisplay(p.date)}
                  {p.note ? ` · ${p.note}` : ''}
                </Text>
              </View>
              <Pressable hitSlop={10} onPress={() => removePayment(p.id)}>
                <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
              </Pressable>
            </View>
          ))
        )}

        <View style={styles.footer}>
          <Pressable
            style={styles.secondaryBtn}
            onPress={() => router.push({ pathname: '/add-loan', params: { id: loan.id } })}
          >
            <Ionicons name="create-outline" size={18} color={colors.text} />
            <Text style={styles.secondaryText}>Edit</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={removeLoan}>
            <Ionicons name="trash-outline" size={18} color={colors.expense} />
            <Text style={[styles.secondaryText, { color: colors.expense }]}>Delete</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={sheet} transparent animationType="slide" onRequestClose={() => setSheet(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.sheetTitle}>{isLent ? 'Payment received' : 'Payment made'}</Text>

              <Text style={styles.fieldLabel}>Amount (max {formatMoney(remaining, currency)})</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholderTextColor={colors.textMuted}
              />

              <DateField label="Date" value={date} onChange={(v) => v && setDate(v)} />

              <Text style={styles.fieldLabel}>Note (optional)</Text>
              <TextInput
                style={styles.input}
                value={note}
                onChangeText={setNote}
                placeholder="e.g. bKash"
                placeholderTextColor={colors.textMuted}
              />

              <View style={styles.sheetButtons}>
                <Pressable style={styles.cancelBtn} onPress={() => setSheet(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.saveBtn} onPress={submitPayment}>
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

function Info({
  label,
  value,
  extra,
  extraColor,
}: {
  label: string;
  value: string;
  extra?: string;
  extraColor?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>
      <View style={{ alignItems: 'flex-end', flexShrink: 1 }}>
        <Text style={styles.infoValue}>{value}</Text>
        {extra ? <Text style={[styles.label, { color: extraColor }]}>{extra}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 60 },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  muted: { color: colors.textMuted },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  label: { color: colors.textMuted, fontSize: fontSize.sm },
  big: { fontSize: fontSize.xxl, fontWeight: '800', marginTop: spacing.xs },
  settled: { color: colors.income, fontWeight: '700', marginTop: spacing.xs },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    marginVertical: spacing.md,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, gap: spacing.lg },
  infoValue: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  primaryBtn: { borderRadius: radius.md, paddingVertical: spacing.lg, alignItems: 'center', marginBottom: spacing.md },
  primaryText: { color: colors.onAccent, fontSize: fontSize.md, fontWeight: '800' },
  section: { color: colors.text, fontSize: fontSize.md, fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.md },
  empty: { color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  payAmount: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  footer: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  secondaryText: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surfaceAlt,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: '90%',
  },
  sheetTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '800', marginBottom: spacing.sm },
  fieldLabel: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.md, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
  },
  sheetButtons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl, marginBottom: spacing.sm },
  cancelBtn: { flex: 1, paddingVertical: spacing.lg, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.surface },
  cancelText: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  saveBtn: { flex: 1, paddingVertical: spacing.lg, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.accent },
  saveText: { color: colors.onAccent, fontSize: fontSize.md, fontWeight: '800' },
});