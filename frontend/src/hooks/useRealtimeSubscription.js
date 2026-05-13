import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import useAppStore from '../store/useAppStore'

export function useRealtimeSubscription() {
  const { applyDbEvent } = useAppStore()

  useEffect(() => {
    // Listen to changes on multiple tables
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
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [applyDbEvent])
}
