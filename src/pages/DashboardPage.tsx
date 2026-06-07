import React, { useState } from 'react'
import { format, differenceInDays } from 'date-fns'
import { TrendingUp, TrendingDown, Wallet, Plus, Calendar } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useAccounts, useTotalBalance, useCreateAccount } from '@/hooks/useAccounts'
import { useTransactions } from '@/hooks/useTransactions'
import { useNextPayday } from '@/hooks/useIncomeSchedules'
import { useAllRecurringItems } from '@/hooks/useRecurringItems'
import { CATEGORIES } from '@/constants/categories'
import { Amount, EmptyState, Spinner, Modal, Input, Select, Button } from '@/components/ui'
import { AccountLogoIcon } from '@/components/ui/AccountLogoIcon'
import { AddTransactionModal } from '@/components/modals/AddTransactionModal'
import { TransactionDetailModal } from '@/components/modals/TransactionDetailModal'

const ACCOUNT_COLORS = ['#6366F1','#4ADE80','#F87171','#FBBF24','#34D399','#60A5FA','#A78BFA','#FB923C']

// ─── Add Account Modal ────────────────────────────────────────────────────────
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
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
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
          <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)', background: 'var(--bg3)', color: 'var(--text2)', transition: 'opacity .15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.8' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
          >Cancel</button>
          <button type="button" onClick={submit} disabled={loading} style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)', background: 'var(--indigo)', color: '#fff', opacity: loading ? 0.7 : 1, transition: 'opacity .15s' }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.opacity = '0.88' }}
            onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
          >{loading ? 'Adding…' : 'Add account'}</button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Account Transactions Modal ───────────────────────────────────────────────
function AccountTransactionsModal({ account, open, onClose }: { account: any; open: boolean; onClose: () => void }) {
  const { data: txns = [], isLoading } = useTransactions({ month: new Date(), accountId: account?.id })
  if (!account) return null
  return (
    <Modal open={open} onClose={onClose} title={`${account.name} — ${format(new Date(), 'MMMM yyyy')}`} width={440}>
      <div>
        <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '12px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: account.color_hex ?? 'var(--indigo)' }} />
            <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>Current balance</span>
          </div>
          <Amount value={Number(account.balance)} size="md" />
        </div>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner /></div>
        ) : txns.length === 0 ? (
          <EmptyState icon={<TrendingUp size={20} />} title="No transactions this month" description="Transactions for this account will appear here" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {txns.map((t, i) => {
              const cat = CATEGORIES.find(c => c.key === t.category)
              return (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < txns.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <AccountLogoIcon accountName={account.name} colorHex={account.color_hex} size={36} borderRadius={10} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat?.label ?? t.category}</p>
                    <p style={{ fontSize: 11, color: 'var(--text3)' }}>
                      {format(new Date(t.txn_date + 'T00:00:00'), 'MMM d')}
                      {t.note ? ` · ${t.note.replace(/__(?:rid|meid):[^_]+__\s?/, '')}` : ''}
                    </p>
                  </div>
                  <Amount value={t.type === 'expense' ? -Number(t.amount) : Number(t.amount)} size="sm" showSign />
                </div>
              )
            })}
          </div>
        )}
        <p style={{ fontSize: 11, color: 'var(--text4)', textAlign: 'center', marginTop: 16 }}>For full history, visit the Transactions page</p>
      </div>
    </Modal>
  )
}

