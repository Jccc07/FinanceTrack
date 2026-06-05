import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, addMonths, addWeeks, addDays, addYears } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { TRANSACTIONS_KEY } from '@/hooks/useTransactions'
import { ACCOUNTS_KEY } from '@/hooks/useAccounts'
import type { Database } from '@/types/database'

type RecurringItem = Database['public']['Tables']['recurring_items']['Row']
type RecurringItemInsert = Database['public']['Tables']['recurring_items']['Insert']

export const RECURRING_KEY = ['recurring_items'] as const

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
