import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import useAppStore from '../store/useAppStore'

export function useRealtimeSubscription(session) {
  const { applyDbEvent } = useAppStore()

  useEffect(() => {
    if (!session) return

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_treasury' },
        (payload) => applyDbEvent('team_treasury', payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory' },
        (payload) => applyDbEvent('inventory', payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ledger' },
        (payload) => applyDbEvent('ledger', payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players' },
        (payload) => applyDbEvent('players', payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'join_requests' },
        (payload) => applyDbEvent('join_requests', payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        (payload) => applyDbEvent('matches', payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rsvps' },
        (payload) => applyDbEvent('rsvps', payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stats' },
        (payload) => applyDbEvent('stats', payload)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [applyDbEvent, session])
}
