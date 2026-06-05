import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthState {
  session: Session | null
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  setSession: (session: Session | null) => void
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setSession: (session) =>
    set({ session, user: session?.user ?? null, isAuthenticated: !!session, isLoading: false }),

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      get().setSession(session)
      supabase.auth.onAuthStateChange((_e, session) => get().setSession(session))
    } catch {
      set({ isLoading: false })
    }
  },

  signUp: async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { full_name: fullName } },
    })
    if (error) throw error
    if (data.session) get().setSession(data.session)
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    get().setSession(data.session)
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null, isAuthenticated: false })
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  },
}))
