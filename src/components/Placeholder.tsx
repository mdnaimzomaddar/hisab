import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize } from '../theme';

export default function Placeholder({ title }: { title: string }) {
  return (
    <View style={styles.root}>
      <Text style={styles.text}>{title}</Text>
      <Text style={styles.sub}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  sub: { color: colors.textMuted, marginTop: 4 },
});