import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, addMonths, addWeeks, addDays, addYears, getYear } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { TRANSACTIONS_KEY } from '@/hooks/useTransactions'
import { ACCOUNTS_KEY } from '@/hooks/useAccounts'
import type { Database } from '@/types/database'

type RecurringItem = Database['public']['Tables']['recurring_items']['Row']
type RecurringItemInsert = Database['public']['Tables']['recurring_items']['Insert']

export const RECURRING_KEY = ['recurring_items'] as const
export const RECURRING_ENTRIES_KEY = ['recurring_month_entries'] as const

// ─── Global recurring items (template definitions) ─────────────────────────

export function useRecurringItems(itemType?: RecurringItem['item_type']) {
  const userId = useAuthStore(s => s.user?.id)
  return useQuery({
    queryKey: [...RECURRING_KEY, userId, itemType],
    queryFn: async () => {
      let query = supabase
        .from('recurring_items').select('*').eq('user_id', userId!)
        .eq('is_active', true).order('next_due_date')
      if (itemType) query = query.eq('item_type', itemType)
      const { data, error } = await query
      if (error) throw error
      return data as RecurringItem[]
    },
    enabled: !!userId,
  })
}

export function useAllRecurringItems() {
  const userId = useAuthStore(s => s.user?.id)
  return useQuery({
    queryKey: [...RECURRING_KEY, userId, 'all'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('recurring_items').select('*').eq('user_id', userId!)
        .eq('is_active', true).order('item_type').order('next_due_date')
      if (error) throw error
      return data as RecurringItem[]
    },
    enabled: !!userId,
  })
}

// ─── Month entries: per-month snapshots ────────────────────────────────────
// These live in `recurring_month_entries` table with columns:
//   id, user_id, month_key (yyyy-MM), name, amount, category,
//   frequency, item_type, installment_total, installment_paid, source_item_id, created_at

export interface MonthEntry {
  id: string
  user_id: string
  month_key: string          // "2025-06"
  name: string
  amount: number
  category: string
  frequency: string
  item_type: 'bill' | 'subscription' | 'installment' | 'income'
  installment_total: number | null
  installment_paid: number
  source_item_id: string | null  // original recurring_item id, if copied
  created_at: string
}

export function useMonthEntries(monthKey: string) {
  const userId = useAuthStore(s => s.user?.id)
  return useQuery({
    queryKey: [...RECURRING_ENTRIES_KEY, userId, monthKey],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('recurring_month_entries')
        .select('*')
        .eq('user_id', userId!)
        .eq('month_key', monthKey)
        .order('item_type')
        .order('created_at')
      if (error) throw error
      return (data ?? []) as MonthEntry[]
    },
    enabled: !!userId,
  })
}

export function useAddMonthEntry() {
  const qc = useQueryClient()
  const userId = useAuthStore(s => s.user?.id)
  return useMutation({
    mutationFn: async (entry: Omit<MonthEntry, 'id' | 'user_id' | 'created_at'>) => {
      const { data, error } = await (supabase as any)
        .from('recurring_month_entries')
        .insert({ ...entry, user_id: userId! })
        .select().single()
      if (error) throw error
      return data as MonthEntry
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: [...RECURRING_ENTRIES_KEY, userId, vars.month_key] }),
  })
}

export function useRemoveMonthEntry() {
  const qc = useQueryClient()
  const userId = useAuthStore(s => s.user?.id)
  return useMutation({
    mutationFn: async ({ id, monthKey }: { id: string; monthKey: string }) => {
      const { error } = await (supabase as any)
        .from('recurring_month_entries').delete().eq('id', id)
      if (error) throw error
      return monthKey
    },
    onSuccess: (monthKey) => qc.invalidateQueries({ queryKey: [...RECURRING_ENTRIES_KEY, userId, monthKey] }),
  })
}

