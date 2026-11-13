import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store';
import { Bucket, buckets, categoryBreakdown, totals } from '../../selectors';
import { colors, fontSize, radius, spacing } from '../../theme';
import {
  DateRange,
  PeriodKind,
  addDays,
  monthRange,
  rangeLabel,
  shiftRange,
  todayString,
  weekRange,
  yearRange,
} from '../../utils/date';
import { formatMoney } from '../../utils/money';
import { DateField } from '../../components/DateField';

const KINDS: { key: PeriodKind; label: string }[] = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
  { key: 'custom', label: 'Custom' },
];

function rangeFor(kind: PeriodKind): DateRange {
  const today = todayString();
  if (kind === 'week') return weekRange(today);
  if (kind === 'month') return monthRange(today);
  if (kind === 'year') return yearRange(today);
  return { from: addDays(today, -29), to: today };
}

export default function ReportsScreen() {
  const transactions = useStore((s) => s.data.transactions);
  const categories = useStore((s) => s.data.categories);
  const currency = useStore((s) => s.data.currency);

  const [kind, setKind] = useState<PeriodKind>('month');
  const [range, setRange] = useState<DateRange>(rangeFor('month'));

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const changeKind = (k: PeriodKind) => {
    setKind(k);
    setRange(rangeFor(k));
  };

  const setFrom = (v: string) => v && setRange((r) => ({ from: v, to: v > r.to ? v : r.to }));
  const setTo = (v: string) => v && setRange((r) => ({ from: v < r.from ? v : r.from, to: v }));

  const current = useMemo(() => totals(transactions, { range }), [transactions, range]);
  const previous = useMemo(
    () => totals(transactions, { range: shiftRange(kind, range, -1) }),
    [transactions, kind, range]
  );
  const data = useMemo(() => buckets(transactions, range), [transactions, range]);
  const expenseRows = useMemo(() => categoryBreakdown(transactions, range, 'expense'), [transactions, range]);
  const incomeRows = useMemo(() => categoryBreakdown(transactions, range, 'income'), [transactions, range]);

  const change =
    previous.expense > 0 ? Math.round(((current.expense - previous.expense) / previous.expense) * 100) : null;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Period type */}
      <View style={styles.kinds}>
        {KINDS.map((k) => (
          <Pressable
            key={k.key}
            style={[styles.kind, kind === k.key && styles.kindActive]}
            onPress={() => changeKind(k.key)}
          >
            <Text style={[styles.kindText, kind === k.key && styles.kindTextActive]}>{k.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Period navigator / custom pickers */}
      {kind === 'custom' ? (
        <View>
          <DateField label="From" value={range.from} onChange={setFrom} />
          <DateField label="To" value={range.to} onChange={setTo} />
        </View>
      ) : (
        <View style={styles.nav}>
          <Pressable hitSlop={12} onPress={() => setRange(shiftRange(kind, range, -1))}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.navText}>{rangeLabel(kind, range)}</Text>
          <Pressable hitSlop={12} onPress={() => setRange(shiftRange(kind, range, 1))}>
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </Pressable>
        </View>
      )}

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.small}>Income</Text>
          <Text style={[styles.summaryValue, { color: colors.income }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatMoney(current.income, currency)}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.small}>Expense</Text>
          <Text style={[styles.summaryValue, { color: colors.expense }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatMoney(current.expense, currency)}
          </Text>
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.small}>Net</Text>
        <Text style={[styles.net, { color: current.net < 0 ? colors.expense : colors.income }]}>
          {formatMoney(current.net, currency)}
        </Text>
        {change !== null && (
          <Text style={[styles.small, { marginTop: spacing.xs }]}>
            Expense {change > 0 ? 'up' : change < 0 ? 'down' : 'unchanged'}
            {change !== 0 ? ` ${Math.abs(change)}%` : ''} vs previous period
          </Text>
        )}
      </View>

      {/* Chart */}
      <View style={styles.card}>
        <View style={styles.legend}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.legendItems}>
            <View style={[styles.dot, { backgroundColor: colors.income }]} />
            <Text style={styles.small}>Income</Text>
            <View style={[styles.dot, { backgroundColor: colors.expense, marginLeft: spacing.md }]} />
            <Text style={styles.small}>Expense</Text>
          </View>
        </View>
        <BarChart data={data} />
      </View>

      {/* Breakdown */}
      <Breakdown
        title="Expense by category"
        total={expenseRows.total}
        rows={expenseRows.rows}
        catMap={catMap}
        currency={currency}
      />
      <Breakdown
        title="Income by category"
        total={incomeRows.total}
        rows={incomeRows.rows}
        catMap={catMap}
        currency={currency}
      />

      <Text style={styles.note}>Loans are not counted as income or expense in reports.</Text>
    </ScrollView>
  );
}

