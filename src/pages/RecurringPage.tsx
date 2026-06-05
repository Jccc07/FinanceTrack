import React, { useState, useEffect } from 'react'
import { format, addMonths, subMonths, isSameMonth, startOfMonth, endOfMonth, getYear } from 'date-fns'
import { Plus, ChevronLeft, ChevronRight, Copy, Check, X, Info } from 'lucide-react'
import {
  useAllRecurringItems, useCreateRecurringItem, useDeleteRecurringItem,
  useMarkRecurringPaid, useUnmarkRecurringPaid, getItemPaidTxnForMonth,
} from '@/hooks/useRecurringItems'
import { useAccounts } from '@/hooks/useAccounts'
import { useAuthStore } from '@/stores/authStore'
import { CATEGORIES } from '@/constants/categories'
import { Button, Input, Select, Modal, Spinner, Amount, Badge } from '@/components/ui'

const FREQ_OPTS = ['daily','weekly','monthly','yearly']
const TYPE_OPTS = ['bill','subscription','installment','income']
const TYPE_COLORS: Record<string, string> = { bill: 'red', subscription: 'indigo', installment: 'yellow', income: 'green' }

const NOW = new Date()

// Check if a month is in the past (before current month)
function isPastMonth(date: Date) {
  return date < startOfMonth(NOW)
}
// Check if it's the current month
function isCurrentMonth(date: Date) {
  return isSameMonth(date, NOW)
}

