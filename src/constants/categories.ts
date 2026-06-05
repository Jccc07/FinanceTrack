export interface Category {
  key: string;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  incomeOnly?: boolean;
}

export const CATEGORIES: Category[] = [
  { key: 'food',          label: 'Food',         icon: '🍔', color: '#F97316', bgColor: '#431407' },
  { key: 'transportation',label: 'Transport',    icon: '🚗', color: '#3B82F6', bgColor: '#1e3a5f' },
  { key: 'bills',         label: 'Bills',        icon: '🧾', color: '#EF4444', bgColor: '#450a0a' },
  { key: 'shopping',      label: 'Shopping',     icon: '🛍️', color: '#EC4899', bgColor: '#500724' },
  { key: 'subscriptions', label: 'Subscriptions',icon: '🔁', color: '#8B5CF6', bgColor: '#2e1065' },
  { key: 'health',        label: 'Health',       icon: '💊', color: '#10B981', bgColor: '#052e16' },
  { key: 'entertainment', label: 'Fun',          icon: '🎮', color: '#F59E0B', bgColor: '#422006' },
  { key: 'education',     label: 'Education',    icon: '📚', color: '#06B6D4', bgColor: '#083344' },
  { key: 'savings',       label: 'Savings',      icon: '💰', color: '#22C55E', bgColor: '#052e16' },
  { key: 'investments',   label: 'Invest',       icon: '📈', color: '#14B8A6', bgColor: '#042f2e' },
  { key: 'personal_care', label: 'Care',         icon: '🧴', color: '#F43F5E', bgColor: '#4c0519' },
  { key: 'miscellaneous', label: 'Other',        icon: '•••', color: '#94A3B8', bgColor: '#1E293B' },
  { key: 'income',      label: 'Salary',   icon: '💵', color: '#22C55E', bgColor: '#052e16', incomeOnly: true },
  { key: 'freelance',   label: 'Freelance',icon: '💻', color: '#6366F1', bgColor: '#1e1b4b', incomeOnly: true },
  { key: 'bonus',       label: 'Bonus',    icon: '⭐', color: '#F59E0B', bgColor: '#422006', incomeOnly: true },
  { key: 'transfer_in', label: 'Transfer', icon: '⬇️', color: '#3B82F6', bgColor: '#1e3a5f', incomeOnly: true },
];

export const getCategoryByKey = (key: string): Category =>
  CATEGORIES.find(c => c.key === key) ?? CATEGORIES[CATEGORIES.length - 1];

export const EXPENSE_CATEGORIES = CATEGORIES.filter(c => !c.incomeOnly);
export const INCOME_CATEGORIES  = CATEGORIES.filter(c => c.incomeOnly);
