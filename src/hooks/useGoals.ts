import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import type { Database } from '@/types/database'

type Goal = Database['public']['Tables']['savings_goals']['Row']
type GoalInsert = Database['public']['Tables']['savings_goals']['Insert']

export const GOALS_KEY = ['savings_goals'] as const

export function useGoals() {
  const userId = useAuthStore(s => s.user?.id)
  return useQuery({
    queryKey: [...GOALS_KEY, userId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('savings_goals').select('*').eq('user_id', userId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Goal[]
    },
    enabled: !!userId,
  })
}

export function useCreateGoal() {
  const qc = useQueryClient()
  const userId = useAuthStore(s => s.user?.id)
  return useMutation({
    mutationFn: async (goal: Omit<GoalInsert, 'user_id'>) => {
      const { data, error } = await (supabase as any)
        .from('savings_goals').insert({ ...goal, user_id: userId! }).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: GOALS_KEY }),
  })
}

export function useUpdateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Goal> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('savings_goals').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: GOALS_KEY }),
  })
}

export function useDeleteGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('savings_goals').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: GOALS_KEY }),
  })
}
