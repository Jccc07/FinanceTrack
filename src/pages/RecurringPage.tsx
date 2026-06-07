import React, { useState, useEffect, useMemo } from 'react'
import {
  format, addMonths, subMonths, isSameMonth,
  startOfMonth, getYear, getMonth,
} from 'date-fns'
import {
  Plus, ChevronLeft, ChevronRight, Check, Info,
  Trash2, Send, Lock, Calendar,
} from 'lucide-react'
import {
  useMonthEntries, useAddMonthEntry, useRemoveMonthEntry,
  useExportEntriesToMonths, useMarkEntryPaid, useUnmarkEntryPaid,
  getEntryPaidTxnForMonth, type MonthEntry,
} from '@/hooks/useRecurringItems'
import { useAccounts } from '@/hooks/useAccounts'
import { useAuthStore } from '@/stores/authStore'
import { CATEGORIES } from '@/constants/categories'
import { Button, Input, Select, Modal, Spinner, Amount, Badge } from '@/components/ui'

// ─── Constants ──────────────────────────────────────────────────────────────

const FREQ_OPTS = ['daily', 'weekly', 'monthly', 'yearly']
const TYPE_OPTS = ['bill', 'subscription', 'installment', 'income'] as const
const TYPE_COLORS: Record<string, string> = {
  bill: 'red', subscription: 'indigo', installment: 'yellow', income: 'green',
}

const NOW = new Date()

function isPastMonth(date: Date) { return date < startOfMonth(NOW) }
function isCurrentMonth(date: Date) { return isSameMonth(date, NOW) }

// Build all months for the current year
function getYearMonths(year: number) {
  return Array.from({ length: 12 }, (_, i) => new Date(year, i, 1))
}

// ─── Add Entry Modal ─────────────────────────────────────────────────────────

