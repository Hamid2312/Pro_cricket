import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PageShell from '../components/ui/PageShell'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate('/', { replace: true })
      }
    })
  }, [navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setMessage('Signed in successfully. Redirecting…')
    navigate('/', { replace: true })
  }

  return (
    <PageShell>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="card auth-card" style={{ maxWidth: 480, width: '100%', padding: '40px 32px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          {/* Header */}
          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: 12 }}>🏏</div>
            <div className="heading grad-text" style={{ fontSize: '28px', marginBottom: 8 }}>Hafiz Stars Eleven</div>
            <div className="small muted" style={{ fontSize: '14px' }}>Welcome back to your cricket team management hub</div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="input-group">
              <span style={{ fontWeight: '600', marginBottom: 8 }}>Email Address</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="captain@cricketclub.com"
                required
                style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
              />
            </label>

            <label className="input-group">
              <span style={{ fontWeight: '600', marginBottom: 8 }}>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
                style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
              />
            </label>

            {error && <div className="alert alert-error" style={{ marginTop: 12, padding: '12px', borderRadius: '6px' }}>{error}</div>}
            {message && <div className="alert alert-success" style={{ marginTop: 12, padding: '12px', borderRadius: '6px' }}>{message}</div>}

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '12px', marginTop: 20 }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Links */}
          <div style={{ marginTop: 24, textAlign: 'center', borderTop: '1px solid #eee', paddingTop: 24 }}>
            <div className="small muted" style={{ marginBottom: 12 }}>
              <Link to="/forgot-password" className="link" style={{ color: '#0066cc', textDecoration: 'none' }}>Forgot password?</Link>
            </div>
            <div className="small muted">
              New to the squad? <Link to="/signup" className="link" style={{ color: '#0066cc', textDecoration: 'none' }}>Create account</Link>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
