import PageShell from '../components/ui/PageShell'
import { Package, Shield, Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'

export default function Inventory() {
  const [inv, setInv] = useState({ fresh_balls: 3, tape_rolls: 2, kit_holder: 'Hafiz Usman' })

  const adjust = (key, delta) =>
    setInv(prev => ({ ...prev, [key]: Math.max(0, prev[key] + delta) }))

  return (
    <PageShell>
      <div className="flex items-center gap-3 mb-7">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(204,255,0,0.1)', border: '1px solid var(--color-border)' }}>
          <Package size={20} style={{ color: 'var(--color-neon)' }} />
        </div>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--color-white)' }}>
            Kit Inventory
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>Balls · Tape · Kit holder</p>
        </div>
      </div>

      <div className="space-y-4">
        {[
          { key: 'fresh_balls', label: 'Fresh Balls', icon: '🏏', color: 'var(--color-neon)',  max: 6 },
          { key: 'tape_rolls',  label: 'Tape Rolls',  icon: '📦', color: '#00e5ff',            max: 5 },
        ].map(({ key, label, icon, color, max }) => (
          <motion.div key={key} className="glass-card p-5"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{icon}</div>
                <div>
                  <div className="font-bold text-[15px]" style={{ color: 'var(--color-white)' }}>{label}</div>
                  <div className="text-[11px]" style={{ color: 'var(--color-muted)' }}>Max stock: {max}</div>
                </div>
              </div>
              <div className="text-[36px] font-black" style={{ color, textShadow: `0 0 20px ${color}66` }}>
                {inv[key]}
              </div>
            </div>

            {/* Progress */}
            <div className="h-2 rounded-full overflow-hidden mb-4" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <motion.div className="h-full rounded-full"
                style={{ background: color, boxShadow: `0 0 8px ${color}55` }}
                animate={{ width: `${(inv[key] / max) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>

            <div className="flex gap-3">
              <button className="btn-ghost flex-1 justify-center py-2.5" onClick={() => adjust(key, -1)}>
                <Minus size={14} /> Use One
              </button>
              <button className="btn-neon flex-1 justify-center py-2.5" onClick={() => adjust(key, 1)}>
                <Plus size={14} /> Restock
              </button>
            </div>
          </motion.div>
        ))}

        {/* Kit holder */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <Shield size={20} style={{ color: 'var(--color-neon)' }} />
            <div className="font-bold text-[15px]" style={{ color: 'var(--color-white)' }}>Kit Bag Holder</div>
          </div>
          <div className="p-4 rounded-xl flex items-center justify-between"
            style={{ background: 'rgba(204,255,0,0.06)', border: '1px solid var(--color-border)' }}>
            <div className="font-black text-[18px]" style={{ color: 'var(--color-neon)' }}>
              {inv.kit_holder}
            </div>
            <button className="btn-ghost text-[12px] py-1.5 px-3">Transfer</button>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