function AddEntryModal({
  open, onClose, monthKey, prefill,
}: {
  open: boolean; onClose: () => void; monthKey: string; prefill?: Partial<MonthEntry>
}) {
  const addEntry = useAddMonthEntry()
  const [f, setF] = useState({
    name: prefill?.name ?? '',
    amount: prefill?.amount?.toString() ?? '',
    category: prefill?.category ?? '',
    frequency: prefill?.frequency ?? 'monthly',
    item_type: (prefill?.item_type ?? 'bill') as MonthEntry['item_type'],
    installment_total: prefill?.installment_total?.toString() ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && prefill) {
      setF({
        name: prefill.name ?? '',
        amount: prefill.amount?.toString() ?? '',
        category: prefill.category ?? '',
        frequency: prefill.frequency ?? 'monthly',
        item_type: prefill.item_type ?? 'bill',
        installment_total: prefill.installment_total?.toString() ?? '',
      })
    }
    if (!open) { setError(''); setLoading(false) }
  }, [open])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await addEntry.mutateAsync({
        month_key: monthKey,
        name: f.name,
        amount: parseFloat(f.amount),
        category: f.category || f.item_type,
        frequency: f.frequency,
        item_type: f.item_type,
        installment_total: f.item_type === 'installment' ? parseInt(f.installment_total || '0') : null,
        installment_paid: 0,
        source_item_id: prefill?.source_item_id ?? null,
      })
      onClose()
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Entry">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input
          label="Name" placeholder="Netflix, Rent, Salary…"
          value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} required
        />
        <Input
          label="Amount (₱)" type="number" placeholder="0.00" step="0.01"
          value={f.amount} onChange={e => setF(p => ({ ...p, amount: e.target.value }))} required
        />
        <Select label="Type" value={f.item_type} onChange={e => setF(p => ({ ...p, item_type: e.target.value as MonthEntry['item_type'] }))}>
          {TYPE_OPTS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </Select>
        <Select label="Frequency" value={f.frequency} onChange={e => setF(p => ({ ...p, frequency: e.target.value }))}>
          {FREQ_OPTS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </Select>
        <Select label="Category" value={f.category} onChange={e => setF(p => ({ ...p, category: e.target.value }))}>
          <option value="">Auto</option>
          {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
        </Select>
        {f.item_type === 'installment' && (
          <Input
            label="Total installments" type="number" placeholder="12"
            value={f.installment_total} onChange={e => setF(p => ({ ...p, installment_total: e.target.value }))}
          />
        )}
        {error && <p style={{ fontSize: 13, color: 'var(--red)' }}>{error}</p>}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
          <Button
            type="button" fullWidth loading={loading}
            onClick={e => submit(e as any)}
          >
            Add entry
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Mark Paid Modal ─────────────────────────────────────────────────────────

function MarkPaidModal({
  open, onClose, entry, monthKey,
}: {
  open: boolean; onClose: () => void; entry: MonthEntry | null; monthKey: string
}) {
  const { data: accounts = [] } = useAccounts()
  const markPaid = useMarkEntryPaid()
  const [accountId, setAccountId] = useState('')
  const [loading, setLoading] = useState(false)

  if (!entry) return null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountId) return
    setLoading(true)
    try {
      await markPaid.mutateAsync({ entry, accountId, monthKey })
      onClose()
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Mark "${entry.name}" as paid`} width={340}>
      <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 14 }}>
        Which account did you use to pay?
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Select label="Account" value={accountId} onChange={e => setAccountId(e.target.value)} required>
          <option value="">Select account…</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </Select>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
          <Button
            type="button" fullWidth loading={loading}
            onClick={e => submit(e as any)}
          >
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Export to Month Modal ────────────────────────────────────────────────────

function ExportModal({
  open, onClose, entries, sourceMonthKey,
}: {
  open: boolean; onClose: () => void; entries: MonthEntry[]; sourceMonthKey: string
}) {
  const exportEntries = useExportEntriesToMonths()
  const currentYear = getYear(NOW)
  const allMonths = getYearMonths(currentYear)

  // Exclude past months and the source month itself
  const sourceDate = new Date(sourceMonthKey + '-01')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!open) { setSelected(new Set()); setDone(false) }
  }, [open])

  const toggleMonth = (mk: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(mk) ? next.delete(mk) : next.add(mk)
      return next
    })
  }

  const handleExport = async () => {
    if (selected.size === 0) return
    setLoading(true)
    try {
      await exportEntries.mutateAsync({ entries, targetMonthKeys: Array.from(selected) })
      setDone(true)
      setTimeout(onClose, 1200)
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Export entries to…" width={360}>
      <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 14 }}>
        Choose which months to copy these {entries.length} entries to.
        Months that already have entries will be skipped.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
        {allMonths.map(m => {
          const mk = format(m, 'yyyy-MM')
          const isPast = isPastMonth(m)
          const isSource = mk === sourceMonthKey
          const isCurr = isCurrentMonth(m)
          const disabled = isPast || isSource
          const isSelected = selected.has(mk)

          return (
            <button
              key={mk}
              disabled={disabled}
              onClick={() => !disabled && toggleMonth(mk)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 10,
                border: `1px solid ${isSelected ? 'var(--indigo)' : 'var(--border)'}`,
                background: isSelected ? 'rgba(99,102,241,.1)' : disabled ? 'var(--bg)' : 'var(--bg2)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.4 : 1,
                transition: 'all .15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={14} color={isSelected ? 'var(--indigo)' : 'var(--text3)'} />
                <span style={{ fontSize: 14, fontWeight: 500, color: disabled ? 'var(--text3)' : 'var(--text)' }}>
                  {format(m, 'MMMM')}
                </span>
                {isCurr && (
                  <span style={{ fontSize: 10, background: 'var(--indigo)', color: '#fff', borderRadius: 99, padding: '1px 6px', fontWeight: 600 }}>
                    Current
                  </span>
                )}
                {isSource && (
                  <span style={{ fontSize: 10, background: 'var(--bg3)', color: 'var(--text3)', borderRadius: 99, padding: '1px 6px' }}>
                    Source
                  </span>
                )}
                {isPast && !isSource && (
                  <Lock size={11} color="var(--text4)" />
                )}
              </div>
              {isSelected && <Check size={15} color="var(--indigo)" />}
            </button>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Button variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
        <Button
          fullWidth loading={loading} disabled={selected.size === 0 || done}
          onClick={handleExport}
        >
          {done ? <><Check size={14} /> Done!</> : `Export to ${selected.size} month${selected.size !== 1 ? 's' : ''}`}
        </Button>
      </div>
    </Modal>
  )
}

// ─── Single Entry Row ─────────────────────────────────────────────────────────

function EntryRow({
  entry, monthKey, isCurrentMo, isPast,
}: {
  entry: MonthEntry; monthKey: string; isCurrentMo: boolean; isPast: boolean
}) {
  const userId = useAuthStore(s => s.user?.id)
  const removeEntry = useRemoveMonthEntry()
  const unmark = useUnmarkEntryPaid()

  const [markOpen, setMarkOpen] = useState(false)
  const [isPaid, setIsPaid] = useState(false)
  const [checking, setChecking] = useState(true)
  const [removing, setRemoving] = useState(false)

  useEffect(() => {
    if (!userId) return
    getEntryPaidTxnForMonth(userId, entry.id, monthKey).then(txnId => {
      setIsPaid(!!txnId); setChecking(false)
    })
  }, [entry.id, monthKey, userId])

  const cat = CATEGORIES.find(c => c.key === entry.category)
  const canCheck = isCurrentMo

  const handleCheck = () => {
    if (!canCheck || checking) return
    if (isPaid) {
      unmark.mutate({ entry, monthKey })
      setIsPaid(false)
    } else {
      setMarkOpen(true)
    }
  }

  const handleRemove = async () => {
    if (!confirm(`Remove "${entry.name}" from this month?`)) return
    setRemoving(true)
    await removeEntry.mutateAsync({ id: entry.id, monthKey })
  }

  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px',
        borderRadius: 12, background: isPaid ? 'rgba(74,222,128,.04)' : 'var(--bg2)',
        border: `1px solid ${isPaid ? 'rgba(74,222,128,.2)' : 'var(--border)'}`,
        opacity: removing ? 0.4 : 1, transition: 'opacity .15s',
      }}>
        {/* Checkbox — only current month */}
        <button
          onClick={handleCheck}
          disabled={!canCheck || checking}
          title={isPast ? 'Past month — read only' : !isCurrentMo ? 'Future month — cannot check yet' : undefined}
          style={{
            width: 24, height: 24, borderRadius: 7, flexShrink: 0,
            border: isPaid ? '2px solid var(--green)' : '2px solid var(--border2)',
            background: isPaid ? 'var(--green)' : 'transparent',
            cursor: canCheck ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: !canCheck ? 0.35 : 1, transition: 'all .15s',
          }}>
          {checking ? <Spinner size={11} /> : isPaid ? <Check size={12} color="#000" strokeWidth={3} /> : null}
        </button>

        {/* Icon */}
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: isPaid ? 'rgba(74,222,128,.1)' : 'var(--bg3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
        }}>
          {cat?.icon ?? '🔄'}
        </div>

        {/* Name + badge */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 14, fontWeight: 600,
            color: isPaid ? 'var(--text3)' : 'var(--text)',
            textDecoration: isPaid ? 'line-through' : 'none',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{entry.name}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
            <Badge color={TYPE_COLORS[entry.item_type] ?? 'gray'}>{entry.item_type}</Badge>
            {entry.item_type === 'installment' && (
              <span style={{ fontSize: 10, color: 'var(--text4)' }}>
                {entry.installment_paid}/{entry.installment_total}
              </span>
            )}
          </div>
        </div>

        {/* Amount */}
        <div style={{ textAlign: 'right', marginRight: 6 }}>
          <Amount value={Number(entry.amount)} size="sm" />
          <p style={{ fontSize: 10, color: 'var(--text4)', marginTop: 1 }}>{entry.frequency}</p>
        </div>

        {/* Remove — only on current & future months */}
        {!isPast && (
          <button
            onClick={handleRemove}
            disabled={removing}
            title="Remove from this month"
            style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: 'transparent', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text4)', transition: 'all .15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(248,113,113,.1)'
              e.currentTarget.style.borderColor = 'rgba(248,113,113,.3)'
              e.currentTarget.style.color = 'var(--red)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.color = 'var(--text4)'
            }}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      <MarkPaidModal
        open={markOpen}
        onClose={() => { setMarkOpen(false); setIsPaid(true) }}
        entry={entry}
        monthKey={monthKey}
      />
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function RecurringPage() {
  const [viewMonth, setViewMonth] = useState(startOfMonth(NOW))
  const [addOpen, setAddOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [filter, setFilter] = useState<string>('all')

  const monthKey = format(viewMonth, 'yyyy-MM')
  const { data: entries = [], isLoading } = useMonthEntries(monthKey)

  const isPast = isPastMonth(viewMonth)
  const isCurrent = isCurrentMonth(viewMonth)
  const isFuture = !isPast && !isCurrent

  // Year boundaries
  const currentYear = getYear(NOW)
  const minMonth = new Date(currentYear, 0, 1)
  const maxMonth = new Date(currentYear, 11, 1)
  const canGoPrev = viewMonth > minMonth
  const canGoNext = !isSameMonth(viewMonth, maxMonth)

  const filtered = filter === 'all' ? entries : entries.filter(e => e.item_type === filter)
  const bills   = filtered.filter(e => e.item_type !== 'income')
  const incomes = filtered.filter(e => e.item_type === 'income')

  const totalExpenses = bills.reduce((s, e) => s + Number(e.amount), 0)
  const totalIncome   = incomes.reduce((s, e) => s + Number(e.amount), 0)

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 800 }}>Recurring</h1>
        {(isCurrent || isFuture) && (
          <button
            onClick={() => setAddOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--indigo)', border: 'none', color: '#fff',
              borderRadius: 12, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Plus size={15} /> Add entry
          </button>
        )}
      </div>

      {/* Month navigator */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg2)', borderRadius: 'var(--radius-lg)', padding: '12px 8px',
        marginBottom: 12, border: '1px solid var(--border)',
      }}>
        <button
          onClick={() => canGoPrev && setViewMonth(m => subMonths(m, 1))}
          disabled={!canGoPrev}
          style={{
            background: canGoPrev ? 'var(--bg3)' : 'transparent', border: 'none',
            cursor: canGoPrev ? 'pointer' : 'not-allowed', color: 'var(--text2)',
            padding: 8, borderRadius: 10, display: 'flex', opacity: canGoPrev ? 1 : 0.3,
          }}>
          <ChevronLeft size={18} />
        </button>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16 }}>
            {format(viewMonth, 'MMMM yyyy')}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 3 }}>
            {isCurrent && (
              <span style={{ fontSize: 11, background: 'var(--indigo)', color: '#fff', borderRadius: 99, padding: '2px 8px', fontWeight: 600 }}>
                Current
              </span>
            )}
            {isPast && (
              <span style={{ fontSize: 11, background: 'var(--bg3)', color: 'var(--text3)', borderRadius: 99, padding: '2px 8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Lock size={9} /> Read-only
              </span>
            )}
            {isFuture && (
              <span style={{ fontSize: 11, background: 'var(--bg3)', color: 'var(--text3)', borderRadius: 99, padding: '2px 8px', fontWeight: 600 }}>
                Planned
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => canGoNext && setViewMonth(m => addMonths(m, 1))}
          disabled={!canGoNext}
          style={{
            background: canGoNext ? 'var(--bg3)' : 'transparent', border: 'none',
            cursor: canGoNext ? 'pointer' : 'not-allowed', color: 'var(--text2)',
            padding: 8, borderRadius: 10, display: 'flex', opacity: canGoNext ? 1 : 0.3,
          }}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Past month banner */}
      {isPast && (
        <div style={{
          background: 'rgba(251,191,36,.06)', border: '1px solid rgba(251,191,36,.18)',
          borderRadius: 12, padding: '12px 14px', marginBottom: 12,
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <Lock size={14} color="var(--yellow)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, color: 'var(--yellow)', fontWeight: 600, marginBottom: 3 }}>
              Past month — read only
            </p>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>
              You can't edit past entries, but you can export them to future months.
            </p>
            {entries.length > 0 && (
              <button
                onClick={() => setExportOpen(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(251,191,36,.12)', border: '1px solid rgba(251,191,36,.25)',
                  color: 'var(--yellow)', borderRadius: 8, padding: '6px 12px',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>
                <Send size={12} /> Export entries to another month
              </button>
            )}
          </div>
        </div>
      )}

      {/* Future month hint */}
      {isFuture && (
        <div style={{
          background: 'rgba(99,102,241,.06)', border: '1px solid rgba(99,102,241,.15)',
          borderRadius: 12, padding: '12px 14px', marginBottom: 12,
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <Calendar size={14} color="var(--indigo)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, color: 'var(--indigo)', fontWeight: 600, marginBottom: 3 }}>
              Planning ahead
            </p>
            <p style={{ fontSize: 12, color: 'var(--text3)' }}>
              Add entries to plan this month. You'll be able to check them off when the month arrives.
            </p>
          </div>
        </div>
      )}

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div style={{
          background: 'var(--bg2)', borderRadius: 12, padding: '12px',
          border: '1px solid rgba(248,113,113,.15)', textAlign: 'center',
        }}>
          <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Bills / Expenses</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--red)' }}>
            ₱{totalExpenses.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div style={{
          background: 'var(--bg2)', borderRadius: 12, padding: '12px',
          border: '1px solid rgba(74,222,128,.15)', textAlign: 'center',
        }}>
          <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Income</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)' }}>
            ₱{totalIncome.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 2 }}>
        {(['all', ...TYPE_OPTS] as string[]).map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            style={{
              padding: '6px 14px', borderRadius: 99, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 500, transition: 'all .15s', flexShrink: 0,
              background: filter === t ? 'var(--indigo)' : 'var(--bg2)',
              color: filter === t ? '#fff' : 'var(--text3)',
            }}>
            {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Entry list */}
      {isLoading
        ? <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner /></div>
        : filtered.length === 0
          ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
              <p style={{ fontSize: 32, marginBottom: 10 }}>🔁</p>
              <p style={{ fontWeight: 600, marginBottom: 6 }}>No entries for {format(viewMonth, 'MMMM')}</p>
              <p style={{ fontSize: 13 }}>
                {isPast
                  ? 'Nothing was recorded for this month.'
                  : isFuture
                  ? 'Plan ahead by adding entries or exporting from another month.'
                  : 'Track your bills, subscriptions, and income.'
                }
              </p>
              {(isCurrent || isFuture) && (
                <button
                  onClick={() => setAddOpen(true)}
                  style={{
                    marginTop: 16, background: 'var(--indigo)', border: 'none',
                    color: '#fff', borderRadius: 12, padding: '10px 20px',
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}>
                  + Add entry
                </button>
              )}
            </div>
          )
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {bills.length > 0 && (
                <div>
                  <p style={{
                    fontSize: 11, fontWeight: 700, color: 'var(--text3)',
                    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
                  }}>Bills & Expenses</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {bills.map(entry => (
                      <EntryRow
                        key={entry.id}
                        entry={entry}
                        monthKey={monthKey}
                        isCurrentMo={isCurrent}
                        isPast={isPast}
                      />
                    ))}
                  </div>
                </div>
              )}

              {incomes.length > 0 && (
                <div>
                  <p style={{
                    fontSize: 11, fontWeight: 700, color: 'var(--text3)',
                    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
                  }}>Income</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {incomes.map(entry => (
                      <EntryRow
                        key={entry.id}
                        entry={entry}
                        monthKey={monthKey}
                        isCurrentMo={isCurrent}
                        isPast={isPast}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Export button at bottom for past/future too */}
              {!isPast && entries.length > 0 && (
                <button
                  onClick={() => setExportOpen(true)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    background: 'var(--bg2)', border: '1px solid var(--border)',
                    color: 'var(--text3)', borderRadius: 12, padding: '10px',
                    fontSize: 13, fontWeight: 500, cursor: 'pointer', marginTop: 4,
                    transition: 'all .15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--indigo)'
                    e.currentTarget.style.color = 'var(--indigo)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.color = 'var(--text3)'
                  }}
                >
                  <Send size={13} /> Export entries to another month
                </button>
              )}
            </div>
          )
      }

      <AddEntryModal open={addOpen} onClose={() => setAddOpen(false)} monthKey={monthKey} />
      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        entries={entries}
        sourceMonthKey={monthKey}
      />
    </div>
  )
}