import { useState, useEffect, useMemo } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import PageShell from '../components/ui/PageShell'
import useAppStore from '../store/useAppStore'
import { useWebSocket } from '../hooks/useWebSocket'
import { api } from '../lib/api'
import { motion } from 'framer-motion'
import { ChevronLeft, Shield, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

function toXiPlayer(p) {
  return {
    id: p.id,
    name: p.name,
    jersey: p.jersey_number ?? p.jersey,
    role: p.role,
  }
}

function SortableItem({ id, player, index }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    background: isDragging ? 'rgba(200,255,0,0.1)' : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`card ${isDragging ? 'glow-border' : ''}`}>
      <div style={{ fontSize: 13, fontWeight: 900, color: 'rgba(255,255,255,0.4)', width: 20 }}>{index + 1}</div>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12, color: '#c8ff00' }}>#{player.jersey}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{player.name}</div>
        <div className="xs muted">{player.role || 'Player'}</div>
      </div>
    </div>
  )
}

export default function LiveXI() {
  const { activeMatch, players } = useAppStore()
  const matchId = activeMatch?.id
  const { connectionState } = useWebSocket(matchId ? `match-${matchId}` : 'global')

  const available = useMemo(() => {
    const rsvpMap = (activeMatch?.rsvps || []).reduce((acc, r) => {
      acc[r.player_id] = r.status
      return acc
    }, {})
    return players
      .filter((p) => rsvpMap[p.id] === 'in')
      .map(toXiPlayer)
  }, [players, activeMatch?.rsvps])

  const initialSquad = useMemo(() => {
    if (activeMatch?.squad_list?.length) {
      return activeMatch.squad_list.map((p) => ({
        id: p.id,
        name: p.name,
        jersey: p.jersey ?? p.jersey_number,
        role: p.role,
      }))
    }
    return available
  }, [activeMatch?.squad_list, available])

  const [squad, setSquad] = useState(initialSquad)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSquad(initialSquad)
  }, [initialSquad])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setSquad((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id)
      const newIndex = items.findIndex((i) => i.id === over.id)
      return arrayMove(items, oldIndex, newIndex)
    })
    setSaved(false)
  }

  const confirmXI = async () => {
    if (!matchId) return
    setSaving(true)
    try {
      await api.setPlayingXI(matchId, squad)
      setSaved(true)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (!matchId) {
    return (
      <PageShell>
        <div className="card" style={{ marginTop: 80, padding: 24, textAlign: 'center' }}>
          <p className="small muted">No upcoming match loaded. Open Matches first.</p>
          <Link to="/matches" className="btn btn-primary" style={{ marginTop: 16 }}>Go to Matches</Link>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div style={{ paddingTop: 20, paddingBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link to="/matches" className="btn" style={{ padding: 8, borderRadius: 10, background: 'rgba(255,255,255,0.05)' }}>
          <ChevronLeft size={20} />
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c8ff00' }}>Live XI Builder</div>
          <div style={{ fontSize: 18, fontWeight: 900 }}>vs {activeMatch?.opponent}</div>
        </div>
        <motion.div className="badge" style={{ background: connectionState === 'connected' ? 'rgba(0,230,118,0.1)' : 'rgba(255,82,82,0.1)', color: connectionState === 'connected' ? '#00e676' : '#ff5252' }}>
          {connectionState === 'connected' ? 'Live' : 'Offline'}
        </motion.div>
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 20, background: 'rgba(200,255,0,0.03)', border: '1px solid rgba(200,255,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Shield size={24} style={{ color: '#c8ff00' }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Drag to set batting order</div>
            <div className="xs muted">Squad sees updates in real time after you confirm.</div>
          </div>
        </div>
      </div>

      {squad.length === 0 ? (
        <div className="card" style={{ padding: 20, textAlign: 'center' }}>
          <span className="small muted">No players marked &quot;In&quot; yet. RSVP on the Matches page first.</span>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={squad.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {squad.map((player, idx) => (
              <SortableItem key={player.id} id={player.id} player={player} index={idx} />
            ))}
          </SortableContext>
        </DndContext>
      )}

      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <button type="button" className="btn btn-primary" style={{ padding: '14px 24px', borderRadius: 14, width: '100%', fontSize: 14 }} onClick={confirmXI} disabled={saving || squad.length === 0}>
          <Zap size={16} /> {saving ? 'Saving…' : saved ? 'XI saved ✓' : 'Confirm Playing XI'}
        </button>
      </div>
      <div style={{ height: 40 }} />
    </PageShell>
  )
}
