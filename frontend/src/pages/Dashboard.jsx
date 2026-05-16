import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { CalendarDays, Wallet, ChevronRight, Users, Trophy, Star } from 'lucide-react'
import useAppStore from '../store/useAppStore'
import { useWebSocket } from '../hooks/useWebSocket'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'

const PAGE = {
  initial: { opacity: 0, y: 24, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: [.25,.46,.45,.94] } },
  exit:    { opacity: 0, y: -12, filter: 'blur(4px)', transition: { duration: 0.25 } },
}
const STAGGER = { animate: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }
const ITEM = { initial: { opacity: 0, y: 22 }, animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [.25,.46,.45,.94] } } }

function useCountdown(iso) {
  const [t, setT] = useState(0)
  useEffect(() => {
    const tick = () => setT(Math.max(0, new Date(iso) - Date.now()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [iso])
  const s = Math.floor(t / 1000)
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 }
}

function TiltCard({ children, className = '', style = {}, onClick }) {
  return (
    <motion.div className={`card tilt-card ${className}`} style={{ ...style }} onClick={onClick}>
      {children}
    </motion.div>
  )
}

function FlipDigit({ value, label }) {
  return (
    <div className="flip-digit" style={{ flex: 1 }}>
      <div className="flip-num">{String(value).padStart(2, '0')}</div>
      <div className="flip-label">{label}</div>
    </div>
  )
}

const MATCH_DATE = new Date(Date.now() + 2.5 * 24 * 3600 * 1000).toISOString()

export default function Dashboard() {
  const { teamMe } = useAuth()
  const { team_treasury, inventory, players, matches, activeMatch, join_requests } = useAppStore()
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const { connectionState } = useWebSocket('global')

  const pendingRequests = join_requests.filter((r) => r.status === 'pending')

  const match = activeMatch || matches[0] || null
  const countdown = useCountdown(match?.match_date ?? MATCH_DATE)
  const rsvps = match?.rsvps || []
  const inCount = rsvps.filter((item) => item.status === 'in').length
  const outCount = rsvps.filter((item) => item.status === 'out').length
  const maybeCount = rsvps.filter((item) => item.status === 'maybe').length
  const rosterNames = rsvps.map((item) => item.players?.name || players.find((p) => p.id === item.player_id)?.name || 'Player')
  const balance = team_treasury.total_balance ?? 0

  const handleDecision = async (requestId, approve) => {
    setActionError('')
    setActionLoading(true)
    try {
      if (approve) await api.approveJoinRequest(requestId)
      else await api.rejectJoinRequest(requestId)
    } catch (err) {
      setActionError(err.message || 'Could not update request')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <motion.div className="wrap" variants={PAGE} initial="initial" animate="animate" exit="exit">
      <motion.div variants={STAGGER} initial="initial" animate="animate" className="space-y-5">
        <motion.div variants={ITEM} className="flex items-start justify-between pt-10 pb-2">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="live-dot" style={{ background: connectionState === 'connected' ? '#c8ff00' : '#ff5252' }} />
              <span className="subhead" style={{ fontSize: 10 }}>
                {connectionState === 'connected' ? 'Live Dashboard' : 'Reconnecting...'}
              </span>
            </div>
            <div className="display grad-text">Hafiz Stars<br />Eleven</div>
            <div className="small muted mt-1" style={{ letterSpacing: '0.06em' }}>⭐ Lahore Tape-Ball Elite · 2025</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <div className="badge badge-neon"><Trophy size={10} /> Season 2025</div>
            <div className="stat-box" style={{ minWidth: 64, padding: '10px 14px' }}>
              <div className="stat-number" style={{ fontSize: 22 }}>{players.length || 11}</div>
              <div className="xs muted" style={{ marginTop: 2, letterSpacing: '0.08em' }}>SQUAD</div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={ITEM}>
          <div className="sec-header">
            <div className="sec-title"><CalendarDays size={14} />Next Match</div>
            <Link to="/matches" className="sec-link">RSVP Now <ChevronRight size={12} /></Link>
          </div>

          <TiltCard className="card-hero glow-border-anim" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(200,255,0,0.06) 0%, rgba(0,0,0,0) 40%, rgba(0,200,255,0.04) 100%)', zIndex: 0 }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(0deg, rgba(8,8,8,0.8) 0%, transparent 100%)', zIndex: 0 }} />
            <div style={{ position: 'relative', zIndex: 1, padding: '20px 20px 0' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                <div>
                  <div className="subhead" style={{ marginBottom: 4 }}>vs</div>
                  <div className="heading" style={{ fontSize: 20, color: '#fff' }}>{match?.opponent ?? 'Green Warriors FC'}</div>
                  <div className="xs muted" style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                    📍 {match?.venue ?? 'Model Town Ground, Lahore'}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div className="badge badge-neon" style={{ marginBottom: 6 }}>{match?.match_time ?? '04:30 PM'}</div>
                  <div className="xs muted">{match?.match_date ? new Date(match.match_date).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' }) : new Date(MATCH_DATE).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 18, marginBottom: 18 }}>
                <FlipDigit value={countdown.d} label="Days" />
                <FlipDigit value={countdown.h} label="Hours" />
                <FlipDigit value={countdown.m} label="Min" />
                <FlipDigit value={countdown.s} label="Sec" />
              </div>
            </div>
            <div style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.07)', padding: '14px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="avatar-stack">
                    {rosterNames.slice(0, 5).map((name, i) => (
                      <div key={i} className="avatar-item" style={{ background: `hsl(${70 + i * 20}, 80%, 20%)`, color: '#c8ff00', zIndex: 10 - i }}>{name[0]}</div>
                    ))}
                    {rosterNames.length > 5 && (
                      <div className="avatar-item" style={{ background: 'rgba(200,255,0,0.1)', color: '#c8ff00' }}>+{rosterNames.length - 5}</div>
                    )}
                  </div>
                  <div>
                    <div className="small muted">Players in</div>
                    <div style={{ fontWeight: 700, color: '#fff' }}>{inCount} confirmed</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 100 }}>
                  <div className="badge" style={{ background: 'rgba(255,82,82,0.08)', color: '#ff5252', border: '1px solid rgba(255,82,82,0.18)' }}>{outCount} absent</div>
                  <div className="xs muted" style={{ marginTop: 4 }}>{maybeCount} undecided</div>
                </div>
              </div>
              <div className="prog-track" style={{ marginTop: 10 }}>
                <motion.div className="prog-fill" style={{ background: 'linear-gradient(90deg, #c8ff00, #00e676)', boxShadow: '0 0 12px rgba(200,255,0,0.4)' }} animate={{ width: `${Math.min(100, Math.round((inCount / 11) * 100))}%` }} transition={{ duration: 0.5, ease: 'easeOut' }} />
              </div>
            </div>
          </TiltCard>
        </motion.div>

        <motion.div variants={ITEM} className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
          <div className="card" style={{ padding: 22 }}>
            <div className="sec-title"><Wallet size={14} /> Team Treasury</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 18 }}>
              <div>
                <div className="stat-number" style={{ fontSize: 34 }}>₨{balance.toLocaleString()}</div>
                <div className="small muted" style={{ marginTop: 6 }}>Available for kit, travel, and match day essentials</div>
              </div>
              <div style={{ width: 110, height: 110 }} />
            </div>
          </div>

          <div className="card" style={{ padding: 22 }}>
            <div className="sec-title"><Users size={14} /> Squad Pulse</div>
            <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}>
              <div className="stat-block">
                <div className="stat-label">Squad size</div>
                <div className="stat-number">{players.length || 11}</div>
              </div>
              <div className="stat-block">
                <div className="stat-label">Balls in stock</div>
                <div className="stat-number">{inventory.fresh_balls ?? 0}</div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={ITEM} className="card" style={{ padding: 22 }}>
          <div className="sec-header">
            <div className="sec-title"><Star size={14} /> Captain console</div>
            {teamMe?.is_captain && <Link to="/matches" className="sec-link">View pending RSVP</Link>}
          </div>

          {teamMe?.is_captain ? (
            <div style={{ marginTop: 14 }}>
              <div className="small muted" style={{ marginBottom: 12 }}>Pending squad approvals</div>
              {pendingRequests.length ? (
                pendingRequests.map((request) => (
                  <div key={request.id} className="card" style={{ padding: 18, marginBottom: 12, background: 'rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{request.full_name}</div>
                        <div className="small muted">#{request.jersey_number} · {request.role}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" className="btn btn-success" onClick={() => handleDecision(request.id, true)} disabled={actionLoading}>Approve</button>
                        <button type="button" className="btn btn-secondary" onClick={() => handleDecision(request.id, false)} disabled={actionLoading}>Reject</button>
                      </div>
                    </div>
                    {request.message && <div className="small muted" style={{ marginTop: 10 }}>{request.message}</div>}
                  </div>
                ))
              ) : (
                <div className="card" style={{ padding: 18, background: 'rgba(255,255,255,0.04)' }}>No pending requests right now.</div>
              )}
              {actionError && <div className="alert alert-error" style={{ marginTop: 12 }}>{actionError}</div>}
            </div>
          ) : (
            <div style={{ marginTop: 14 }}>
              <div className="small muted">Only captains can review new join requests.</div>
              <div className="badge badge-neon" style={{ marginTop: 12 }}>Captain access required</div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
