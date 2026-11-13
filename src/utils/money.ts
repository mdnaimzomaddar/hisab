// ভাসমান সংখ্যার ভুল (0.1 + 0.2) এড়াতে পয়সা পর্যন্ত গোল করা
export function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function sumAmounts(values: number[]): number {
  return roundMoney(values.reduce((a, b) => a + b, 0));
}

// 1234567.5 -> "1,234,567.5"; পূর্ণসংখ্যা হলে দশমিক দেখায় না
export function formatNumber(n: number): string {
  const rounded = roundMoney(Math.abs(n));
  const [intPart, decPart] = rounded.toFixed(2).split('.');
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const dec = decPart === '00' ? '' : `.${decPart}`;
  return `${withCommas}${dec}`;
}

// formatMoney(-1500, '৳') -> "-৳1,500"
export function formatMoney(n: number, currency = '৳'): string {
  const sign = n < 0 ? '-' : '';
  return `${sign}${currency}${formatNumber(n)}`;
}