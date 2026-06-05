import React, { useState } from 'react'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { CATEGORIES } from '@/constants/categories'
import { Card, Amount, Spinner } from '@/components/ui'

function useMonthlyData(months: Date[]) {
  const userId = useAuthStore(s => s.user?.id)
  return useQuery({
    queryKey: ['analytics', userId, months.map(m => format(m, 'yyyy-MM'))],
    queryFn: async () => {
      const results = await Promise.all(months.map(async m => {
        const { data } = await (supabase as any)
          .from('transactions').select('amount,type,category')
          .eq('user_id', userId!)
          .gte('txn_date', format(startOfMonth(m), 'yyyy-MM-dd'))
          .lte('txn_date', format(endOfMonth(m), 'yyyy-MM-dd'))
        const income  = (data ?? []).filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + Number(t.amount), 0)
        const expense = (data ?? []).filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + Number(t.amount), 0)
        return { month: format(m, 'MMM'), income, expense, net: income - expense, raw: data ?? [] }
      }))
      return results
    },
    enabled: !!userId,
  })
}

function BarChart({ data }: { data: { month: string; income: number; expense: number }[] }) {
  const max = Math.max(...data.flatMap(d => [d.income, d.expense]), 1)
  const H = 140
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: H + 24, paddingBottom: 24, position: 'relative' }}>
      {data.map(d => (
        <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: H }}>
            <div title={`Income ₱${d.income.toLocaleString()}`} style={{ width: 14, height: `${(d.income / max) * 100}%`, background: 'var(--green)', borderRadius: '4px 4px 0 0', transition: 'height .4s ease', minHeight: 2 }} />
            <div title={`Expense ₱${d.expense.toLocaleString()}`} style={{ width: 14, height: `${(d.expense / max) * 100}%`, background: 'var(--red)', borderRadius: '4px 4px 0 0', transition: 'height .4s ease', minHeight: 2 }} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{d.month}</span>
        </div>
      ))}
      {/* Legend */}
      <div style={{ position: 'absolute', top: 0, right: 0, display: 'flex', gap: 12 }}>
        <span style={{ fontSize: 11, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, background: 'var(--green)', borderRadius: 2, display: 'inline-block' }} />Income</span>
        <span style={{ fontSize: 11, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, background: 'var(--red)', borderRadius: 2, display: 'inline-block' }} />Expense</span>
      </div>
    </div>
  )
}

function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (total === 0) return <p style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>No data</p>

  const r = 60, cx = 80, cy = 80, stroke = 28
  let offset = 0
  const circ = 2 * Math.PI * r
  const arcs = segments.map(seg => {
    const pct   = seg.value / total
    const dash  = pct * circ
    const arc   = { ...seg, dash, gap: circ - dash, offset }
    offset += dash
    return arc
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <svg width={160} height={160} viewBox="0 0 160 160">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg3)" strokeWidth={stroke} />
        {arcs.map((arc, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={arc.color} strokeWidth={stroke}
            strokeDasharray={`${arc.dash} ${arc.gap}`}
            strokeDashoffset={-arc.offset + circ / 4}
            style={{ transition: 'all .4s ease' }}
          />
        ))}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        {segments.slice(0, 6).map(seg => (
          <div key={seg.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>{seg.label}</span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>
              {((seg.value / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const CHART_COLORS = ['#6366F1','#F87171','#4ADE80','#FBBF24','#A78BFA','#34D399','#FB923C','#60A5FA']

export function AnalyticsPage() {
  const months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), 5 - i))
  const { data, isLoading } = useMonthlyData(months)

  const thisMonth = data?.[data.length - 1]
  const catTotals: Record<string, number> = {}
  for (const t of thisMonth?.raw ?? []) {
    if (t.type === 'expense') catTotals[t.category] = (catTotals[t.category] ?? 0) + Number(t.amount)
  }
  const topCats = Object.entries(catTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], i) => ({ label, value, color: CHART_COLORS[i % CHART_COLORS.length] }))

  return (
    <div className="fade-in">
      <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 800, marginBottom: 24 }}>Analytics</h1>

      {isLoading
        ? <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner /></div>
        : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Income vs Expense bar */}
            <Card style={{ gridColumn: 'span 2' }}>
              <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Income vs Expenses — Last 6 months</h2>
              <BarChart data={data ?? []} />
            </Card>

            {/* Summary */}
            <Card>
              <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>This Month</h2>
              {thisMonth && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Income', value: thisMonth.income, color: 'var(--green)' },
                    { label: 'Expenses', value: thisMonth.expense, color: 'var(--red)' },
                    { label: 'Net', value: thisMonth.net, color: thisMonth.net >= 0 ? 'var(--green)' : 'var(--red)' },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 14, color: 'var(--text2)' }}>{row.label}</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: row.color }}>
                        ₱{Math.abs(row.value).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Category breakdown */}
            <Card>
              <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Spending by Category</h2>
              <DonutChart segments={topCats} />
            </Card>

            {/* Monthly table */}
            <Card style={{ gridColumn: 'span 2' }}>
              <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Monthly Summary</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      {['Month', 'Income', 'Expenses', 'Net'].map(h => (
                        <th key={h} style={{ textAlign: h === 'Month' ? 'left' : 'right', padding: '8px 12px', color: 'var(--text3)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...(data ?? [])].reverse().map(row => (
                      <tr key={row.month}>
                        <td style={{ padding: '10px 12px', color: 'var(--text)', fontWeight: 500 }}>{row.month}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--green)' }}>₱{row.income.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--red)' }}>₱{row.expense.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: row.net >= 0 ? 'var(--green)' : 'var(--red)' }}>
                          {row.net >= 0 ? '+' : '−'}₱{Math.abs(row.net).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )
      }
    </div>
  )
}
