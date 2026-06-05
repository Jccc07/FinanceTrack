import React, { useState } from 'react'
import { format, differenceInDays } from 'date-fns'
import { Plus, Trash2, CheckCircle2, XCircle, RefreshCcw } from 'lucide-react'
import {
  useAllRecurringItems, useCreateRecurringItem, useDeleteRecurringItem,
  useMarkRecurringPaid, useUnmarkRecurringPaid, getItemPaidTxnForMonth,
} from '@/hooks/useRecurringItems'
import { useAccounts } from '@/hooks/useAccounts'
import { useAuthStore } from '@/stores/authStore'
import { CATEGORIES } from '@/constants/categories'
import { Card, Button, Input, Select, EmptyState, Badge, Amount, Modal, Spinner } from '@/components/ui'

const FREQ_OPTS = ['daily','weekly','monthly','yearly']
const TYPE_OPTS = ['bill','subscription','installment','income']

function AddRecurringModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateRecurringItem()
  const [f, setF] = useState({ name: '', amount: '', category: '', frequency: 'monthly', item_type: 'bill', next_due_date: format(new Date(), 'yyyy-MM-dd'), installment_total: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
          {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.key}</option>)}
        </Select>
        <Input label="Next due date" type="date" value={f.next_due_date} onChange={e => setF(p => ({ ...p, next_due_date: e.target.value }))} />
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
    <Modal open={open} onClose={onClose} title={`Mark "${item?.name}" as paid`} width={360}>
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

function RecurringCard({ item }: { item: any }) {
  const userId = useAuthStore(s => s.user?.id)
  const deleteItem = useDeleteRecurringItem()
  const unmark = useUnmarkRecurringPaid()
  const [markOpen, setMarkOpen] = useState(false)
  const [isPaid, setIsPaid] = useState(false)
  const [checking, setChecking] = useState(true)

  const days = differenceInDays(new Date(item.next_due_date), new Date())
  const monthStr = format(new Date(), 'yyyy-MM')

  React.useEffect(() => {
    if (!userId) return
    getItemPaidTxnForMonth(userId, item.id, monthStr).then(txnId => {
      setIsPaid(!!txnId); setChecking(false)
    })
  }, [item.id, monthStr, userId])

  const typeColors: Record<string, string> = { bill: 'red', subscription: 'indigo', installment: 'yellow', income: 'green' }

  return (
    <Card style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: isPaid ? 'rgba(74,222,128,.1)' : 'var(--bg3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
      }}>
        {CATEGORIES.find(c => c.key === item.category)?.icon ?? '🔄'}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: isPaid ? 'var(--text3)' : 'var(--text)', textDecoration: isPaid ? 'line-through' : 'none' }}>{item.name}</p>
          <Badge color={typeColors[item.item_type] ?? 'gray'}>{item.item_type}</Badge>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text3)' }}>
          {days < 0 ? `Overdue by ${Math.abs(days)}d` : days === 0 ? 'Due today' : `Due in ${days}d`}
          {' · '}{item.frequency}
          {item.item_type === 'installment' && ` · ${item.installment_paid ?? 0}/${item.installment_total}`}
        </p>
      </div>

      <Amount value={Number(item.amount)} size="sm" />

      <div style={{ display: 'flex', gap: 4 }}>
        {checking ? <Spinner size={16} /> : isPaid ? (
          <button onClick={() => unmark.mutate({ item, month: monthStr })} title="Unmark paid"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--green)', padding: 4, borderRadius: 6, display: 'flex' }}>
            <XCircle size={18} />
          </button>
        ) : (
          <button onClick={() => setMarkOpen(true)} title="Mark paid"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4, borderRadius: 6, display: 'flex' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--green)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}>
            <CheckCircle2 size={18} />
          </button>
        )}
        <button onClick={() => { if (confirm('Remove this item?')) deleteItem.mutate(item.id) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text4)', padding: 4, borderRadius: 6, display: 'flex' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text4)'}>
          <Trash2 size={14} />
        </button>
      </div>

      <MarkPaidModal open={markOpen} onClose={() => setMarkOpen(false)} item={item} />
    </Card>
  )
}

export function RecurringPage() {
  const { data: items = [], isLoading } = useAllRecurringItems()
  const [addOpen, setAddOpen] = useState(false)
  const [filter, setFilter] = useState<string>('all')

  const filtered = filter === 'all' ? items : items.filter(i => i.item_type === filter)
  const groups: Record<string, typeof items> = {}
  for (const i of filtered) {
    if (!groups[i.item_type]) groups[i.item_type] = []
    groups[i.item_type].push(i)
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 800 }}>Recurring</h1>
        <Button onClick={() => setAddOpen(true)}><Plus size={15} /> Add item</Button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', ...TYPE_OPTS].map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{
            padding: '6px 14px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all .15s',
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
          ? <EmptyState icon={<RefreshCcw size={24} />} title="No recurring items" description="Track your bills, subscriptions, and income" action={<Button onClick={() => setAddOpen(true)}><Plus size={14} /> Add item</Button>} />
          : filter === 'all'
            ? Object.entries(groups).map(([type, groupItems]) => (
              <div key={type} style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{type}s</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {groupItems.map(item => <RecurringCard key={item.id} item={item} />)}
                </div>
              </div>
            ))
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filtered.map(item => <RecurringCard key={item.id} item={item} />)}
              </div>
            )
      }

      <AddRecurringModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
