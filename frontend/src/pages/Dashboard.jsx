import { useEffect, useState, useRef } from 'react'
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  CalendarDays, Wallet, Package, ChevronRight, Zap, Star,
  Users, Flame, AlertTriangle, TrendingUp, CheckCircle2,
  XCircle, Clock, Shield, Trophy, ArrowUpRight
} from 'lucide-react'
import useAppStore from '../store/useAppStore'
import { useWebSocket } from '../hooks/useWebSocket'

/* ── Page transition ── */
const PAGE = {
  initial: { opacity: 0, y: 24, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: [.25,.46,.45,.94] } },
  exit:    { opacity: 0, y: -12, filter: 'blur(4px)', transition: { duration: 0.25 } },
}
const STAGGER = {
  animate: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } }
}
const ITEM = {
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [.25,.46,.45,.94] } },
}

/* ── Countdown hook ── */
function useCountdown(iso) {
  const [t, setT] = useState(0)
  useEffect(() => {
    const tick = () => setT(Math.max(0, new Date(iso) - Date.now()))
    tick(); const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [iso])
  const s = Math.floor(t / 1000)
  return { d: Math.floor(s/86400), h: Math.floor(s%86400/3600), m: Math.floor(s%3600/60), s: s%60 }
}

/* ── Animated number ── */
function AnimNum({ to, prefix = '', suffix = '' }) {
  const spring = useSpring(0, { stiffness: 60, damping: 20 })
  const display = useTransform(spring, v => `${prefix}${Math.round(v).toLocaleString()}${suffix}`)
  useEffect(() => { spring.set(to) }, [to])
  return <motion.span>{display}</motion.span>
}

/* ── Tilt card ── */
function TiltCard({ children, className = '', style = {}, onClick }) {
  const ref = useRef(null)
  const rx = useMotionValue(0), ry = useMotionValue(0)
  const rotX = useSpring(rx, { stiffness: 300, damping: 30 })
  const rotY = useSpring(ry, { stiffness: 300, damping: 30 })

  const onMove = (e) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width  - 0.5
    const y = (e.clientY - rect.top)  / rect.height - 0.5
    rx.set(y * -8); ry.set(x * 8)
  }
  const onLeave = () => { rx.set(0); ry.set(0) }

  return (
    <motion.div
      ref={ref}
      className={`card tilt-card ${className}`}
      style={{ rotateX: rotX, rotateY: rotY, transformPerspective: 800, ...style }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}

/* ── Arc gauge ── */
function ArcGauge({ pct, size = 110, color = '#c8ff00' }) {
  const r = 42, cx = size / 2, cy = size / 2
  const arc = (a, rx, ry) => {
    const rad = (a - 90) * Math.PI / 180
    return { x: cx + rx * Math.cos(rad), y: cy + ry * Math.sin(rad) }
  }
  const startAngle = -210, sweepAngle = 240
  const endAngle = startAngle + sweepAngle * (pct / 100)
  const s = arc(startAngle, r, r), e = arc(endAngle, r, r)
  const largeArc = sweepAngle * pct / 100 > 180 ? 1 : 0
  const pathBg = `M ${arc(startAngle, r, r).x} ${arc(startAngle, r, r).y} A ${r} ${r} 0 1 1 ${arc(startAngle + sweepAngle, r, r).x} ${arc(startAngle + sweepAngle, r, r).y}`
  const pathFg = pct > 0
    ? `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`
    : null

  return (
    <div className="arc-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="#00c8ff" />
          </linearGradient>
          <filter id="arcGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <path d={pathBg} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" strokeLinecap="round" />
        {pathFg && (
          <motion.path
            d={pathFg} fill="none"
            stroke="url(#arcGrad)" strokeWidth="8" strokeLinecap="round"
            filter="url(#arcGlow)"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, ease: 'easeOut', delay: 0.4 }}
          />
        )}
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center' }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>SPENT</div>
        <div style={{ fontSize: 20, fontWeight: 900, color, textShadow: `0 0 20px ${color}99` }}>{pct}%</div>
      </div>
    </div>
  )
}

/* ── Flip countdown digit ── */
function FlipDigit({ value, label }) {
  return (
    <div className="flip-digit" style={{ flex: 1 }}>
      <AnimatePresence mode="popLayout">
        <motion.div
          key={value}
          className="flip-num"
          initial={{ y: -20, opacity: 0, scale: 0.8 }}
          animate={{ y: 0,   opacity: 1, scale: 1 }}
          exit={{    y: 20,  opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.25, ease: [.25,.46,.45,.94] }}
        >
          {String(value).padStart(2, '0')}
        </motion.div>
      </AnimatePresence>
      <div className="flip-label">{label}</div>
    </div>
  )
}

