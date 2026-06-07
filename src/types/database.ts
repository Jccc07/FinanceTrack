export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string; user_id: string; full_name: string | null;
          currency: string; timezone: string; pay_schedule: Json | null;
          onboarding_completed: boolean; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; user_id: string; full_name?: string | null;
          currency?: string; timezone?: string; pay_schedule?: Json | null;
          onboarding_completed?: boolean;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      accounts: {
        Row: {
          id: string; user_id: string; name: string;
          type: 'cash' | 'ewallet' | 'bank_savings' | 'emergency' | 'investment';
          balance: number; color_hex: string; icon: string;
          is_archived: boolean; sort_order: number; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; user_id: string; name: string;
          type?: 'cash' | 'ewallet' | 'bank_savings' | 'emergency' | 'investment';
          balance?: number; color_hex?: string; icon?: string;
          is_archived?: boolean; sort_order?: number;
        };
        Update: Partial<Database['public']['Tables']['accounts']['Insert']>;
      };
      transactions: {
        Row: {
          id: string; user_id: string; account_id: string;
          type: 'income' | 'expense' | 'transfer';
          amount: number; category: string; note: string | null;
          txn_date: string; is_recurring: boolean;
          recurring_id: string | null; receipt_url: string | null;
          created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; user_id: string; account_id: string;
          type: 'income' | 'expense' | 'transfer';
          amount: number; category?: string; note?: string | null;
          txn_date?: string; is_recurring?: boolean;
          recurring_id?: string | null; receipt_url?: string | null;
        };
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>;
      };
      recurring_items: {
        Row: {
          id: string; user_id: string; account_id: string | null; name: string;
          item_type: 'bill' | 'subscription' | 'installment' | 'income';
          amount: number; frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
          next_due_date: string; category: string; is_active: boolean;
          installment_total: number | null; installment_paid: number; created_at: string;
        };
        Insert: {
          id?: string; user_id: string; account_id?: string | null; name: string;
          item_type?: 'bill' | 'subscription' | 'installment' | 'income';
          amount: number; frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
          next_due_date: string; category?: string; is_active?: boolean;
          installment_total?: number | null; installment_paid?: number;
        };
        Update: Partial<Database['public']['Tables']['recurring_items']['Insert']>;
      };
      recurring_month_entries: {
        Row: {
          id: string; user_id: string; month_key: string; name: string;
          amount: number; category: string; frequency: string;
          item_type: 'bill' | 'subscription' | 'installment' | 'income';
          installment_total: number | null; installment_paid: number;
          source_item_id: string | null; created_at: string;
        };
        Insert: {
          id?: string; user_id: string; month_key: string; name: string;
          amount: number; category?: string; frequency?: string;
          item_type?: 'bill' | 'subscription' | 'installment' | 'income';
          installment_total?: number | null; installment_paid?: number;
          source_item_id?: string | null;
        };
        Update: Partial<Database['public']['Tables']['recurring_month_entries']['Insert']>;
      };
      savings_goals: {
        Row: {
          id: string; user_id: string; account_id: string | null; name: string;
          target_amount: number; current_amount: number; deadline: string | null;
          color_hex: string; icon: string; is_completed: boolean;
          created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; user_id: string; account_id?: string | null; name: string;
          target_amount: number; current_amount?: number; deadline?: string | null;
          color_hex?: string; icon?: string; is_completed?: boolean;
        };
        Update: Partial<Database['public']['Tables']['savings_goals']['Insert']>;
      };
      income_schedules: {
        Row: {
          id: string; user_id: string; label: string; amount: number;
          frequency: 'monthly' | 'semi-monthly' | 'bi-weekly' | 'weekly';
          next_payday: string; account_id: string | null; is_active: boolean; created_at: string;
        };
        Insert: {
          id?: string; user_id: string; label: string; amount: number;
          frequency?: 'monthly' | 'semi-monthly' | 'bi-weekly' | 'weekly';
          next_payday: string; account_id?: string | null; is_active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['income_schedules']['Insert']>;
      };
      budget_limits: {
        Row: {
          id: string; user_id: string; category: string;
          amount: number; period: string; created_at: string;
        };
        Insert: {
          id?: string; user_id: string; category: string; amount: number; period?: string;
        };
        Update: Partial<Database['public']['Tables']['budget_limits']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      account_type: 'cash' | 'ewallet' | 'bank_savings' | 'emergency' | 'investment';
      transaction_type: 'income' | 'expense' | 'transfer';
    };
  };
};