import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../components/ui/PageShell'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'

const ROLES = ['Batsman', 'Bowler', 'All-Rounder', 'WK']

export default function JoinRequest() {
  const { session, teamMe, loadingTeam, refreshTeamMe, signOut } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [jerseyNumber, setJerseyNumber] = useState('')
  const [role, setRole] = useState('Batsman')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (teamMe?.can_use_app) {
      navigate('/', { replace: true })
      return
    }

    if (teamMe?.pending_request) {
      setStatus('pending')
    }

    if (!fullName) {
      setFullName(teamMe?.player?.name || session?.user?.email?.split('@')[0] || '')
    }
  }, [teamMe, session, navigate, fullName])

  const joinRequest = useMemo(() => teamMe?.pending_request, [teamMe])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setStatus('')
    setSubmitting(true)

    try {
      await api.submitJoinRequest({
        full_name: fullName,
        jersey_number: Number(jerseyNumber),
        role,
        message,
      })
      setStatus('pending')
      refreshTeamMe(session)
    } catch (err) {
      setError(err.message || 'Unable to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  if (session === undefined || loadingTeam) {
    return (
      <PageShell>
        <div className="card" style={{ maxWidth: 520, margin: '80px auto', padding: 24, textAlign: 'center' }}>
          Loading your team status…
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="card auth-card" style={{ maxWidth: 560, margin: '80px auto 40px', padding: '32px 28px' }}>
        <div style={{ marginBottom: 24 }}>
          <div className="subhead">Membership request</div>
          <div className="heading grad-text" style={{ marginTop: 8 }}>Complete your join request</div>
          <div className="small muted" style={{ marginTop: 6 }}>
            {joinRequest ? 'Your request is awaiting captain approval.' : 'Tell us your details so the team can approve you.'}
          </div>
        </div>

        {joinRequest ? (
          <div className="space-y-4">
            <div className="card" style={{ padding: 18, background: 'rgba(255,255,255,0.04)' }}>
              <div className="small muted">Requested name</div>
              <div style={{ marginTop: 6, fontWeight: 700 }}>{joinRequest.full_name}</div>
              <div className="small muted" style={{ marginTop: 10 }}>Jersey</div>
              <div>{joinRequest.jersey_number}</div>
              <div className="small muted" style={{ marginTop: 10 }}>Role</div>
              <div>{joinRequest.role}</div>
              {joinRequest.message && (
                <>
                  <div className="small muted" style={{ marginTop: 10 }}>Message</div>
                  <div>{joinRequest.message}</div>
                </>
              )}
            </div>
            <div className="alert alert-info">
              Your request has been submitted. Captains will review it shortly.
            </div>
            <button type="button" className="btn btn-secondary" onClick={signOut}>
              Sign out
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="input-group">
              <span>Full name</span>
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Hafiz Usman"
                required
              />
            </label>

            <label className="input-group">
              <span>Jersey number</span>
              <input
                type="number"
                min="1"
                max="99"
                value={jerseyNumber}
                onChange={(event) => setJerseyNumber(event.target.value)}
                placeholder="11"
                required
              />
            </label>

            <label className="input-group">
              <span>Role</span>
              <select value={role} onChange={(event) => setRole(event.target.value)}>
                {ROLES.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="input-group">
              <span>Why do you want to join?</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="I want to join the squad and contribute with my all-round skills."
                rows={4}
              />
            </label>

            {error && <div className="alert alert-error">{error}</div>}
            {status === 'pending' && <div className="alert alert-success">Join request submitted successfully.</div>}

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Send request'}
            </button>
          </form>
        )}
      </div>
    </PageShell>
  )
}
