import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import BottomNav from './components/BottomNav'
import Dashboard from './pages/Dashboard'
import Finance from './pages/Finance'
import Matches from './pages/Matches'
import Scorer from './pages/Scorer'
import Inventory from './pages/Inventory'
import Players from './pages/Players'
import LiveXI from './pages/LiveXI'
import Login from './pages/Login'
import Signup from './pages/Signup'
import JoinRequest from './pages/JoinRequest'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Profile from './pages/Profile'
import { useRealtimeSubscription } from './hooks/useRealtimeSubscription'
import { useWebSocket } from './hooks/useWebSocket'
import { useBootstrapData } from './hooks/useBootstrapData'
import { useAuth } from './lib/AuthContext'

export default function App() {
  const { session, teamMe, loadingTeam } = useAuth()
  const isLoggedIn = Boolean(session?.access_token)
  useWebSocket('global', isLoggedIn)

  useRealtimeSubscription(session)

  const isActive = teamMe?.can_use_app
  useBootstrapData(Boolean(session && isActive))

  if (session === undefined || (isLoggedIn && loadingTeam && teamMe === null)) {
    return (
      <div className="wrap" style={{ minHeight: '100vh', paddingTop: 80 }}>
        <div className="card" style={{ maxWidth: 440, margin: '0 auto', padding: 24, textAlign: 'center' }}>
          Loading your account…
        </div>
      </div>
    )
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes>
          <Route
            path="/login"
            element={
              session ? <Navigate to={isActive ? '/' : '/join-request'} replace /> : <Login />
            }
          />
          <Route
            path="/signup"
            element={
              session ? <Navigate to={isActive ? '/' : '/join-request'} replace /> : <Signup />
            }
          />
          <Route
            path="/forgot-password"
            element={
              session ? <Navigate to="/" replace /> : <ForgotPassword />
            }
          />
          <Route
            path="/reset-password"
            element={
              <ResetPassword />
            }
          />
          <Route
            path="/profile"
            element={
              session ? <Profile /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/join-request"
            element={
              session ? <JoinRequest /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/"
            element={
              session ? (isActive ? <Dashboard /> : <Navigate to="/join-request" replace />) : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/finance"
            element={
              session ? (isActive ? <Finance /> : <Navigate to="/join-request" replace />) : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/matches"
            element={
              session ? (isActive ? <Matches /> : <Navigate to="/join-request" replace />) : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/scorer"
            element={
              session ? (isActive ? <Scorer /> : <Navigate to="/join-request" replace />) : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/inventory"
            element={
              session ? (isActive ? <Inventory /> : <Navigate to="/join-request" replace />) : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/players"
            element={
              session ? (isActive ? <Players /> : <Navigate to="/join-request" replace />) : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/live-xi"
            element={
              session ? (isActive ? <LiveXI /> : <Navigate to="/join-request" replace />) : <Navigate to="/login" replace />
            }
          />
          <Route
            path="*"
            element={
              session
                ? (isActive ? <Navigate to="/" replace /> : <Navigate to="/join-request" replace />)
                : <Navigate to="/login" replace />
            }
          />
        </Routes>
      </AnimatePresence>
      {isActive && <BottomNav />}
    </>
  )
}
