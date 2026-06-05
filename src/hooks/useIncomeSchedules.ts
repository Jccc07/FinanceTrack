import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import type { Database } from '@/types/database'

type IncomeSchedule = Database['public']['Tables']['income_schedules']['Row']
type IncomeScheduleInsert = Database['public']['Tables']['income_schedules']['Insert']

export const INCOME_KEY = ['income_schedules'] as const

export function useIncomeSchedules() {
  const userId = useAuthStore(s => s.user?.id)
  return useQuery({
    queryKey: [...INCOME_KEY, userId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('income_schedules').select('*').eq('user_id', userId!)
        .eq('is_active', true).order('next_payday')
      if (error) throw error
      return data as IncomeSchedule[]
    },
    enabled: !!userId,
  })
}

export function useNextPayday(): Date | null {
  const { data = [] } = useIncomeSchedules()
  if (data.length === 0) return null
  const sorted = [...data].sort(
    (a, b) => new Date(a.next_payday).getTime() - new Date(b.next_payday).getTime()
  )
  return new Date(sorted[0].next_payday)
}

export function useCreateIncomeSchedule() {
  const qc = useQueryClient()
  const userId = useAuthStore(s => s.user?.id)
  return useMutation({
    mutationFn: async (schedule: Omit<IncomeScheduleInsert, 'user_id'>) => {
      const { data, error } = await (supabase as any)
        .from('income_schedules').insert({ ...schedule, user_id: userId! }).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: INCOME_KEY }),
  })
}
