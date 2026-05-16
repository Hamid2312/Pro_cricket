import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PageShell from '../components/ui/PageShell'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setMessage('Check your email for a password reset link!')
  }

  return (
    <PageShell>
      <div className="card auth-card" style={{ maxWidth: 520, margin: '80px auto 0', padding: '32px 28px' }}>
        <div style={{ marginBottom: 28 }}>
          <div className="subhead">Forgot your password?</div>
          <div className="heading grad-text" style={{ marginTop: 8 }}>Reset your password</div>
          <div className="small muted" style={{ marginTop: 6 }}>Enter your email and we'll send you a reset link.</div>
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

          {error && <div className="alert alert-error">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>

        <div className="small muted" style={{ marginTop: 20, textAlign: 'center' }}>
          Remember your password? <Link to="/login" className="link">Sign in</Link>
        </div>
      </div>
    </PageShell>
  )
}
