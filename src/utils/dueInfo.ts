import { colors } from '../theme';
import { daysBetween, formatDisplay } from './date';

// ফেরতের তারিখ অনুযায়ী লেখা ও রং
export function dueInfo(dueDate: string | undefined, today: string) {
  if (!dueDate) return null;
  const diff = daysBetween(today, dueDate);
  if (diff < 0) {
    const n = -diff;
    return { text: `Overdue by ${n} day${n === 1 ? '' : 's'}`, color: colors.expense };
  }
  if (diff === 0) return { text: 'Due today', color: colors.warning };
  if (diff === 1) return { text: 'Due tomorrow', color: colors.warning };
  return { text: `Due ${formatDisplay(dueDate)}`, color: colors.textMuted };
}