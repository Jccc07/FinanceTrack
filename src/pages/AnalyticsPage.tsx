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
  const H = 120
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 8, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 11, color: 'var(--green)', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, background: 'var(--green)', borderRadius: 2, display: 'inline-block' }} />Income
        </span>
        <span style={{ fontSize: 11, color: 'var(--red)', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, background: 'var(--red)', borderRadius: 2, display: 'inline-block' }} />Expense
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: H + 20, paddingBottom: 20 }}>
        {data.map(d => (
          <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: H }}>
              <div title={`Income ₱${d.income.toLocaleString()}`} style={{ width: '45%', height: `${(d.income / max) * 100}%`, background: 'var(--green)', borderRadius: '3px 3px 0 0', transition: 'height .4s ease', minHeight: 2 }} />
              <div title={`Expense ₱${d.expense.toLocaleString()}`} style={{ width: '45%', height: `${(d.expense / max) * 100}%`, background: 'var(--red)', borderRadius: '3px 3px 0 0', transition: 'height .4s ease', minHeight: 2 }} />
            </div>
            <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>{d.month}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (total === 0) return <p style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13, fontFamily: 'var(--font-body)', padding: '20px 0' }}>No expense data</p>

  const r = 54, cx = 70, cy = 70, stroke = 24
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <svg width={140} height={140} viewBox="0 0 140 140" style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg3)" strokeWidth={stroke} />
        {arcs.map((arc, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={arc.color} strokeWidth={stroke}
            strokeDasharray={`${arc.dash} ${arc.gap}`}
            strokeDashoffset={-arc.offset + circ / 4}
            style={{ transition: 'all .4s ease' }}
          />
        ))}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, minWidth: 120 }}>
        {segments.slice(0, 6).map(seg => {
          const cat = CATEGORIES.find(c => c.key === seg.label)
          return (
            <div key={seg.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--font-body)' }}>{cat?.label ?? seg.label}</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>{((seg.value / total) * 100).toFixed(1)}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const CHART_COLORS = ['#6366F1','#F87171','#4ADE80','#FBBF24','#A78BFA','#34D399','#FB923C','#60A5FA']

/* Reusable section heading */
function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, letterSpacing: '-0.2px', marginBottom: 14, color: 'var(--text)' }}>
      {children}
    </h2>
  )
}

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
      <h1 style={{ fontFamily: 'var(--font-body)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px', marginBottom: 20 }}>Analytics</h1>

      {isLoading
        ? <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner /></div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Income vs Expense bar */}
            <div style={{ background: 'var(--bg2)', borderRadius: 'var(--radius-lg)', padding: '16px 14px', border: '1px solid var(--border2)' }}>
              <SectionHead>Income vs Expenses — 6 months</SectionHead>
              <BarChart data={data ?? []} />
            </div>

            {/* This month summary */}
            <div style={{ background: 'var(--bg2)', borderRadius: 'var(--radius-lg)', padding: '16px', border: '1px solid var(--border2)' }}>
              <SectionHead>This Month</SectionHead>
              {thisMonth && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {[
                    { label: 'Income',   value: thisMonth.income,  color: 'var(--green)' },
                    { label: 'Expenses', value: thisMonth.expense, color: 'var(--red)' },
                    { label: 'Net',      value: thisMonth.net,     color: thisMonth.net >= 0 ? 'var(--green)' : 'var(--red)' },
                  ].map((row, i, arr) => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <span style={{ fontSize: 14, fontFamily: 'var(--font-body)', color: 'var(--text2)' }}>{row.label}</span>
                      <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-body)', color: row.color }}>
                        ₱{Math.abs(row.value).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category breakdown */}
            <div style={{ background: 'var(--bg2)', borderRadius: 'var(--radius-lg)', padding: '16px', border: '1px solid var(--border2)' }}>
              <SectionHead>Spending by Category</SectionHead>
              <DonutChart segments={topCats} />
            </div>

            {/* Monthly table */}
            <div style={{ background: 'var(--bg2)', borderRadius: 'var(--radius-lg)', padding: '16px', border: '1px solid var(--border2)' }}>
              <SectionHead>Monthly Summary</SectionHead>
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)', fontSize: 13, minWidth: 300 }}>
                  <thead>
                    <tr>
                      {['Month', 'Income', 'Expenses', 'Net'].map(h => (
                        <th key={h} style={{ textAlign: h === 'Month' ? 'left' : 'right', padding: '8px 10px', color: 'var(--text3)', fontWeight: 600, fontFamily: 'var(--font-body)', borderBottom: '1px solid var(--border)', fontSize: 12 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...(data ?? [])].reverse().map(row => (
                      <tr key={row.month}>
                        <td style={{ padding: '10px', fontFamily: 'var(--font-body)', color: 'var(--text)', fontWeight: 500 }}>{row.month}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-body)', color: 'var(--green)', fontWeight: 600 }}>₱{row.income.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-body)', color: 'var(--red)', fontWeight: 600 }}>₱{row.expense.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-body)', fontWeight: 700, color: row.net >= 0 ? 'var(--green)' : 'var(--red)' }}>
                          {row.net >= 0 ? '+' : '−'}₱{Math.abs(row.net).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )
      }
    </div>
  )
}