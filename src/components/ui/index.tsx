import React from 'react'
import ReactDOM from 'react-dom'

// ─── Button ────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
}
export function Button({
  variant = 'primary', size = 'md', loading, fullWidth, children, disabled, className = '', ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl border-0 cursor-pointer transition-all duration-150 select-none'
  const variants = {
    primary:   'bg-indigo-500 text-white hover:bg-indigo-400 active:scale-95',
    secondary: 'bg-bg2 text-text border border-border2 hover:bg-bg3 active:scale-95',
    ghost:     'bg-transparent text-text2 hover:bg-bg2 active:scale-95',
    danger:    'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 active:scale-95',
  }
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' }
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled || loading}
      style={{ fontFamily: 'var(--font-body)' }}
      {...props}
    >
      {loading && <Spinner size={14} />}
      {children}
    </button>
  )
}

// ─── Input ─────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}
export function Input({ label, error, leftIcon, rightIcon, className = '', ...props }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>{label}</label>}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {leftIcon && (
          <span style={{ position: 'absolute', left: 12, color: 'var(--text3)', display: 'flex' }}>{leftIcon}</span>
        )}
        <input
          style={{
            width: '100%', background: 'var(--bg2)', border: `1px solid ${error ? 'var(--red)' : 'var(--border2)'}`,
            borderRadius: 12, padding: `10px ${rightIcon ? '40px' : '14px'} 10px ${leftIcon ? '40px' : '14px'}`,
            color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none',
            transition: 'border-color .15s',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--indigo)' }}
          onBlur={e => { e.currentTarget.style.borderColor = error ? 'var(--red)' : 'var(--border2)' }}
          {...props}
        />
        {rightIcon && (
          <span style={{ position: 'absolute', right: 12, color: 'var(--text3)', display: 'flex' }}>{rightIcon}</span>
        )}
      </div>
      {error && <span style={{ fontSize: 12, color: 'var(--red)' }}>{error}</span>}
    </div>
  )
}

// ─── Select ────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}
export function Select({ label, error, children, ...props }: SelectProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>{label}</label>}
      <div style={{ position: 'relative' }}>
        <select
          style={{
            width: '100%', background: 'var(--bg2)', border: `1px solid ${error ? 'var(--red)' : 'var(--border2)'}`,
            borderRadius: 12, padding: '10px 36px 10px 14px', color: 'var(--text)', fontSize: 14,
            fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer',
            appearance: 'none', WebkitAppearance: 'none',
          } as React.CSSProperties}
          {...props}
        >
          {children}
        </select>
        <span style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          pointerEvents: 'none', color: 'var(--text3)', display: 'flex', alignItems: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>
      {error && <span style={{ fontSize: 12, color: 'var(--red)' }}>{error}</span>}
    </div>
  )
}

// ─── Card ──────────────────────────────────────────────────────────────────
export function Card({ children, style, onClick, className = '' }: {
  children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void; className?: string
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
        padding: '20px', ...(onClick ? { cursor: 'pointer' } : {}), ...style,
      }}
      className={className}
    >
      {children}
    </div>
  )
}

// ─── Badge ─────────────────────────────────────────────────────────────────
export function Badge({ children, color = 'indigo' }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    indigo: { bg: 'rgba(99,102,241,.15)', text: 'var(--indigo-l)' },
    green:  { bg: 'rgba(74,222,128,.12)', text: 'var(--green)' },
    red:    { bg: 'rgba(248,113,113,.12)', text: 'var(--red)' },
    yellow: { bg: 'rgba(251,191,36,.12)', text: 'var(--yellow)' },
    gray:   { bg: 'var(--bg3)', text: 'var(--text3)' },
  }
  const c = colors[color] ?? colors.indigo
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: c.bg, color: c.text, borderRadius: 99, padding: '3px 10px',
      fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}

// ─── Spinner ───────────────────────────────────────────────────────────────
export function Spinner({ size = 20, color = 'var(--indigo)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ animation: 'spin .7s linear infinite', flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeOpacity=".25" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

// ─── Empty State ───────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: {
  icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode
}) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {icon && (
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)' }}>
          {icon}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: 15 }}>{title}</p>
        {description && <p style={{ fontSize: 13, color: 'var(--text3)' }}>{description}</p>}
      </div>
      {action}
    </div>
  )
}

// ─── Modal ─────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 480 }: {
  open: boolean; onClose: () => void; title?: string; children: React.ReactNode; width?: number
}) {
  React.useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return ReactDOM.createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        bottom: 'calc(-1 * env(safe-area-inset-bottom, 0px))',
        background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 28px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="scale-in"
        style={{
          background: 'var(--bg2)', border: '1px solid var(--border2)',
          borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: Math.min(width, 360),
          maxHeight: '75dvh', overflowY: 'auto',
          padding: '18px 18px 20px', boxShadow: '0 24px 64px rgba(0,0,0,.6)',
        }}
      >
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700 }}>{title}</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4, borderRadius: 8, fontSize: 18, lineHeight: 1 }}>✕</button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  )
}

// ─── Progress Bar ──────────────────────────────────────────────────────────
export function ProgressBar({ value, max, color = 'var(--indigo)' }: { value: number; max: number; color?: string }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0)
  return (
    <div style={{ height: 8, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width .4s ease' }} />
    </div>
  )
}

// ─── Amount display ────────────────────────────────────────────────────────
export function Amount({ value, size = 'md', showSign = false }: { value: number; size?: 'sm' | 'md' | 'lg' | 'xl'; showSign?: boolean }) {
  const isNeg = value < 0
  const abs   = Math.abs(value)
  const color = showSign ? (isNeg ? 'var(--red)' : 'var(--green)') : 'inherit'
  const sizes = { sm: 13, md: 15, lg: 20, xl: 32 }
  const prefix = showSign ? (isNeg ? '−' : '+') : ''
  return (
    <span style={{ color, fontSize: sizes[size], fontWeight: size === 'xl' || size === 'lg' ? 700 : 600, fontVariantNumeric: 'tabular-nums' }}>
      {prefix}₱{abs.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  )
}