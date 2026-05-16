import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, Wallet, CalendarDays, BrainCircuit, Package, Users, User } from 'lucide-react'

const NAV = [
  { to: '/',          Icon: LayoutDashboard, label: 'Home'    },
  { to: '/matches',   Icon: CalendarDays,    label: 'Matches' },
  { to: '/finance',   Icon: Wallet,          label: 'Khata'   },
  { to: '/scorer',    Icon: BrainCircuit,    label: 'AI Score'},
  { to: '/inventory', Icon: Package,         label: 'Kit'     },
  { to: '/players',   Icon: Users,           label: 'Squad'   },
  { to: '/profile',   Icon: User,            label: 'Profile' },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav md:hidden">
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '0 4px' }}>
        {NAV.map(({ to, Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}>
            {({ isActive }) => (
              <motion.div
                whileTap={{ scale: 0.82 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 10px', borderRadius: 14, cursor: 'pointer', position: 'relative', minWidth: 48 }}
              >
                {/* Active BG pill */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-bg"
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      style={{
                        position: 'absolute', top: 2, left: 4, right: 4, bottom: 12,
                        borderRadius: 12,
                        background: 'rgba(200,255,0,0.1)',
                        border: '1px solid rgba(200,255,0,0.18)',
                        boxShadow: '0 0 20px rgba(200,255,0,0.15)',
                      }}
                    />
                  )}
                </AnimatePresence>

                <motion.div
                  animate={{ color: isActive ? '#c8ff00' : 'rgba(255,255,255,0.3)' }}
                  style={{
                    filter: isActive ? 'drop-shadow(0 0 8px rgba(200,255,0,0.8))' : 'none',
                    position: 'relative', zIndex: 1, transition: 'filter 0.2s',
                  }}
                >
                  <Icon size={19} strokeWidth={isActive ? 2.2 : 1.5} />
                </motion.div>
                <motion.span
                  animate={{ color: isActive ? '#c8ff00' : 'rgba(255,255,255,0.28)' }}
                  style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', position: 'relative', zIndex: 1 }}
                >
                  {label}
                </motion.span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
