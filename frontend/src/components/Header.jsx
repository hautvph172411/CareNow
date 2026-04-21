import { useState } from 'react'
import { Bell, Search, User, ChevronDown } from 'lucide-react'

export default function Header({ onMenuClick, onLogout }) {
  const [showProfile, setShowProfile] = useState(false)

  return (
    <header className="dashboard-header">
      <div className="dashboard-header-content">
        {/* Menu Button */}
        <button className="header-menu-btn" onClick={onMenuClick}>
          ☰
        </button>

        {/* Search */}
        <div className="header-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm lịch hẹn, bệnh nhân..."
          />
        </div>

        {/* Right Section */}
        <div className="header-actions">
          {/* Notifications */}
          <button className="header-notification-btn">
            <Bell size={20} />
            <span className="notification-badge"></span>
          </button>

          {/* Profile Menu */}
          <div className="header-profile">
            <button
              className="header-profile-btn"
              onClick={() => setShowProfile(!showProfile)}
            >
              <div className="header-profile-avatar">A</div>
              <span className="header-profile-name">Admin</span>
              <ChevronDown size={16} />
            </button>

            {showProfile && (
              <div className="header-profile-menu">
                <div className="profile-menu-header">
                  <p className="profile-name">Nguyễn Văn A</p>
                  <p className="profile-email">admin@carenow.vn</p>
                </div>
                <div className="profile-menu-items">
                  <a href="#" className="profile-menu-item">Hồ sơ</a>
                  <a href="#" className="profile-menu-item">Cài đặt</a>
                  <button className="profile-menu-item logout" onClick={onLogout}>
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
