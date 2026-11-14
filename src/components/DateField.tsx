import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors, fontSize, radius, spacing, lazyStyles } from "../theme";
import { formatDisplay, parseDateString, toDateString } from "../utils/date";

interface Props {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  allowClear?: boolean;
}

export function DateField({ value, onChange, label, allowClear }: Props) {
  const [show, setShow] = useState(false);

  const handle = (e: DateTimePickerEvent, d?: Date) => {
    setShow(false);
    if (e.type === "set" && d) onChange(toDateString(d));
  };

  return (
    <>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable style={styles.field} onPress={() => setShow(true)}>
        <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
        <Text style={[styles.text, !value && { color: colors.textMuted }]}>
          {value ? formatDisplay(value) : "Not set"}
        </Text>
        {allowClear && value ? (
          <Pressable onPress={() => onChange("")} hitSlop={10}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </Pressable>
      {show && (
        <DateTimePicker
          value={value ? parseDateString(value) : new Date()}
          mode="date"
          onChange={handle}
        />
      )}
    </>
  );
}

const styles = lazyStyles(() =>
  StyleSheet.create({
    label: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      marginBottom: spacing.xs,
      marginTop: spacing.md,
    },
    field: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      gap: spacing.sm,
    },
    text: { flex: 1, color: colors.text, fontSize: fontSize.md },
  }),
);
