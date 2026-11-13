import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../../store';
import { balanceOf, loanTotals, sortTransactions, totals } from '../../selectors';
import { colors, fontSize, radius, spacing } from '../../theme';
import { formatMoney } from '../../utils/money';
import { formatDisplay } from '../../utils/date';
import { useToday } from '../../utils/useToday';
import { TransactionRow } from '../../components/TransactionRow';

export default function Dashboard() {
  const router = useRouter();
  const today = useToday();

  // শুধু স্থির রেফারেন্স সিলেক্ট করছি; হিসাব নিচে useMemo তে
  const transactions = useStore((s) => s.data.transactions);
  const categories = useStore((s) => s.data.categories);
  const loans = useStore((s) => s.data.loans);
  const currency = useStore((s) => s.data.currency);

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const balance = useMemo(() => balanceOf(transactions), [transactions]);
  const todayTotals = useMemo(
    () => totals(transactions, { range: { from: today, to: today } }),
    [transactions, today]
  );
  const todayList = useMemo(
    () => sortTransactions(transactions.filter((t) => t.date === today)),
    [transactions, today]
  );
  const loanSummary = useMemo(() => loanTotals(loans), [loans]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Hisab</Text>
            <Text style={styles.subtitle}>{formatDisplay(today)}</Text>
          </View>
          <View style={styles.headerIcons}>
            <Pressable style={styles.iconBtn} onPress={() => router.push('/categories')}>
              <Ionicons name="pricetags-outline" size={22} color={colors.text} />
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={() => router.push('/settings')}>
              <Ionicons name="settings-outline" size={22} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {/* Total balance */}
        <View style={styles.card}>
          <Text style={styles.label}>Total Balance</Text>
          <Text style={[styles.bigValue, balance < 0 && { color: colors.expense }]}>
            {formatMoney(balance, currency)}
          </Text>
        </View>

        {/* Today */}
        <View style={styles.card}>
          <Text style={styles.label}>Today</Text>
          <Text
            style={[
              styles.bigValue,
              { color: todayTotals.net < 0 ? colors.expense : colors.text },
            ]}
          >
            {formatMoney(todayTotals.net, currency)}
          </Text>
          <View style={styles.splitRow}>
            <View style={styles.splitItem}>
              <Ionicons name="arrow-down-circle" size={18} color={colors.income} />
              <View style={{ marginLeft: spacing.sm }}>
                <Text style={styles.smallLabel}>Income</Text>
                <Text style={[styles.smallValue, { color: colors.income }]}>
                  {formatMoney(todayTotals.income, currency)}
                </Text>
              </View>
            </View>
            <View style={styles.splitItem}>
              <Ionicons name="arrow-up-circle" size={18} color={colors.expense} />
              <View style={{ marginLeft: spacing.sm }}>
                <Text style={styles.smallLabel}>Expense</Text>
                <Text style={[styles.smallValue, { color: colors.expense }]}>
                  {formatMoney(todayTotals.expense, currency)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Loans summary */}
        <Pressable style={styles.loanRow} onPress={() => router.push('/loans')}>
          <View style={[styles.card, styles.loanCard]}>
            <Text style={styles.smallLabel}>To receive</Text>
            <Text style={[styles.smallValue, { color: colors.income }]}>
              {formatMoney(loanSummary.receivable, currency)}
            </Text>
          </View>
          <View style={[styles.card, styles.loanCard]}>
            <Text style={styles.smallLabel}>To pay</Text>
            <Text style={[styles.smallValue, { color: colors.warning }]}>
              {formatMoney(loanSummary.payable, currency)}
            </Text>
          </View>
        </Pressable>

        {/* Today's transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's transactions</Text>
          <Pressable onPress={() => router.push('/transactions')}>
            <Text style={styles.link}>See all</Text>
          </Pressable>
        </View>

        {todayList.length === 0 ? (
          <Text style={styles.empty}>No transactions today</Text>
        ) : (
          todayList.map((t) => (
            <TransactionRow key={t.id} tx={t} category={catMap.get(t.categoryId)} currency={currency} />
          ))
        )}
      </ScrollView>

      {/* Add button */}
      <Pressable style={styles.fab} onPress={() => router.push('/add-transaction')}>
        <Ionicons name="add" size={30} color={colors.onAccent} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 110 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 2 },
  headerIcons: { flexDirection: 'row', gap: spacing.sm },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  label: { color: colors.textMuted, fontSize: fontSize.sm },
  bigValue: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '800', marginTop: spacing.xs },
  splitRow: { flexDirection: 'row', marginTop: spacing.lg },
  splitItem: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  smallLabel: { color: colors.textMuted, fontSize: fontSize.xs },
  smallValue: { fontSize: fontSize.md, fontWeight: '700', marginTop: 2 },
  loanRow: { flexDirection: 'row', gap: spacing.md },
  loanCard: { flex: 1 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  link: { color: colors.accent, fontSize: fontSize.sm, fontWeight: '600' },
  empty: { color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xl },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
});