function AddRecurringModal({ open, onClose, prefill }: { open: boolean; onClose: () => void; prefill?: any }) {
  const create = useCreateRecurringItem()
  const [f, setF] = useState({
    name: prefill?.name ?? '',
    amount: prefill?.amount?.toString() ?? '',
    category: prefill?.category ?? '',
    frequency: prefill?.frequency ?? 'monthly',
    item_type: prefill?.item_type ?? 'bill',
    next_due_date: format(new Date(), 'yyyy-MM-dd'),
    installment_total: prefill?.installment_total?.toString() ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (prefill) setF({ name: prefill.name, amount: prefill.amount?.toString(), category: prefill.category ?? '', frequency: prefill.frequency ?? 'monthly', item_type: prefill.item_type ?? 'bill', next_due_date: format(new Date(), 'yyyy-MM-dd'), installment_total: prefill.installment_total?.toString() ?? '' })
  }, [prefill])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await create.mutateAsync({
        name: f.name, amount: parseFloat(f.amount), category: f.category || f.item_type,
        frequency: f.frequency as any, item_type: f.item_type as any, next_due_date: f.next_due_date,
        installment_total: f.item_type === 'installment' ? parseInt(f.installment_total || '0') : null,
        installment_paid: 0,
      })
      onClose()
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Recurring Item">
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Name" placeholder="Netflix, Rent, Salary…" value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} required />
        <Input label="Amount (₱)" type="number" placeholder="0.00" step="0.01" value={f.amount} onChange={e => setF(p => ({ ...p, amount: e.target.value }))} required />
        <Select label="Type" value={f.item_type} onChange={e => setF(p => ({ ...p, item_type: e.target.value }))}>
          {TYPE_OPTS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </Select>
        <Select label="Frequency" value={f.frequency} onChange={e => setF(p => ({ ...p, frequency: e.target.value }))}>
          {FREQ_OPTS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </Select>
        <Select label="Category" value={f.category} onChange={e => setF(p => ({ ...p, category: e.target.value }))}>
          <option value="">Auto</option>
          {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
        </Select>
        <Input label="Due date" type="date" value={f.next_due_date} onChange={e => setF(p => ({ ...p, next_due_date: e.target.value }))} />
        {f.item_type === 'installment' && (
          <Input label="Total installments" type="number" placeholder="12" value={f.installment_total} onChange={e => setF(p => ({ ...p, installment_total: e.target.value }))} />
        )}
        {error && <p style={{ fontSize: 13, color: 'var(--red)' }}>{error}</p>}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
          <Button type="submit" fullWidth loading={loading}>Add item</Button>
        </div>
      </form>
    </Modal>
  )
}

function MarkPaidModal({ open, onClose, item }: { open: boolean; onClose: () => void; item: any }) {
  const { data: accounts = [] } = useAccounts()
  const markPaid = useMarkRecurringPaid()
  const [accountId, setAccountId] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountId) return
    setLoading(true)
    try { await markPaid.mutateAsync({ item, accountId }); onClose() }
    finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Mark "${item?.name}" as paid`} width={340}>
      <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 14 }}>Which account did you use to pay?</p>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Select label="Account" value={accountId} onChange={e => setAccountId(e.target.value)} required>
          <option value="">Select account…</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </Select>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
          <Button type="submit" fullWidth loading={loading}>Confirm</Button>
        </div>
      </form>
    </Modal>
  )
}

function ItemDetailModal({ open, onClose, item, onDelete }: { open: boolean; onClose: () => void; item: any; onDelete: () => void }) {
  if (!item) return null
  const cat = CATEGORIES.find(c => c.key === item.category)
  return (
    <Modal open={open} onClose={onClose} title="Item Details" width={340}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ textAlign: 'center', padding: '4px 0' }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, margin: '0 auto 10px', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
            {cat?.icon ?? '🔄'}
          </div>
          <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{item.name}</p>
          <Badge color={TYPE_COLORS[item.item_type] ?? 'gray'}>{item.item_type}</Badge>
        </div>
        <div style={{ background: 'var(--bg)', borderRadius: 12, overflow: 'hidden' }}>
          {[
            { label: 'Amount', value: `₱${Number(item.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` },
            { label: 'Frequency', value: item.frequency.charAt(0).toUpperCase() + item.frequency.slice(1) },
            { label: 'Category', value: cat?.label ?? item.category },
            { label: 'Next due', value: format(new Date(item.next_due_date + 'T00:00:00'), 'MMMM d, yyyy') },
            ...(item.item_type === 'installment' ? [{ label: 'Progress', value: `${item.installment_paid ?? 0} / ${item.installment_total} paid` }] : []),
          ].map((row, i, arr) => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ fontSize: 13, color: 'var(--text3)' }}>{row.label}</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{row.value}</span>
            </div>
          ))}
        </div>
        <Button variant="danger" fullWidth onClick={onDelete}>Remove item</Button>
      </div>
    </Modal>
  )
}

function RecurringItemRow({ item, isPast, isCurrentMo }: { item: any; isPast: boolean; isCurrentMo: boolean }) {
  const userId = useAuthStore(s => s.user?.id)
  const deleteItem = useDeleteRecurringItem()
  const unmark = useUnmarkRecurringPaid()
  const [markOpen, setMarkOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [isPaid, setIsPaid] = useState(false)
  const [checking, setChecking] = useState(true)

  const monthStr = format(new Date(), 'yyyy-MM')

  useEffect(() => {
    if (!userId) return
    getItemPaidTxnForMonth(userId, item.id, monthStr).then(txnId => {
      setIsPaid(!!txnId); setChecking(false)
    })
  }, [item.id, monthStr, userId])

  const cat = CATEGORIES.find(c => c.key === item.category)
  const canCheck = isCurrentMo && !isPast

  const handleCheck = () => {
    if (!canCheck) return
    if (isPaid) {
      unmark.mutate({ item, month: monthStr })
    } else {
      setMarkOpen(true)
    }
  }

  const handleDelete = async () => {
    if (confirm('Remove this item?')) { await deleteItem.mutateAsync(item.id); setDetailOpen(false) }
  }

  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
        borderRadius: 12, background: isPaid ? 'rgba(74,222,128,.04)' : 'var(--bg2)',
        border: `1px solid ${isPaid ? 'rgba(74,222,128,.2)' : 'var(--border)'}`,
        opacity: isPast ? 0.7 : 1,
      }}>
        {/* Checkbox */}
        <button
          onClick={handleCheck}
          disabled={!canCheck || checking}
          title={!canCheck ? (isPast ? 'Past month – read only' : 'Future month') : undefined}
          style={{
            width: 24, height: 24, borderRadius: 7, flexShrink: 0,
            border: isPaid ? '2px solid var(--green)' : '2px solid var(--border2)',
            background: isPaid ? 'var(--green)' : 'transparent',
            cursor: canCheck ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: !canCheck ? 0.4 : 1, transition: 'all .15s',
          }}>
          {checking ? <Spinner size={12} /> : isPaid ? <Check size={13} color="#000" strokeWidth={3} /> : null}
        </button>

        {/* Icon */}
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: isPaid ? 'rgba(74,222,128,.1)' : 'var(--bg3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
        }}>
          {cat?.icon ?? '🔄'}
        </div>

        {/* Info - clickable */}
        <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => setDetailOpen(true)}>
          <p style={{ fontSize: 14, fontWeight: 600, color: isPaid ? 'var(--text3)' : 'var(--text)', textDecoration: isPaid ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <Badge color={TYPE_COLORS[item.item_type] ?? 'gray'}>{item.item_type}</Badge>
            {item.item_type === 'installment' && <span style={{ fontSize: 10, color: 'var(--text4)' }}>{item.installment_paid}/{item.installment_total}</span>}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <Amount value={Number(item.amount)} size="sm" />
          <p style={{ fontSize: 10, color: 'var(--text4)', marginTop: 1 }}>{item.frequency}</p>
        </div>
      </div>

      <MarkPaidModal open={markOpen} onClose={() => { setMarkOpen(false); setIsPaid(true) }} item={item} />
      <ItemDetailModal open={detailOpen} onClose={() => setDetailOpen(false)} item={item} onDelete={handleDelete} />
    </>
  )
}

export function RecurringPage() {
  const { data: items = [], isLoading } = useAllRecurringItems()
  const [viewMonth, setViewMonth] = useState(startOfMonth(NOW))
  const [addOpen, setAddOpen] = useState(false)
  const [copyConfirm, setCopyConfirm] = useState(false)
  const [filter, setFilter] = useState<string>('all')

  const isPast = isPastMonth(viewMonth)
  const isCurrent = isCurrentMonth(viewMonth)
  const isFuture = !isPast && !isCurrent

  // Only allow navigating within current year
  const minMonth = new Date(getYear(NOW), 0, 1)
  const maxMonth = new Date(getYear(NOW), 11, 1)
  const canGoPrev = viewMonth > minMonth
  const canGoNext = viewMonth <= maxMonth && !isSameMonth(viewMonth, maxMonth)

  const filtered = filter === 'all' ? items : items.filter(i => i.item_type === filter)

  const bills    = filtered.filter(i => i.item_type !== 'income')
  const incomes  = filtered.filter(i => i.item_type === 'income')

  const totalExpenses = bills.reduce((s, i) => s + Number(i.amount), 0)
  const totalIncome   = incomes.reduce((s, i) => s + Number(i.amount), 0)

  const handleCopyToCurrentMonth = () => {
    setCopyConfirm(true)
    // In a real app you'd copy the items to the current month's view
    // Here we just show a confirmation since items are global
    setTimeout(() => setCopyConfirm(false), 3000)
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 800 }}>Recurring</h1>
        {isCurrent && (
          <button onClick={() => setAddOpen(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--indigo)', border: 'none', color: '#fff',
            borderRadius: 12, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            <Plus size={15} /> Add item
          </button>
        )}
      </div>

      {/* Month navigator */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg2)', borderRadius: 'var(--radius-lg)', padding: '12px 8px',
        marginBottom: 12, border: '1px solid var(--border)',
      }}>
        <button onClick={() => canGoPrev && setViewMonth(m => subMonths(m, 1))}
          disabled={!canGoPrev}
          style={{ background: canGoPrev ? 'var(--bg3)' : 'transparent', border: 'none', cursor: canGoPrev ? 'pointer' : 'not-allowed', color: canGoPrev ? 'var(--text2)' : 'var(--bg3)', padding: 8, borderRadius: 10, display: 'flex', opacity: canGoPrev ? 1 : 0.3 }}>
          <ChevronLeft size={18} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16 }}>{format(viewMonth, 'MMMM yyyy')}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 3 }}>
            {isCurrent && <span style={{ fontSize: 11, background: 'var(--indigo)', color: '#fff', borderRadius: 99, padding: '2px 8px', fontWeight: 600 }}>Current</span>}
            {isPast && <span style={{ fontSize: 11, background: 'var(--bg3)', color: 'var(--text3)', borderRadius: 99, padding: '2px 8px', fontWeight: 600 }}>Read-only</span>}
            {isFuture && <span style={{ fontSize: 11, background: 'var(--bg3)', color: 'var(--text3)', borderRadius: 99, padding: '2px 8px', fontWeight: 600 }}>Planned</span>}
          </div>
        </div>
        <button onClick={() => canGoNext && setViewMonth(m => addMonths(m, 1))}
          disabled={!canGoNext}
          style={{ background: canGoNext ? 'var(--bg3)' : 'transparent', border: 'none', cursor: canGoNext ? 'pointer' : 'not-allowed', color: canGoNext ? 'var(--text2)' : 'var(--bg3)', padding: 8, borderRadius: 10, display: 'flex', opacity: canGoNext ? 1 : 0.3 }}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Past month notice */}
      {isPast && (
        <div style={{ background: 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.2)', borderRadius: 12, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <Info size={15} color="var(--yellow)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, color: 'var(--yellow)', fontWeight: 500, marginBottom: 4 }}>Past month — read only</p>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>You can copy these entries to the current month.</p>
            <button onClick={handleCopyToCurrentMonth} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(251,191,36,.15)', border: '1px solid rgba(251,191,36,.3)',
              color: 'var(--yellow)', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>
              {copyConfirm ? <><Check size={13} /> Noted!</> : <><Copy size={13} /> Copy entries to current month</>}
            </button>
          </div>
        </div>
      )}

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div style={{ background: 'var(--bg2)', borderRadius: 12, padding: '12px', border: '1px solid rgba(248,113,113,.15)', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Bills / Expenses</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--red)' }}>₱{totalExpenses.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
        </div>
        <div style={{ background: 'var(--bg2)', borderRadius: 12, padding: '12px', border: '1px solid rgba(74,222,128,.15)', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Income</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)' }}>₱{totalIncome.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 2 }}>
        {['all', ...TYPE_OPTS].map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{
            padding: '6px 14px', borderRadius: 99, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 500, transition: 'all .15s', flexShrink: 0,
            background: filter === t ? 'var(--indigo)' : 'var(--bg2)',
            color: filter === t ? '#fff' : 'var(--text3)',
          }}>
            {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {isLoading
        ? <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner /></div>
        : filtered.length === 0
          ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
              <p style={{ fontSize: 32, marginBottom: 10 }}>🔁</p>
              <p style={{ fontWeight: 600, marginBottom: 6 }}>No recurring items</p>
              <p style={{ fontSize: 13 }}>Track your bills, subscriptions, and income</p>
              {isCurrent && (
                <button onClick={() => setAddOpen(true)} style={{ marginTop: 16, background: 'var(--indigo)', border: 'none', color: '#fff', borderRadius: 12, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  + Add item
                </button>
              )}
            </div>
          )
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Bills / Expenses */}
              {bills.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Bills & Expenses</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {bills.map(item => (
                      <RecurringItemRow key={item.id} item={item} isPast={isPast} isCurrentMo={isCurrent} />
                    ))}
                  </div>
                </div>
              )}

              {/* Income */}
              {incomes.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Income</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {incomes.map(item => (
                      <RecurringItemRow key={item.id} item={item} isPast={isPast} isCurrentMo={isCurrent} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
      }

      <AddRecurringModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
