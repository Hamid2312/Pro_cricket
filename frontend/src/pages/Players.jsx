import { useEffect } from 'react'
import { motion } from 'framer-motion'
import PageShell from '../components/ui/PageShell'
import useAppStore from '../store/useAppStore'
import { api } from '../lib/api'
import { Star } from 'lucide-react'

const ROLE_COLOR = {
  'All-Rounder': '#ffb300',
  Batsman: '#c8ff00',
  Bowler: '#00c8ff',
  WK: '#cf94da',
}

export default function Players() {
  const { players, setInitialData } = useAppStore()

  useEffect(() => {
    if (!players.length) {
      api.getPlayers().then((data) => setInitialData({ players: data })).catch(() => {})
    }
  }, [players.length, setInitialData])

  const sortedPlayers = [...players]
    .map((player) => ({ ...player, impact: player.impact_rating ?? 0 }))
    .sort((a, b) => b.impact - a.impact)

  return (
    <PageShell>
      <div style={{ paddingTop: 40, marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(200,255,0,0.7)', marginBottom: 6 }}>Squad</div>
        <div className="heading grad-text">Impact Rankings</div>
        <div className="small muted" style={{ marginTop: 4 }}>{players.length || 0} players · Season 2025</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.12fr 1fr', gap: 8, marginBottom: 20, alignItems: 'flex-end' }}>
        {sortedPlayers.slice(0, 3).map((player, index) => {
          const rc = ROLE_COLOR[player.role] || '#c8ff00'
          const heights = ['160px', '190px', '148px']
          return (
            <motion.div key={player.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1, duration: 0.45 }} className="card" style={{ padding: '16px 12px', textAlign: 'center', height: heights[index], display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: index === 1 ? 'rgba(200,255,0,0.05)' : 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{['🥇', '🥈', '🥉'][index]}</div>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: `${rc}18`, border: `1px solid ${rc}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontWeight: 900, fontSize: 13, color: rc }}>
                #{player.jersey_number}
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: 2 }}>{player.name.split(' ')[0]}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: rc, textShadow: `0 0 20px ${rc}88`, letterSpacing: '-0.03em' }}>{player.impact}</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em', marginTop: 2 }}>{(player.role || 'Player').toUpperCase()}</div>
            </motion.div>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sortedPlayers.map((player, i) => {
          const rc = ROLE_COLOR[player.role] || '#c8ff00'
          return (
            <motion.div key={player.id} className="card" style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12 }} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04, duration: 0.35 }} whileHover={{ x: 4 }}>
              <div style={{ fontSize: i < 3 ? 16 : 13, width: 26, textAlign: 'center', fontWeight: 900, color: i < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][i] : 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
                {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, flexShrink: 0, background: `${rc}15`, color: rc, border: `1px solid ${rc}25` }}>
                {player.jersey_number}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{player.name}</span>
                  {i === 0 && <Star size={11} fill="#c8ff00" style={{ color: '#c8ff00' }} />}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="badge" style={{ background: `${rc}12`, color: rc, border: `1px solid ${rc}25`, fontSize: 10, padding: '2px 8px' }}>{player.role ?? 'Unknown'}</span>
                  <span className="xs muted">{player.match_stats?.length ?? 0}M · {player.impact.toFixed(0)} impact</span>
                </div>
                <div className="prog-track" style={{ marginTop: 7, height: 3 }}>
                  <motion.div className="prog-fill" style={{ background: `linear-gradient(90deg, ${rc}, ${rc}66)`, boxShadow: `0 0 6px ${rc}55` }} initial={{ width: 0 }} animate={{ width: `${Math.min(100, player.impact)}%` }} transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 + i * 0.04 }} />
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div className="xs muted" style={{ marginBottom: 1 }}>Impact</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: rc, letterSpacing: '-0.03em', textShadow: `0 0 16px ${rc}66` }}>{player.impact}</div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </PageShell>
  )
}
