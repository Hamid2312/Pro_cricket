import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PageShell from '../components/ui/PageShell'

export default function Profile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        navigate('/login')
        return
      }

      setUser(session.user)
      setLoading(false)
    }

    getUser()
  }, [navigate])

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      setError(error.message)
    } else {
      navigate('/login')
    }
  }

  if (loading) {
    return (
      <PageShell>
        <div style={{ textAlign: 'center', marginTop: '80px' }}>
          <div className="subhead">Loading...</div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="card" style={{ maxWidth: 520, margin: '40px auto 0', padding: '32px 28px' }}>
        <div style={{ marginBottom: 28 }}>
          <div className="subhead">Your Account</div>
          <div className="heading grad-text" style={{ marginTop: 8 }}>Profile</div>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

        <div style={{ marginBottom: 24, padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <div className="small muted">Email Address</div>
          <div style={{ fontSize: '18px', fontWeight: '500', marginTop: 8 }}>{user?.email}</div>
        </div>

        <div style={{ marginBottom: 24, padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <div className="small muted">Account Type</div>
          <div style={{ fontSize: '18px', fontWeight: '500', marginTop: 8 }}>Captain</div>
        </div>

        <div style={{ marginBottom: 24, padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <div className="small muted">Last Sign In</div>
          <div style={{ fontSize: '18px', fontWeight: '500', marginTop: 8 }}>
            {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'N/A'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: 28 }}>
          <button onClick={() => navigate('/')} className="btn" style={{ flex: 1 }}>
            Back to Home
          </button>
          <button onClick={handleLogout} className="btn btn-primary" style={{ flex: 1 }}>
            Logout
          </button>
        </div>
      </div>
    </PageShell>
  )
}
