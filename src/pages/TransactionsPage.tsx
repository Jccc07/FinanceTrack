import React, { useState } from 'react'
import { format, subMonths, addMonths } from 'date-fns'
import { Plus, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useTransactions } from '@/hooks/useTransactions'
import { useAccounts } from '@/hooks/useAccounts'
import { CATEGORIES } from '@/constants/categories'
import { Card, Button, Amount, EmptyState, Spinner, Select, Input } from '@/components/ui'
import { AccountLogoIcon } from '@/components/ui/AccountLogoIcon'
import { AddTransactionModal } from '@/components/modals/AddTransactionModal'
import { TransactionDetailModal } from '@/components/modals/TransactionDetailModal'

export function TransactionsPage() {
  const [month, setMonth]       = useState(new Date())
  const [search, setSearch]     = useState('')
  const [filterAccount, setFilterAccount] = useState('')
  const [filterType, setFilterType] = useState<'income' | 'expense' | ''>('')
  const [addOpen, setAddOpen]   = useState(false)
  const [selectedTxn, setSelectedTxn] = useState<any>(null)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

  const { data: transactions = [], isLoading } = useTransactions({ month })
  const { data: accounts = [] } = useAccounts()

  // Reset to page 1 whenever filters or month change
  React.useEffect(() => { setPage(1) }, [month, search, filterAccount, filterType])

  const accountMap = Object.fromEntries(accounts.map(a => [a.id, a]))

  const filtered = transactions.filter(t => {
    const matchSearch = !search || t.category.toLowerCase().includes(search.toLowerCase()) || (t.note ?? '').toLowerCase().includes(search.toLowerCase()) || (accountMap[t.account_id]?.name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchAccount = !filterAccount || t.account_id === filterAccount
    const matchType    = !filterType || t.type === filterType
    return matchSearch && matchAccount && matchType
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

  // Flatten filtered into ordered list for pagination, then re-group current page
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageSlice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const pageGrouped: Record<string, typeof filtered> = {}
  for (const t of pageSlice) {
    if (!pageGrouped[t.txn_date]) pageGrouped[t.txn_date] = []
    pageGrouped[t.txn_date].push(t)
  }
  const pageDates = Object.keys(pageGrouped).sort((a, b) => b.localeCompare(a))

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-body)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px' }}>Transactions</h1>
        <button
          onClick={() => setAddOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--indigo)', border: 'none', color: '#fff',
            borderRadius: 12, padding: '9px 16px', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', letterSpacing: '-0.1px',
          }}
        >
          <Plus size={15} /> Add
        </button>
      </div>

      {/* Month nav */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg2)', borderRadius: 'var(--radius-lg)', padding: '10px 8px',
        marginBottom: 12, border: '1px solid var(--border2)',
      }}>
        <button
          onClick={() => setMonth(m => subMonths(m, 1))}
          style={{ background: 'var(--bg3)', border: 'none', cursor: 'pointer', color: 'var(--text2)', padding: 8, borderRadius: 10, display: 'flex' }}
        >
          <ChevronLeft size={18} />
        </button>

        <div style={{ textAlign: 'center', flex: 1 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, letterSpacing: '-0.2px' }}>
            {format(month, 'MMMM yyyy')}
          </p>
          {/* Cash in / Cash out pill containers */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 7 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(74,222,128,.1)', border: '1px solid rgba(74,222,128,.2)',
              borderRadius: 20, padding: '3px 10px',
            }}>
              <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 500, opacity: 0.8 }}>IN</span>
              <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 700 }}>
                +₱{income.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.2)',
              borderRadius: 20, padding: '3px 10px',
            }}>
              <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 500, opacity: 0.8 }}>OUT</span>
              <span style={{ fontSize: 12, color: 'var(--red)', fontWeight: 700 }}>
                -₱{expense.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setMonth(m => addMonths(m, 1))}
          style={{ background: 'var(--bg3)', border: 'none', cursor: 'pointer', color: 'var(--text2)', padding: 8, borderRadius: 10, display: 'flex' }}
        >
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
          <Select value={filterAccount} onChange={e => setFilterAccount(e.target.value)}>
            <option value="">All accounts</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
        </div>
      </div>

      {/* List */}
      {isLoading
        ? <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner /></div>
        : filtered.length === 0
          ? <EmptyState icon={<Search size={22} />} title="No transactions" description="Try adjusting your filters" action={<Button onClick={() => setAddOpen(true)}><Plus size={14} /> Add transaction</Button>} />
          : pageDates.map(date => (
            <div key={date} style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-body)' }}>
                {format(new Date(date + 'T00:00:00'), 'EEE, MMM d')}
              </p>
              <div style={{ background: 'var(--bg2)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border2)' }}>
                {pageGrouped[date].map((t, i) => {
                  const cat = CATEGORIES.find(c => c.key === t.category)
                  const acct = accountMap[t.account_id]
                  return (
                    <div key={t.id}
                      onClick={() => setSelectedTxn(t)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                        borderBottom: i < pageGrouped[date].length - 1 ? '1px solid var(--border)' : 'none',
                        cursor: 'pointer', transition: 'background .1s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      {/* Account logo as icon */}
                      {acct ? (
                        <AccountLogoIcon accountName={acct.name} colorHex={acct.color_hex ?? undefined} size={38} borderRadius={10} />
                      ) : (
                        <div style={{
                          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                          background: t.type === 'income' ? 'rgba(74,222,128,.1)' : 'rgba(248,113,113,.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
                        }}>
                          {cat?.icon ?? '💳'}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.1px' }}>
                          {t.category === 'account_adjustment' && t.note
                            ? t.note.replace(/__adj:(edit|delete)__\s?/, '')
                            : acct?.name ?? (cat?.label ?? t.category)}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.category === 'account_adjustment'
                            ? 'Account adjustment'
                            : `${cat?.label ?? t.category}${t.note ? ` · ${t.note.replace(/__(?:rid|meid):[^_]+__\s?/, '')}` : ''}`}
                        </p>
                      </div>
                      {t.category === 'account_adjustment'
                        ? <span style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 500, flexShrink: 0 }}>₱{Number(t.amount).toLocaleString()}</span>
                        : <Amount value={t.type === 'expense' ? -Number(t.amount) : Number(t.amount)} size="sm" showSign />
                      }
                    </div>
                  )
                })}
              </div>
            </div>
          ))
      }

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 20, marginBottom: 8 }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={safePage === 1}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)',
              background: 'var(--bg2)', cursor: safePage === 1 ? 'not-allowed' : 'pointer',
              color: safePage === 1 ? 'var(--text4)' : 'var(--text2)', transition: 'opacity .15s',
              opacity: safePage === 1 ? 0.4 : 1,
            }}>
            <ChevronLeft size={16} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} style={{
                width: 32, height: 32, borderRadius: 8, border: 'none',
                background: p === safePage ? 'var(--indigo)' : 'var(--bg2)',
                color: p === safePage ? '#fff' : 'var(--text3)',
                fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)',
                cursor: 'pointer', transition: 'all .15s',
              }}>{p}</button>
            ))}
          </div>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)',
              background: 'var(--bg2)', cursor: safePage === totalPages ? 'not-allowed' : 'pointer',
              color: safePage === totalPages ? 'var(--text4)' : 'var(--text2)', transition: 'opacity .15s',
              opacity: safePage === totalPages ? 0.4 : 1,
            }}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
      {filtered.length > 0 && (
        <p style={{ fontSize: 11, color: 'var(--text4)', textAlign: 'center', marginBottom: 16 }}>
          Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} transactions
        </p>
      )}

      <AddTransactionModal open={addOpen} onClose={() => setAddOpen(false)} />
      <TransactionDetailModal txn={selectedTxn} onClose={() => setSelectedTxn(null)} />
    </div>
  )
}