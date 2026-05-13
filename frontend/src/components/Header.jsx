import { useCallback, useEffect, useState } from 'react'
import { Bell, CalendarClock, ChevronDown, Phone, Search, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getAppointments } from '../api/appointment.api'

const NOTIFICATION_LIMIT = 10

function formatAppointmentDate(value) {
  if (!value) return 'Chưa có ngày'
  return new Date(value).toLocaleDateString('vi-VN')
}

export default function Header({ onMenuClick, onLogout }) {
  const [showProfile, setShowProfile] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [appointmentSearch, setAppointmentSearch] = useState('')
  const [notifications, setNotifications] = useState([])
  const [notificationPage, setNotificationPage] = useState(1)
  const [notificationTotal, setNotificationTotal] = useState(0)
  const [notificationTotalPages, setNotificationTotalPages] = useState(1)
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const navigate = useNavigate()

  const unreadLabel = notificationTotal > 99 ? '99+' : String(notificationTotal)

  const fetchNotifications = useCallback(async (page = 1, append = false) => {
    setLoadingNotifications(true)
    try {
      const res = await getAppointments({
        status: 1,
        page,
        limit: NOTIFICATION_LIMIT,
      })
      setNotificationTotal(res?.pagination?.total || 0)
      setNotificationTotalPages(res?.pagination?.totalPages || 1)
      setNotificationPage(page)
      setNotifications((prev) => append ? [...prev, ...(res?.data || [])] : (res?.data || []))
    } catch (error) {
      console.error('Failed to fetch appointment notifications:', error)
    } finally {
      setLoadingNotifications(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications(1)
    const timer = setInterval(() => fetchNotifications(1), 30000)
    return () => clearInterval(timer)
  }, [fetchNotifications])

  const handleAppointmentSearch = (e) => {
    e.preventDefault()
    const keyword = appointmentSearch.trim()
    navigate(keyword ? `/appointments/admin?q=${encodeURIComponent(keyword)}` : '/appointments/admin')
  }

  const handleOpenNotifications = () => {
    setShowProfile(false)
    setShowNotifications((value) => !value)
    fetchNotifications(1)
  }

  const handleNotificationScroll = (e) => {
    const el = e.currentTarget
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 24
    if (nearBottom && !loadingNotifications && notificationPage < notificationTotalPages) {
      fetchNotifications(notificationPage + 1, true)
    }
  }

  const goToAppointment = (item) => {
    setShowNotifications(false)
    navigate(`/appointments/admin?q=${encodeURIComponent(`#${item.id}`)}`)
  }

  return (
    <header className="dashboard-top-bar">
      <div className="dashboard-header-content">
        {/* Menu Button */}
        <button className="header-menu-btn" onClick={onMenuClick}>
          ☰
        </button>

        {/* Search */}
        <form className="header-search" onSubmit={handleAppointmentSearch}>
          <Search size={18} />
          <input
            type="text"
            value={appointmentSearch}
            onChange={(e) => setAppointmentSearch(e.target.value)}
            placeholder="Tìm theo #id, Họ và tên, Số điện thoại đặt lịch"
          />
        </form>

        {/* Right Section */}
        <div className="header-actions">
          {/* Notifications */}
          <div className="header-notification">
            <button className="header-notification-btn" onClick={handleOpenNotifications}>
              <Bell size={20} />
              {notificationTotal > 0 && <span className="notification-badge">{unreadLabel}</span>}
            </button>

            {showNotifications && (
              <div className="notification-menu">
                <div className="notification-menu-header">
                  <div>
                    <p className="notification-title">Thông báo đơn đặt khám</p>
                    <p className="notification-subtitle">{notificationTotal} đơn đang chờ xác nhận</p>
                  </div>
                </div>

                <div className="notification-list" onScroll={handleNotificationScroll}>
                  {notifications.length === 0 && !loadingNotifications ? (
                    <div className="notification-empty">Không có đơn đặt khám mới</div>
                  ) : (
                    notifications.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="notification-item"
                        onClick={() => goToAppointment(item)}
                      >
                        <span className="notification-dot" />
                        <span className="notification-content">
                          <strong>{item.patient_name || 'Khách hàng'}</strong>
                          <span className="notification-meta">
                            <Phone size={13} />
                            {item.patient_phone || 'Chưa có SĐT'}
                          </span>
                          <span className="notification-meta">
                            <CalendarClock size={13} />
                            {formatAppointmentDate(item.appt_date)} {item.appt_time ? `- ${String(item.appt_time).slice(0, 5)}` : ''}
                          </span>
                        </span>
                        <span className="notification-code">{item.booking_code || `#${item.id}`}</span>
                      </button>
                    ))
                  )}
                  {loadingNotifications && <div className="notification-loading">Đang tải...</div>}
                </div>
              </div>
            )}
          </div>

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
