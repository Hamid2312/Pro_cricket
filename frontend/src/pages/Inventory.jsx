import { useState } from 'react'
import PageShell from '../components/ui/PageShell'
import { Package, Shield, Minus, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import useAppStore from '../store/useAppStore'
import { api } from '../lib/api'

export default function Inventory() {
  const { inventory, players } = useAppStore()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const inv = {
    fresh_balls: inventory?.fresh_balls ?? 0,
    tape_rolls: inventory?.tape_rolls ?? 0,
    kit_holder_name: inventory?.kit_holder_name ?? 'Unassigned',
  }

  const patch = async (payload) => {
    setError('')
    setSaving(true)
    try {
      await api.updateInventory(payload)
    } catch (err) {
      setError(err.message || 'Could not update inventory')
    } finally {
      setSaving(false)
    }
  }

  const adjust = (key, delta) => {
    const next = Math.max(0, inv[key] + delta)
    patch({ [key]: next })
  }

  return (
    <PageShell>
      <div className="flex items-center gap-3 mb-7" style={{ paddingTop: 32 }}>
        <motion.div
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(204,255,0,0.1)', border: '1px solid rgba(200,255,0,0.2)' }}
        >
          <Package size={20} style={{ color: '#c8ff00' }} />
        </motion.div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em', color: '#fff' }}>Kit Inventory</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Live stock · Updates for everyone instantly</p>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="space-y-4">
        {[
          { key: 'fresh_balls', label: 'Fresh Balls', icon: '🏏', color: '#c8ff00', max: 12 },
          { key: 'tape_rolls', label: 'Tape Rolls', icon: '📦', color: '#00e5ff', max: 10 },
        ].map(({ key, label, icon, color, max }) => (
          <motion.div key={key} className="card" style={{ padding: 20 }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 28 }}>{icon}</div>
                <motion.div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>{label}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Max stock: {max}</div>
                </motion.div>
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, color, textShadow: `0 0 20px ${color}66` }}>{inv[key]}</div>
            </div>

            <div style={{ height: 8, borderRadius: 999, overflow: 'hidden', marginBottom: 16, background: 'rgba(255,255,255,0.07)' }}>
              <motion.div
                style={{ height: '100%', borderRadius: 999, background: color, boxShadow: `0 0 8px ${color}55` }}
                animate={{ width: `${Math.min(100, (inv[key] / max) * 100)}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => adjust(key, -1)} disabled={saving || inv[key] <= 0}>
                <Minus size={14} /> Use One
              </button>
              <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={() => adjust(key, 1)} disabled={saving}>
                <Plus size={14} /> Restock
              </button>
            </div>
          </motion.div>
        ))}

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Shield size={20} style={{ color: '#c8ff00' }} />
            <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>Kit Bag Holder</div>
          </div>
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(200,255,0,0.06)',
              border: '1px solid rgba(200,255,0,0.15)',
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 18, color: '#c8ff00' }}>{inv.kit_holder_name}</div>
            {players.length > 0 && (
              <select
                className="btn btn-glass"
                style={{ fontSize: 12, padding: '8px 12px' }}
                value={inventory?.kit_holder_id || ''}
                onChange={(e) => patch({ kit_holder_id: e.target.value || null })}
                disabled={saving}
              >
                <option value="">Transfer to…</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  )
}
