import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing, lazyStyles } from "../theme";
import { Category, Transaction } from "../types";
import { formatDisplay } from "../utils/date";
import { formatMoney } from "../utils/money";

interface Props {
  tx: Transaction;
  category?: Category;
  currency: string;
  showDate?: boolean;
  onPress?: () => void;
}

function TransactionRowBase({
  tx,
  category,
  currency,
  showDate,
  onPress,
}: Props) {
  const color = category?.color ?? colors.textMuted;
  const isIncome = tx.type === "income";
  const amountText = isIncome
    ? `+${formatMoney(tx.amount, currency)}`
    : formatMoney(-tx.amount, currency);

  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: color + "26" }]}>
        <Ionicons
          name={(category?.icon ?? "help-circle") as any}
          size={20}
          color={color}
        />
      </View>
      <View style={styles.middle}>
        <Text style={styles.name} numberOfLines={1}>
          {category?.name ?? "Unknown"}
        </Text>
        {(tx.note || showDate) && (
          <Text style={styles.sub} numberOfLines={1}>
            {[showDate ? formatDisplay(tx.date) : "", tx.note]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        )}
      </View>
      <Text
        style={[
          styles.amount,
          { color: isIncome ? colors.income : colors.expense },
        ]}
      >
        {amountText}
      </Text>
    </Pressable>
  );
}

export const TransactionRow = memo(TransactionRowBase);

const styles = lazyStyles(() =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacing.md,
    },
    middle: { flex: 1, marginRight: spacing.sm },
    name: { color: colors.text, fontSize: fontSize.md, fontWeight: "600" },
    sub: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
    amount: { fontSize: fontSize.md, fontWeight: "700" },
  }),
);
