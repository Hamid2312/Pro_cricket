import { create } from 'zustand'

const useAppStore = create((set, get) => ({
  // State
  team_treasury: { total_balance: 0 },
  inventory: { fresh_balls: 0, tape_rolls: 0, kit_holder_id: null },
  players: [],
  ledger: [],
  matches: [],
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
      }
      
      return state // No change
    })
  },

  // Handle Python WebSocket Events
  applyWsEvent: (event, payload) => {
    set((state) => {
      // These are examples of pure WS broadcasts (e.g. for things we don't want CDC for, or fast transient state)
      if (event === 'PAYMENT_APPROVED') {
        // UI notification trigger, or optimistic update if needed
        console.log("WS Event: Payment Approved", payload)
      }
      
      if (event === 'RSVP_CHANGED') {
        // Find active match and update RSVP locally
        if (state.activeMatch && state.activeMatch.id === payload.match_id) {
           const updatedRsvps = state.activeMatch.rsvps.map(r => 
               r.player_id === payload.player_id ? { ...r, status: payload.status } : r
           )
           // If it's a new RSVP not in the list
           if (!state.activeMatch.rsvps.find(r => r.player_id === payload.player_id)) {
               updatedRsvps.push(payload)
           }
           return { activeMatch: { ...state.activeMatch, rsvps: updatedRsvps } }
        }
      }
      
      if (event === 'XI_UPDATED') {
        if (state.activeMatch && state.activeMatch.id === payload.id) {
           return { activeMatch: { ...state.activeMatch, squad_list: payload.squad_list } }
        }
      }
      
      return state
    })
  }
}))

export default useAppStore
