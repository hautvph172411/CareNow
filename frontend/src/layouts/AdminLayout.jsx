import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { useAuth } from '../hooks/useAuth'

export default function AdminLayout({ children, pageTitle, defaultSidebarCollapsed = false }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(defaultSidebarCollapsed)
  const { logout } = useAuth()

  useEffect(() => {
    setSidebarCollapsed(defaultSidebarCollapsed)
  }, [defaultSidebarCollapsed])

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
