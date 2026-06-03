import { useCallback, useEffect, useRef, useState } from 'react'
import { Bell, CalendarClock, ChevronDown, Menu, Phone, Search, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getAppointments } from '../api/appointment.api'

const NOTIFICATION_LIMIT = 10

function formatAppointmentDate(value) {
  if (!value) return 'Chưa có ngày'
  return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

export default function Header({ onMenuClick, onLogout }) {
  const { user, isManager } = useAuth()
  const [showProfile, setShowProfile] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [appointmentSearch, setAppointmentSearch] = useState('')
  const [notifications, setNotifications] = useState([])
  const [notificationPage, setNotificationPage] = useState(1)
  const [notificationTotal, setNotificationTotal] = useState(0)
  const [notificationTotalPages, setNotificationTotalPages] = useState(1)
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const navigate = useNavigate()
  const profileRef = useRef(null)
  const notifRef = useRef(null)

  const initials = (user?.display_name || user?.username || 'U')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const unreadLabel = notificationTotal > 99 ? '99+' : String(notificationTotal)

  const fetchNotifications = useCallback(async (page = 1, append = false) => {
    setLoadingNotifications(true)
    try {
      const res = await getAppointments({ page, limit: NOTIFICATION_LIMIT * 3 })
      const raw = res?.data || []
      const filtered = raw.filter((item) => [1, 4].includes(Number(item.status))).slice(0, NOTIFICATION_LIMIT)
      const pendingCount = raw.filter((item) => Number(item.status) === 1).length
      const cancelledCount = raw.filter((item) => Number(item.status) === 4).length
      setNotificationTotal(pendingCount + cancelledCount)
      setNotificationTotalPages(1)
      setNotificationPage(page)
      setNotifications(prev => append ? [...prev, ...filtered] : filtered)
    } catch (error) {
      console.error('Notification fetch failed:', error)
    } finally {
      setLoadingNotifications(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications(1)
    const timer = setInterval(() => fetchNotifications(1), 30000)
    return () => clearInterval(timer)
  }, [fetchNotifications])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleAppointmentSearch = (e) => {
    e.preventDefault()
    const keyword = appointmentSearch.trim()
    navigate(keyword ? `/appointments?q=${encodeURIComponent(keyword)}` : '/appointments')
    setAppointmentSearch('')
  }

  const handleNotificationScroll = (e) => {
    const el = e.currentTarget
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 24
    if (nearBottom && !loadingNotifications && notificationPage < notificationTotalPages) {
      fetchNotifications(notificationPage + 1, true)
    }
  }

  return (
    <header className="dashboard-top-bar">
      <div className="dashboard-header-content">
        {/* Mobile menu button */}
        <button className="header-menu-btn" onClick={onMenuClick} aria-label="Menu">
          <Menu size={20} />
        </button>

        {/* Search bar */}
        <form className="header-search" onSubmit={handleAppointmentSearch}>
          <Search size={16} color="var(--gray-400)" />
          <input
            type="text"
            value={appointmentSearch}
            onChange={e => setAppointmentSearch(e.target.value)}
            placeholder="Tìm lịch hẹn, bệnh nhân, số điện thoại..."
          />
          {appointmentSearch && (
            <button type="button" onClick={() => setAppointmentSearch('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--gray-400)', display: 'flex' }}>
              <X size={14} />
            </button>
          )}
        </form>

        {/* Actions */}
        <div className="header-actions">
          {/* Notifications */}
          <div className="header-notification" ref={notifRef}>
            <button
              className="header-notification-btn"
              onClick={() => { setShowProfile(false); setShowNotifications(v => !v); if (!showNotifications) fetchNotifications(1) }}
              aria-label="Thông báo"
            >
              <Bell size={18} />
              {notificationTotal > 0 && (
                <span className="notification-badge">{unreadLabel}</span>
              )}
            </button>

            {showNotifications && (
              <div className="notification-menu">
                <div className="notification-menu-header">
                  <div>
                    <p className="notification-title">Thông báo lịch hẹn</p>
                    <p className="notification-subtitle">{notificationTotal} đơn cần xử lý (mới + bệnh nhân hủy)</p>
                  </div>
                  {notificationTotal > 0 && (
                    <button
                      onClick={() => { setShowNotifications(false); navigate('/appointments') }}
                      style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Xem tất cả
                    </button>
                  )}
                </div>

                <div className="notification-list" onScroll={handleNotificationScroll}>
                  {notifications.length === 0 && !loadingNotifications ? (
                    <div className="notification-empty">
                      <Bell size={24} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
                      <p>Không có lịch hẹn nào đang chờ</p>
                    </div>
                  ) : (
                    notifications.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        className="notification-item"
                        onClick={() => { setShowNotifications(false); navigate(`/appointments?q=${item.booking_code || item.id}`) }}
                      >
                        <span className="notification-dot" style={{ background: Number(item.status) === 4 ? '#ef4444' : undefined }} />
                        <span className="notification-content">
                          <strong>{item.patient_name || 'Bệnh nhân'}</strong>
                          <span className="notification-meta" style={{ color: Number(item.status) === 4 ? '#b91c1c' : undefined, fontWeight: 700 }}>
                            {Number(item.status) === 4 ? 'Bệnh nhân đã hủy lịch' : 'Đơn mới chờ xác nhận'}
                          </span>
                          <span className="notification-meta">
                            <Phone size={11} /> {item.patient_phone || 'Chưa có SĐT'}
                          </span>
                          <span className="notification-meta">
                            <CalendarClock size={11} />
                            {formatAppointmentDate(item.appt_date)}
                            {item.appt_time ? ` lúc ${String(item.appt_time).slice(0, 5)}` : ''}
                          </span>
                        </span>
                        <span className="notification-code">{item.booking_code || `#${item.id}`}</span>
                      </button>
                    ))
                  )}
                  {loadingNotifications && (
                    <div className="notification-loading">Đang tải...</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="header-profile" ref={profileRef}>
            <button
              className="header-profile-btn"
              onClick={() => { setShowNotifications(false); setShowProfile(v => !v) }}
            >
              <div className="header-profile-avatar">{initials}</div>
              <span className="header-profile-name">
                {user?.display_name || user?.username || 'Tài khoản'}
              </span>
              <ChevronDown size={14} color="var(--gray-400)" />
            </button>

            {showProfile && (
              <div className="header-profile-menu">
                <div className="profile-menu-header">
                  <p className="profile-name">{user?.display_name || user?.username}</p>
                  <p className="profile-email">{isManager ? '👑 Quản lý' : '👤 Nhân viên'}</p>
                </div>
                <div className="profile-menu-items">
                  <button className="profile-menu-item" onClick={() => { setShowProfile(false); navigate('/profile') }}>
                    Hồ sơ
                  </button>
                  <button className="profile-menu-item logout" onClick={() => { setShowProfile(false); onLogout() }}>
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
