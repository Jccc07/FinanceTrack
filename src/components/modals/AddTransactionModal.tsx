import React, { useState } from 'react'
import { format } from 'date-fns'
import { useCreateTransaction } from '@/hooks/useTransactions'
import { useAccounts } from '@/hooks/useAccounts'
import { CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/constants/categories'
import { Modal, Button, Input, Select } from '@/components/ui'

interface Props { open: boolean; onClose: () => void }

export function AddTransactionModal({ open, onClose }: Props) {
  const { data: accounts = [] } = useAccounts()
  const createTransaction = useCreateTransaction()
  const [type, setType]         = useState<'expense' | 'income'>('expense')
  const [amount, setAmount]     = useState('')
  const [category, setCategory] = useState('')
  const [accountId, setAccountId] = useState('')
  const [note, setNote]         = useState('')
  const [date, setDate]         = useState(format(new Date(), 'yyyy-MM-dd'))
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const filteredCats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  const reset = () => { setAmount(''); setCategory(''); setNote(''); setError('') }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountId) { setError('Please select an account'); return }
    setError(''); setLoading(true)
    try {
      await createTransaction.mutateAsync({
        type, amount: parseFloat(amount), category, account_id: accountId,
        note: note || null, txn_date: date,
      })
      reset()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose() }} title="Add Transaction">
      <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: 10, padding: 4, marginBottom: 20 }}>
        {(['expense', 'income'] as const).map(t => (
          <button key={t} onClick={() => { setType(t); setCategory('') }}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all .15s',
              background: type === t ? (t === 'expense' ? 'var(--red)' : 'var(--green)') : 'transparent',
              color: type === t ? '#fff' : 'var(--text3)',
            }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Amount (₱)" type="number" placeholder="0.00" step="0.01" min="0.01"
          value={amount} onChange={e => setAmount(e.target.value)} required />

        <Select label="Category" value={category} onChange={e => setCategory(e.target.value)} required>
          <option value="">Select category…</option>
          {filteredCats.map(c => (
            <option key={c.key} value={c.key}>{c.icon} {c.label}</option>
          ))}
        </Select>

        <Select label="Account" value={accountId} onChange={e => setAccountId(e.target.value)} required>
          <option value="">Select account…</option>
          {accounts.map(a => (
            <option key={a.id} value={a.id}>{a.name} — ₱{Number(a.balance).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</option>
          ))}
        </Select>

        <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
        <Input label="Note (optional)" placeholder="Optional description" value={note} onChange={e => setNote(e.target.value)} />

        {error && <p style={{ fontSize: 13, color: 'var(--red)' }}>{error}</p>}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <Button type="button" variant="secondary" fullWidth onClick={() => { reset(); onClose() }}>Cancel</Button>
          <Button type="submit" fullWidth loading={loading}>Add transaction</Button>
        </div>
      </form>
    </Modal>
  )
}
