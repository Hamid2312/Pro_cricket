/** Map API ledger row (with nested players) to list UI shape. */
export function ledgerToDisplay(row) {
  return {
    id: row.id,
    name: row.players?.name ?? (row.type === 'Expense' ? 'Team expense' : 'Squad'),
    jersey: row.players?.jersey_number ?? '—',
    month: row.month_ref || row.description || row.category || '—',
    status: row.status,
    amount: row.amount,
    category: row.category,
    method:
      row.proof_image_url
        ? 'Proof uploaded'
        : row.status === 'Paid'
          ? 'Confirmed'
          : 'Awaiting payment',
  }
}

export function finesFromLedger(ledger) {
  return (ledger || [])
    .filter((row) => row.category === 'Fine')
    .map((row) => ({
      id: row.id,
      name: row.players?.name ?? 'Player',
      reason: row.description || 'Fine',
      amount: row.amount,
      paid: row.status === 'Paid',
    }))
}
