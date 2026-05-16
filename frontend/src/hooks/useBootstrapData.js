import { useEffect, useRef } from 'react'
import { api } from '../lib/api'
import useAppStore from '../store/useAppStore'
import { useAuth } from '../lib/AuthContext'

function normalizeInventory(row) {
  if (!row) return { fresh_balls: 0, tape_rolls: 0, kit_holder_id: null, kit_holder_name: null }
  return {
    fresh_balls: row.fresh_balls ?? 0,
    tape_rolls: row.tape_rolls ?? 0,
    kit_holder_id: row.kit_holder_id ?? null,
    kit_holder_name: row.players?.name ?? null,
  }
}

/** Load treasury, ledger, inventory, squad, matches (+ RSVPs) when user is an active member. */
export function useBootstrapData(enabled) {
  const { teamMe } = useAuth()
  const setInitialData = useAppStore((s) => s.setInitialData)
  const ran = useRef(false)

  useEffect(() => {
    if (!enabled) {
      ran.current = false
      return
    }
    if (ran.current) return
    ran.current = true

    let cancelled = false

    async function load() {
      try {
        const [balance, ledger, inventory, players, matches] = await Promise.all([
          api.getBalance(),
          api.getLedger(),
          api.getInventory(),
          api.getPlayers(),
          api.getUpcomingMatches(),
        ])
        if (cancelled) return

        const payload = {
          team_treasury: { total_balance: balance?.total_balance ?? 0 },
          ledger: ledger ?? [],
          inventory: normalizeInventory(inventory),
          players: players ?? [],
          matches: matches ?? [],
        }

        if (matches?.length) {
          const detail = await api.getMatch(matches[0].id)
          if (!cancelled && detail) {
            payload.activeMatch = detail
            payload.matches = matches.map((m) => (m.id === detail.id ? detail : m))
          }
        }

        if (teamMe?.is_captain) {
          const joinRequests = await api.getJoinRequests()
          if (!cancelled) payload.join_requests = joinRequests ?? []
        }

        if (!cancelled) setInitialData(payload)
      } catch (err) {
        console.error('Bootstrap load failed:', err)
        ran.current = false
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [enabled, setInitialData, teamMe?.is_captain])
}
