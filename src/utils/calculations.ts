import { differenceInDays, addDays, isBefore, format } from 'date-fns';

// ── Survival Mode ─────────────────────────────────────────
export interface UpcomingBill { name: string; amount: number; dueDate: Date; }

export interface SurvivalModeInput {
  totalBalance: number;
  nextPayday: Date;
  upcomingBills: UpcomingBill[];
  savingsGoalMonthly: number;
}

export interface SurvivalModeResult {
  daysUntilPayday: number;
  safeBalance: number;
  safeDailyLimit: number;
  safeWeeklyLimit: number;
  projectedBalanceAtPayday: number;
  warningLevel: 'safe' | 'caution' | 'danger';
  upcomingBillsTotal: number;
}

export function calculateSurvivalMode(
  input: SurvivalModeInput,
  todaySpend = 0,
): SurvivalModeResult {
  const today = new Date(); today.setHours(0,0,0,0);
  const payday = new Date(input.nextPayday); payday.setHours(0,0,0,0);
  const daysUntilPayday = Math.max(1, differenceInDays(payday, today));

  const upcomingBillsTotal = input.upcomingBills
    .filter(b => isBefore(new Date(b.dueDate), payday))
    .reduce((s, b) => s + b.amount, 0);

  const savingsReserve = (input.savingsGoalMonthly / 30) * daysUntilPayday;
  const safeBalance = Math.max(0, input.totalBalance - upcomingBillsTotal - savingsReserve);
  const safeDailyLimit = safeBalance / daysUntilPayday;
  const safeWeeklyLimit = safeDailyLimit * 7;
  const projectedBalanceAtPayday = input.totalBalance - upcomingBillsTotal - safeDailyLimit * daysUntilPayday;

  let warningLevel: SurvivalModeResult['warningLevel'] = 'safe';
  if (safeDailyLimit < 200 || todaySpend > safeDailyLimit * 1.5) warningLevel = 'danger';
  else if (safeDailyLimit < 500 || todaySpend > safeDailyLimit * 1.2) warningLevel = 'caution';

  return { daysUntilPayday, safeBalance, safeDailyLimit, safeWeeklyLimit, projectedBalanceAtPayday, warningLevel, upcomingBillsTotal };
}

// ── Category breakdown ────────────────────────────────────
export interface CategoryTotal {
  category: string; total: number; percentage: number; transactionCount: number;
}

export function computeCategoryBreakdown(
  transactions: Array<{ category: string; amount: number; type: string }>,
): CategoryTotal[] {
  const expenses = transactions.filter(t => t.type === 'expense');
  const grandTotal = expenses.reduce((s, t) => s + t.amount, 0);
  if (grandTotal === 0) return [];

  const map = new Map<string, { total: number; count: number }>();
  for (const t of expenses) {
    const e = map.get(t.category) ?? { total: 0, count: 0 };
    map.set(t.category, { total: e.total + t.amount, count: e.count + 1 });
  }
  return Array.from(map.entries())
    .map(([category, { total, count }]) => ({
      category,
      total: Math.round(total * 100) / 100,
      percentage: Math.round((total / grandTotal) * 1000) / 10,
      transactionCount: count,
    }))
    .sort((a, b) => b.total - a.total);
}

// ── Formatting ────────────────────────────────────────────
const fmt = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 });
export const formatPHP = (n: number) => fmt.format(n);
export const formatPHPShort = (n: number) => {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `₱${(n / 1_000).toFixed(1)}K`;
  return `₱${n.toFixed(0)}`;
};
