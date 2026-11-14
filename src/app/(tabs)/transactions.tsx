import { useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store';
import { sortTransactions, totals } from '../../selectors';
import { colors, fontSize, radius, spacing } from '../../theme';
import { formatDisplay } from '../../utils/date';
import { formatMoney } from '../../utils/money';
import { TransactionRow } from '../../components/TransactionRow';
import { Transaction } from '../../types';
import { lazyStyles } from '../../theme';

type Filter = 'all' | 'income' | 'expense';

export default function TransactionsScreen() {
  const router = useRouter();
  const transactions = useStore((s) => s.data.transactions);
  const categories = useStore((s) => s.data.categories);
  const currency = useStore((s) => s.data.currency);
  const [filter, setFilter] = useState<Filter>('all');

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const sections = useMemo(() => {
    const list = sortTransactions(transactions.filter((t) => filter === 'all' || t.type === filter));
    const groups = new Map<string, Transaction[]>();
    for (const t of list) {
      const arr = groups.get(t.date);
      if (arr) arr.push(t);
      else groups.set(t.date, [t]);
    }
    return Array.from(groups, ([date, data]) => ({
      date,
      data,
      net: totals(data, { includeLoans: true }).net,
    }));
  }, [transactions, filter]);

  const onPressTx = (t: Transaction) => {
    if (t.loanId) {
      router.push({ pathname: '/loan/[id]', params: { id: t.loanId } });
    } else {
      router.push({ pathname: '/add-transaction', params: { id: t.id } });
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.filters}>
        {(['all', 'expense', 'income'] as Filter[]).map((f) => (
          <Pressable
            key={f}
            style={[styles.chip, filter === f && styles.chipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
              {f === 'all' ? 'All' : f === 'expense' ? 'Expense' : 'Income'}
            </Text>
          </Pressable>
        ))}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionDate}>{formatDisplay(section.date)}</Text>
            <Text style={[styles.sectionNet, section.net < 0 && { color: colors.expense }]}>
              {formatMoney(section.net, currency)}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TransactionRow
            tx={item}
            category={catMap.get(item.categoryId)}
            currency={currency}
            onPress={() => onPressTx(item)}
          />
        )}
        ListEmptyComponent={<Text style={styles.empty}>No transactions yet</Text>}
      />

      <Pressable style={styles.fab} onPress={() => router.push('/add-transaction')}>
        <Ionicons name="add" size={30} color={colors.onAccent} />
      </Pressable>
    </View>
  );
}

const styles = lazyStyles(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  filters: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.accent },
  chipText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600' },
  chipTextActive: { color: colors.onAccent },
  list: { padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: 110 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionDate: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600' },
  sectionNet: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600' },
  empty: { color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xxl },
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
}));