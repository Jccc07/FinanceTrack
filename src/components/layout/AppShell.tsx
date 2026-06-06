import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, ArrowLeftRight, BarChart2,
  RefreshCcw, LogOut, X, Wallet, ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

const NAV = [
  { to: '/',            icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight,  label: 'Transactions' },
  { to: '/analytics',   icon: BarChart2,       label: 'Analytics' },
  { to: '/recurring',   icon: RefreshCcw,      label: 'Recurring' },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false) }, [location.pathname])

  const handleSignOut = async () => { await signOut(); navigate('/login') }

  const userName = user?.user_metadata?.full_name ?? user?.email ?? '?'
  const userInitial = userName[0].toUpperCase()

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', maxWidth: '100vw' }}>

      {/* ── Desktop sidebar ── */}
      <aside className="desktop-sidebar" style={{
        width: 'var(--sidebar-w)', flexShrink: 0,
        background: 'var(--bg)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', height: '100vh',
        position: 'sticky', top: 0,
      }}>
        <div style={{ padding: '24px 20px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wallet size={18} color="#fff" />
          </div>
          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 18, letterSpacing: '-0.3px' }}>FinTrack</span>
        </div>
        <nav style={{ flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10, textDecoration: 'none',
                fontWeight: 500, fontSize: 14, transition: 'all .15s',
                background: isActive ? 'rgba(99,102,241,.12)' : 'transparent',
                color: isActive ? 'var(--indigo-l)' : 'var(--text3)',
              })}>
              {({ isActive }) => (<><Icon size={16} strokeWidth={isActive ? 2.5 : 2} />{label}</>)}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {userInitial}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.user_metadata?.full_name ?? 'User'}</p>
              <p style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
            </div>
          </div>
          <button onClick={handleSignOut} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: 'none', border: 'none', color: 'var(--text3)', fontSize: 13, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = 'rgba(248,113,113,.08)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.background = 'none' }}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile drawer overlay ── */}
      {drawerOpen && (
        <div onClick={() => setDrawerOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)',
          zIndex: 50, backdropFilter: 'blur(2px)',
        }} className="mobile-only" />
      )}

      {/* ── Mobile side drawer ── */}
      <div className="mobile-only" style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 280,
        background: 'var(--bg2)', zIndex: 51, display: 'flex', flexDirection: 'column',
        transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform .25s ease',
        borderRight: '1px solid var(--border2)',
      }}>
        {/* Drawer header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 16px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={16} color="#fff" />
            </div>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 17, letterSpacing: '-0.3px' }}>FinTrack</span>
          </div>
          <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4, borderRadius: 8, display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        {/* User info */}
        <div style={{ margin: '0 16px 12px', padding: '12px', background: 'var(--bg3)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {userInitial}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.user_metadata?.full_name ?? 'User'}</p>
            <p style={{ fontSize: 12, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '4px 12px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 12, textDecoration: 'none',
                fontWeight: 500, fontSize: 15, transition: 'all .15s',
                background: isActive ? 'rgba(99,102,241,.15)' : 'transparent',
                color: isActive ? 'var(--indigo-l)' : 'var(--text2)',
              })}>
              {({ isActive }) => (
                <>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  <span style={{ flex: 1 }}>{label}</span>
                  {isActive && <ChevronRight size={14} style={{ opacity: 0.5 }} />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sign out */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <button onClick={handleSignOut} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.15)', color: 'var(--red)', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <main style={{ flex: 1, overflow: 'hidden', background: 'var(--bg)', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile top bar — outside scroll so it never moves */}
        <div className="mobile-only mobile-top-bar" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', paddingTop: 'calc(env(safe-area-inset-top) + 12px)',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg)', flexShrink: 0, zIndex: 10,
        }}>
          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 18, letterSpacing: '-0.3px' }}>FinTrack</span>
          <button
            onClick={() => setDrawerOpen(v => !v)}
            style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 10, cursor: 'pointer', color: 'var(--text2)', padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 18 }}>
              <span style={{ display: 'block', height: 2, background: 'currentColor', borderRadius: 2 }} />
              <span style={{ display: 'block', height: 2, background: 'currentColor', borderRadius: 2, width: '75%' }} />
              <span style={{ display: 'block', height: 2, background: 'currentColor', borderRadius: 2 }} />
            </div>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <div className="page-content" style={{ padding: '20px 16px 100px', maxWidth: 700, margin: '0 auto', boxSizing: 'border-box', width: '100%' }}>
            {children}
          </div>
        </div>
      </main>

      {/* ── Mobile bottom nav ── */}
      <div className="mobile-only mobile-bottom-nav" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30,
        background: 'var(--bg2)', borderTop: '1px solid var(--border)',
        display: 'flex', flexShrink: 0,
      }}>
        {NAV.map(({ to, icon: Icon, label }) => {
          const isActive = to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(to)
          return (
            <NavLink key={to} to={to} end={to === '/'}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, textDecoration: 'none', padding: '4px 0' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isActive ? 'rgba(99,102,241,.2)' : 'transparent',
                transition: 'background .15s',
              }}>
                <Icon size={20} color={isActive ? 'var(--indigo-l)' : 'var(--text4)'} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--indigo-l)' : 'var(--text4)' }}>{label}</span>
            </NavLink>
          )
        })}
      </div>

      <style>{`
        .desktop-sidebar { display: flex !important; }
        .mobile-only { display: none !important; }
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-only { display: flex !important; }
          .page-content { padding: 16px 16px 100px !important; }
          .mobile-top-bar {
            padding-top: max(12px, calc(env(safe-area-inset-top) + 12px)) !important;
          }
          .mobile-bottom-nav {
            padding: 8px 0 max(12px, calc(env(safe-area-inset-bottom) + 8px)) !important;
          }
        }
        @media (min-width: 769px) {
          .page-content { padding: 28px 32px 32px !important; max-width: 1100px !important; }
        }
      `}</style>
    </div>
  )
}