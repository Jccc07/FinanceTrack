import React, { useState } from 'react'
import { format, differenceInDays } from 'date-fns'
import { TrendingUp, TrendingDown, Wallet, Plus, Calendar, Target } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useAccounts, useTotalBalance } from '@/hooks/useAccounts'
import { useTransactions } from '@/hooks/useTransactions'
import { useNextPayday } from '@/hooks/useIncomeSchedules'
import { useGoals } from '@/hooks/useGoals'
import { useAllRecurringItems } from '@/hooks/useRecurringItems'
import { Card, Badge, Amount, EmptyState, ProgressBar, Spinner } from '@/components/ui'
import { AddTransactionModal } from '@/components/modals/AddTransactionModal'

function StatCard({ label, value, sub, icon, color }: { label: string; value: React.ReactNode; sub?: string; icon: React.ReactNode; color: string }) {
  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 500 }}>{label}</span>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          {icon}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-head)', letterSpacing: '-0.5px' }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{sub}</div>}
      </div>
    </Card>
  )
}

export function DashboardPage() {
  const [addTxnOpen, setAddTxnOpen] = useState(false)
  const { user } = useAuthStore()
  const totalBalance = useTotalBalance()
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts()
  const { data: transactions = [], isLoading: txnsLoading } = useTransactions({ month: new Date(), limit: 5 })
  const nextPayday = useNextPayday()
  const { data: goals = [] } = useGoals()
  const { data: recurring = [] } = useAllRecurringItems()

  const income  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

  const dueItems = recurring.filter(r => {
    const days = differenceInDays(new Date(r.next_due_date), new Date())
    return days >= 0 && days <= 7
  }).slice(0, 4)

  const name = user?.user_metadata?.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
          Hey, {name} 👋
        </h1>
        <p style={{ color: 'var(--text3)', fontSize: 14 }}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard
          label="Total Balance" color="var(--indigo)"
          icon={<Wallet size={16} />}
          value={<Amount value={totalBalance} size="lg" />}
          sub={`${accounts.length} account${accounts.length !== 1 ? 's' : ''}`}
        />
        <StatCard
          label="Income this month" color="var(--green)"
          icon={<TrendingUp size={16} />}
          value={<Amount value={income} size="lg" />}
        />
        <StatCard
          label="Expenses this month" color="var(--red)"
          icon={<TrendingDown size={16} />}
          value={<Amount value={expense} size="lg" />}
        />
        {nextPayday && (
          <StatCard
            label="Next payday" color="var(--yellow)"
            icon={<Calendar size={16} />}
            value={format(nextPayday, 'MMM d')}
            sub={`In ${differenceInDays(nextPayday, new Date())} days`}
          />
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent Transactions */}
        <Card style={{ gridColumn: 'span 1' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16 }}>Recent Transactions</h2>
            <button
              onClick={() => setAddTxnOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--indigo)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={13} /> Add
            </button>
          </div>
          {txnsLoading
            ? <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Spinner /></div>
            : transactions.length === 0
              ? <EmptyState icon={<TrendingUp size={22} />} title="No transactions yet" description="Add your first transaction" />
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {transactions.map(t => (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{t.category}</span>
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>{format(new Date(t.txn_date), 'MMM d')} {t.note ? `· ${t.note.replace(/__rid:[^_]+__\s?/, '')}` : ''}</span>
                      </div>
                      <Amount value={t.type === 'expense' ? -Number(t.amount) : Number(t.amount)} size="sm" showSign />
                    </div>
                  ))}
                </div>
              )
          }
        </Card>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Goals */}
          {goals.length > 0 && (
            <Card>
              <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Savings Goals</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {goals.slice(0, 3).map(g => {
                  const pct = Math.min(100, (Number(g.current_amount) / Number(g.target_amount)) * 100)
                  return (
                    <div key={g.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{g.name}</span>
                        <span style={{ fontSize: 12, color: 'var(--text3)' }}>{pct.toFixed(0)}%</span>
                      </div>
                      <ProgressBar value={Number(g.current_amount)} max={Number(g.target_amount)} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                        <Amount value={Number(g.current_amount)} size="sm" />
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>of <Amount value={Number(g.target_amount)} size="sm" /></span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Upcoming recurring */}
          {dueItems.length > 0 && (
            <Card>
              <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Due This Week</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dueItems.map(r => {
                  const days = differenceInDays(new Date(r.next_due_date), new Date())
                  return (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</p>
                        <p style={{ fontSize: 11, color: 'var(--text3)' }}>{days === 0 ? 'Today' : `In ${days}d`}</p>
                      </div>
                      <Amount value={Number(r.amount)} size="sm" />
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Accounts */}
          <Card>
            <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Accounts</h2>
            {accountsLoading
              ? <Spinner />
              : accounts.length === 0
                ? <EmptyState icon={<Wallet size={18} />} title="No accounts yet" />
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {accounts.map(a => (
                      <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.color_hex ?? 'var(--indigo)' }} />
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{a.name}</span>
                        </div>
                        <Amount value={Number(a.balance)} size="sm" />
                      </div>
                    ))}
                  </div>
                )
            }
          </Card>
        </div>
      </div>

      <AddTransactionModal open={addTxnOpen} onClose={() => setAddTxnOpen(false)} />

      <style>{`
        @media (max-width: 900px) {
          .dashboard-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