// Export entries from one month to selected target months
export function useExportEntriesToMonths() {
  const qc = useQueryClient()
  const userId = useAuthStore(s => s.user?.id)
  return useMutation({
    mutationFn: async ({ entries, targetMonthKeys }: { entries: MonthEntry[]; targetMonthKeys: string[] }) => {
      const rows = targetMonthKeys.flatMap(mk =>
        entries.map(e => ({
          user_id: userId!,
          month_key: mk,
          name: e.name,
          amount: e.amount,
          category: e.category,
          frequency: e.frequency,
          item_type: e.item_type,
          installment_total: e.installment_total,
          installment_paid: 0,
          source_item_id: e.source_item_id ?? e.id,
        }))
      )
      // Insert only if not already exists (upsert by unique constraint)
      // We do a simple insert and ignore duplicates by checking first
      for (const mk of targetMonthKeys) {
        const { data: existing } = await (supabase as any)
          .from('recurring_month_entries')
          .select('id').eq('user_id', userId!).eq('month_key', mk)
        if (existing && existing.length > 0) continue // skip already-populated months
        const toInsert = rows.filter(r => r.month_key === mk)
        const { error } = await (supabase as any)
          .from('recurring_month_entries').insert(toInsert)
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: RECURRING_ENTRIES_KEY }),
  })
}

// ─── Mark paid / unpaid (same transaction logic, but keyed to month entry) ─

export function useMarkEntryPaid() {
  const qc = useQueryClient()
  const userId = useAuthStore(s => s.user?.id)
  return useMutation({
    mutationFn: async ({ entry, accountId, monthKey }: { entry: MonthEntry; accountId: string; monthKey: string }) => {
      const today = format(new Date(), 'yyyy-MM-dd')
      const txnType = entry.item_type === 'income' ? 'income' : 'expense'
      const { data: txn, error: txnErr } = await (supabase as any)
        .from('transactions').insert({
          user_id: userId!, account_id: accountId, type: txnType,
          amount: Number(entry.amount), category: entry.category,
          note: `__meid:${entry.id}__ ${entry.name}`, txn_date: today,
        }).select().single()
      if (txnErr) throw txnErr
      return txn
    },
    onSuccess: (_txn, vars) => {
      qc.invalidateQueries({ queryKey: [...RECURRING_ENTRIES_KEY, userId, vars.monthKey] })
      qc.invalidateQueries({ queryKey: TRANSACTIONS_KEY })
      qc.invalidateQueries({ queryKey: ACCOUNTS_KEY })
    },
  })
}

export function useUnmarkEntryPaid() {
  const qc = useQueryClient()
  const userId = useAuthStore(s => s.user?.id)
  return useMutation({
    mutationFn: async ({ entry, monthKey }: { entry: MonthEntry; monthKey: string }) => {
      const { data: txns, error: findErr } = await (supabase as any)
        .from('transactions').select('id')
        .eq('user_id', userId!)
        .like('note', `__meid:${entry.id}__%`)
        .gte('txn_date', `${monthKey}-01`)
        .lte('txn_date', `${monthKey}-31`)
        .order('created_at', { ascending: false }).limit(1)
      if (findErr) throw findErr
      if (txns && txns.length > 0) {
        const { error: delErr } = await (supabase as any).from('transactions').delete().eq('id', txns[0].id)
        if (delErr) throw delErr
      }
      return { entryId: entry.id, monthKey }
    },
    onSuccess: ({ monthKey }) => {
      qc.invalidateQueries({ queryKey: [...RECURRING_ENTRIES_KEY, userId, monthKey] })
      qc.invalidateQueries({ queryKey: TRANSACTIONS_KEY })
      qc.invalidateQueries({ queryKey: ACCOUNTS_KEY })
    },
  })
}

export async function getEntryPaidTxnForMonth(userId: string, entryId: string, month: string): Promise<string | null> {
  const { data } = await (supabase as any)
    .from('transactions').select('id').eq('user_id', userId)
    .like('note', `__meid:${entryId}__%`)
    .gte('txn_date', `${month}-01`).lte('txn_date', `${month}-31`).limit(1)
  return data?.[0]?.id ?? null
}



// ─── Legacy hooks kept for compatibility ───────────────────────────────────

export function useCreateRecurringItem() {
  const qc = useQueryClient()
  const userId = useAuthStore(s => s.user?.id)
  return useMutation({
    mutationFn: async (item: Omit<RecurringItemInsert, 'user_id'>) => {
      const { data, error } = await (supabase as any)
        .from('recurring_items').insert({ ...item, user_id: userId! }).select().single()
      if (error) throw error
      return data as RecurringItem
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: RECURRING_KEY }),
  })
}

export function useUpdateRecurringItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RecurringItem> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('recurring_items').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data as RecurringItem
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: RECURRING_KEY }),
  })
}

