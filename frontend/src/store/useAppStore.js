import { create } from 'zustand'

const useAppStore = create((set, get) => ({
  // State
  team_treasury: { total_balance: 0 },
  inventory: { fresh_balls: 0, tape_rolls: 0, kit_holder_id: null },
  players: [],
  ledger: [],
  matches: [],
  join_requests: [],
  stats: [],
  activeMatch: null,

  // Setup Initial State (can be populated via regular API calls)
  setInitialData: (data) => set((state) => ({ ...state, ...data })),

  // Handle Supabase Realtime CDC Events
  applyDbEvent: (table, payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    set((state) => {
      if (table === 'team_treasury') {
        return { team_treasury: { ...state.team_treasury, ...newRecord } }
      }

      if (table === 'inventory') {
        return { inventory: { ...state.inventory, ...newRecord } }
      }

      if (table === 'ledger') {
        if (eventType === 'INSERT') {
          return { ledger: [newRecord, ...state.ledger] }
        }
        if (eventType === 'UPDATE') {
          return { ledger: state.ledger.map(item => item.id === newRecord.id ? newRecord : item) }
        }
        if (eventType === 'DELETE') {
          return { ledger: state.ledger.filter(item => item.id !== oldRecord.id) }
        }
      }

      if (table === 'players') {
        if (eventType === 'INSERT') {
          return { players: [...state.players, newRecord] }
        }
        if (eventType === 'UPDATE') {
          return { players: state.players.map(p => p.id === newRecord.id ? newRecord : p) }
        }
        if (eventType === 'DELETE') {
          return { players: state.players.filter(p => p.id !== oldRecord.id) }
        }
      }

      if (table === 'join_requests') {
        if (eventType === 'INSERT') {
          return { join_requests: [newRecord, ...state.join_requests] }
        }
        if (eventType === 'UPDATE') {
          return { join_requests: state.join_requests.map(item => item.id === newRecord.id ? newRecord : item) }
        }
        if (eventType === 'DELETE') {
          return { join_requests: state.join_requests.filter(item => item.id !== oldRecord.id) }
        }
      }

      if (table === 'matches') {
        if (eventType === 'INSERT') {
          return { matches: [...state.matches, newRecord] }
        }
        if (eventType === 'UPDATE') {
          const updated = state.matches.map(item => item.id === newRecord.id ? { ...item, ...newRecord } : item)
          const activeMatch = state.activeMatch?.id === newRecord.id ? { ...state.activeMatch, ...newRecord } : state.activeMatch
          return { matches: updated, activeMatch }
        }
        if (eventType === 'DELETE') {
          return {
            matches: state.matches.filter(item => item.id !== oldRecord.id),
            activeMatch: state.activeMatch?.id === oldRecord.id ? null : state.activeMatch,
          }
        }
      }

      if (table === 'rsvps') {
        const updateMatchRsvps = (match) => {
          if (!match || match.id !== (newRecord?.match_id || oldRecord?.match_id)) return match
          const current = Array.isArray(match.rsvps) ? [...match.rsvps] : []

          if (eventType === 'DELETE') {
            return { ...match, rsvps: current.filter(item => item.id !== oldRecord.id) }
          }

          const index = current.findIndex(item => item.id === newRecord.id)
          if (index >= 0) {
            current[index] = newRecord
          } else {
            current.push(newRecord)
          }

          return { ...match, rsvps: current }
        }

        return {
          matches: state.matches.map(updateMatchRsvps),
          activeMatch: updateMatchRsvps(state.activeMatch),
        }
      }

      if (table === 'stats') {
        if (eventType === 'INSERT') {
          return { stats: [newRecord, ...state.stats] }
        }
        if (eventType === 'UPDATE') {
          return { stats: state.stats.map(item => item.id === newRecord.id ? newRecord : item) }
        }
        if (eventType === 'DELETE') {
          return { stats: state.stats.filter(item => item.id !== oldRecord.id) }
        }
      }

      return state // No change
    })
  },

  setActiveMatch: (match) => set({ activeMatch: match }),

  upsertMatch: (match) => set((state) => ({
    matches: state.matches.map((m) => (m.id === match.id ? { ...m, ...match } : m)),
    activeMatch: state.activeMatch?.id === match.id ? { ...state.activeMatch, ...match } : state.activeMatch,
  })),

  pendingJoinRequests: () => get().join_requests.filter((r) => r.status === 'pending'),

  // Handle Python WebSocket Events
  applyWsEvent: (event, payload) => {
    set((state) => {
      if (event === 'PAYMENT_APPROVED' && payload?.id) {
        return {
          ledger: state.ledger.map((item) =>
            item.id === payload.id ? { ...item, ...payload, status: 'Paid' } : item
          ),
        }
      }

      if (event === 'JOIN_REQUEST_CREATED' && payload?.id) {
        const exists = state.join_requests.some((r) => r.id === payload.id)
        if (exists) return state
        return { join_requests: [payload, ...state.join_requests] }
      }

      if (event === 'JOIN_REQUEST_APPROVED' || event === 'JOIN_REQUEST_REJECTED') {
        return {
          join_requests: state.join_requests.map((r) =>
            r.id === payload?.join_request_id ? { ...r, status: event === 'JOIN_REQUEST_APPROVED' ? 'approved' : 'rejected' } : r
          ),
        }
      }

      if (event === 'RSVP_CHANGED') {
        if (state.activeMatch && state.activeMatch.id === payload.match_id) {
          const updatedRsvps = state.activeMatch.rsvps ? [...state.activeMatch.rsvps] : []
          const index = updatedRsvps.findIndex(r => r.id === payload.id)
          if (index >= 0) {
            updatedRsvps[index] = payload
          } else {
            updatedRsvps.push(payload)
          }
          return { activeMatch: { ...state.activeMatch, rsvps: updatedRsvps } }
        }
      }

      if (event === 'XI_UPDATED') {
        const matchId = payload?.id
        if (!matchId) return state
        return {
          matches: state.matches.map((m) =>
            m.id === matchId ? { ...m, squad_list: payload.squad_list } : m
          ),
          activeMatch:
            state.activeMatch?.id === matchId
              ? { ...state.activeMatch, squad_list: payload.squad_list }
              : state.activeMatch,
        }
      }

      return state
    })
  },
}))

export default useAppStore
