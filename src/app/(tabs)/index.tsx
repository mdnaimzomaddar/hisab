import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TransactionRow } from "../../components/TransactionRow";
import {
  balanceOf,
  loanTotals,
  sortTransactions,
  totals,
} from "../../selectors";
import { useStore } from "../../store";
import { colors, fontSize, lazyStyles, radius, spacing } from "../../theme";
import { Transaction } from "../../types";
import { addDays, formatDisplay } from "../../utils/date";
import { formatMoney, roundMoney } from "../../utils/money";
import { useToday } from "../../utils/useToday";

export default function Dashboard() {
  const router = useRouter();
  const today = useToday();

  const transactions = useStore((s) => s.data.transactions);
  const categories = useStore((s) => s.data.categories);
  const loans = useStore((s) => s.data.loans);
  const currency = useStore((s) => s.data.currency);

  // null = আজ (রাত ১২টার পর নিজে নতুন দিনে যাবে)
  const [selected, setSelected] = useState<string | null>(null);
  const day = selected ?? today;
  const isToday = day >= today;

  const catMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );
  const balance = useMemo(() => balanceOf(transactions), [transactions]);
  const overall = useMemo(() => totals(transactions), [transactions]); // ধার বাদে, সারা জীবন
  const loanAdjust = roundMoney(balance - overall.net);
  const dayTotals = useMemo(
    () => totals(transactions, { range: { from: day, to: day } }),
    [transactions, day],
  );
  const dayList = useMemo(
    () => sortTransactions(transactions.filter((t) => t.date === day)),
    [transactions, day],
  );
  const loanSummary = useMemo(() => loanTotals(loans), [loans]);

  const dayTitle = isToday
    ? "Today"
    : day === addDays(today, -1)
      ? "Yesterday"
      : formatDisplay(day);

  const goPrev = () => setSelected(addDays(day, -1));
  const goNext = () => {
    const next = addDays(day, 1);
    setSelected(next >= today ? null : next);
  };

  const onPressTx = (t: Transaction) => {
    if (t.loanId)
      router.push({ pathname: "/loan/[id]", params: { id: t.loanId } });
    else router.push({ pathname: "/add-transaction", params: { id: t.id } });
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Hisab</Text>
            <Text style={styles.subtitle}>{formatDisplay(today)}</Text>
          </View>
          <View style={styles.headerIcons}>
            <Pressable
              style={styles.iconBtn}
              onPress={() => router.push("/categories")}
            >
              <Ionicons
                name="pricetags-outline"
                size={22}
                color={colors.text}
              />
            </Pressable>
            <Pressable
              style={styles.iconBtn}
              onPress={() => router.push("/settings")}
            >
              <Ionicons name="settings-outline" size={22} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {/* Overview */}
        <View style={styles.card}>
          <Text style={styles.label}>Total Balance</Text>
          <Text
            style={[styles.bigValue, balance < 0 && { color: colors.expense }]}
          >
            {formatMoney(balance, currency)}
          </Text>

          <View style={styles.splitRow}>
            <View style={styles.splitItem}>
              <Ionicons
                name="arrow-down-circle"
                size={20}
                color={colors.income}
              />
              <View style={{ marginLeft: spacing.sm }}>
                <Text style={styles.smallLabel}>Total Income</Text>
                <Text style={[styles.smallValue, { color: colors.income }]}>
                  {formatMoney(overall.income, currency)}
                </Text>
              </View>
            </View>
            <View style={styles.splitItem}>
              <Ionicons
                name="arrow-up-circle"
                size={20}
                color={colors.expense}
              />
              <View style={{ marginLeft: spacing.sm }}>
                <Text style={styles.smallLabel}>Total Expense</Text>
                <Text style={[styles.smallValue, { color: colors.expense }]}>
                  {formatMoney(overall.expense, currency)}
                </Text>
              </View>
            </View>
          </View>

          {loanAdjust !== 0 && (
            <Text style={styles.loanNote}>
              Includes {formatMoney(loanAdjust, currency)} from loans
            </Text>
          )}
        </View>

        {/* Loans summary */}
        <Pressable style={styles.loanRow} onPress={() => router.push("/loans")}>
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

        {/* Day report with navigation */}
        <View style={styles.card}>
          <View style={styles.dayNav}>
            <Pressable hitSlop={12} onPress={goPrev}>
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </Pressable>
            <View style={{ alignItems: "center" }}>
              <Text style={styles.dayTitle}>{dayTitle}</Text>
              {!isToday && (
                <Pressable onPress={() => setSelected(null)} hitSlop={8}>
                  <Text style={styles.link}>Back to today</Text>
                </Pressable>
              )}
            </View>
            <Pressable
              hitSlop={12}
              onPress={goNext}
              disabled={isToday}
              style={isToday && { opacity: 0.25 }}
            >
              <Ionicons name="chevron-forward" size={24} color={colors.text} />
            </Pressable>
          </View>

          <Text
            style={[
              styles.bigValue,
              { color: dayTotals.net < 0 ? colors.expense : colors.text },
            ]}
          >
            {formatMoney(dayTotals.net, currency)}
          </Text>
          <View style={styles.splitRow}>
            <View style={styles.splitItem}>
              <Ionicons
                name="arrow-down-circle"
                size={18}
                color={colors.income}
              />
              <View style={{ marginLeft: spacing.sm }}>
                <Text style={styles.smallLabel}>Income</Text>
                <Text style={[styles.smallValue, { color: colors.income }]}>
                  {formatMoney(dayTotals.income, currency)}
                </Text>
              </View>
            </View>
            <View style={styles.splitItem}>
              <Ionicons
                name="arrow-up-circle"
                size={18}
                color={colors.expense}
              />
              <View style={{ marginLeft: spacing.sm }}>
                <Text style={styles.smallLabel}>Expense</Text>
                <Text style={[styles.smallValue, { color: colors.expense }]}>
                  {formatMoney(dayTotals.expense, currency)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Transactions of the selected day */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {isToday
              ? "Today's transactions"
              : `Transactions · ${formatDisplay(day)}`}
          </Text>
          <Pressable onPress={() => router.push("/transactions")}>
            <Text style={styles.link}>See all</Text>
          </Pressable>
        </View>

        {dayList.length === 0 ? (
          <Text style={styles.empty}>
            No transactions {isToday ? "today" : "on this day"}
          </Text>
        ) : (
          dayList.map((t) => (
            <TransactionRow
              key={t.id}
              tx={t}
              category={catMap.get(t.categoryId)}
              currency={currency}
              onPress={() => onPressTx(t)}
            />
          ))
        )}
      </ScrollView>

      <Pressable
        style={styles.fab}
        onPress={() => router.push("/add-transaction")}
      >
        <Ionicons name="add" size={30} color={colors.onAccent} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = lazyStyles(() =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.lg, paddingBottom: 110 },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.lg,
    },
    title: { color: colors.text, fontSize: fontSize.xl, fontWeight: "800" },
    subtitle: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 2 },
    headerIcons: { flexDirection: "row", gap: spacing.sm },
    iconBtn: {
      width: 42,
      height: 42,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    label: { color: colors.textMuted, fontSize: fontSize.sm },
    bigValue: {
      color: colors.text,
      fontSize: fontSize.xxl,
      fontWeight: "800",
      marginTop: spacing.xs,
    },
    splitRow: { flexDirection: "row", marginTop: spacing.lg },
    splitItem: { flex: 1, flexDirection: "row", alignItems: "center" },
    smallLabel: { color: colors.textMuted, fontSize: fontSize.xs },
    smallValue: { fontSize: fontSize.md, fontWeight: "700", marginTop: 2 },
    loanNote: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
      marginTop: spacing.md,
    },
    loanRow: { flexDirection: "row", gap: spacing.md },
    loanCard: { flex: 1 },
    dayNav: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.xs,
    },
    dayTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: "700" },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: spacing.sm,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: fontSize.md,
      fontWeight: "700",
      flex: 1,
    },
    link: { color: colors.accent, fontSize: fontSize.sm, fontWeight: "600" },
    empty: {
      color: colors.textMuted,
      textAlign: "center",
      paddingVertical: spacing.xl,
    },
    fab: {
      position: "absolute",
      right: spacing.lg,
      bottom: spacing.xl,
      width: 60,
      height: 60,
      borderRadius: radius.pill,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
      elevation: 6,
    },
  }),
);