function BarChart({ data }: { data: Bucket[] }) {
  const max = Math.max(0, ...data.flatMap((b) => [b.income, b.expense]));
  const H = 110;
  const step = data.length > 16 ? 5 : data.length > 8 ? 2 : 1; // লেবেল ভিড় কমাতে

  if (max === 0) return <Text style={styles.empty}>No data for this period</Text>;

  return (
    <View style={styles.chart}>
      {data.map((b, i) => (
        <View key={b.key} style={styles.col}>
          <View style={[styles.barArea, { height: H }]}>
            <View style={[styles.bar, { height: Math.max(b.income > 0 ? 2 : 0, (b.income / max) * H), backgroundColor: colors.income }]} />
            <View style={[styles.bar, { height: Math.max(b.expense > 0 ? 2 : 0, (b.expense / max) * H), backgroundColor: colors.expense }]} />
          </View>
          <Text style={styles.barLabel} numberOfLines={1}>
            {i % step === 0 ? b.label : ''}
          </Text>
        </View>
      ))}
    </View>
  );
}

function Breakdown({
  title,
  total,
  rows,
  catMap,
  currency,
}: {
  title: string;
  total: number;
  rows: { categoryId: string; amount: number; pct: number }[];
  catMap: Map<string, { name: string; icon: string; color: string }>;
  currency: string;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.legend}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.small}>{formatMoney(total, currency)}</Text>
      </View>
      {rows.length === 0 ? (
        <Text style={styles.empty}>Nothing here</Text>
      ) : (
        rows.map((r) => {
          const c = catMap.get(r.categoryId);
          const color = c?.color ?? colors.textMuted;
          return (
            <View key={r.categoryId} style={styles.brRow}>
              <View style={[styles.brIcon, { backgroundColor: color + '26' }]}>
                <Ionicons name={(c?.icon ?? 'help-circle') as any} size={18} color={color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.brTop}>
                  <Text style={styles.brName} numberOfLines={1}>{c?.name ?? 'Unknown'}</Text>
                  <Text style={styles.brAmount}>{formatMoney(r.amount, currency)}</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${Math.max(2, Math.round(r.pct * 100))}%`, backgroundColor: color }]} />
                </View>
              </View>
              <Text style={styles.brPct}>{Math.round(r.pct * 100)}%</Text>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 60 },
  kinds: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.pill, padding: 4 },
  kind: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.pill, alignItems: 'center' },
  kindActive: { backgroundColor: colors.accent },
  kindText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '700' },
  kindTextActive: { color: colors.onAccent },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.lg },
  navText: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  summaryCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg },
  summaryValue: { fontSize: fontSize.lg, fontWeight: '800', marginTop: 2 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.md },
  small: { color: colors.textMuted, fontSize: fontSize.xs },
  net: { fontSize: fontSize.xl, fontWeight: '800', marginTop: 2 },
  legend: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  legendItems: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  empty: { color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg },
  chart: { flexDirection: 'row', alignItems: 'flex-end' },
  col: { flex: 1, alignItems: 'center' },
  barArea: { flexDirection: 'row', alignItems: 'flex-end', gap: 1 },
  bar: { width: 4, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  barLabel: { color: colors.textMuted, fontSize: 9, marginTop: 4, width: 30, textAlign: 'center' },
  brRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  brIcon: { width: 34, height: 34, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  brTop: { flexDirection: 'row', justifyContent: 'space-between' },
  brName: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600', flex: 1, marginRight: spacing.sm },
  brAmount: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  brPct: { color: colors.textMuted, fontSize: fontSize.xs, width: 38, textAlign: 'right' },
  track: { height: 5, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, marginTop: 6, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
  note: { color: colors.textMuted, fontSize: fontSize.xs, textAlign: 'center', marginTop: spacing.xl },
});