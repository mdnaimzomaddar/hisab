import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { cancelAllReminders, resyncAllReminders } from "../notifications";
import { isValidAppData } from "../storage";
import { useStore } from "../store";
import { colors, fontSize, lazyStyles, radius, spacing } from "../theme";
import { ThemePref, useThemeStore } from "../themeStore";
import { todayString } from "../utils/date";

const CURRENCIES = ["৳", "$", "₹", "€", "£", "¥"];

export default function SettingsScreen() {
  const router = useRouter();
  const data = useStore((s) => s.data);
  const setCurrency = useStore((s) => s.setCurrency);
  const replaceData = useStore((s) => s.replaceData);
  const resetAll = useStore((s) => s.resetAll);
  const pref = useThemeStore((s) => s.pref);
  const setPref = useThemeStore((s) => s.setPref);
  const [busy, setBusy] = useState(false);

  const backup = async () => {
    try {
      setBusy(true);
      const json = JSON.stringify(
        { ...data, exportedAt: new Date().toISOString() },
        null,
        2,
      );
      const file = new File(Paths.cache, `hisab-backup-${todayString()}.json`);
      if (file.exists) file.delete();
      file.create();
      file.write(json);
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert(
          "Not available",
          "Sharing is not available on this device.",
        );
        return;
      }
      await Sharing.shareAsync(file.uri, {
        mimeType: "application/json",
        dialogTitle: "Save Hisab backup",
      });
    } catch (e) {
      console.warn("backup failed", e);
      Alert.alert("Backup failed", "Could not create the backup file.");
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.[0]) return;
      const uri = res.assets[0].uri;

      let text: string;
      try {
        text = await new File(uri).text();
      } catch {
        text = await (await fetch(uri)).text();
      }

      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        Alert.alert("Invalid file", "This is not a valid Hisab backup.");
        return;
      }
      if (!isValidAppData(parsed)) {
        Alert.alert("Invalid file", "This is not a valid Hisab backup.");
        return;
      }

      Alert.alert(
        "Restore backup?",
        `This replaces ALL current data with the backup:\n${parsed.transactions.length} transactions, ${parsed.loans.length} loans, ${parsed.categories.length} categories.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Restore",
            style: "destructive",
            onPress: async () => {
              setBusy(true);
              try {
                await cancelAllReminders();
                await replaceData(parsed);
                await resyncAllReminders();
                Alert.alert("Restored", "Your data has been restored.");
              } catch (e) {
                console.warn("restore failed", e);
                Alert.alert("Restore failed", "Something went wrong.");
              } finally {
                setBusy(false);
              }
            },
          },
        ],
      );
    } catch (e) {
      console.warn("pick failed", e);
      Alert.alert("Error", "Could not open the file.");
    }
  };

  const reset = () => {
    Alert.alert(
      "Delete all data?",
      "All transactions, loans and custom categories will be erased. Make a backup first.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: "destructive",
          onPress: () =>
            Alert.alert("Are you absolutely sure?", "This cannot be undone.", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete everything",
                style: "destructive",
                onPress: async () => {
                  await cancelAllReminders();
                  await resetAll();
                },
              },
            ]),
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.section}>General</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Currency symbol</Text>
        <View style={styles.chips}>
          {CURRENCIES.map((c) => (
            <Pressable
              key={c}
              style={[styles.chip, data.currency === c && styles.chipActive]}
              onPress={() => setCurrency(c)}
            >
              <Text
                style={[
                  styles.chipText,
                  data.currency === c && { color: colors.onAccent },
                ]}
              >
                {c}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable style={styles.row} onPress={() => router.push("/categories")}>
        <Ionicons name="pricetags-outline" size={22} color={colors.text} />
        <Text style={styles.rowText}>Manage categories</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Pressable>

      <Text style={styles.section}>Appearance</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Theme</Text>
        <View style={styles.chips}>
          {(["system", "light", "dark"] as ThemePref[]).map((p) => (
            <Pressable
              key={p}
              style={[styles.chip, pref === p && styles.chipActive]}
              onPress={() => setPref(p)}
            >
              <Text
                style={[
                  styles.chipText,
                  pref === p && { color: colors.onAccent },
                ]}
              >
                {p === "system" ? "System" : p === "light" ? "Light" : "Dark"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Text style={styles.section}>Backup</Text>
      <Pressable style={styles.row} onPress={backup} disabled={busy}>
        <Ionicons name="cloud-upload-outline" size={22} color={colors.accent} />
        <View style={{ flex: 1 }}>
          <Text style={styles.rowText}>Create backup</Text>
          <Text style={styles.sub}>Save a file to Drive, WhatsApp, etc.</Text>
        </View>
      </Pressable>
      <Pressable style={styles.row} onPress={restore} disabled={busy}>
        <Ionicons
          name="cloud-download-outline"
          size={22}
          color={colors.accent}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.rowText}>Restore from backup</Text>
          <Text style={styles.sub}>Pick a Hisab backup (.json) file</Text>
        </View>
      </Pressable>

      <Text style={styles.section}>Danger zone</Text>
      <Pressable style={styles.row} onPress={reset} disabled={busy}>
        <Ionicons name="trash-outline" size={22} color={colors.expense} />
        <Text style={[styles.rowText, { color: colors.expense }]}>
          Delete all data
        </Text>
      </Pressable>

      <Text style={styles.footer}>
        Hisab v1.0 · {data.transactions.length} transactions ·{" "}
        {data.loans.length} loans{"\n"}
        All data stays on this phone. Make backups regularly.
      </Text>
    </ScrollView>
  );
}

const styles = lazyStyles(() =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.lg, paddingBottom: 60 },
    section: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      fontWeight: "700",
      marginTop: spacing.xl,
      marginBottom: spacing.sm,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.lg,
      marginBottom: spacing.sm,
    },
    label: {
      color: colors.text,
      fontSize: fontSize.md,
      fontWeight: "600",
      marginBottom: spacing.md,
    },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    chip: {
      minWidth: 48,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceAlt,
      alignItems: "center",
    },
    chipActive: { backgroundColor: colors.accent },
    chipText: { color: colors.text, fontSize: fontSize.md, fontWeight: "700" },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.lg,
      marginBottom: spacing.sm,
    },
    rowText: {
      flex: 1,
      color: colors.text,
      fontSize: fontSize.md,
      fontWeight: "600",
    },
    sub: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
    footer: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
      textAlign: "center",
      marginTop: spacing.xxl,
      lineHeight: 18,
    },
  }),
);
