import React, { useState } from 'react'
import { format, differenceInDays } from 'date-fns'
import { TrendingUp, TrendingDown, Wallet, Plus, Calendar } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useAccounts, useTotalBalance, useCreateAccount } from '@/hooks/useAccounts'
import { useTransactions } from '@/hooks/useTransactions'
import { useNextPayday } from '@/hooks/useIncomeSchedules'
import { useAllRecurringItems } from '@/hooks/useRecurringItems'
import { CATEGORIES } from '@/constants/categories'
import { Card, Amount, EmptyState, Spinner, Modal, Input, Select, Button } from '@/components/ui'
import { AddTransactionModal } from '@/components/modals/AddTransactionModal'
import { TransactionDetailModal } from '@/components/modals/TransactionDetailModal'

const ACCOUNT_COLORS = ['#6366F1','#4ADE80','#F87171','#FBBF24','#34D399','#60A5FA','#A78BFA','#FB923C']
const ACCOUNT_TYPE_ICONS: Record<string, string> = {
  ewallet: '📱', bank: '🏦', cash: '💵', credit: '💳', savings: '🏦', other: '💼',
}

function AddAccountModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createAccount = useCreateAccount()
  const [name, setName] = useState('')
  const [balance, setBalance] = useState('')
  const [type, setType] = useState('bank')
  const [color, setColor] = useState(ACCOUNT_COLORS[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!name || !balance) { setError('Name and balance are required'); return }
    setLoading(true); setError('')
    try {
      await createAccount.mutateAsync({ name, balance: parseFloat(balance), type: type as any, color_hex: color, sort_order: 0 })
      setName(''); setBalance(''); setType('bank'); onClose()
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Account">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Account name" placeholder="GCash, BPI, Cash..." value={name} onChange={e => setName(e.target.value)} />
        <Input label="Current balance (₱)" type="number" placeholder="0.00" value={balance} onChange={e => setBalance(e.target.value)} />
        <Select label="Type" value={type} onChange={e => setType(e.target.value)}>
          {['bank','ewallet','cash','credit','savings','other'].map(t => (
            <option key={t} value={t}>{ACCOUNT_TYPE_ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </Select>
        <div>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 8 }}>Color</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ACCOUNT_COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} style={{
                width: 28, height: 28, borderRadius: '50%', background: c, border: color === c ? '3px solid white' : '2px solid transparent',
                cursor: 'pointer', boxSizing: 'border-box',
              }} />
            ))}
          </div>
        </div>
        {error && <p style={{ fontSize: 13, color: 'var(--red)' }}>{error}</p>}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <Button variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
          <Button fullWidth loading={loading} onClick={submit}>Add account</Button>
        </div>
      </div>
    </Modal>
  )
}

