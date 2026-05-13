import { useState, useEffect } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import PageShell from '../components/ui/PageShell'
import useAppStore from '../store/useAppStore'
import { useWebSocket } from '../hooks/useWebSocket'
import { ChevronLeft, Users, Shield, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

function SortableItem({ id, player, index }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 1 }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`card ${isDragging ? 'glow-border' : ''}`} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, background: isDragging ? 'rgba(200,255,0,0.1)' : '', ...style }}>
      <div style={{ fontSize: 13, fontWeight: 900, color: 'rgba(255,255,255,0.4)', width: 20 }}>{index + 1}</div>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12, color: '#c8ff00' }}>#{player.jersey}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{player.name}</div>
        <div className="xs muted">{player.role || 'Player'}</div>
      </div>
      <div style={{ cursor: 'grab', padding: '4px' }}>
        <div style={{ width: 16, height: 2, background: 'rgba(255,255,255,0.2)', marginBottom: 3 }} />
        <div style={{ width: 16, height: 2, background: 'rgba(255,255,255,0.2)', marginBottom: 3 }} />
        <div style={{ width: 16, height: 2, background: 'rgba(255,255,255,0.2)' }} />
      </div>
    </div>
  )
}

export default function LiveXI() {
  const { activeMatch } = useAppStore()
  // Mock match ID for demo
  const matchId = activeMatch?.id || 'demo-match'
  const { connectionState, sendMessage } = useWebSocket(`match-${matchId}`)

  // For demo, load dummy squad if store is empty
  const [squad, setSquad] = useState(
    activeMatch?.squad_list || [
      { id: '1', name: 'Ali Haider', jersey: 7, role: 'All-Rounder' },
      { id: '2', name: 'Hafiz Usman', jersey: 11, role: 'Batsman' },
      { id: '3', name: 'Bilal Ahmed', jersey: 3, role: 'Bowler' },
      { id: '4', name: 'Tariq Bhai', jersey: 2, role: 'Bowler' },
      { id: '5', name: 'Zain Abbas', jersey: 4, role: 'Batsman' },
    ]
  )

  useEffect(() => {
    if (activeMatch?.squad_list) {
      setSquad(activeMatch.squad_list)
    }
  }, [activeMatch?.squad_list])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (active.id !== over.id) {
      setSquad((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id)
        const newIndex = items.findIndex(i => i.id === over.id)
        const newSquad = arrayMove(items, oldIndex, newIndex)
        
        // Broadcast the new XI list
        sendMessage('XI_UPDATED', { id: matchId, squad_list: newSquad })
        return newSquad
      })
    }
  }

  return (
    <PageShell>
      <div style={{ paddingTop: 20, paddingBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link to="/matches" className="btn" style={{ padding: 8, borderRadius: 10, background: 'rgba(255,255,255,0.05)' }}>
          <ChevronLeft size={20} />
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c8ff00' }}>Live XI Builder</div>
          <div style={{ fontSize: 18, fontWeight: 900 }}>Drag to Order</div>
        </div>
        <div className="badge" style={{ background: connectionState === 'connected' ? 'rgba(0,230,118,0.1)' : 'rgba(255,82,82,0.1)', color: connectionState === 'connected' ? '#00e676' : '#ff5252' }}>
          {connectionState === 'connected' ? 'Live' : 'Offline'}
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 20, background: 'rgba(200,255,0,0.03)', border: '1px solid rgba(200,255,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Shield size={24} style={{ color: '#c8ff00' }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Captain's View</div>
            <div className="xs muted">Changes here are broadcasted in real-time to the squad.</div>
          </div>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={squad.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {squad.map((player, idx) => (
            <SortableItem key={player.id} id={player.id} player={player} index={idx} />
          ))}
        </SortableContext>
      </DndContext>
      
      <div style={{ marginTop: 20, textAlign: 'center' }}>
         <button className="btn btn-primary" style={{ padding: '14px 24px', borderRadius: 14, width: '100%', fontSize: 14 }}>
            <Zap size={16} /> Confirm Playing XI
         </button>
      </div>
      <div style={{ height: 40 }} />
    </PageShell>
  )
}
