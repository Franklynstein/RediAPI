import { useState } from 'react'
import './App.css'
import Balance from './components/Balance'
import Services from './components/Services'
import Orders from './components/Orders'

export default function App() {
  const [view, setView] = useState('services')
  const [refreshKey, setRefreshKey] = useState(0)

  const handleOrderPlaced = () => setRefreshKey(k => k + 1)

  return (
    <div className="App">
      <header>
        <div className="header-inner">
          <h1>Rediprofiles</h1>
          <Balance refreshKey={refreshKey} />
        </div>
        <nav className="tabs">
          <button
            className={view === 'services' ? 'tab active' : 'tab'}
            onClick={() => setView('services')}
          >
            Services
          </button>
          <button
            className={view === 'orders' ? 'tab active' : 'tab'}
            onClick={() => setView('orders')}
          >
            Orders
          </button>
        </nav>
      </header>
      <main>
        {view === 'services'
          ? <Services onOrderPlaced={handleOrderPlaced} />
          : <Orders refreshKey={refreshKey} />}
      </main>
    </div>
  )
}
