import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store';
import { loanPaid, loanRemaining } from '../../selectors';
import { colors, fontSize, radius, spacing } from '../../theme';
import { formatMoney, sumAmounts } from '../../utils/money';
import { useToday } from '../../utils/useToday';
import { dueInfo } from '../../utils/dueInfo';
import { Loan, LoanDirection } from '../../types';

export default function LoansScreen() {
  const router = useRouter();
  const today = useToday();
  const loans = useStore((s) => s.data.loans);
  const currency = useStore((s) => s.data.currency);
  const [tab, setTab] = useState<LoanDirection>('lent');

  const list = useMemo(() => {
    const filtered = loans.filter((l) => l.direction === tab);
    const active = filtered
      .filter((l) => loanRemaining(l) > 0)
      .sort((a, b) => {
        // ফেরতের তারিখ কাছের আগে, তারিখ নেই এমন সবার শেষে
        if (a.dueDate && b.dueDate) return a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0;
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return b.createdAt - a.createdAt;
      });
    const settled = filtered
      .filter((l) => loanRemaining(l) <= 0)
      .sort((a, b) => b.createdAt - a.createdAt);
    return [...active, ...settled];
  }, [loans, tab]);

  const totalRemaining = useMemo(
    () => sumAmounts(list.map((l) => Math.max(0, loanRemaining(l)))),
    [list]
  );

  const accent = tab === 'lent' ? colors.income : colors.warning;

  const renderItem = ({ item }: { item: Loan }) => {
    const remaining = loanRemaining(item);
    const settled = remaining <= 0;
    const pct = Math.min(100, Math.round((loanPaid(item) / item.principal) * 100));
    const due = settled ? null : dueInfo(item.dueDate, today);

    return (
      <Pressable
        style={[styles.card, settled && { opacity: 0.55 }]}
        onPress={() => router.push({ pathname: '/loan/[id]', params: { id: item.id } })}
      >
        <View style={styles.cardTop}>
          <View style={[styles.avatar, { backgroundColor: accent + '26' }]}>
            <Text style={[styles.avatarText, { color: accent }]}>
              {item.person.trim().charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.person} numberOfLines={1}>{item.person}</Text>
            <Text style={[styles.sub, due && { color: due.color }]}>
              {settled ? 'Settled' : due ? due.text : 'No due date'}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.amount, { color: accent }]}>
              {formatMoney(Math.max(0, remaining), currency)}
            </Text>
            <Text style={styles.sub}>of {formatMoney(item.principal, currency)}</Text>
          </View>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${pct}%`, backgroundColor: accent }]} />
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.tabs}>
        {([['lent', 'To receive'], ['borrowed', 'To pay']] as const).map(([key, label]) => (
          <Pressable
            key={key}
            style={[styles.tab, tab === key && styles.tabActive]}
            onPress={() => setTab(key)}
          >
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.summary}>
        <Text style={styles.sub}>{tab === 'lent' ? 'Total to receive' : 'Total to pay'}</Text>
        <Text style={[styles.summaryValue, { color: accent }]}>{formatMoney(totalRemaining, currency)}</Text>
      </View>

      <FlatList
        data={list}
        keyExtractor={(l) => l.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {tab === 'lent' ? 'Nobody owes you anything' : "You don't owe anybody"}
          </Text>
        }
      />

      <Pressable
        style={styles.fab}
        onPress={() => router.push({ pathname: '/add-loan', params: { direction: tab } })}
      >
        <Ionicons name="add" size={30} color={colors.onAccent} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 4,
    margin: spacing.lg,
    marginBottom: spacing.sm,
  },
  tab: { flex: 1, paddingVertical: spacing.sm + 2, borderRadius: radius.pill, alignItems: 'center' },
  tabActive: { backgroundColor: colors.accent },
  tabText: { color: colors.textMuted, fontSize: fontSize.md, fontWeight: '700' },
  tabTextActive: { color: colors.onAccent },
  summary: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  summaryValue: { fontSize: fontSize.xl, fontWeight: '800', marginTop: 2 },
  list: { padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: 110 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: { fontSize: fontSize.md, fontWeight: '800' },
  person: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  sub: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  amount: { fontSize: fontSize.md, fontWeight: '700' },
  track: {
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill },
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
});