import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppData } from './types';
import { DEFAULT_CATEGORIES } from './defaults';

const STORAGE_KEY = 'hisab:data';
export const CURRENT_VERSION = 1;

export function createInitialData(): AppData {
  return {
    version: CURRENT_VERSION,
    transactions: [],
    categories: DEFAULT_CATEGORIES,
    loans: [],
    currency: '৳',
  };
}

// ব্যাকআপ ফাইল রিস্টোরের সময়ও এটা কাজে লাগবে
export function isValidAppData(x: any): x is AppData {
  return (
    x &&
    typeof x === 'object' &&
    typeof x.version === 'number' &&
    Array.isArray(x.transactions) &&
    Array.isArray(x.categories) &&
    Array.isArray(x.loans)
  );
}

// ভবিষ্যতে ডেটার কাঠামো বদলালে পুরনো ডেটা এখানে আপগ্রেড হবে
export function migrate(data: AppData): AppData {
  return {
    ...data,
    version: CURRENT_VERSION,
    currency: data.currency ?? '৳',
    loans: data.loans.map((l) => ({ ...l, payments: Array.isArray(l.payments) ? l.payments : [] })),
  };
}

// নতুন ডিফল্ট ক্যাটেগরি যোগ হলে ইউজারের পুরনো ডেটায় সেগুলো মিশিয়ে দেয়
function ensureDefaultCategories(data: AppData): AppData {
  const existing = new Set(data.categories.map((c) => c.id));
  const missing = DEFAULT_CATEGORIES.filter((c) => !existing.has(c.id));
  return missing.length ? { ...data, categories: [...data.categories, ...missing] } : data;
}

export async function loadData(): Promise<AppData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialData();
    const parsed = JSON.parse(raw);
    if (!isValidAppData(parsed)) return createInitialData();
    return ensureDefaultCategories(migrate(parsed));
  } catch (e) {
    console.warn('loadData failed', e);
    return createInitialData();
  }
}

export async function saveData(data: AppData): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('saveData failed', e);
  }
}

export async function clearData(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}