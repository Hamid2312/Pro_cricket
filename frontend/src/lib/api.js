// API client — attaches Supabase access token to every /api/* request
import { supabase } from './supabase'

const BASE = '/api'

const EMPTY_TEAM_ME = {
  user_id: null,
  player: null,
  pending_request: null,
  is_captain: false,
  can_use_app: false,
}

async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

async function request(path, options = {}, retry = false) {
  const token = await getAccessToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  // One retry only after explicit session refresh (avoid infinite 401 loops)
  if (res.status === 401 && !retry && token) {
    const { data: { session }, error } = await supabase.auth.refreshSession()
    if (!error && session?.access_token) {
      return request(path, options, true)
    }
  }

  if (res.status === 401) {
    const err = new Error('Unauthorized')
    err.status = 401
    err.teamMe = EMPTY_TEAM_ME
    throw err
  }

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`)
  }

  return res.json()
}

export const api = {
  getTeamMe: () => request('/team/me'),
  submitJoinRequest: (data) =>
    request('/team/join-request', { method: 'POST', body: JSON.stringify(data) }),
  getJoinRequests: () => request('/team/join-requests'),
  approveJoinRequest: (id) => request(`/team/join-requests/${id}/approve`, { method: 'POST' }),
  rejectJoinRequest: (id) => request(`/team/join-requests/${id}/reject`, { method: 'POST' }),

  getPlayers: () => request('/players'),
  getPlayer: (id) => request(`/players/${id}`),

  getLedger: () => request('/finance/ledger'),
  getBalance: () => request('/finance/balance'),
  addLedgerEntry: (data) => request('/finance/ledger', { method: 'POST', body: JSON.stringify(data) }),
  approvePayment: (id) => request(`/finance/approve/${id}`, { method: 'PATCH' }),
  triggerMonthlyDues: () => request('/finance/monthly-dues', { method: 'POST' }),

  getUpcomingMatches: () => request('/matches/upcoming'),
  getMatch: (id) => request(`/matches/${id}`),
  createMatch: (data) => request('/matches', { method: 'POST', body: JSON.stringify(data) }),
  updateRSVP: (matchId, data) =>
    request(`/matches/${matchId}/rsvp`, { method: 'POST', body: JSON.stringify(data) }),
  setPlayingXI: (matchId, squad_list) =>
    request(`/matches/${matchId}/xi`, { method: 'PATCH', body: JSON.stringify({ squad_list }) }),

  getInventory: () => request('/inventory'),
  updateInventory: (data) => request('/inventory', { method: 'PATCH', body: JSON.stringify(data) }),

  uploadStats: async (matchId, file) => {
    const token = await getAccessToken()
    const form = new FormData()
    form.append('file', file)
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    const res = await fetch(`${BASE}/stats/upload-stats?match_id=${matchId}`, {
      method: 'POST',
      headers,
      body: form,
    })
    if (!res.ok) throw new Error(`Upload failed ${res.status}`)
    return res.json()
  },
  confirmStats: (matchId, stats) =>
    request(`/stats/confirm/${matchId}`, { method: 'POST', body: JSON.stringify(stats) }),
}

export { EMPTY_TEAM_ME }
