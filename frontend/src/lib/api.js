// API client for Hafiz Stars Eleven backend
const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)
  return res.json()
}

export const api = {
  // Players
  getPlayers: () => request('/players'),
  getPlayer: (id) => request(`/players/${id}`),

  // Finance
  getLedger: () => request('/finance/ledger'),
  getBalance: () => request('/finance/balance'),
  payDues: (data) => request('/finance/pay', { method: 'POST', body: JSON.stringify(data) }),
  approvePayment: (id) => request(`/finance/approve/${id}`, { method: 'PATCH' }),
  getFines: () => request('/finance/jurmana'),
  addFine: (player_id, reason, amount) =>
    request(`/finance/jurmana?player_id=${player_id}&reason=${encodeURIComponent(reason)}&amount=${amount}`, { method: 'POST' }),

  // Matches
  getUpcomingMatches: () => request('/matches/upcoming'),
  getMatch: (id) => request(`/matches/${id}`),
  createMatch: (data) => request('/matches', { method: 'POST', body: JSON.stringify(data) }),
  updateRSVP: (matchId, data) =>
    request(`/matches/${matchId}/rsvp`, { method: 'POST', body: JSON.stringify(data) }),
  setPlayingXI: (matchId, player_ids) =>
    request(`/matches/${matchId}/xi`, { method: 'POST', body: JSON.stringify({ match_id: matchId, player_ids }) }),

  // Inventory
  getInventory: () => request('/inventory'),
  updateInventory: (data) => request('/inventory', { method: 'PATCH', body: JSON.stringify(data) }),

  // Stats
  uploadStats: (matchId, file) => {
    const form = new FormData()
    form.append('file', file)
    return fetch(`${BASE}/stats/upload-stats?match_id=${matchId}`, { method: 'POST', body: form }).then(r => r.json())
  },
  confirmStats: (matchId, stats) =>
    request(`/stats/confirm/${matchId}`, { method: 'POST', body: JSON.stringify(stats) }),
}