export function useDeleteRecurringItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('recurring_items').update({ is_active: false }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: RECURRING_KEY }),
  })
}

export function useMarkRecurringPaid() {
  const qc = useQueryClient()
  const userId = useAuthStore(s => s.user?.id)
  return useMutation({
    mutationFn: async ({ item, accountId, paidDate }: { item: RecurringItem; accountId: string; paidDate?: string }) => {
      const today = paidDate ?? format(new Date(), 'yyyy-MM-dd')
      const txnType = item.item_type === 'income' ? 'income' : 'expense'
      const { data: txn, error: txnErr } = await (supabase as any)
        .from('transactions').insert({
          user_id: userId!, account_id: accountId, type: txnType,
          amount: Number(item.amount), category: item.category,
          note: `__rid:${item.id}__ ${item.name}`, txn_date: today,
        }).select().single()
      if (txnErr) throw txnErr
      const current = new Date(item.next_due_date)
      let nextDue: Date
      switch (item.frequency) {
        case 'weekly':  nextDue = addWeeks(current, 1);  break
        case 'monthly': nextDue = addMonths(current, 1); break
        case 'yearly':  nextDue = addYears(current, 1);  break
        default:        nextDue = addDays(current, 1);   break
      }
      const updates: Partial<RecurringItem> = { next_due_date: format(nextDue, 'yyyy-MM-dd') }
      if (item.item_type === 'installment' && item.installment_total) {
        const newPaid = (item.installment_paid ?? 0) + 1
        updates.installment_paid = newPaid
        if (newPaid >= (item.installment_total ?? 0)) updates.is_active = false
      }
      const { error: updateErr } = await (supabase as any)
        .from('recurring_items').update(updates).eq('id', item.id)
      if (updateErr) throw updateErr
      return txn
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RECURRING_KEY })
      qc.invalidateQueries({ queryKey: TRANSACTIONS_KEY })
      qc.invalidateQueries({ queryKey: ACCOUNTS_KEY })
    },
  })
}

export function useUnmarkRecurringPaid() {
  const qc = useQueryClient()
  const userId = useAuthStore(s => s.user?.id)
  return useMutation({
    mutationFn: async ({ item, month }: { item: RecurringItem; month: string }) => {
      const { data: txns, error: findErr } = await (supabase as any)
        .from('transactions').select('id, created_at').eq('user_id', userId!)
        .like('note', `__rid:${item.id}__%`)
        .gte('txn_date', `${month}-01`).lte('txn_date', `${month}-31`)
        .order('created_at', { ascending: false }).limit(1)
      if (findErr) throw findErr
      if (txns && txns.length > 0) {
        const { error: delErr } = await (supabase as any).from('transactions').delete().eq('id', txns[0].id)
        if (delErr) throw delErr
      }
      const current = new Date(item.next_due_date)
      let prevDue: Date
      switch (item.frequency) {
        case 'weekly':  prevDue = addWeeks(current, -1);  break
        case 'monthly': prevDue = addMonths(current, -1); break
        case 'yearly':  prevDue = addYears(current, -1);  break
        default:        prevDue = addDays(current, -1);   break
      }
      const rollbackUpdates: Partial<RecurringItem> = { next_due_date: format(prevDue, 'yyyy-MM-dd') }
      if (item.item_type === 'installment') {
        rollbackUpdates.installment_paid = Math.max(0, (item.installment_paid ?? 0) - 1)
        rollbackUpdates.is_active = true
      }
      const { error: updateErr } = await (supabase as any)
        .from('recurring_items').update(rollbackUpdates).eq('id', item.id)
      if (updateErr) throw updateErr
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RECURRING_KEY })
      qc.invalidateQueries({ queryKey: TRANSACTIONS_KEY })
      qc.invalidateQueries({ queryKey: ACCOUNTS_KEY })
    },
  })
}

export async function getItemPaidTxnForMonth(userId: string, itemId: string, month: string): Promise<string | null> {
  const { data } = await (supabase as any)
    .from('transactions').select('id').eq('user_id', userId)
    .like('note', `__rid:${itemId}__%`)
    .gte('txn_date', `${month}-01`).lte('txn_date', `${month}-31`).limit(1)
  return data?.[0]?.id ?? null
}