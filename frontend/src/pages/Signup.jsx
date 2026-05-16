import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PageShell from '../components/ui/PageShell'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const { data, error } = await supabase.auth.signUp({ email, password })
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    if (data?.session) {
      navigate('/', { replace: true })
      return
    }

    setMessage('Account created. Check your email to confirm your account.')
  }

  return (
    <PageShell>
      <div className="card auth-card" style={{ maxWidth: 520, margin: '80px auto 0', padding: '32px 28px' }}>
        <div style={{ marginBottom: 28 }}>
          <div className="subhead">Join the squad</div>
          <div className="heading grad-text" style={{ marginTop: 8 }}>Create your Hafiz Stars account</div>
          <div className="small muted" style={{ marginTop: 6 }}>Register with your team email and start the approval flow.</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="input-group">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@cricketclub.com"
              required
            />
          </label>

          <label className="input-group">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          {error && <div className="alert alert-error">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating account…' : 'Sign up'}
          </button>
        </form>

        <div className="small muted" style={{ marginTop: 20, textAlign: 'center' }}>
          Already registered? <Link to="/login" className="link">Sign in</Link>
        </div>
      </div>
    </PageShell>
  )
}
