import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { loanRemaining } from "./selectors";
import { useStore } from "./store";
import { parseDateString } from "./utils/date";
import { formatMoney } from "./utils/money";

const CHANNEL_ID = "loan-reminders";
// ফেরতের তারিখে সকাল ৯:০০ টায় রিমাইন্ডার
const REMINDER_HOUR = 9;
const REMINDER_MINUTE = 0;

async function ensureChannel() {
  if (Platform.OS !== "android") return;
  try {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Loan reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#3DDC97",
    });
  } catch (e) {
    console.warn("channel setup failed", e);
  }
}

// অ্যাপ চালুর সময় একবার ডাকা হবে
export function setupNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  void ensureChannel();
}

// Android 13+ এ নোটিফিকেশন পারমিশন চাইতে হয়, আর তার আগে চ্যানেল বানানো থাকতে হয়
export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    await ensureChannel();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const req = await Notifications.requestPermissionsAsync();
    return req.granted;
  } catch (e) {
    console.warn("permission failed", e);
    return false;
  }
}

export async function cancelReminder(reminderId?: string) {
  if (!reminderId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(reminderId);
  } catch (e) {
    console.warn("cancelReminder failed", e);
  }
}

// ধারের বর্তমান অবস্থা দেখে রিমাইন্ডার নতুন করে সেট করে:
// পুরনোটা বাতিল, আর বাকি থাকলে এবং তারিখ ভবিষ্যতে হলে নতুনটা সেট
export async function refreshReminder(loanId: string) {
  const { data, setLoanReminder } = useStore.getState();
  const loan = data.loans.find((l) => l.id === loanId);
  if (!loan) return;

  await cancelReminder(loan.reminderId);

  let newId: string | undefined;
  const remaining = loanRemaining(loan);

  if (loan.dueDate && remaining > 0) {
    const when = parseDateString(loan.dueDate);
    when.setHours(REMINDER_HOUR, REMINDER_MINUTE, 0, 0);

    if (when.getTime() > Date.now()) {
      try {
        const perm = await Notifications.getPermissionsAsync();
        if (perm.granted) {
          const amountText = formatMoney(remaining, data.currency);
          newId = await Notifications.scheduleNotificationAsync({
            content: {
              title:
                loan.direction === "lent"
                  ? "Payment due today"
                  : "Repayment due today",
              body:
                loan.direction === "lent"
                  ? `${loan.person} owes you ${amountText}.`
                  : `You owe ${loan.person} ${amountText}.`,
              data: { loanId },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: when,
              channelId: CHANNEL_ID,
            },
          });
        }
      } catch (e) {
        console.warn("schedule failed", e);
      }
    }
  }

  if (newId !== loan.reminderId) setLoanReminder(loanId, newId);
}

export async function cancelAllReminders() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.warn("cancelAll failed", e);
  }
}

export async function resyncAllReminders() {
  const loans = useStore.getState().data.loans;
  for (const l of loans) {
    await refreshReminder(l.id);
  }
}
