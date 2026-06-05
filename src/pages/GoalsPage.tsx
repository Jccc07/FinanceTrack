import React, { useState } from 'react'
import { format } from 'date-fns'
import { Plus, Trash2, PiggyBank, Edit2 } from 'lucide-react'
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from '@/hooks/useGoals'
import { Card, Button, Input, EmptyState, ProgressBar, Spinner, Modal, Amount } from '@/components/ui'

function GoalModal({ open, onClose, goal }: { open: boolean; onClose: () => void; goal?: any }) {
  const create = useCreateGoal()
  const update = useUpdateGoal()
  const [name, setName]           = useState(goal?.name ?? '')
  const [target, setTarget]       = useState(goal?.target_amount?.toString() ?? '')
  const [current, setCurrent]     = useState(goal?.current_amount?.toString() ?? '')
  const [deadline, setDeadline]   = useState(goal?.deadline ?? '')
  const [color, setColor]         = useState(goal?.color_hex ?? '#6366F1')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = { name, target_amount: parseFloat(target), current_amount: parseFloat(current || '0'), deadline: deadline || null, color_hex: color }
      if (goal) await update.mutateAsync({ id: goal.id, ...payload })
      else      await create.mutateAsync(payload)
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={goal ? 'Edit Goal' : 'New Savings Goal'}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Goal name" placeholder="e.g. Emergency Fund" value={name} onChange={e => setName(e.target.value)} required />
        <Input label="Target amount (₱)" type="number" placeholder="0.00" step="0.01" value={target} onChange={e => setTarget(e.target.value)} required />
        <Input label="Current amount (₱)" type="number" placeholder="0.00" step="0.01" value={current} onChange={e => setCurrent(e.target.value)} />
        <Input label="Target date (optional)" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>Color</label>
          <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: 48, height: 36, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 8 }} />
        </div>
        {error && <p style={{ fontSize: 13, color: 'var(--red)' }}>{error}</p>}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
          <Button type="submit" fullWidth loading={loading}>{goal ? 'Save' : 'Create goal'}</Button>
        </div>
      </form>
    </Modal>
  )
}

function ContributeModal({ open, onClose, goal }: { open: boolean; onClose: () => void; goal: any }) {
  const update = useUpdateGoal()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const newAmount = Number(goal.current_amount) + parseFloat(amount)
      await update.mutateAsync({ id: goal.id, current_amount: newAmount })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Add to "${goal?.name}"`} width={360}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Amount to add (₱)" type="number" placeholder="0.00" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
        <div style={{ display: 'flex', gap: 10 }}>
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
          <Button type="submit" fullWidth loading={loading}>Add funds</Button>
        </div>
      </form>
    </Modal>
  )
}

export function GoalsPage() {
  const { data: goals = [], isLoading } = useGoals()
  const deleteGoal = useDeleteGoal()
  const [createOpen, setCreateOpen]     = useState(false)
  const [editGoal, setEditGoal]         = useState<any>(null)
  const [contributeGoal, setContribute] = useState<any>(null)

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 800 }}>Savings Goals</h1>
        <Button onClick={() => setCreateOpen(true)}><Plus size={15} /> New goal</Button>
      </div>

      {isLoading
        ? <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner /></div>
        : goals.length === 0
          ? <EmptyState icon={<PiggyBank size={26} />} title="No savings goals yet" description="Start tracking your financial goals" action={<Button onClick={() => setCreateOpen(true)}><Plus size={14} /> Create goal</Button>} />
          : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {goals.map(goal => {
                const pct = Math.min(100, Number(goal.target_amount) > 0 ? (Number(goal.current_amount) / Number(goal.target_amount)) * 100 : 0)
                const done = pct >= 100
                return (
                  <Card key={goal.id}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: goal.color_hex ?? 'var(--indigo)', flexShrink: 0 }} />
                        <div>
                          <h3 style={{ fontWeight: 700, fontSize: 15 }}>{goal.name}</h3>
                          {goal.deadline && <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>by {format(new Date(goal.deadline), 'MMM d, yyyy')}</p>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => setEditGoal(goal)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4, borderRadius: 6, display: 'flex' }}><Edit2 size={13} /></button>
                        <button onClick={() => { if (confirm('Delete this goal?')) deleteGoal.mutate(goal.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4, borderRadius: 6, display: 'flex' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}><Trash2 size={13} /></button>
                      </div>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Amount value={Number(goal.current_amount)} size="md" />
                        <span style={{ fontSize: 13, color: 'var(--text3)' }}>of <Amount value={Number(goal.target_amount)} size="sm" /></span>
                      </div>
                      <ProgressBar value={Number(goal.current_amount)} max={Number(goal.target_amount)} color={done ? 'var(--green)' : (goal.color_hex ?? 'var(--indigo)')} />
                      <p style={{ fontSize: 12, color: done ? 'var(--green)' : 'var(--text3)', marginTop: 6, fontWeight: done ? 700 : 400 }}>
                        {done ? '🎉 Goal reached!' : `${pct.toFixed(1)}% · ₱${(Number(goal.target_amount) - Number(goal.current_amount)).toLocaleString('en-PH', { minimumFractionDigits: 2 })} remaining`}
                      </p>
                    </div>

                    {!done && (
                      <Button variant="secondary" fullWidth size="sm" onClick={() => setContribute(goal)}>
                        Add funds
                      </Button>
                    )}
                  </Card>
                )
              })}
            </div>
          )
      }

      <GoalModal open={createOpen} onClose={() => setCreateOpen(false)} />
      {editGoal && <GoalModal open={!!editGoal} onClose={() => setEditGoal(null)} goal={editGoal} />}
      {contributeGoal && <ContributeModal open={!!contributeGoal} onClose={() => setContribute(null)} goal={contributeGoal} />}
    </div>
  )
}
