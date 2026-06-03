import { useCallback, useEffect, useState } from 'react'
import { Bell, CalendarClock, ChevronDown, Phone, Search, User, MessageSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getAppointments } from '../api/appointment.api'
import { getUnreadConsultationsCount } from '../api/consultation.api'

const NOTIFICATION_LIMIT = 10

function formatAppointmentDate(value) {
  if (!value) return 'Chưa có ngày'
  return new Date(value).toLocaleDateString('vi-VN')
}

export default function Header({ onMenuClick, onLogout }) {
  const { user, hasPermission } = useAuth()
  const [showProfile, setShowProfile] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [appointmentSearch, setAppointmentSearch] = useState('')
  const [notifications, setNotifications] = useState([])
  const [notificationPage, setNotificationPage] = useState(1)
  const [notificationTotal, setNotificationTotal] = useState(0)
  const [notificationTotalPages, setNotificationTotalPages] = useState(1)
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  
  const [unreadConsultations, setUnreadConsultations] = useState(0)

  const navigate = useNavigate()

  const unreadLabel = notificationTotal > 99 ? '99+' : String(notificationTotal)
  const unreadConsultationsLabel = unreadConsultations > 99 ? '99+' : String(unreadConsultations)

  const fetchNotifications = useCallback(async (page = 1, append = false) => {
    setLoadingNotifications(true)
    try {
      const res = await getAppointments({
        page,
        limit: NOTIFICATION_LIMIT * 3,
      })
      const raw = res?.data || []
      const filtered = raw.filter((item) => [1, 4].includes(Number(item.status))).slice(0, NOTIFICATION_LIMIT)
      const pendingCount = raw.filter((item) => Number(item.status) === 1).length
      const cancelledCount = raw.filter((item) => Number(item.status) === 4).length
      const total = pendingCount + cancelledCount
      setNotificationTotal(total)
      setNotificationTotalPages(1)
      setNotificationPage(page)
      setNotifications((prev) => append ? [...prev, ...filtered] : filtered)
    } catch (error) {
      console.error('Failed to fetch appointment notifications:', error)
    } finally {
      setLoadingNotifications(false)
    }
  }, [])

  const fetchConsultationsCount = useCallback(async () => {
    if (!hasPermission('manage_appointment')) return
    try {
      const res = await getUnreadConsultationsCount()
      if (res && res.count !== undefined) {
        setUnreadConsultations(res.count)
      }
    } catch (error) {
      console.error('Failed to fetch unread consultations count:', error)
    }
  }, [hasPermission])

  useEffect(() => {
    fetchNotifications(1)
    fetchConsultationsCount()
    
    const timer = setInterval(() => {
      fetchNotifications(1)
      fetchConsultationsCount()
    }, 30000)
    
    window.addEventListener('consultations_updated', fetchConsultationsCount)

    return () => {
      clearInterval(timer)
      window.removeEventListener('consultations_updated', fetchConsultationsCount)
    }
  }, [fetchNotifications, fetchConsultationsCount])

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
          
          {/* Consultations */}
          {hasPermission('manage_appointment') && (
            <div className="header-notification">
              <button 
                className="header-notification-btn" 
                title="Yêu cầu Tư vấn thêm"
                onClick={() => navigate('/tu-van-them')}
              >
                <MessageSquare size={20} />
                {unreadConsultations > 0 && <span className="notification-badge">{unreadConsultationsLabel}</span>}
              </button>
            </div>
          )}

          {/* Notifications */}
          <div className="header-notification">
            <button className="header-notification-btn" title="Đơn đặt khám" onClick={handleOpenNotifications}>
              <Bell size={20} />
              {notificationTotal > 0 && <span className="notification-badge">{unreadLabel}</span>}
            </button>

            {showNotifications && (
              <div className="notification-menu">
                <div className="notification-menu-header">
                  <div>
                    <p className="notification-title">Thông báo đơn đặt khám</p>
                    <p className="notification-subtitle">{notificationTotal} đơn cần xử lý (mới + bệnh nhân hủy)</p>
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
                        <span className="notification-dot" style={{ background: Number(item.status) === 4 ? '#ef4444' : undefined }} />
                        <span className="notification-content">
                          <strong>{item.patient_name || 'Khách hàng'}</strong>
                          <span className="notification-meta" style={{ color: Number(item.status) === 4 ? '#b91c1c' : undefined, fontWeight: 700 }}>
                            {Number(item.status) === 4 ? 'Bệnh nhân đã hủy lịch' : 'Đơn mới chờ xác nhận'}
                          </span>
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
              <div className="header-profile-avatar">{(user?.display_name || user?.username || 'U')[0].toUpperCase()}</div>
              <span className="header-profile-name">{user?.display_name || user?.username || 'Admin'}</span>
              <ChevronDown size={16} />
            </button>

            {showProfile && (
              <div className="header-profile-menu">
                <div className="profile-menu-header">
                  <p className="profile-name">{user?.display_name || user?.username || 'Người dùng'}</p>
                  <p className="profile-email">{user?.email || 'admin@carenow.vn'}</p>
                </div>
                <div className="profile-menu-items">
                  <button type="button" className="profile-menu-item" onClick={() => { setShowProfile(false); navigate('/profile'); }}>Hồ sơ</button>
                  <button type="button" className="profile-menu-item" onClick={() => { setShowProfile(false); navigate('/settings'); }}>Cài đặt</button>
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
