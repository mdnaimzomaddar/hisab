export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;   // কোন ধরনের লেনদেনে এই ক্যাটেগরি দেখাবে
  icon: string;            // Ionicons এর নাম, যেমন "fast-food"
  color: string;           // hex, যেমন "#FF6B6B"
  isDefault: boolean;      // ডিফল্টগুলো মোছা যাবে না, শুধু বদলানো যাবে
  archived: boolean;       // মোছার বদলে লুকানো, যাতে পুরনো লেনদেনের ক্যাটেগরি না হারায়
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;          // সবসময় ধনাত্মক; চিহ্ন নির্ধারিত হয় type দিয়ে
  categoryId: string;
  note: string;
  date: string;            // "YYYY-MM-DD" (লোকাল তারিখ)
  createdAt: number;       // timestamp, একই দিনের লেনদেন সাজাতে
  loanId?: string;
  paymentId?: string;
}

export type LoanDirection = 'lent' | 'borrowed';
// lent = আমি ধার দিয়েছি (পাওনা), borrowed = আমি ধার নিয়েছি (দেনা)

export interface LoanPayment {
  id: string;
  amount: number;
  date: string;            // "YYYY-MM-DD"
  note: string;
}

export interface Loan {
  id: string;
  direction: LoanDirection;
  person: string;
  principal: number;       // মূল ধারের পরিমাণ
  date: string;            // ধার দেওয়া/নেওয়ার তারিখ
  dueDate?: string;        // ফেরতের তারিখ (ঐচ্ছিক)
  note: string;
  payments: LoanPayment[]; // আংশিক ফেরতের তালিকা
  reminderId?: string;     // নির্ধারিত নোটিফিকেশনের id
  createdAt: number;
}

export interface AppData {
  version: number;         // ব্যাকআপ/মাইগ্রেশনের জন্য
  transactions: Transaction[];
  categories: Category[];
  loans: Loan[];
  currency: string;        // যেমন "৳"
}