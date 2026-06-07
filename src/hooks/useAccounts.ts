import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { TRANSACTIONS_KEY } from '@/hooks/useTransactions'
import type { Database } from '@/types/database'

type Account = Database['public']['Tables']['accounts']['Row']
type AccountInsert = Database['public']['Tables']['accounts']['Insert']
type AccountUpdate = Database['public']['Tables']['accounts']['Update'] & { id: string }

export const ACCOUNTS_KEY = ['accounts'] as const

export function useAccounts() {
  const userId = useAuthStore(s => s.user?.id)
  return useQuery({
    queryKey: [...ACCOUNTS_KEY, userId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('accounts').select('*').eq('user_id', userId!)
        .eq('is_archived', false).order('sort_order')
      if (error) throw error
      return data as Account[]
    },
    enabled: !!userId,
  })
}

export function useTotalBalance() {
  const { data: accounts = [] } = useAccounts()
  return accounts.reduce((s, a) => s + Number(a.balance), 0)
}

export function useCreateAccount() {
  const qc = useQueryClient()
  const userId = useAuthStore(s => s.user?.id)
  return useMutation({
    mutationFn: async (account: Omit<AccountInsert, 'user_id'>) => {
      // 1. Create the account
      const { data, error } = await (supabase as any)
        .from('accounts').insert({ ...account, user_id: userId! }).select().single()
      if (error) throw error

      // 2. Explicitly set the balance via update (insert may be ignored by column-level RLS)
      if (Number(account.balance) !== 0) {
        const { error: balErr } = await (supabase as any)
          .from('accounts').update({ balance: Number(account.balance) }).eq('id', data.id)
        if (balErr) throw balErr
      }

      // 3. Log an adjustment transaction for the opening balance (same pattern as edit/delete)
      //    type 'transfer' keeps it excluded from income/expense totals
      if (Number(account.balance) !== 0) {
        const today = new Date().toISOString().slice(0, 10)
        await (supabase as any).from('transactions').insert({
          user_id: userId!,
          account_id: data.id,
          type: 'transfer',
          amount: Math.abs(Number(account.balance)),
          category: 'account_adjustment',
          note: `__adj:add__ Add Account: ${account.name}`,
          txn_date: today,
        })
      }

      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ACCOUNTS_KEY })
      qc.invalidateQueries({ queryKey: TRANSACTIONS_KEY })
    },
  })
}

export function useUpdateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: AccountUpdate) => {
      const { data, error } = await (supabase as any)
        .from('accounts').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ACCOUNTS_KEY }),
  })
}

export function useDeleteAccount() {
  const qc = useQueryClient()
  const userId = useAuthStore(s => s.user?.id)
  return useMutation({
    mutationFn: async ({ id, name, balance }: { id: string; name: string; balance: number }) => {
      if (balance !== 0) {
        const today = new Date().toISOString().slice(0, 10)
        await (supabase as any).from('transactions').insert({
          user_id: userId!, account_id: id, type: 'transfer',
          amount: Math.abs(balance), category: 'account_adjustment',
          note: `__adj:delete__ Delete Account: ${name}`, txn_date: today,
        })
      }
      const { error } = await (supabase as any).from('accounts').update({ is_archived: true }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ACCOUNTS_KEY })
      qc.invalidateQueries({ queryKey: TRANSACTIONS_KEY })
    },
  })
}

export function useEditAccountBalance() {
  const qc = useQueryClient()
  const userId = useAuthStore(s => s.user?.id)
  return useMutation({
    mutationFn: async ({ id, name, oldBalance, newBalance }: { id: string; name: string; oldBalance: number; newBalance: number }) => {
      const diff = newBalance - oldBalance
      if (diff === 0) return
      const today = new Date().toISOString().slice(0, 10)
      await (supabase as any).from('transactions').insert({
        user_id: userId!, account_id: id, type: 'transfer',
        amount: Math.abs(diff), category: 'account_adjustment',
        note: `__adj:edit__ Edit Account: ${name}`, txn_date: today,
      })
      const { error } = await (supabase as any).from('accounts').update({ balance: newBalance }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ACCOUNTS_KEY })
      qc.invalidateQueries({ queryKey: TRANSACTIONS_KEY })
    },
  })
}