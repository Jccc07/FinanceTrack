import React, { useState } from 'react'
import { format, subMonths, addMonths } from 'date-fns'
import { Plus, ChevronLeft, ChevronRight, Trash2, Search } from 'lucide-react'
import { useTransactions, useDeleteTransaction } from '@/hooks/useTransactions'
import { useAccounts } from '@/hooks/useAccounts'
import { CATEGORIES } from '@/constants/categories'
import { Card, Button, Badge, Amount, EmptyState, Spinner, Select, Input } from '@/components/ui'
import { AddTransactionModal } from '@/components/modals/AddTransactionModal'

export function TransactionsPage() {
  const [month, setMonth]       = useState(new Date())
  const [search, setSearch]     = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterType, setFilterType] = useState<'income' | 'expense' | ''>('')
  const [addOpen, setAddOpen]   = useState(false)

  const { data: transactions = [], isLoading } = useTransactions({ month })
  const { data: accounts = [] } = useAccounts()
  const deleteTransaction = useDeleteTransaction()

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 800 }}>Transactions</h1>
        <Button onClick={() => setAddOpen(true)}>
          <Plus size={15} /> Add transaction
        </Button>
      </div>

      {/* Month nav */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => setMonth(m => subMonths(m, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', padding: 8, borderRadius: 8 }}>
            <ChevronLeft size={18} />
          </button>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 17 }}>{format(month, 'MMMM yyyy')}</p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--green)' }}>+<Amount value={income} size="sm" /></span>
              <span style={{ fontSize: 12, color: 'var(--red)' }}>−<Amount value={expense} size="sm" /></span>
            </div>
          </div>
          <button onClick={() => setMonth(m => addMonths(m, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', padding: 8, borderRadius: 8 }}>
            <ChevronRight size={18} />
          </button>
        </div>
      </Card>

      {/* Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, marginBottom: 20 }}>
        <Input
          placeholder="Search transactions…"
          value={search} onChange={e => setSearch(e.target.value)}
          leftIcon={<Search size={14} />}
        />
        <Select value={filterType} onChange={e => setFilterType(e.target.value as any)} style={{ minWidth: 120 }}>
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </Select>
        <Select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ minWidth: 140 }}>
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.key}</option>)}
        </Select>
      </div>

      {/* List */}
      {isLoading
        ? <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner /></div>
        : filtered.length === 0
          ? <EmptyState icon={<Search size={22} />} title="No transactions" description="Try adjusting your filters" action={<Button onClick={() => setAddOpen(true)}><Plus size={14} /> Add transaction</Button>} />
          : sortedDates.map(date => (
            <div key={date} style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {format(new Date(date + 'T00:00:00'), 'EEEE, MMMM d')}
              </p>
              <Card style={{ padding: 0, overflow: 'hidden' }}>
                {grouped[date].map((t, i) => (
                  <div key={t.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    borderBottom: i < grouped[date].length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: t.type === 'income' ? 'rgba(74,222,128,.1)' : 'rgba(248,113,113,.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16,
                    }}>
                      {CATEGORIES.find(c => c.key === t.category)?.icon ?? '💳'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600 }}>{t.category}</p>
                      <p style={{ fontSize: 12, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {accountMap[t.account_id] ?? '—'}{t.note ? ` · ${t.note.replace(/__rid:[^_]+__\s?/, '')}` : ''}
                      </p>
                    </div>
                    <Amount value={t.type === 'expense' ? -Number(t.amount) : Number(t.amount)} size="sm" showSign />
                    <button
                      onClick={() => { if (confirm('Delete this transaction?')) deleteTransaction.mutate(t.id) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text4)', padding: 6, borderRadius: 6, display: 'flex' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text4)'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </Card>
            </div>
          ))
      }

      <AddTransactionModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
