import PageShell from '../components/ui/PageShell'
import { motion } from 'framer-motion'
import { Star, TrendingUp } from 'lucide-react'

const PLAYERS = [
  { id: '1',  name: 'Ali Haider',   jersey: 7,  role: 'All-Rounder', impact: 87.4, m: 15, r: 610, w: 14 },
  { id: '2',  name: 'Hafiz Usman',  jersey: 11, role: 'Batsman',      impact: 82.1, m: 14, r: 520, w: 0  },
  { id: '3',  name: 'Bilal Ahmed',  jersey: 3,  role: 'Bowler',       impact: 79.8, m: 14, r: 88,  w: 24 },
  { id: '4',  name: 'Zain Abbas',   jersey: 4,  role: 'Batsman',      impact: 74.1, m: 13, r: 410, w: 0  },
  { id: '5',  name: 'Omar Sheikh',  jersey: 10, role: 'All-Rounder',  impact: 73.8, m: 12, r: 290, w: 8  },
  { id: '6',  name: 'Saad Khan',    jersey: 5,  role: 'All-Rounder',  impact: 76.3, m: 11, r: 280, w: 9  },
  { id: '7',  name: 'Tariq Bhai',   jersey: 2,  role: 'Bowler',       impact: 71.5, m: 10, r: 45,  w: 18 },
  { id: '8',  name: 'Usman Tariq',  jersey: 9,  role: 'Batsman',      impact: 70.0, m: 11, r: 350, w: 0  },
  { id: '9',  name: 'Hamza Malik',  jersey: 1,  role: 'WK',           impact: 68.2, m: 12, r: 320, w: 0  },
  { id: '10', name: 'Faisal Rana',  jersey: 6,  role: 'Batsman',      impact: 65.4, m: 9,  r: 195, w: 0  },
  { id: '11', name: 'Raza Ali',     jersey: 8,  role: 'Bowler',       impact: 62.1, m: 8,  r: 30,  w: 12 },
]

const ROLE_COLOR = {
  'All-Rounder': '#ffb300',
  'Batsman':     '#c8ff00',
  'Bowler':      '#00c8ff',
  'WK':          '#cf94da',
}

const RANK_EMOJI = ['🥇', '🥈', '🥉']

const sorted = [...PLAYERS].sort((a, b) => b.impact - a.impact)

export default function Players() {
  return (
    <PageShell>
      <div style={{ paddingTop: 40, marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(200,255,0,0.7)', marginBottom: 6 }}>Squad</div>
        <div className="heading grad-text">Impact Rankings</div>
        <div className="small muted" style={{ marginTop: 4 }}>Season 2025 · 11 Players</div>
      </div>

      {/* Top 3 podium */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.12fr 1fr', gap: 8, marginBottom: 20, alignItems: 'flex-end' }}>
        {[sorted[1], sorted[0], sorted[2]].map((p, podI) => {
          const actualRank = podI === 0 ? 1 : podI === 1 ? 0 : 2
          const rc = ROLE_COLOR[p.role] || '#c8ff00'
          const heights = ['160px', '190px', '148px']
          return (
            <motion.div key={p.id}
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: podI * 0.1, duration: 0.5 }}
              className="card" style={{
                padding: '16px 12px', textAlign: 'center', height: heights[podI],
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                background: podI === 1 ? 'rgba(200,255,0,0.05)' : 'rgba(255,255,255,0.02)',
              }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{RANK_EMOJI[actualRank]}</div>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: `${rc}18`, border: `1px solid ${rc}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontWeight: 900, fontSize: 13, color: rc }}>
                #{p.jersey}
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: 2 }}>{p.name.split(' ')[0]}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: rc, textShadow: `0 0 20px ${rc}88`, letterSpacing: '-0.03em' }}>{p.impact}</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em', marginTop: 2 }}>{p.role.toUpperCase()}</div>
            </motion.div>
          )
        })}
      </div>

      {/* Full rankings list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sorted.map((p, i) => {
          const rc = ROLE_COLOR[p.role] || '#c8ff00'
          return (
            <motion.div key={p.id} className="card"
              style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12 }}
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.35 }}
              whileHover={{ x: 4 }}>
              {/* Rank */}
              <div style={{ fontSize: i < 3 ? 16 : 13, width: 26, textAlign: 'center', fontWeight: 900, color: i < 3 ? ['#FFD700','#C0C0C0','#CD7F32'][i] : 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
                {i < 3 ? RANK_EMOJI[i] : `#${i + 1}`}
              </div>
              {/* Jersey */}
              <div style={{ width: 40, height: 40, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, flexShrink: 0, background: `${rc}15`, color: rc, border: `1px solid ${rc}25` }}>
                {p.jersey}
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{p.name}</span>
                  {i === 0 && <Star size={11} fill="#c8ff00" style={{ color: '#c8ff00' }} />}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="badge" style={{ background: `${rc}12`, color: rc, border: `1px solid ${rc}25`, fontSize: 10, padding: '2px 8px' }}>{p.role}</span>
                  <span className="xs muted">{p.m}M · {p.r}R · {p.w}W</span>
                </div>
                <div className="prog-track" style={{ marginTop: 7, height: 3 }}>
                  <motion.div className="prog-fill"
                    style={{ background: `linear-gradient(90deg, ${rc}, ${rc}66)`, boxShadow: `0 0 6px ${rc}55` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${p.impact}%` }}
                    transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 + i * 0.04 }}
                  />
                </div>
              </div>
              {/* Score */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div className="xs muted" style={{ marginBottom: 1 }}>Impact</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: rc, letterSpacing: '-0.03em', textShadow: `0 0 16px ${rc}66` }}>{p.impact}</div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </PageShell>
  )
}
