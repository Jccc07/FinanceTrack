import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
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
      const { data, error } = await (supabase as any)
        .from('accounts').insert({ ...account, user_id: userId! }).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ACCOUNTS_KEY }),
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
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('accounts').update({ is_archived: true }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ACCOUNTS_KEY }),
  })
}
