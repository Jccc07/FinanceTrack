import React, { useState } from 'react'
import { format } from 'date-fns'
import { useCreateTransaction } from '@/hooks/useTransactions'
import { useAccounts } from '@/hooks/useAccounts'
import { CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/constants/categories'
import { Modal, Input, Select } from '@/components/ui'

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

  /* shared button base */
  const btnBase: React.CSSProperties = {
    flex: 1, padding: '12px 0', borderRadius: 12, border: 'none',
    cursor: 'pointer', fontSize: 14, fontWeight: 600,
    fontFamily: 'var(--font-body)', letterSpacing: '-0.1px',
    transition: 'opacity .15s, background .15s',
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose() }} title="Add Transaction">

      {/* Type toggle */}
      <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: 12, padding: 4, marginBottom: 20, border: '1px solid var(--border2)' }}>
        {(['expense', 'income'] as const).map(t => (
          <button key={t} onClick={() => { setType(t); setCategory('') }}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)', transition: 'all .15s',
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

        {error && <p style={{ fontSize: 13, color: 'var(--red)', fontFamily: 'var(--font-body)' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          {/* Cancel */}
          <button
            type="button"
            onClick={() => { reset(); onClose() }}
            style={{
              ...btnBase,
              background: 'var(--bg3)',
              color: 'var(--text2)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.8' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
          >
            Cancel
          </button>

          {/* Add Transaction */}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...btnBase,
              background: 'var(--indigo)',
              color: '#fff',
              opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.opacity = '0.88' }}
            onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
          >
            {loading ? 'Adding…' : 'Add Transaction'}
          </button>
        </div>
      </form>
    </Modal>
  )
}