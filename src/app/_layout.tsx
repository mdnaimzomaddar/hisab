import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { useStore } from '../store';
import { colors } from '../theme';
import { setupNotifications } from '../notifications';

export default function RootLayout() {
  const router = useRouter();
  const loaded = useStore((s) => s.loaded);
  const init = useStore((s) => s.init);
  const lastResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    setupNotifications();
    init();
  }, [init]);

  // নোটিফিকেশনে চাপলে সেই ধারের স্ক্রিনে যাবে
  useEffect(() => {
    const loanId = lastResponse?.notification.request.content.data?.loanId;
    if (loaded && typeof loanId === 'string') {
      router.push({ pathname: '/loan/[id]', params: { id: loanId } });
    }
  }, [lastResponse, loaded, router]);

  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="add-transaction" options={{ title: 'Add Transaction' }} />
        <Stack.Screen name="add-loan" options={{ title: 'Add Loan' }} />
        <Stack.Screen name="categories" options={{ title: 'Categories' }} />
        <Stack.Screen name="loan/[id]" options={{ title: 'Loan' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
    </>
  );
}