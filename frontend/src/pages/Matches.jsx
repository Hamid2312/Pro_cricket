import { useState } from 'react'
import PageShell from '../components/ui/PageShell'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Clock, Users, Zap } from 'lucide-react'

const STAGGER = { animate: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } } }
const ITEM = { initial: { opacity: 0, x: -16 }, animate: { opacity: 1, x: 0, transition: { duration: 0.32 } } }

const PLAYERS = [
  { id: '1',  name: 'Ali Haider',   jersey: 7,  rsvp: 'in'    },
  { id: '2',  name: 'Hafiz Usman',  jersey: 11, rsvp: 'in'    },
  { id: '3',  name: 'Bilal Ahmed',  jersey: 3,  rsvp: 'in'    },
  { id: '4',  name: 'Saad Khan',    jersey: 5,  rsvp: 'out'   },
  { id: '5',  name: 'Usman Tariq',  jersey: 9,  rsvp: 'maybe' },
  { id: '6',  name: 'Hamza Malik',  jersey: 1,  rsvp: 'in'    },
  { id: '7',  name: 'Zain Abbas',   jersey: 4,  rsvp: 'in'    },
  { id: '8',  name: 'Faisal Rana',  jersey: 6,  rsvp: 'maybe' },
  { id: '9',  name: 'Raza Ali',     jersey: 8,  rsvp: 'out'   },
  { id: '10', name: 'Omar Sheikh',  jersey: 10, rsvp: 'in'    },
  { id: '11', name: 'Tariq Bhai',   jersey: 2,  rsvp: 'in'    },
]

import { Link } from 'react-router-dom'

const RSVP_CFG = {
  in:    { color: '#00e676', bg: 'rgba(0,230,118,0.08)',  border: 'rgba(0,230,118,0.2)',  Icon: CheckCircle2, label: 'In'    },
  out:   { color: '#ff5252', bg: 'rgba(255,82,82,0.08)',  border: 'rgba(255,82,82,0.2)',  Icon: XCircle,      label: 'Out'   },
  maybe: { color: '#ffb300', bg: 'rgba(255,179,0,0.08)', border: 'rgba(255,179,0,0.18)', Icon: Clock,        label: 'Maybe' },
}

export default function Matches() {
  const [players, setPlayers] = useState(PLAYERS)

  const toggle = (id) => setPlayers(prev => prev.map(p => {
    if (p.id !== id) return p
    return { ...p, rsvp: { in: 'out', out: 'maybe', maybe: 'in' }[p.rsvp] }
  }))

  const inCount    = players.filter(p => p.rsvp === 'in').length
  const outCount   = players.filter(p => p.rsvp === 'out').length
  const maybeCount = players.filter(p => p.rsvp === 'maybe').length

  return (
    <PageShell>
      {/* Header */}
      <div style={{ paddingTop: 40, marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(200,255,0,0.7)', marginBottom: 6 }}>Module B</div>
        <div className="heading grad-text">Match Day</div>
        <div className="small muted" style={{ marginTop: 4 }}>RSVP · Squad · Playing XI</div>
      </div>

      {/* Match banner */}
      <div className="card card-hero" style={{ padding: '18px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(200,255,0,0.7)', marginBottom: 4 }}>Next Match</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>vs Green Warriors FC</div>
            <div className="xs muted" style={{ marginTop: 4 }}>📍 Model Town · Sat 16 May · 04:30 PM</div>
          </div>
          <div className="badge badge-neon" style={{ fontSize: 12, flexShrink: 0 }}>2 days</div>
        </div>

        {/* Stat pills */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { count: inCount,    label: 'In',    color: '#00e676' },
            { count: outCount,   label: 'Out',   color: '#ff5252' },
            { count: maybeCount, label: 'Maybe', color: '#ffb300' },
          ].map(({ count, label, color }) => (
            <div key={label} style={{ flex: 1, background: `${color}10`, border: `1px solid ${color}25`, borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color, textShadow: `0 0 16px ${color}66` }}>{count}</div>
              <div className="xs" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="prog-track" style={{ marginTop: 14 }}>
          <motion.div className="prog-fill"
            style={{ background: 'linear-gradient(90deg, #c8ff00, #00e676)', boxShadow: '0 0 12px rgba(200,255,0,0.4)' }}
            animate={{ width: `${(inCount / 11) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <div className="xs muted" style={{ marginTop: 5 }}>
          {inCount >= 11 ? '✓ Playing XI ready' : `${11 - inCount} more needed for full XI`}
        </div>
      </div>

      {/* Squad list */}
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>
        Squad · Tap to toggle
      </div>

      <motion.div variants={STAGGER} initial="initial" animate="animate" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {players.map(p => {
          const cfg = RSVP_CFG[p.rsvp]
          return (
            <motion.button key={p.id} variants={ITEM} layout
              onClick={() => toggle(p.id)}
              whileTap={{ scale: 0.97 }}
              className="card"
              style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', width: '100%', textAlign: 'left', border: `1px solid ${cfg.border}` }}>
              {/* Jersey */}
              <div style={{ width: 40, height: 40, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, flexShrink: 0, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                #{p.jersey}
              </div>
              <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#fff' }}>{p.name}</div>
              {/* RSVP icon */}
              <AnimatePresence mode="wait">
                <motion.div key={p.rsvp}
                  initial={{ scale: 0.4, opacity: 0, rotate: -30 }}
                  animate={{ scale: 1,   opacity: 1, rotate: 0 }}
                  exit={{    scale: 0.4, opacity: 0, rotate: 30 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}>
                  <cfg.Icon size={18} style={{ color: cfg.color, filter: `drop-shadow(0 0 6px ${cfg.color}88)` }} />
                </motion.div>
              </AnimatePresence>
              <span className="badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: 10, flexShrink: 0 }}>{cfg.label}</span>
            </motion.button>
          )
        })}
      </motion.div>

      {/* Build XI CTA */}
      <Link to="/live-xi" className="btn btn-primary" style={{ width: '100%', padding: '15px', fontSize: 15, borderRadius: 16, letterSpacing: '0.02em', boxShadow: '0 0 40px rgba(200,255,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Users size={17} /> Build Playing XI ({inCount} available)
      </Link>
    </PageShell>
  )
}