/* ── Mock data ── */
const MATCH_DATE = new Date(Date.now() + 2.5 * 24 * 3600 * 1000).toISOString()
const IN_PLAYERS = ['Ali', 'Hafiz', 'Bilal', 'Hamza', 'Zain', 'Faisal', 'Usman', 'Omar']
const OUT_PLAYERS = ['Raza', 'Saad']
const EXPENSES = [
  { cat: 'Tape',   amt: 450, color: '#c8ff00' },
  { cat: 'Balls',  amt: 600, color: '#00e676' },
  { cat: 'Snacks', amt: 350, color: '#ffb300' },
]
const PLAYERS = [
  { name: 'Ali Haider',  role: 'All-Rounder', impact: 87.4, j: 7,  m: 15, r: 610, w: 14 },
  { name: 'Hafiz Usman', role: 'Batsman',      impact: 82.1, j: 11, m: 14, r: 520, w: 0  },
  { name: 'Bilal Ahmed', role: 'Bowler',        impact: 79.8, j: 3,  m: 14, r: 88,  w: 24 },
]
const TOTAL_IN = 5250, TOTAL_OUT = 1400, BALANCE = 3850

/* ── Dashboard ── */
export default function Dashboard() {
  const cd = useCountdown(MATCH_DATE)
  
  // Real-time Store Data
  const { team_treasury, inventory, ledger } = useAppStore()
  const { connectionState } = useWebSocket('global')
  
  // Calculate total in / out from local ledger cache (if we load it)
  // For demo, we use treasury directly. The actual total_in could be derived from ledger.
  const balance = team_treasury.total_balance || 3850
  const spentPct = Math.round((TOTAL_OUT / Math.max(TOTAL_IN, 1)) * 100)

  return (
    <motion.div className="wrap" {...{ variants: PAGE, initial: 'initial', animate: 'animate', exit: 'exit' }}>
      <motion.div variants={STAGGER} initial="initial" animate="animate" className="space-y-5">

        {/* ── HEADER ── */}
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
              <div className="stat-number" style={{ fontSize: 22 }}>11</div>
              <div className="xs muted" style={{ marginTop: 2, letterSpacing: '0.08em' }}>SQUAD</div>
            </div>
          </div>
        </motion.div>

        {/* ── NEXT MATCH HERO ── */}
        <motion.div variants={ITEM}>
          <div className="sec-header">
            <div className="sec-title"><CalendarDays size={14} />Next Match</div>
            <Link to="/matches" className="sec-link">RSVP Now <ChevronRight size={12} /></Link>
          </div>

          <TiltCard className="card-hero glow-border-anim" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Stadium gradient backdrop */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(160deg, rgba(200,255,0,0.06) 0%, rgba(0,0,0,0) 40%, rgba(0,200,255,0.04) 100%)',
              zIndex: 0,
            }} />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
              background: 'linear-gradient(0deg, rgba(8,8,8,0.8) 0%, transparent 100%)',
              zIndex: 0,
            }} />

            <div style={{ position: 'relative', zIndex: 1, padding: '20px 20px 0' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                <div>
                  <div className="subhead" style={{ marginBottom: 4 }}>vs</div>
                  <div className="heading" style={{ fontSize: 20, color: '#fff' }}>Green Warriors FC</div>
                  <div className="xs muted" style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                    📍 Model Town Ground, Lahore
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div className="badge badge-neon" style={{ marginBottom: 6 }}>04:30 PM</div>
                  <div className="xs muted">{new Date(MATCH_DATE).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                </div>
              </div>

              {/* Countdown */}
              <div style={{ display: 'flex', gap: 8, marginTop: 18, marginBottom: 18 }}>
                <FlipDigit value={cd.d} label="Days" />
                <FlipDigit value={cd.h} label="Hours" />
                <FlipDigit value={cd.m} label="Min" />
                <FlipDigit value={cd.s} label="Sec" />
              </div>
            </div>

            {/* RSVP strip */}
            <div style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.07)', padding: '14px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Avatar stack */}
                  <div className="avatar-stack">
                    {IN_PLAYERS.slice(0, 5).map((n, i) => (
                      <div className="avatar-item" key={i} style={{
                        background: `hsl(${70 + i * 20}, 80%, 20%)`,
                        color: '#c8ff00',
                        zIndex: 10 - i
                      }}>
                        {n[0]}
                      </div>
                    ))}
                    {IN_PLAYERS.length > 5 && (
                      <div className="avatar-item" style={{ background: 'rgba(200,255,0,0.1)', color: '#c8ff00' }}>
                        +{IN_PLAYERS.length - 5}
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#00e676' }}>
                      {IN_PLAYERS.length} confirmed
                    </div>
                    <div className="xs muted">{OUT_PLAYERS.length} out · {11 - IN_PLAYERS.length > 0 ? `need ${11 - IN_PLAYERS.length}` : '✓ XI ready'}</div>
                  </div>
                </div>
                <div className="badge badge-green">
                  <CheckCircle2 size={10} />
                  {IN_PLAYERS.length >= 11 ? 'XI Ready' : `${IN_PLAYERS.length}/11`}
                </div>
              </div>

              {/* XI progress bar */}
              <div className="prog-track" style={{ marginBottom: 14 }}>
                <motion.div
                  className="prog-fill"
                  style={{ background: 'linear-gradient(90deg, #c8ff00, #00e676)', boxShadow: '0 0 10px rgba(200,255,0,0.4)' }}
                  initial={{ width: '0%' }}
                  animate={{ width: `${(IN_PLAYERS.length / 11) * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.6 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <Link to="/matches" style={{ flex: 1 }} className="btn btn-primary" style={{ flex: 1, borderRadius: 12, padding: '11px 0', fontSize: 13 }}>
                  <Zap size={14} /> Mark Attendance
                </Link>
                <Link to="/matches" className="btn btn-glass" style={{ borderRadius: 12, padding: '11px 16px', fontSize: 13 }}>
                  <Users size={14} /> XI
                </Link>
              </div>
            </div>
          </TiltCard>
        </motion.div>

        {/* ── QUICK STATS ROW ── */}
        <motion.div variants={ITEM} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { label: 'Balance', value: balance, prefix: '₨', color: '#c8ff00', icon: <Wallet size={13} /> },
            { label: 'RSVP In', value: IN_PLAYERS.length, suffix: '/11', color: '#00e676', icon: <Users size={13} /> },
            { label: 'Balls', value: inventory.fresh_balls || 3, suffix: ' left', color: '#00c8ff', icon: <Package size={13} /> },
          ].map(({ label, value, prefix, suffix, color, icon }) => (
            <div className="stat-box" key={label} style={{ borderRadius: 16 }}>
              <div style={{ color, opacity: 0.7, marginBottom: 6, display: 'flex', justifyContent: 'center' }}>{icon}</div>
              <div className="stat-number" style={{ color, fontSize: 20, textShadow: `0 0 20px ${color}66` }}>
                <AnimNum to={value} prefix={prefix || ''} suffix={suffix || ''} />
              </div>
              <div className="xs muted" style={{ marginTop: 4, letterSpacing: '0.06em' }}>{label}</div>
            </div>
          ))}
        </motion.div>

        {/* ── TEAM KHATA ── */}
        <motion.div variants={ITEM}>
          <div className="sec-header">
            <div className="sec-title"><Wallet size={14} />Team Khata</div>
            <Link to="/finance" className="sec-link">Full Ledger <ChevronRight size={12} /></Link>
          </div>
          <div className="card" style={{ padding: 20 }}>
            {/* Balance row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
              <ArcGauge pct={spentPct} />
              <div style={{ flex: 1 }}>
                <div className="xs muted" style={{ marginBottom: 4 }}>Current Balance</div>
                <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-0.04em', color: '#c8ff00', textShadow: '0 0 30px rgba(200,255,0,0.4)', lineHeight: 1 }}>
                  ₨<AnimNum to={balance} />
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <div className="xs" style={{ color: '#00e676' }}>↑ ₨{TOTAL_IN.toLocaleString()} in</div>
                  <div className="xs" style={{ color: '#ff5252' }}>↓ ₨{TOTAL_OUT.toLocaleString()} out</div>
                </div>
              </div>
            </div>

            <div className="divider" style={{ margin: '0 0 16px' }} />

            {/* Expenses */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {EXPENSES.map(({ cat, amt, color }, i) => (
                <div key={cat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span className="small" style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{cat}</span>
                    <span className="small" style={{ color, fontWeight: 800 }}>₨{amt}</span>
                  </div>
                  <div className="prog-track">
                    <motion.div className="prog-fill"
                      style={{ background: color, boxShadow: `0 0 8px ${color}66` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(amt / TOTAL_IN) * 100}%` }}
                      transition={{ duration: 0.9, delay: 0.4 + i * 0.12 }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,179,0,0.07)', border: '1px solid rgba(255,179,0,0.18)' }}>
              <AlertTriangle size={13} style={{ color: '#ffb300', flexShrink: 0 }} />
              <span className="xs" style={{ color: '#ffb300', fontWeight: 600 }}>3 players have pending dues for May 2025</span>
            </div>
          </div>
        </motion.div>

        {/* ── KIT STATUS ── */}
        <motion.div variants={ITEM}>
          <div className="sec-header">
            <div className="sec-title"><Package size={14} />Kit Status</div>
            <Link to="/inventory" className="sec-link">Manage <ChevronRight size={12} /></Link>
          </div>
          <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Fresh Balls', count: inventory.fresh_balls || 3, max: 6, color: '#c8ff00', icon: '🏏', warn: (inventory.fresh_balls || 3) <= 2 },
              { label: 'Tape Rolls',  count: inventory.tape_rolls || 2, max: 5, color: '#00c8ff', icon: '📦', warn: false },
            ].map(({ label, count, max, color, icon, warn }, i) => (
              <div key={label}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: 20 }}>{icon}</div>
                    <div>
                      <div className="small" style={{ fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{label}</div>
                      {warn && <div className="xs" style={{ color: '#ff5252', fontWeight: 600, marginTop: 1 }}>⚠ Low — restock soon</div>}
                    </div>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900, color, textShadow: `0 0 20px ${color}88`, letterSpacing: '-0.03em' }}>{count}</div>
                </div>
                <div className="prog-track">
                  <motion.div className="prog-fill"
                    style={{ background: `linear-gradient(90deg, ${color}, ${color}88)`, boxShadow: `0 0 10px ${color}55` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / max) * 100}%` }}
                    transition={{ duration: 1, delay: 0.5 + i * 0.15 }}
                  />
                </div>
              </div>
            ))}
            <div className="divider" style={{ margin: '2px 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={15} style={{ color: '#c8ff00' }} />
                <span className="small" style={{ fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>Kit Holder</span>
              </div>
              <div className="badge badge-neon" style={{ fontSize: 12 }}>Hafiz Usman</div>
            </div>
          </div>
        </motion.div>

        {/* ── IMPACT LEADERS ── */}
        <motion.div variants={ITEM}>
          <div className="sec-header">
            <div className="sec-title"><TrendingUp size={14} />Impact Leaders</div>
            <Link to="/players" className="sec-link">Full Squad <ChevronRight size={12} /></Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PLAYERS.map((p, i) => {
              const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32']
              const roleColors = { 'All-Rounder': '#ffb300', Batsman: '#c8ff00', Bowler: '#00c8ff' }
              const rc = roleColors[p.role] || '#c8ff00'
              return (
                <TiltCard key={p.name} style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Rank */}
                    <div style={{ fontSize: 18, width: 28, textAlign: 'center', fontWeight: 900, color: rankColors[i], textShadow: `0 0 16px ${rankColors[i]}88`, flexShrink: 0 }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                    </div>
                    {/* Jersey */}
                    <div style={{
                      width: 42, height: 42, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 900, fontSize: 14, flexShrink: 0,
                      background: `${rc}15`, color: rc, border: `1px solid ${rc}30`,
                    }}>#{p.j}</div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontWeight: 800, fontSize: 14, color: '#fff' }}>{p.name}</span>
                        {i === 0 && <Star size={11} fill="#c8ff00" style={{ color: '#c8ff00' }} />}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="badge" style={{ background: `${rc}12`, color: rc, border: `1px solid ${rc}25`, padding: '2px 8px', fontSize: 10 }}>{p.role}</span>
                        <span className="xs muted">{p.m}M · {p.r}R · {p.w}W</span>
                      </div>
                      {/* Impact bar */}
                      <div className="prog-track" style={{ marginTop: 8, height: 3 }}>
                        <motion.div className="prog-fill"
                          style={{ background: `linear-gradient(90deg, #c8ff00, #fff)`, boxShadow: '0 0 8px rgba(200,255,0,0.5)' }}
                          initial={{ width: 0 }}
                          animate={{ width: `${p.impact}%` }}
                          transition={{ duration: 1, ease: 'easeOut', delay: 0.6 + i * 0.1 }}
                        />
                      </div>
                    </div>
                    {/* Impact score */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div className="xs muted" style={{ marginBottom: 2 }}>Impact</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#c8ff00', textShadow: '0 0 20px rgba(200,255,0,0.6)', letterSpacing: '-0.03em' }}>{p.impact}</div>
                    </div>
                  </div>
                </TiltCard>
              )
            })}
          </div>
        </motion.div>

        <div style={{ height: 8 }} />
      </motion.div>
    </motion.div>
  )
}
