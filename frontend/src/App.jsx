import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import BottomNav from './components/BottomNav'
import Dashboard from './pages/Dashboard'
import Finance from './pages/Finance'
import Matches from './pages/Matches'
import Scorer from './pages/Scorer'
import Inventory from './pages/Inventory'
import Players from './pages/Players'
import LiveXI from './pages/LiveXI'
import { useRealtimeSubscription } from './hooks/useRealtimeSubscription'
import { useWebSocket } from './hooks/useWebSocket'

export default function App() {
  // Initialize Realtime CDC and Global WebSocket connection
  useRealtimeSubscription()
  const { connectionState } = useWebSocket('global')
  
  return (
    <>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/"          element={<Dashboard />} />
          <Route path="/finance"   element={<Finance />} />
          <Route path="/matches"   element={<Matches />} />
          <Route path="/scorer"    element={<Scorer />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/players"   element={<Players />} />
          <Route path="/live-xi"   element={<LiveXI />} />
        </Routes>
      </AnimatePresence>
      <BottomNav />
    </>
  )
}
