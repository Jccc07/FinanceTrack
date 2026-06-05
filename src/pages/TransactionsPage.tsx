import React, { useState } from 'react'
import { format, subMonths, addMonths } from 'date-fns'
import { Plus, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useTransactions } from '@/hooks/useTransactions'
import { useAccounts } from '@/hooks/useAccounts'
import { CATEGORIES } from '@/constants/categories'
import { Card, Button, Amount, EmptyState, Spinner, Select, Input } from '@/components/ui'
import { AddTransactionModal } from '@/components/modals/AddTransactionModal'
import { TransactionDetailModal } from '@/components/modals/TransactionDetailModal'

export function TransactionsPage() {
  const [month, setMonth]       = useState(new Date())
  const [search, setSearch]     = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterType, setFilterType] = useState<'income' | 'expense' | ''>('')
  const [addOpen, setAddOpen]   = useState(false)
  const [selectedTxn, setSelectedTxn] = useState<any>(null)

  const { data: transactions = [], isLoading } = useTransactions({ month })
  const { data: accounts = [] } = useAccounts()

  const accountMap = Object.fromEntries(accounts.map(a => [a.id, a.name]))

  const filtered = transactions.filter(t => {
    const matchSearch = !search || t.category.toLowerCase().includes(search.toLowerCase()) || (t.note ?? '').toLowerCase().includes(search.toLowerCase())
    const matchCat    = !filterCat || t.category === filterCat
    const matchType   = !filterType || t.type === filterType
    return matchSearch && matchCat && matchType
  })

  const income  = filtered.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const expense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

  const grouped: Record<string, typeof filtered> = {}
  for (const t of filtered) {
    const d = t.txn_date
    if (!grouped[d]) grouped[d] = []
    grouped[d].push(t)
  }
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 800 }}>Transactions</h1>
        <button onClick={() => setAddOpen(true)} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'var(--indigo)', border: 'none', color: '#fff',
          borderRadius: 12, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          <Plus size={15} /> Add
        </button>
      </div>

      {/* Month nav */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg2)', borderRadius: 'var(--radius-lg)', padding: '12px 8px',
        marginBottom: 12, border: '1px solid var(--border)',
      }}>
        <button onClick={() => setMonth(m => subMonths(m, 1))} style={{ background: 'var(--bg3)', border: 'none', cursor: 'pointer', color: 'var(--text2)', padding: 8, borderRadius: 10, display: 'flex' }}>
          <ChevronLeft size={18} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16 }}>{format(month, 'MMMM yyyy')}</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>+₱{income.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
            <span style={{ fontSize: 12, color: 'var(--red)', fontWeight: 600 }}>-₱{expense.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
        <button onClick={() => setMonth(m => addMonths(m, 1))} style={{ background: 'var(--bg3)', border: 'none', cursor: 'pointer', color: 'var(--text2)', padding: 8, borderRadius: 10, display: 'flex' }}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        <Input
          placeholder="Search transactions…"
          value={search} onChange={e => setSearch(e.target.value)}
          leftIcon={<Search size={14} />}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Select value={filterType} onChange={e => setFilterType(e.target.value as any)}>
            <option value="">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </Select>
          <Select value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
          </Select>
        </div>
      </div>

      {/* List */}
      {isLoading
        ? <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner /></div>
        : filtered.length === 0
          ? <EmptyState icon={<Search size={22} />} title="No transactions" description="Try adjusting your filters" action={<Button onClick={() => setAddOpen(true)}><Plus size={14} /> Add transaction</Button>} />
          : sortedDates.map(date => (
            <div key={date} style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {format(new Date(date + 'T00:00:00'), 'EEE, MMM d')}
              </p>
              <div style={{ background: 'var(--bg2)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                {grouped[date].map((t, i) => {
                  const cat = CATEGORIES.find(c => c.key === t.category)
                  return (
                    <div key={t.id}
                      onClick={() => setSelectedTxn(t)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                        borderBottom: i < grouped[date].length - 1 ? '1px solid var(--border)' : 'none',
                        cursor: 'pointer', transition: 'background .1s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                        background: t.type === 'income' ? 'rgba(74,222,128,.1)' : 'rgba(248,113,113,.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
                      }}>
                        {cat?.icon ?? '💳'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat?.label ?? t.category}</p>
                        <p style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {accountMap[t.account_id] ?? '—'}{t.note ? ` · ${t.note.replace(/__rid:[^_]+__\s?/, '')}` : ''}
                        </p>
                      </div>
                      <Amount value={t.type === 'expense' ? -Number(t.amount) : Number(t.amount)} size="sm" showSign />
                    </div>
                  )
                })}
              </div>
            </div>
          ))
      }

      <AddTransactionModal open={addOpen} onClose={() => setAddOpen(false)} />
      <TransactionDetailModal txn={selectedTxn} onClose={() => setSelectedTxn(null)} />
    </div>
  )
}
