const pad = (n: number) => String(n).padStart(2, '0');

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Date -> "YYYY-MM-DD" (লোকাল সময়ে; toISOString ব্যবহার করিনি কারণ ওটা UTC দেয়, রাত ১২টার পর ভুল দিন আসতে পারে)
export function toDateString(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayString(): string {
  return toDateString(new Date());
}

// "YYYY-MM-DD" -> Date (লোকাল মধ্যরাত)
export function parseDateString(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(s: string, days: number): string {
  const d = parseDateString(s);
  d.setDate(d.getDate() + days);
  return toDateString(d);
}

// "13 Nov 2026"
export function formatDisplay(s: string): string {
  const d = parseDateString(s);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export interface DateRange {
  from: string; // অন্তর্ভুক্ত
  to: string;   // অন্তর্ভুক্ত
}

// সপ্তাহ শুরু: ডিফল্ট শনিবার (6)। রবি = 0, সোম = 1 ...
export function weekRange(ref: string, weekStartsOn = 6): DateRange {
  const d = parseDateString(ref);
  const diff = (d.getDay() - weekStartsOn + 7) % 7;
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  return { from: toDateString(start), to: toDateString(end) };
}

export function monthRange(ref: string): DateRange {
  const d = parseDateString(ref);
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { from: toDateString(start), to: toDateString(end) };
}

export function yearRange(ref: string): DateRange {
  const y = parseDateString(ref).getFullYear();
  return { from: `${y}-01-01`, to: `${y}-12-31` };
}

// "YYYY-MM-DD" ফরম্যাটে স্ট্রিং তুলনাই সঠিক তারিখ তুলনা
export function inRange(date: string, range: DateRange): boolean {
  return date >= range.from && date <= range.to;
}
// দুই তারিখের মধ্যে কত দিন (to - from)। গোল করা হয়েছে যাতে ডে-লাইট সেভিং এর ঘণ্টার গরমিল না আসে
export function daysBetween(from: string, to: string): number {
  const a = parseDateString(from).getTime();
  const b = parseDateString(to).getTime();
  return Math.round((b - a) / 86400000);
}

export type PeriodKind = 'week' | 'month' | 'year' | 'custom';

export function addMonths(s: string, n: number): string {
  const d = parseDateString(s);
  return toDateString(new Date(d.getFullYear(), d.getMonth() + n, 1));
}

// dir = 1 পরের পিরিয়ড, -1 আগের পিরিয়ড
export function shiftRange(kind: PeriodKind, range: DateRange, dir: 1 | -1): DateRange {
  if (kind === 'week') return { from: addDays(range.from, 7 * dir), to: addDays(range.to, 7 * dir) };
  if (kind === 'month') return monthRange(addMonths(range.from, dir));
  if (kind === 'year') return yearRange(`${parseDateString(range.from).getFullYear() + dir}-01-01`);
  const len = daysBetween(range.from, range.to) + 1;
  return { from: addDays(range.from, len * dir), to: addDays(range.to, len * dir) };
}

export function rangeLabel(kind: PeriodKind, range: DateRange): string {
  if (kind === 'month') {
    const d = parseDateString(range.from);
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }
  if (kind === 'year') return String(parseDateString(range.from).getFullYear());
  return `${formatDisplay(range.from)} – ${formatDisplay(range.to)}`;
}