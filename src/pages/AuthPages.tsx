import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, User, Wallet, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Button, Input, Spinner } from '@/components/ui'

function AuthShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 16,
    }}>
      <div className="fade-in" style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16, background: 'var(--indigo)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
          }}>
            <Wallet size={24} color="#fff" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 800, marginBottom: 6 }}>{title}</h1>
          <p style={{ color: 'var(--text3)', fontSize: 14 }}>{subtitle}</p>
        </div>

        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border2)',
          borderRadius: 'var(--radius-lg)', padding: 28,
        }}>
          {children}
        </div>
      </div>
    </div>
  )
}

export function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { signIn }  = useAuthStore()
  const navigate    = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err?.message ?? 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your FinTrack account">
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input
          label="Email" type="email" placeholder="you@email.com"
          value={email} onChange={e => setEmail(e.target.value)}
          leftIcon={<Mail size={15} />} required
        />
        <Input
          label="Password" type={showPw ? 'text' : 'password'} placeholder="••••••••"
          value={password} onChange={e => setPassword(e.target.value)}
          leftIcon={<Lock size={15} />}
          rightIcon={
            <button type="button" onClick={() => setShowPw(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex', padding: 0 }}>
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
          required
        />
        {error && <p style={{ fontSize: 13, color: 'var(--red)', textAlign: 'center' }}>{error}</p>}
        <Button type="submit" fullWidth loading={loading} style={{ marginTop: 4 }}>
          Sign in
        </Button>
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--indigo-l)', textDecoration: 'none', fontWeight: 600 }}>Create one</Link>
        </p>
      </form>
    </AuthShell>
  )
}

export function RegisterPage() {
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { signUp } = useAuthStore()
  const navigate   = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      await signUp(email, password, name)
      navigate('/')
    } catch (err: any) {
      setError(err?.message ?? 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Create account" subtitle="Start tracking your finances today">
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input
          label="Full name" placeholder="Juan dela Cruz"
          value={name} onChange={e => setName(e.target.value)}
          leftIcon={<User size={15} />} required
        />
        <Input
          label="Email" type="email" placeholder="you@email.com"
          value={email} onChange={e => setEmail(e.target.value)}
          leftIcon={<Mail size={15} />} required
        />
        <Input
          label="Password" type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters"
          value={password} onChange={e => setPassword(e.target.value)}
          leftIcon={<Lock size={15} />}
          rightIcon={
            <button type="button" onClick={() => setShowPw(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex', padding: 0 }}>
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
          required
        />
        {error && <p style={{ fontSize: 13, color: 'var(--red)', textAlign: 'center' }}>{error}</p>}
        <Button type="submit" fullWidth loading={loading} style={{ marginTop: 4 }}>
          Create account
        </Button>
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--indigo-l)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
        </p>
      </form>
    </AuthShell>
  )
}