export function DashboardPage() {
  const [addTxnOpen, setAddTxnOpen] = useState(false)
  const [addAcctOpen, setAddAcctOpen] = useState(false)
  const [selectedTxn, setSelectedTxn] = useState<any>(null)
  const { user } = useAuthStore()
  const totalBalance = useTotalBalance()
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts()
  const { data: transactions = [], isLoading: txnsLoading } = useTransactions({ month: new Date(), limit: 10 })
  const nextPayday = useNextPayday()
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
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 800, marginBottom: 2 }}>
          Hey, {name} 👋
        </h1>
        <p style={{ color: 'var(--text3)', fontSize: 13 }}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Total Balance */}
      <div style={{
        background: 'linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)',
        borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: 12,
        border: '1px solid rgba(99,102,241,.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Balance</span>
          <Wallet size={18} color="rgba(255,255,255,.5)" />
        </div>
        <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-head)', color: '#fff', letterSpacing: '-1px', marginBottom: 4 }}>
          ₱{totalBalance.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>{accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Accounts grid */}
      {accountsLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}><Spinner /></div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            {accounts.map(a => (
              <div key={a.id} style={{
                background: 'var(--bg2)', borderRadius: 14, padding: '14px',
                border: `1px solid ${a.color_hex ?? 'var(--border)'}33`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.color_hex ?? 'var(--indigo)', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-head)', color: 'var(--text)' }}>
                  ₱{Number(a.balance).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            ))}
            {/* Add account tile */}
            <button onClick={() => setAddAcctOpen(true)} style={{
              background: 'transparent', borderRadius: 14, padding: '14px',
              border: '1.5px dashed var(--border2)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              color: 'var(--text4)', fontSize: 13, fontWeight: 500,
            }}>
              <Plus size={16} /> Add account
            </button>
          </div>
        </>
      )}

      {/* Income + Expense row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div style={{ background: 'var(--bg2)', borderRadius: 14, padding: '14px', border: '1px solid rgba(74,222,128,.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <TrendingUp size={14} color="var(--green)" />
            <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>Income</span>
          </div>
          <Amount value={income} size="md" />
          <p style={{ fontSize: 10, color: 'var(--text4)', marginTop: 2 }}>this month</p>
        </div>
        <div style={{ background: 'var(--bg2)', borderRadius: 14, padding: '14px', border: '1px solid rgba(248,113,113,.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <TrendingDown size={14} color="var(--red)" />
            <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>Expenses</span>
          </div>
          <Amount value={expense} size="md" />
          <p style={{ fontSize: 10, color: 'var(--text4)', marginTop: 2 }}>this month</p>
        </div>
      </div>

      {/* Next payday */}
      {nextPayday && (
        <div style={{ background: 'var(--bg2)', borderRadius: 14, padding: '14px 16px', border: '1px solid rgba(251,191,36,.15)', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={16} color="var(--yellow)" />
            <span style={{ fontSize: 13, fontWeight: 500 }}>Next payday</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--yellow)' }}>{format(nextPayday, 'MMM d')}</p>
            <p style={{ fontSize: 11, color: 'var(--text3)' }}>In {differenceInDays(nextPayday, new Date())} days</p>
          </div>
        </div>
      )}

      {/* Due this week */}
      {dueItems.length > 0 && (
        <div style={{ background: 'var(--bg2)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: 16, border: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--text2)' }}>⚠️ Due This Week</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {dueItems.map(r => {
              const days = differenceInDays(new Date(r.next_due_date), new Date())
              return (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</p>
                    <p style={{ fontSize: 11, color: days === 0 ? 'var(--red)' : 'var(--text3)' }}>{days === 0 ? 'Today!' : `In ${days}d`}</p>
                  </div>
                  <Amount value={Number(r.amount)} size="sm" />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div style={{ background: 'var(--bg2)', borderRadius: 'var(--radius-lg)', padding: '16px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16 }}>Recent Transactions</h2>
          <button onClick={() => setAddTxnOpen(true)} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'var(--indigo)', border: 'none', color: '#fff',
            borderRadius: 10, padding: '7px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            <Plus size={14} /> Add
          </button>
        </div>
        {txnsLoading
          ? <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Spinner /></div>
          : transactions.length === 0
            ? <EmptyState icon={<TrendingUp size={22} />} title="No transactions yet" description="Add your first transaction" />
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {transactions.map((t, i) => {
                  const cat = CATEGORIES.find(c => c.key === t.category)
                  return (
                    <div key={t.id}
                      onClick={() => setSelectedTxn(t)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 0', cursor: 'pointer',
                        borderBottom: i < transactions.length - 1 ? '1px solid var(--border)' : 'none',
                      }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                        background: t.type === 'income' ? 'rgba(74,222,128,.12)' : 'rgba(248,113,113,.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
                      }}>
                        {cat?.icon ?? '💳'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat?.label ?? t.category}</p>
                        <p style={{ fontSize: 11, color: 'var(--text3)' }}>{format(new Date(t.txn_date + 'T00:00:00'), 'MMM d')}{t.note ? ` · ${t.note.replace(/__rid:[^_]+__\s?/, '')}` : ''}</p>
                      </div>
                      <Amount value={t.type === 'expense' ? -Number(t.amount) : Number(t.amount)} size="sm" showSign />
                    </div>
                  )
                })}
              </div>
            )
        }
      </div>

      <AddTransactionModal open={addTxnOpen} onClose={() => setAddTxnOpen(false)} />
      <AddAccountModal open={addAcctOpen} onClose={() => setAddAcctOpen(false)} />
      <TransactionDetailModal txn={selectedTxn} onClose={() => setSelectedTxn(null)} />
    </div>
  )
}
