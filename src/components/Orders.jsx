import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'

const STATUS_STYLES = {
  success: 'badge badge-success',
  completed: 'badge badge-success',
  pending: 'badge badge-pending',
  processing: 'badge badge-pending',
  failed: 'badge badge-error',
  refunded: 'badge badge-neutral',
}

const SUCCESS_STATUSES = new Set(['success', 'completed'])

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  return isNaN(d.getTime()) ? '—' : d.toLocaleString()
}

function renderAccountData(accountData) {
  if (!accountData) return null
  if (typeof accountData === 'string') {
    return <pre className="account-data">{accountData}</pre>
  }
  if (Array.isArray(accountData)) {
    return (
      <div className="account-data-list">
        {accountData.map((entry, i) => (
          <pre key={entry.sqid ?? i} className="account-data">
            {entry.account_details ?? JSON.stringify(entry, null, 2)}
          </pre>
        ))}
      </div>
    )
  }
  return <pre className="account-data">{JSON.stringify(accountData, null, 2)}</pre>
}

export default function Orders({ refreshKey = 0 }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('')
  const [appliedFilter, setAppliedFilter] = useState('')
  const [source, setSource] = useState('all') // 'all' | 'api'
  const [selected, setSelected] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const fn = source === 'api' ? api.listApiOrders : api.listOrders
      const data = await fn({ externalCustomerRef: appliedFilter || undefined })
      setOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [appliedFilter, source])

  useEffect(() => { load() }, [load, refreshKey])

  const applyFilter = e => {
    e.preventDefault()
    setAppliedFilter(filter.trim())
  }

  const clearFilter = () => {
    setFilter('')
    setAppliedFilter('')
  }

  const openDetails = async order => {
    setSelected({ ...order, loading: true })
    try {
      const getter = source === 'api' ? api.getApiOrder : api.getOrder
      const data = await getter(order.order_id)
      setSelected({ ...data, loading: false })
    } catch (err) {
      setSelected({ ...order, loading: false, detailError: err.message })
    }
  }

  return (
    <section className="orders">
      <form onSubmit={applyFilter} className="orders-toolbar">
        <label>
          Source:
          <select value={source} onChange={e => setSource(e.target.value)}>
            <option value="all">All orders</option>
            <option value="api">API orders only</option>
          </select>
        </label>
        <label>
          Customer ref:
          <input
            type="text"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="customer-123"
          />
        </label>
        <button type="submit">Apply</button>
        {appliedFilter && (
          <button type="button" className="secondary" onClick={clearFilter}>Clear</button>
        )}
        <button type="button" className="secondary" onClick={load}>Refresh</button>
      </form>

      {loading && <div className="loading">Loading orders…</div>}
      {error && <div className="error">Error: {error}</div>}

      {!loading && !error && orders.length === 0 && (
        <div className="empty">No orders found{appliedFilter ? ` for ref "${appliedFilter}"` : ''}.</div>
      )}

      {!loading && !error && orders.length > 0 && (
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Service</th>
              <th>Qty</th>
              <th>Total</th>
              <th>Status</th>
              <th>Source</th>
              <th>Customer ref</th>
              <th>Purchased</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.order_id}>
                <td><code>{order.order_id}</code></td>
                <td>{order.service_name ?? order.service}</td>
                <td>{order.quantity}</td>
                <td>₦{order.charged_price ?? order.total_price}</td>
                <td>
                  <span className={STATUS_STYLES[order.status] || 'badge'}>
                    {order.status}
                  </span>
                </td>
                <td>{order.source}</td>
                <td>{order.external_customer_ref || '—'}</td>
                <td>{formatDate(order.purchase_date ?? order.created_at)}</td>
                <td>
                  <button type="button" className="link" onClick={() => openDetails(order)}>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selected && (
        <div className="drawer" role="dialog" aria-label="Order details">
          <div className="drawer-header">
            <h3>Order {selected.order_id}</h3>
            <button type="button" className="link" onClick={() => setSelected(null)}>Close</button>
          </div>
          {selected.loading ? (
            <div className="loading">Loading details…</div>
          ) : selected.detailError ? (
            <div className="error">Error: {selected.detailError}</div>
          ) : (
            <dl className="order-details">
              <dt>Service</dt><dd>{selected.service_name ?? selected.service}</dd>
              <dt>Quantity</dt><dd>{selected.quantity}</dd>
              <dt>Total</dt><dd>₦{selected.charged_price ?? selected.total_price}</dd>
              <dt>Status</dt>
              <dd>
                <span className={STATUS_STYLES[selected.status] || 'badge'}>
                  {selected.status}
                </span>
              </dd>
              <dt>Source</dt><dd>{selected.source}</dd>
              <dt>Customer ref</dt><dd>{selected.external_customer_ref || '—'}</dd>
              <dt>Purchased</dt><dd>{formatDate(selected.purchase_date ?? selected.created_at)}</dd>
              {SUCCESS_STATUSES.has(selected.status) && selected.account_data && (
                <>
                  <dt>Account data</dt>
                  <dd>{renderAccountData(selected.account_data)}</dd>
                </>
              )}
            </dl>
          )}
        </div>
      )}
    </section>
  )
}
