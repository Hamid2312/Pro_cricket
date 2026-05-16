import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { CheckCircle2, XCircle, Clock, Users } from 'lucide-react'
import PageShell from '../components/ui/PageShell'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'
import useAppStore from '../store/useAppStore'

const RSVP_CFG = {
  in:    { color: '#00e676', bg: 'rgba(0,230,118,0.08)', border: 'rgba(0,230,118,0.2)', Icon: CheckCircle2, label: 'In' },
  out:   { color: '#ff5252', bg: 'rgba(255,82,82,0.08)', border: 'rgba(255,82,82,0.2)', Icon: XCircle, label: 'Out' },
  maybe: { color: '#ffb300', bg: 'rgba(255,179,0,0.08)', border: 'rgba(255,179,0,0.18)', Icon: Clock, label: 'Maybe' },
}

export default function Matches() {
  const { teamMe } = useAuth()
  const { matches, players, activeMatch, upsertMatch, setActiveMatch } = useAppStore()

  const match = activeMatch || matches[0]
  const playerId = teamMe?.player?.id

  useEffect(() => {
    if (!match?.id) return
    if (Array.isArray(match.rsvps)) return
    api.getMatch(match.id).then((detail) => {
      if (detail) {
        upsertMatch(detail)
        setActiveMatch(detail)
      }
    }).catch(() => {})
  }, [match?.id, match?.rsvps, upsertMatch, setActiveMatch])

  const rsvpMap = (match?.rsvps || []).reduce((acc, item) => {
    acc[item.player_id] = item.status
    return acc
  }, {})

  const toggle = async () => {
    if (!match || !playerId) return
    const current = rsvpMap[playerId] || 'maybe'
    const next = { in: 'out', out: 'maybe', maybe: 'in' }[current]
    await api.updateRSVP(match.id, { player_id: playerId, status: next })
  }

  const inCount = Object.values(rsvpMap).filter((status) => status === 'in').length
  const outCount = Object.values(rsvpMap).filter((status) => status === 'out').length
  const maybeCount = Object.values(rsvpMap).filter((status) => status === 'maybe').length

  return (
    <PageShell>
      <motion.div style={{ paddingTop: 40, marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(200,255,0,0.7)', marginBottom: 6 }}>Module B</div>
        <div className="heading grad-text">Match Day</div>
        <div className="small muted" style={{ marginTop: 4 }}>RSVP · Squad · Playing XI</div>
      </motion.div>

      <div className="card card-hero" style={{ padding: '18px 20px', marginBottom: 20 }}>
        <motion.div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(200,255,0,0.7)', marginBottom: 4 }}>Next Match</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>vs {match?.opponent ?? '—'}</div>
            <div className="xs muted" style={{ marginTop: 4 }}>
              📍 {match?.venue ?? '—'} · {match?.match_date ? new Date(match.match_date).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' }) : 'TBD'} · {match?.match_time ?? 'TBD'}
            </div>
          </div>
          <div className="badge badge-neon" style={{ fontSize: 12, flexShrink: 0 }}>{match ? 'Live' : 'No match'}</div>
        </motion.div>

        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { count: inCount, label: 'In', color: '#00e676' },
            { count: outCount, label: 'Out', color: '#ff5252' },
            { count: maybeCount, label: 'Maybe', color: '#ffb300' },
          ].map(({ count, label, color }) => (
            <div key={label} style={{ flex: 1, background: `${color}10`, border: `1px solid ${color}25`, borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color, textShadow: `0 0 16px ${color}66` }}>{count}</div>
              <div className="xs" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}>{label}</div>
            </div>
          ))}
        </div>

        <div className="prog-track" style={{ marginTop: 14 }}>
          <motion.div className="prog-fill" style={{ background: 'linear-gradient(90deg, #c8ff00, #00e676)', boxShadow: '0 0 12px rgba(200,255,0,0.4)' }} animate={{ width: `${match ? Math.min(100, Math.round((inCount / 11) * 100)) : 0}%` }} transition={{ duration: 0.5, ease: 'easeOut' }} />
        </div>
        <div className="xs muted" style={{ marginTop: 5 }}>
          {inCount >= 11 ? '✓ Playing XI ready' : `${Math.max(0, 11 - inCount)} more needed for full XI`}
        </div>
      </div>

      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>
        Squad · Tap your row to update your RSVP
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {players.map((player) => {
          const status = rsvpMap[player.id] || 'maybe'
          const cfg = RSVP_CFG[status]
          const isCurrent = playerId === player.id
          const Icon = cfg.Icon
          return (
            <motion.button
              key={player.id}
              layout
              whileTap={isCurrent ? { scale: 0.97 } : {}}
              className="card"
              style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: isCurrent ? 'pointer' : 'default', width: '100%', textAlign: 'left', border: `1px solid ${cfg.border}` }}
              onClick={isCurrent ? toggle : undefined}
              disabled={!isCurrent}
            >
              <div style={{ width: 40, height: 40, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, flexShrink: 0, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                #{player.jersey_number}
              </div>
              <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#fff' }}>{player.name}</div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <Icon size={18} style={{ color: cfg.color, filter: `drop-shadow(0 0 6px ${cfg.color}88)` }} />
                <span className="badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: 10 }}>{cfg.label}</span>
              </div>
            </motion.button>
          )
        })}
      </div>

      <Link to="/live-xi" className="btn btn-primary" style={{ width: '100%', padding: '15px', fontSize: 15, borderRadius: 16, letterSpacing: '0.02em', boxShadow: '0 0 40px rgba(200,255,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Users size={17} /> Build Playing XI ({inCount} available)
      </Link>
    </PageShell>
  )
}
