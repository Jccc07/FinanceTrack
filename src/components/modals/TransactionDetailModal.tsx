import React from 'react'
import { format } from 'date-fns'
import { Trash2 } from 'lucide-react'
import { useAccounts } from '@/hooks/useAccounts'
import { useDeleteTransaction } from '@/hooks/useTransactions'
import { CATEGORIES } from '@/constants/categories'
import { Modal, Amount } from '@/components/ui'

interface Props { txn: any; onClose: () => void }

export function TransactionDetailModal({ txn, onClose }: Props) {
  const { data: accounts = [] } = useAccounts()
  const deleteTransaction = useDeleteTransaction()
  if (!txn) return null

  const cat = CATEGORIES.find(c => c.key === txn.category)
  const account = accounts.find(a => a.id === txn.account_id)
  const cleanNote = txn.note?.replace(/__rid:[^_]+__\s?/, '') ?? ''

  const handleDelete = async () => {
    if (confirm('Delete this transaction?')) {
      await deleteTransaction.mutateAsync(txn.id)
      onClose()
    }
  }

  return (
    <Modal open={!!txn} onClose={onClose} title="Transaction Details" width={360}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Icon + amount */}
        <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
          <div style={{
            width: 60, height: 60, borderRadius: 18, margin: '0 auto 12px',
            background: txn.type === 'income' ? 'rgba(74,222,128,.12)' : 'rgba(248,113,113,.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
          }}>
            {cat?.icon ?? '💳'}
          </div>
          <Amount value={txn.type === 'expense' ? -Number(txn.amount) : Number(txn.amount)} size="xl" showSign />
          <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4, fontFamily: 'var(--font-body)', fontWeight: 500 }}>
            {cat?.label ?? txn.category}
          </p>
        </div>

        {/* Details */}
        <div style={{ background: 'var(--bg)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border2)' }}>
          {[
            { label: 'Type', value: txn.type.charAt(0).toUpperCase() + txn.type.slice(1) },
            { label: 'Date', value: format(new Date(txn.txn_date + 'T00:00:00'), 'MMMM d, yyyy') },
            { label: 'Account', value: account?.name ?? '—' },
            ...(cleanNote ? [{ label: 'Note', value: cleanNote }] : []),
          ].map((row, i, arr) => (
            <div key={row.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '11px 14px',
              borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <span style={{ fontSize: 13, color: 'var(--text3)', fontFamily: 'var(--font-body)' }}>{row.label}</span>
              <span style={{ fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-body)', color: 'var(--text)', textAlign: 'right', maxWidth: '60%' }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Delete — subtle ghost button with icon */}
        <button
          onClick={handleDelete}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '11px 0',
            background: 'rgba(248,113,113,.08)',
            border: '1px solid rgba(248,113,113,.18)',
            borderRadius: 12, cursor: 'pointer',
            color: 'var(--red)', fontSize: 13, fontWeight: 600,
            fontFamily: 'var(--font-body)', letterSpacing: '-0.1px',
            transition: 'background .15s, border-color .15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(248,113,113,.15)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(248,113,113,.08)' }}
        >
          <Trash2 size={14} />
          Delete transaction
        </button>
      </div>
    </Modal>
  )
}