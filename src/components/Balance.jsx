import { useEffect, useState } from 'react'
import { api } from '../api'

export default function Balance({ refreshKey = 0 }) {
  const [balance, setBalance] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    api.getBalance()
      .then(data => { if (!cancelled) { setBalance(data); setError(null) } })
      .catch(err => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [refreshKey])

  if (error) return <span className="balance balance-error">Balance unavailable</span>
  if (!balance) return <span className="balance">Loading balance…</span>

  return (
    <span className="balance">
      Balance: {balance.currency_symbol}{balance.balance} {balance.currency}
    </span>
  )
}
