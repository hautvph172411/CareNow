import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { useAuth } from '../hooks/useAuth'

export default function AdminLayout({ children, pageTitle }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { logout } = useAuth()

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <div className={`dashboard-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
      />
      <div className="dashboard-main">
        <Header onMenuClick={handleMenuClick} onLogout={handleLogout} />
        <div className="dashboard-content">
          {pageTitle && (
            <div className="dashboard-page-heading">
              <h1 className="dashboard-title">{pageTitle}</h1>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}
