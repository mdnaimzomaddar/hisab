import { Loan, Transaction } from './types';
import { roundMoney, sumAmounts } from './utils/money';
import { DateRange, MONTHS, addDays, daysBetween, inRange, parseDateString } from './utils/date';
// আয়-খরচের যোগফল। ডিফল্টে ধারের লেনদেন বাদ যায়, যাতে ধার দেওয়া "খরচ" বা ধার নেওয়া "আয়" হিসেবে না গোনা হয়।
export function totals(
  txs: Transaction[],
  opts: { range?: DateRange; includeLoans?: boolean } = {}
) {
  let income = 0;
  let expense = 0;
  for (const t of txs) {
    if (!opts.includeLoans && t.loanId) continue;
    if (opts.range && !inRange(t.date, opts.range)) continue;
    if (t.type === 'income') income += t.amount;
    else expense += t.amount;
  }
  income = roundMoney(income);
  expense = roundMoney(expense);
  return { income, expense, net: roundMoney(income - expense) };
}

// মোট ব্যালেন্স: ধার সহ সব লেনদেন, কারণ হাতের টাকা সত্যিই বাড়ে-কমে
export function balanceOf(txs: Transaction[]): number {
  return totals(txs, { includeLoans: true }).net;
}

export function loanPaid(loan: Loan): number {
  return sumAmounts(loan.payments.map((p) => p.amount));
}

export function loanRemaining(loan: Loan): number {
  return roundMoney(loan.principal - loanPaid(loan));
}

export function loanTotals(loans: Loan[]) {
  let receivable = 0; // পাওনা
  let payable = 0;    // দেনা
  for (const l of loans) {
    const rem = Math.max(0, loanRemaining(l));
    if (l.direction === 'lent') receivable += rem;
    else payable += rem;
  }
  return { receivable: roundMoney(receivable), payable: roundMoney(payable) };
}

// নতুন তারিখ আগে, একই দিনে নতুন লেনদেন আগে
export function sortTransactions(txs: Transaction[]): Transaction[] {
  return [...txs].sort((a, b) =>
    a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1
  );
}

export interface CategoryRow {
  categoryId: string;
  amount: number;
  pct: number; // 0..1
}

// ক্যাটেগরি অনুযায়ী ভাগ (ধারের লেনদেন বাদ)
export function categoryBreakdown(txs: Transaction[], range: DateRange, type: 'income' | 'expense') {
  const map = new Map<string, number>();
  for (const t of txs) {
    if (t.loanId || t.type !== type || !inRange(t.date, range)) continue;
    map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
  }
  const total = roundMoney(Array.from(map.values()).reduce((a, b) => a + b, 0));
  const rows: CategoryRow[] = Array.from(map, ([categoryId, amount]) => ({
    categoryId,
    amount: roundMoney(amount),
    pct: total > 0 ? amount / total : 0,
  })).sort((a, b) => b.amount - a.amount);
  return { total, rows };
}

export interface Bucket {
  key: string;
  label: string;
  income: number;
  expense: number;
}

// চার্টের জন্য: ৩১ দিন বা কমের পিরিয়ডে দিন ধরে, বেশি হলে মাস ধরে
export function buckets(txs: Transaction[], range: DateRange): Bucket[] {
  const days = daysBetween(range.from, range.to) + 1;
  const monthly = days > 31;
  const list: Bucket[] = [];
  const index = new Map<string, Bucket>();

  if (monthly) {
    const s = parseDateString(range.from);
    const e = parseDateString(range.to);
    let y = s.getFullYear();
    let m = s.getMonth();
    while (y < e.getFullYear() || (y === e.getFullYear() && m <= e.getMonth())) {
      const key = `${y}-${String(m + 1).padStart(2, '0')}`;
      const b: Bucket = { key, label: MONTHS[m], income: 0, expense: 0 };
      list.push(b);
      index.set(key, b);
      m++;
      if (m > 11) { m = 0; y++; }
    }
  } else {
    for (let i = 0; i < days; i++) {
      const d = addDays(range.from, i);
      const b: Bucket = { key: d, label: String(parseDateString(d).getDate()), income: 0, expense: 0 };
      list.push(b);
      index.set(d, b);
    }
  }

  for (const t of txs) {
    if (t.loanId || !inRange(t.date, range)) continue;
    const b = index.get(monthly ? t.date.slice(0, 7) : t.date);
    if (!b) continue;
    if (t.type === 'income') b.income += t.amount;
    else b.expense += t.amount;
  }
  return list.map((b) => ({ ...b, income: roundMoney(b.income), expense: roundMoney(b.expense) }));
}