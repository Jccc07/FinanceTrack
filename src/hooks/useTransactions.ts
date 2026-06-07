import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { ACCOUNTS_KEY } from '@/hooks/useAccounts'
import type { Database } from '@/types/database'

type Transaction = Database['public']['Tables']['transactions']['Row']
type TransactionInsert = Database['public']['Tables']['transactions']['Insert']

export const TRANSACTIONS_KEY = ['transactions'] as const

export interface TransactionFilters {
  month?: Date
  category?: string
  accountId?: string
  type?: 'income' | 'expense'
  limit?: number
}

export function useTransactions(filters: TransactionFilters = {}) {
  const userId = useAuthStore(s => s.user?.id)
  const month = filters.month ?? new Date()
  const monthKey = format(month, 'yyyy-MM')

  return useQuery({
    queryKey: [...TRANSACTIONS_KEY, userId, monthKey, filters.category ?? null, filters.accountId ?? null, filters.type ?? null, filters.limit ?? null],
    queryFn: async () => {
      let query = supabase
        .from('transactions').select('*').eq('user_id', userId!)
        .gte('txn_date', format(startOfMonth(month), 'yyyy-MM-dd'))
        .lte('txn_date', format(endOfMonth(month), 'yyyy-MM-dd'))
        .order('txn_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (filters.category)  query = query.eq('category', filters.category)
      if (filters.accountId) query = query.eq('account_id', filters.accountId)
      if (filters.type)      query = query.eq('type', filters.type)
      if (filters.limit)     query = query.limit(filters.limit)

      const { data, error } = await query
      if (error) throw error
      return data as Transaction[]
    },
    enabled: !!userId,
  })
}

export function useCreateTransaction() {
  const qc = useQueryClient()
  const userId = useAuthStore(s => s.user?.id)
  return useMutation({
    mutationFn: async (txn: Omit<TransactionInsert, 'user_id'>) => {
      const { data, error } = await (supabase as any)
        .from('transactions').insert({ ...txn, user_id: userId! }).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TRANSACTIONS_KEY })
      qc.invalidateQueries({ queryKey: ACCOUNTS_KEY })
    },
  })
}

export function useDeleteTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('transactions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TRANSACTIONS_KEY })
      qc.invalidateQueries({ queryKey: ACCOUNTS_KEY })
    },
  })
}