// ─── Recurring Summary Modal ──────────────────────────────────────────────────
function RecurringSummaryModal({ type, open, onClose, recurringItems, transactions }: {
  type: 'income' | 'expense'
  open: boolean
  onClose: () => void
  recurringItems: any[]
  transactions: any[]
}) {
  const items = recurringItems.filter(r =>
    type === 'income' ? r.item_type === 'income' : r.item_type !== 'income'
  )

  // Check paid status via __meid: tag (month entry) OR __rid: tag (legacy)
  const paidIds = new Set(
    transactions
      .map(t => {
        const meidMatch = t.note?.match(/__meid:([^_]+)__/)
        const ridMatch = t.note?.match(/__rid:([^_]+)__/)
        return meidMatch?.[1] ?? ridMatch?.[1] ?? null
      })
      .filter(Boolean)
  )

  const title = type === 'income' ? 'Expected Income' : 'Expected Expenses'
  const total = items.reduce((s, r) => s + Number(r.amount), 0)
  const paidTotal = items.filter(r => paidIds.has(r.id)).reduce((s, r) => s + Number(r.amount), 0)

  // Also include all actual income/expense transactions from this month (not just recurring)
  const allActual = transactions.filter(t => type === 'income' ? t.type === 'income' : t.type === 'expense')
  const actualTotal = allActual.reduce((s, t) => s + Number(t.amount), 0)

  return (
    <Modal open={open} onClose={onClose} title={`${title} — ${format(new Date(), 'MMMM yyyy')}`} width={440}>
      <div>
        {/* Summary bar */}
        <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '12px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>
              {type === 'income' ? 'Total received this month' : 'Total spent this month'}
            </p>
            <Amount value={actualTotal} size="md" />
            {items.length > 0 && total !== paidTotal && (
              <p style={{ fontSize: 11, color: 'var(--text4)', marginTop: 1 }}>
                ₱{paidTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })} from {items.filter(r => paidIds.has(r.id)).length} recurring · ₱{total.toLocaleString('en-PH', { minimumFractionDigits: 2 })} scheduled
              </p>
            )}
          </div>
          <div style={{ fontSize: 22 }}>{type === 'income' ? '💰' : '📋'}</div>
        </div>

        {/* Non-recurring transactions this month */}
        {allActual.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              All {type === 'income' ? 'Income' : 'Expenses'} This Month
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {allActual.map((t, i) => {
                const cat = CATEGORIES.find(c => c.key === t.category)
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: i < allActual.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                      background: type === 'income' ? 'rgba(74,222,128,.12)' : 'rgba(248,113,113,.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
                    }}>
                      {cat?.icon ?? (type === 'income' ? '💵' : '💸')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat?.label ?? t.category}</p>
                      <p style={{ fontSize: 11, color: 'var(--text3)' }}>
                        {format(new Date(t.txn_date + 'T00:00:00'), 'MMM d')}
                        {t.note ? ` · ${t.note.replace(/__(?:rid|meid):[^_]+__\s?/, '')}` : ''}
                      </p>
                    </div>
                    <Amount value={Number(t.amount)} size="sm" />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recurring schedule */}
        {items.length > 0 && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Recurring Schedule
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {items.map((r, i) => {
                const isPaid = paidIds.has(r.id)
                const cat = CATEGORIES.find(c => c.key === r.category)
                return (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none', opacity: isPaid ? 0.55 : 1 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                      background: type === 'income' ? 'rgba(74,222,128,.12)' : 'rgba(248,113,113,.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
                    }}>
                      {cat?.icon ?? (type === 'income' ? '💰' : '📋')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: isPaid ? 'line-through' : 'none' }}>{r.name}</p>
                      <p style={{ fontSize: 11, color: isPaid ? 'var(--green)' : 'var(--text3)', textDecoration: isPaid ? 'line-through' : 'none' }}>
                        {isPaid ? (type === 'income' ? 'Received' : 'Paid') : `Due ${format(new Date(r.next_due_date + 'T00:00:00'), 'MMM d')}`}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Amount value={Number(r.amount)} size="sm" />
                      {isPaid && <p style={{ fontSize: 10, color: 'var(--green)', marginTop: 1 }}>✓ done</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {allActual.length === 0 && items.length === 0 && (
          <EmptyState icon={<TrendingUp size={20} />} title={`No ${type === 'income' ? 'income' : 'expenses'} yet`} description={`Add transactions or recurring items to see them here`} />
        )}

        <p style={{ fontSize: 11, color: 'var(--text4)', textAlign: 'center', marginTop: 16 }}>Manage recurring items in the Recurring page</p>
      </div>
    </Modal>
  )
}

// ─── Section Label ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{children}</p>
  )
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export function DashboardPage() {
  const [addTxnOpen, setAddTxnOpen] = useState(false)
  const [addAcctOpen, setAddAcctOpen] = useState(false)
  const [selectedTxn, setSelectedTxn] = useState<any>(null)
  const [selectedAccount, setSelectedAccount] = useState<any>(null)
  const [recurringModal, setRecurringModal] = useState<'income' | 'expense' | null>(null)

  const { user } = useAuthStore()
  const totalBalance = useTotalBalance()
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts()
  const { data: transactions = [], isLoading: txnsLoading, isError: txnsError } = useTransactions({ month: new Date(), limit: 10 })
  const nextPayday = useNextPayday()
  const { data: recurring = [] } = useAllRecurringItems()

  const income  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

  // Build account map for lookup in transaction rows
  const accountMap = Object.fromEntries(accounts.map(a => [a.id, a]))

  const dueItems = recurring.filter(r => {
    const days = differenceInDays(new Date(r.next_due_date), new Date())
    return days >= 0 && days <= 7
  }).slice(0, 4)

  const name = user?.user_metadata?.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-body)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.3px', marginBottom: 2 }}>Hey, {name}</h1>
        <p style={{ color: 'var(--text3)', fontSize: 13 }}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Total Balance */}
      <div style={{ background: 'linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: 16, border: '1px solid rgba(99,102,241,.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Balance</span>
          <Wallet size={18} color="rgba(255,255,255,.5)" />
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'var(--font-body)', color: '#fff', letterSpacing: '-1px', marginBottom: 4 }}>
          ₱{totalBalance.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>{accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Accounts */}
      {accountsLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}><Spinner /></div>
      ) : (
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>Accounts</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {accounts.map(a => (
              <button key={a.id} onClick={() => setSelectedAccount(a)} style={{
                background: 'var(--bg2)', borderRadius: 14, padding: '14px',
                border: `1px solid ${a.color_hex ?? 'var(--border)'}33`,
                textAlign: 'left', cursor: 'pointer', transition: 'border-color .15s, background .15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg3)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg2)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <AccountLogoIcon accountName={a.name} colorHex={a.color_hex ?? undefined} size={28} borderRadius={8} />
                  <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-body)', color: 'var(--text)' }}>
                  ₱{Number(a.balance).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </button>
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
        </div>
      )}

      {/* Income + Expense */}
      <div style={{ marginBottom: 16 }}>
        <SectionLabel>This Month</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button onClick={() => setRecurringModal('income')} style={{ background: 'var(--bg2)', borderRadius: 14, padding: '14px', border: '1px solid rgba(74,222,128,.15)', textAlign: 'left', cursor: 'pointer', transition: 'background .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg3)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg2)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <TrendingUp size={14} color="var(--green)" />
              <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>Income</span>
            </div>
            <Amount value={income} size="md" />
            <p style={{ fontSize: 10, color: 'var(--text4)', marginTop: 2 }}>tap to view details</p>
          </button>
          <button onClick={() => setRecurringModal('expense')} style={{ background: 'var(--bg2)', borderRadius: 14, padding: '14px', border: '1px solid rgba(248,113,113,.15)', textAlign: 'left', cursor: 'pointer', transition: 'background .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg3)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg2)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <TrendingDown size={14} color="var(--red)" />
              <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>Expenses</span>
            </div>
            <Amount value={expense} size="md" />
            <p style={{ fontSize: 10, color: 'var(--text4)', marginTop: 2 }}>tap to view details</p>
          </button>
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
          <h2 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--text2)' }}>⚠️ Due This Week</h2>
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
          <h2 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16 }}>Recent Transactions</h2>
          <button onClick={() => setAddTxnOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--indigo)', border: 'none', color: '#fff', borderRadius: 10, padding: '7px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Add
          </button>
        </div>
        {txnsLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Spinner /></div>
        ) : txnsError ? (
          <EmptyState icon={<TrendingUp size={22} />} title="Could not load transactions" description="Check your connection and try refreshing" />
        ) : transactions.length === 0 ? (
          <EmptyState icon={<TrendingUp size={22} />} title="No transactions yet" description="Add your first transaction" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {transactions.map((t, i) => {
              const cat = CATEGORIES.find(c => c.key === t.category)
              const acct = accountMap[t.account_id]
              return (
                <div key={t.id}
                  onClick={() => setSelectedTxn(t)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', cursor: 'pointer', borderBottom: i < transactions.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  {/* Account logo instead of category emoji */}
                  {acct ? (
                    <AccountLogoIcon accountName={acct.name} colorHex={acct.color_hex ?? undefined} size={38} borderRadius={10} />
                  ) : (
                    <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: t.type === 'income' ? 'rgba(74,222,128,.12)' : 'rgba(248,113,113,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>
                      {cat?.icon ?? '💳'}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {acct?.name ?? (cat?.label ?? t.category)}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text3)' }}>
                      {cat?.label ?? t.category} · {format(new Date(t.txn_date + 'T00:00:00'), 'MMM d')}
                      {t.note ? ` · ${t.note.replace(/__(?:rid|meid):[^_]+__\s?/, '')}` : ''}
                    </p>
                  </div>
                  <Amount value={t.type === 'expense' ? -Number(t.amount) : Number(t.amount)} size="sm" showSign />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddTransactionModal open={addTxnOpen} onClose={() => setAddTxnOpen(false)} />
      <AddAccountModal open={addAcctOpen} onClose={() => setAddAcctOpen(false)} />
      <TransactionDetailModal txn={selectedTxn} onClose={() => setSelectedTxn(null)} />
      <AccountTransactionsModal account={selectedAccount} open={!!selectedAccount} onClose={() => setSelectedAccount(null)} />
      <RecurringSummaryModal
        type={recurringModal ?? 'income'}
        open={!!recurringModal}
        onClose={() => setRecurringModal(null)}
        recurringItems={recurring}
        transactions={transactions}
      />
    </div>
  )
}
