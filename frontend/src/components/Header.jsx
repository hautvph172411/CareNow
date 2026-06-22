import { useCallback, useEffect, useState } from 'react'
import { Bell, CalendarClock, ChevronDown, Phone, Search, User, MessageSquare, History } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getAppointments } from '../api/appointment.api'
import { getUnreadConsultationsCount } from '../api/consultation.api'
import { getScheduleLogs } from '../api/appointmentSchedule.api'
import { getClinics } from '../api/clinic.api'
import { getPartners } from '../api/partner.api'

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
  
  // Schedule Logs Notifications
  const [showScheduleLogs, setShowScheduleLogs] = useState(false)
  const [scheduleLogs, setScheduleLogs] = useState([])
  const [unreadScheduleLogs, setUnreadScheduleLogs] = useState(0)
  const [loadingScheduleLogs, setLoadingScheduleLogs] = useState(false)
  const [clinics, setClinics] = useState([])
  const [partners, setPartners] = useState([])

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

  const fetchScheduleLogs = useCallback(async () => {
    if (!hasPermission('manage_appointment_schedule')) return
    try {
      if (clinics.length === 0) {
        getClinics({ limit: 1000 }).then(res => {
          if (res?.data) setClinics(res.data);
        }).catch(err => console.error(err));
      }
      if (partners.length === 0) {
        getPartners({ limit: 1000 }).then(res => {
          if (res?.data) setPartners(res.data);
        }).catch(err => console.error(err));
      }
      const res = await getScheduleLogs({ user_type: 'partner', action_type: 'TOGGLE_STATUS', limit: 10, page: 1 })
      if (res?.data?.rows) {
        setScheduleLogs(res.data.rows)
        const lastSeenId = parseInt(localStorage.getItem('last_seen_schedule_log_id') || '0', 10)
        const unreadCount = res.data.rows.filter(log => parseInt(log.id, 10) > lastSeenId).length
        setUnreadScheduleLogs(unreadCount)
      }
    } catch (error) {
      console.error('Failed to fetch schedule logs:', error)
    }
  }, [hasPermission, clinics.length])

  useEffect(() => {
    fetchNotifications(1)
    fetchConsultationsCount()
    fetchScheduleLogs()
    
    const timer = setInterval(() => {
      fetchNotifications(1)
      fetchConsultationsCount()
      fetchScheduleLogs()
    }, 30000)
    
    window.addEventListener('consultations_updated', fetchConsultationsCount)

    return () => {
      clearInterval(timer)
      window.removeEventListener('consultations_updated', fetchConsultationsCount)
    }
  }, [fetchNotifications, fetchConsultationsCount, fetchScheduleLogs])

  const handleAppointmentSearch = (e) => {
    e.preventDefault()
    const keyword = appointmentSearch.trim()
    navigate(keyword ? `/appointments/admin?q=${encodeURIComponent(keyword)}` : '/appointments/admin')
  }

  const handleOpenNotifications = () => {
    setShowProfile(false)
    setShowScheduleLogs(false)
    setShowNotifications((value) => !value)
    fetchNotifications(1)
  }

  const handleOpenScheduleLogs = () => {
    setShowProfile(false)
    setShowNotifications(false)
    const nextState = !showScheduleLogs
    setShowScheduleLogs(nextState)
    if (nextState && scheduleLogs.length > 0) {
      // Mark as read
      localStorage.setItem('last_seen_schedule_log_id', String(scheduleLogs[0].id))
      setUnreadScheduleLogs(0)
    }
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

          {/* Schedule Logs Notification */}
          {hasPermission('manage_appointment_schedule') && (
            <div className="header-notification">
              <button className="header-notification-btn" title="Thay đổi lịch từ đối tác" onClick={handleOpenScheduleLogs}>
                <History size={20} />
                {unreadScheduleLogs > 0 && <span className="notification-badge">{unreadScheduleLogs > 99 ? '99+' : unreadScheduleLogs}</span>}
              </button>

              {showScheduleLogs && (
                <div className="notification-menu" style={{ width: 380 }}>
                  <div className="notification-menu-header">
                    <div>
                      <p className="notification-title">Thay đổi lịch từ Đối tác</p>
                      <p className="notification-subtitle">10 thao tác Bật/Tắt lịch gần nhất</p>
                    </div>
                  </div>

                  <div className="notification-list">
                    {scheduleLogs.length === 0 && !loadingScheduleLogs ? (
                      <div className="notification-empty">Không có thay đổi lịch nào.</div>
                    ) : (
                      scheduleLogs.map((log) => {
                        const data = log.new_data || log.old_data;
                        const isTurnedOn = data?.status === 1;
                        const sessionMap = { 1: 'Sáng', 2: 'Chiều', 3: 'Tối', 4: 'Đêm' };
                        const dowMap = { 0: 'CN', 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7' };
                        const clinic = clinics.find(c => String(c.id) === String(data?.clinic_id));
                        const doctorName = clinic?.name || `Bác sĩ #${data?.clinic_id}`;
                        const partner = partners.find(p => String(p.id) === String(data?.partner_id));
                        const partnerName = partner?.name || log.user_email || 'Đối tác';
                        const formattedDate = log.created_at ? new Date(log.created_at * 1000).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
                        
                        return (
                          <button
                            key={log.id}
                            type="button"
                            className="notification-item"
                            onClick={() => { setShowScheduleLogs(false); navigate('/appointment-schedule'); }}
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'flex-start', textAlign: 'left' }}
                          >
                            <span className="notification-dot" style={{ background: isTurnedOn ? '#10b981' : '#ef4444' }} />
                            <span className="notification-content">
                              <strong>Đối tác {partnerName}</strong>
                              <span className="notification-meta" style={{ color: isTurnedOn ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                                {isTurnedOn ? 'Vừa BẬT lịch' : 'Vừa TẮT lịch'}
                              </span>
                              {data && (
                                <span className="notification-meta" style={{ fontSize: 13, marginTop: 4 }}>
                                  Bác sĩ: <strong>{doctorName}</strong><br/>
                                  Buổi: <strong>{sessionMap[data.session_type]} {dowMap[data.day_of_week]}</strong> ({data.start_time?.slice(0,5)} - {data.end_time?.slice(0,5)})
                                </span>
                              )}
                              <span className="notification-meta" style={{ fontSize: 11, marginTop: 4, color: '#94a3b8' }}>
                                Vào lúc: {formattedDate}
                              </span>
                            </span>
                          </button>
                        )
                      })
                    )}
                    {loadingScheduleLogs && <div className="notification-loading">Đang tải...</div>}
                  </div>
                </div>
              )}
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
