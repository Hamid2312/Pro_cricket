import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PageShell from '../components/ui/PageShell'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User is in recovery state
      }
    })

    return () => {
      data?.subscription?.unsubscribe()
    }
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setMessage('Password updated successfully! Redirecting to login...')
    setTimeout(() => navigate('/login'), 2000)
  }

  return (
    <PageShell>
      <div className="card auth-card" style={{ maxWidth: 520, margin: '80px auto 0', padding: '32px 28px' }}>
        <div style={{ marginBottom: 28 }}>
          <div className="subhead">Create new password</div>
          <div className="heading grad-text" style={{ marginTop: 8 }}>Set your new password</div>
          <div className="small muted" style={{ marginTop: 6 }}>Make sure it's strong and unique.</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="input-group">
            <span>New Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          <label className="input-group">
            <span>Confirm Password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          {error && <div className="alert alert-error">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </PageShell>
  )
}
