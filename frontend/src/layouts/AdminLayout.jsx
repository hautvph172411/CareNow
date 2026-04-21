import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

export default function AdminLayout({ children, pageTitle }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleLogout = () => {
    navigate('/login')
  }

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="dashboard-main">
        <Header onMenuClick={handleMenuClick} onLogout={handleLogout} />
        <div className="dashboard-content">
          {pageTitle && (
            <div className="dashboard-header">
              <h1 className="dashboard-title">{pageTitle}</h1>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}
