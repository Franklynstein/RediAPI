import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [orderResult, setOrderResult] = useState(null)
  const [ordering, setOrdering] = useState(false)
  const [orderError, setOrderError] = useState(null)

  useEffect(() => {
    // Fetch services from local proxy server
    fetch('http://localhost:3001/api/services')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json()
      })
      .then(data => {
        setServices(data)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error fetching services:', error)
        setError(error.message)
        setLoading(false)
      })
  }, [])

  const placeOrder = async serviceId => {
    setOrdering(true)
    setOrderError(null)
    setOrderResult(null)

    try {
      const response = await fetch('http://localhost:3001/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ service_id: serviceId, quantity: 1 })
      })

      if (!response.ok) {
        const body = await response.json()
        throw new Error(body.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setOrderResult(data)
    } catch (error) {
      console.error('Error placing order:', error)
      setOrderError(error.message)
    } finally {
      setOrdering(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading services...</div>
  }

  if (error) {
    return <div className="error">Error: {error}</div>
  }

  return (
    <div className="App">
      <header>
        {orderResult && (
          <div className="order-success">
            Order placed: <strong>{orderResult.sqid || orderResult.id}</strong> - {orderResult.status}
          </div>
        )}
        {orderError && <div className="order-error">Order error: {orderError}</div>}
        <h1>Rediprofiles - Social Media Accounts</h1>
      </header>
      <main>
        <div className="services-grid">
          {services.map(service => (
            <div key={service.id} className="service-card">
              <h2>{service.name}</h2>
              <p className="price">Price: ₦{service.final_price}</p>
              <p className="stock">In Stock: {service.quantity_in_stock}</p>
              <button
                className="buy-button"
                onClick={() => placeOrder(service.id)}
                disabled={ordering}
              >
                {ordering ? 'Purchasing…' : 'Purchase'}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default App