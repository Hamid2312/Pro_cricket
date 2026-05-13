import { useState, useRef } from 'react'
import PageShell from '../components/ui/PageShell'
import { BrainCircuit, Upload, FileText, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const MOCK_EXTRACTED = [
  { player_id: '1', player_name: 'Ali Haider',  runs: 42, balls: 31, wickets: 0, overs: 0 },
  { player_id: '2', player_name: 'Hafiz Usman', runs: 28, balls: 22, wickets: 0, overs: 0 },
  { player_id: '3', player_name: 'Bilal Ahmed', runs: 4,  balls: 6,  wickets: 3, overs: 4.0 },
  { player_id: null, player_name: 'Unkown Player', runs: 10, balls: 8, wickets: 1, overs: 2.0 },
]

export default function Scorer() {
  const [phase, setPhase] = useState('idle') // idle | processing | review | done
  const [file, setFile] = useState(null)
  const [stats, setStats] = useState([])
  const fileRef = useRef()

  const handleFile = (f) => {
    setFile(f)
    setPhase('processing')
    // Simulate AI extraction
    setTimeout(() => {
      setStats(MOCK_EXTRACTED)
      setPhase('review')
    }, 2800)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleConfirm = () => {
    setPhase('done')
  }

  return (
    <PageShell>
      <div className="flex items-center gap-3 mb-7">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(204,255,0,0.1)', border: '1px solid var(--color-border)' }}>
          <BrainCircuit size={20} style={{ color: 'var(--color-neon)' }} />
        </div>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--color-white)' }}>
            AI Scorer
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>PDF → JSON stats via Gemini</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {phase === 'idle' && (
          <motion.div key="idle"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div
              className="rounded-2xl p-10 flex flex-col items-center gap-4 cursor-pointer"
              style={{ border: '2px dashed rgba(204,255,0,0.3)', background: 'rgba(204,255,0,0.03)' }}
              onClick={() => fileRef.current.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(204,255,0,0.1)', boxShadow: '0 0 30px rgba(204,255,0,0.15)' }}>
                <Upload size={28} style={{ color: 'var(--color-neon)' }} />
              </div>
              <div className="text-center">
                <div className="font-bold text-[16px]" style={{ color: 'var(--color-white)' }}>
                  Drop scorecard PDF here
                </div>
                <div className="text-[13px] mt-1" style={{ color: 'var(--color-muted)' }}>
                  or click to browse · PDF only
                </div>
              </div>
              <input ref={fileRef} type="file" accept=".pdf" className="hidden"
                onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
            </div>
            <div className="glass-card p-4 mt-5">
              <div className="text-[12px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-muted)' }}>
                How it works
              </div>
              <div className="space-y-2.5">
                {['Upload cricket scorecard PDF', 'Gemini AI extracts player stats', 'Admin reviews & confirms', 'Stats auto-update lifetime records'].map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black"
                      style={{ background: 'rgba(204,255,0,0.12)', color: 'var(--color-neon)' }}>
                      {i + 1}
                    </div>
                    <span className="text-[13px]" style={{ color: 'var(--color-white)', opacity: 0.8 }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {phase === 'processing' && (
          <motion.div key="processing"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 py-16">
            <div className="relative">
              <div className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(204,255,0,0.08)', border: '1px solid var(--color-border)' }}>
                <BrainCircuit size={36} style={{ color: 'var(--color-neon)' }} />
              </div>
              <motion.div className="absolute inset-0 rounded-full"
                style={{ border: '2px solid rgba(204,255,0,0.4)' }}
                animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0, 0.8] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              />
            </div>
            <div className="text-center">
              <div className="font-black text-[18px]" style={{ color: 'var(--color-white)' }}>
                AI Brain Processing...
              </div>
              <div className="text-[13px] mt-1" style={{ color: 'var(--color-muted)' }}>
                Extracting stats from {file?.name}
              </div>
            </div>
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <motion.div key={i} className="w-2 h-2 rounded-full"
                  style={{ background: 'var(--color-neon)' }}
                  animate={{ y: [-4, 0, -4] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {phase === 'review' && (
          <motion.div key="review"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="flex items-center gap-2 mb-4">
              <FileText size={16} style={{ color: 'var(--color-neon)' }} />
              <span className="font-bold text-[15px]" style={{ color: 'var(--color-white)' }}>
                Review Extracted Stats
              </span>
            </div>
            <div className="space-y-3 mb-5">
              {stats.map((s, i) => (
                <motion.div key={i} className="glass-card p-4"
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-[14px]" style={{ color: 'var(--color-white)' }}>
                      {s.player_name}
                    </div>
                    {!s.player_id && (
                      <span className="badge badge-danger">
                        <AlertTriangle size={10} /> Unmatched
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Runs',    value: s.runs },
                      { label: 'Balls',   value: s.balls },
                      { label: 'Wkts',    value: s.wickets },
                      { label: 'Overs',   value: s.overs },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center p-2 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div className="text-[16px] font-black stat-glow">{value}</div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider"
                          style={{ color: 'var(--color-muted)' }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
            <button className="btn-neon w-full justify-center py-3.5 text-[15px] font-black"
              onClick={handleConfirm}>
              <CheckCircle2 size={16} /> Confirm & Update Lifetime Stats
            </button>
          </motion.div>
        )}

        {phase === 'done' && (
          <motion.div key="done"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 py-16 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,230,118,0.12)', border: '1px solid rgba(0,230,118,0.3)' }}>
              <CheckCircle2 size={36} style={{ color: 'var(--color-success)' }} />
            </div>
            <div>
              <div className="font-black text-[20px]" style={{ color: 'var(--color-white)' }}>
                Stats Committed!
              </div>
              <div className="text-[13px] mt-1" style={{ color: 'var(--color-muted)' }}>
                Lifetime records & impact ratings updated.
              </div>
            </div>
            <button className="btn-ghost" onClick={() => setPhase('idle')}>
              Upload Another Scorecard
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  )
}
