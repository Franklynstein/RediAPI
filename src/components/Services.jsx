import { useEffect, useState } from 'react'
import { api, ApiError } from '../api'

export default function Services({ onOrderPlaced }) {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [orderingId, setOrderingId] = useState(null)
  const [orderResult, setOrderResult] = useState(null)
  const [orderError, setOrderError] = useState(null)
  const [customerRef, setCustomerRef] = useState('')
  const [quantities, setQuantities] = useState({})

  useEffect(() => {
    let cancelled = false
    api.listServices()
      .then(data => { if (!cancelled) { setServices(data); setLoading(false) } })
      .catch(err => { if (!cancelled) { setError(err.message); setLoading(false) } })
    return () => { cancelled = true }
  }, [])

  const placeOrder = async service => {
    const quantity = Math.max(1, Math.min(Number(quantities[service.id]) || 1, service.quantity_in_stock))
    setOrderingId(service.id)
    setOrderError(null)
    setOrderResult(null)
    try {
      const payload = { service_id: service.id, quantity }
      if (customerRef.trim()) payload.external_customer_ref = customerRef.trim()
      const data = await api.createOrder(payload)
      setOrderResult(data)
      onOrderPlaced?.(data)
    } catch (err) {
      const msg = err instanceof ApiError && err.status === 402
        ? `${err.message} — check your wallet balance.`
        : err.message
      setOrderError(msg)
    } finally {
      setOrderingId(null)
    }
  }

  if (loading) return <div className="loading">Loading services…</div>
  if (error) return <div className="error">Error: {error}</div>

  return (
    <section>
      {orderResult && (
        <div className="order-success">
          Order placed: <strong>{orderResult.order_id ?? orderResult.sqid}</strong> — status {orderResult.status}
        </div>
      )}
      {orderError && <div className="order-error">Order error: {orderError}</div>}

      <div className="order-options">
        <label>
          External customer ref (optional):
          <input
            type="text"
            value={customerRef}
            onChange={e => setCustomerRef(e.target.value)}
            placeholder="e.g. customer-123"
          />
        </label>
      </div>

      <div className="services-grid">
        {services.map(service => {
          const outOfStock = service.quantity_in_stock <= 0
          return (
            <div key={service.id} className="service-card">
              <h2>{service.name}</h2>
              <p className="price">Price: ₦{service.final_price}</p>
              <p className="stock">In stock: {service.quantity_in_stock}</p>
              <label className="qty-label">
                Quantity:
                <input
                  type="number"
                  min="1"
                  max={service.quantity_in_stock || 1}
                  value={quantities[service.id] ?? 1}
                  onChange={e => setQuantities(q => ({ ...q, [service.id]: e.target.value }))}
                  disabled={outOfStock}
                />
              </label>
              <button
                className="buy-button"
                onClick={() => placeOrder(service)}
                disabled={outOfStock || orderingId === service.id}
              >
                {outOfStock ? 'Out of stock' : orderingId === service.id ? 'Purchasing…' : 'Purchase'}
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
