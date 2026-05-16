import { useState } from 'react'
import PageShell from '../components/ui/PageShell'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Clock, XCircle, Upload, Plus } from 'lucide-react'
import useAppStore from '../store/useAppStore'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'
import { ledgerToDisplay, finesFromLedger } from '../lib/ledgerUtils'

const STAGGER = { animate: { transition: { staggerChildren: 0.06 } } }
const ITEM = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

export default function Finance() {
  const [filter, setFilter] = useState('All')
  const [approvingId, setApprovingId] = useState(null)
  const [error, setError] = useState('')
  const { ledger, team_treasury } = useAppStore()
  const { teamMe } = useAuth()

  const isOfficer = teamMe?.is_captain || teamMe?.player?.is_admin
  const monthlyDues = ledger.filter((row) => row.category === 'Monthly')
  const activeLedger = monthlyDues.map(ledgerToDisplay)
  const fines = finesFromLedger(ledger)

  const paid = activeLedger.filter((r) => r.status === 'Paid').length
  const pending = activeLedger.filter((r) => r.status === 'Pending').length
  const balance = team_treasury?.total_balance ?? 0

  const filtered =
    filter === 'All'
      ? activeLedger
      : filter === 'Paid'
        ? activeLedger.filter((r) => r.status === 'Paid')
        : activeLedger.filter((r) => r.status === 'Pending')

  const handleApprove = async (id) => {
    if (!isOfficer) return
    setError('')
    setApprovingId(id)
    try {
      await api.approvePayment(id)
    } catch (err) {
      setError(err.message || 'Could not approve payment')
    } finally {
      setApprovingId(null)
    }
  }

  return (
    <PageShell>
      <div style={{ paddingTop: 40, paddingBottom: 8, marginBottom: 20 }}>
        <motion.div variants={STAGGER} initial="initial" animate="animate">
          <motion.div variants={ITEM}>
            <motion.div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(200,255,0,0.7)', marginBottom: 6 }}>Module A</div>
                <div className="heading grad-text">Team Khata</div>
                <motion.div className="small muted" style={{ marginTop: 4 }}>Monthly dues · Expenses · Jurmana</motion.div>
              </div>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 20 }}>
              {[
                { label: 'Treasury', value: `₨${balance.toLocaleString()}`, color: '#c8ff00' },
                { label: 'Paid', value: paid, color: '#00e676' },
                { label: 'Pending', value: pending, color: '#ffb300' },
              ].map(({ label, value, color }) => (
                <div className="stat-box" key={label} style={{ padding: '14px 12px' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color, textShadow: `0 0 20px ${color}55`, letterSpacing: '-0.03em' }}>{value}</div>
                  <div className="xs muted" style={{ marginTop: 3, letterSpacing: '0.06em' }}>{label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {['All', 'Paid', 'Pending'].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className="btn"
            style={{
              padding: '8px 18px',
              fontSize: 12,
              borderRadius: 999,
              flexShrink: 0,
              background: filter === f ? '#c8ff00' : 'rgba(255,255,255,0.05)',
              color: filter === f ? '#080808' : 'rgba(255,255,255,0.4)',
              border: filter === f ? 'none' : '1px solid rgba(255,255,255,0.08)',
              boxShadow: filter === f ? '0 0 20px rgba(200,255,0,0.3)' : 'none',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}

      <motion.div variants={STAGGER} initial="initial" animate="animate" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div variants={ITEM} className="card" style={{ padding: 18, textAlign: 'center' }}>
              <span className="small muted">No monthly dues yet. Treasury updates live when payments are approved.</span>
            </motion.div>
          ) : (
            filtered.map((r) => (
              <motion.div
                key={r.id}
                variants={ITEM}
                layout
                className="card"
                style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <motion.div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: 13,
                      flexShrink: 0,
                      background: r.status === 'Paid' ? 'rgba(0,230,118,0.1)' : 'rgba(255,179,0,0.08)',
                      color: r.status === 'Paid' ? '#00e676' : '#ffb300',
                      border: `1px solid ${r.status === 'Paid' ? 'rgba(0,230,118,0.2)' : 'rgba(255,179,0,0.18)'}`,
                    }}
                  >
                    #{r.jersey}
                  </motion.div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{r.name}</div>
                    <div className="xs muted">{r.month} · {r.method}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 15, fontWeight: 900, color: '#c8ff00' }}>₨{r.amount}</span>
                  {r.status === 'Paid' ? (
                    <span className="badge badge-green">
                      <CheckCircle2 size={10} />
                      Paid
                    </span>
                  ) : isOfficer ? (
                    <button
                      type="button"
                      onClick={() => handleApprove(r.id)}
                      disabled={approvingId === r.id}
                      className="badge badge-yellow"
                      style={{ cursor: 'pointer', border: '1px solid rgba(255,179,0,0.4)' }}
                    >
                      <Clock size={10} />
                      {approvingId === r.id ? '…' : 'Approve'}
                    </button>
                  ) : (
                    <span className="badge badge-yellow">
                      <Clock size={10} />
                      Pending
                    </span>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

      <div className="card" style={{ padding: '16px 18px', marginBottom: 24, borderStyle: 'dashed' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Upload size={20} style={{ color: '#c8ff00' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Upload Payment Proof</div>
            <motion.div className="xs muted" style={{ marginTop: 2 }}>Easypaisa / JazzCash — coming soon</motion.div>
          </div>
          <button type="button" className="btn btn-primary" style={{ padding: '9px 16px', fontSize: 12, borderRadius: 10, flexShrink: 0 }} disabled>
            Upload
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="sec-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          ⚡ Jurmana (Fines)
        </div>
        {isOfficer && (
          <button type="button" className="btn btn-glass" style={{ padding: '7px 14px', fontSize: 12, borderRadius: 10 }} disabled>
            <Plus size={12} /> Add Fine
          </button>
        )}
      </div>

      <motion.div variants={STAGGER} initial="initial" animate="animate" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {fines.length === 0 ? (
          <div className="card" style={{ padding: 18 }}>
            <span className="small muted">No fines on record.</span>
          </div>
        ) : (
          fines.map((f) => (
            <motion.div
              key={f.id}
              variants={ITEM}
              className="card"
              style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{f.name}</div>
                <div className="xs muted">{f.reason}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 15, fontWeight: 900, color: f.paid ? '#00e676' : '#ff5252' }}>₨{f.amount}</span>
                {f.paid ? (
                  <span className="badge badge-green">
                    <CheckCircle2 size={10} />
                    Paid
                  </span>
                ) : (
                  <span className="badge badge-red">
                    <XCircle size={10} />
                    Unpaid
                  </span>
                )}
              </div>
            </motion.div>
          ))
        )}
      </motion.div>
    </PageShell>
  )
}
