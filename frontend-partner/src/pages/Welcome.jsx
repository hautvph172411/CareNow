import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, ArrowRight, User, CalendarCheck,
  CalendarClock, TrendingUp, Activity
} from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { getDashboardStats } from '../api/dashboard.api';
import { useAuth } from '../hooks/useAuth';

function StatusPill({ status }) {
  const map = {
    1: { label: 'Chờ xác nhận', bg: '#fef3c7', color: '#92400e' },
    2: { label: 'Đã xác nhận',  bg: '#dbeafe', color: '#1d4ed8' },
    3: { label: 'Đã khám',      bg: '#dcfce7', color: '#166534' },
    4: { label: 'Hủy',          bg: '#fee2e2', color: '#991b1b' },
    5: { label: 'Hủy',          bg: '#fee2e2', color: '#991b1b' },
    6: { label: 'Không đến',    bg: '#f1f5f9', color: '#475569' },
  };
  const s = map[status] || { label: '—', bg: '#f1f5f9', color: '#475569' };
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
      {s.label}
    </span>
  );
}

export default function Welcome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(res => { if (res?.data) setStats(res.data); })
      .catch(err => console.error('Dashboard error', err))
      .finally(() => setLoading(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 6)  return 'Chào đêm khuya';
    if (h < 12) return 'Chào buổi sáng';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const formatDate = (v) => {
    if (!v) return '';
    return new Date(v).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  const formatTime = (v) => v ? String(v).slice(0, 5) : '';

  const statCards = [
    {
      label: 'Lịch hẹn hôm nay',
      value: stats?.appt_today ?? '—',
      icon: Calendar,
      gradient: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
      iconBg: 'rgba(255,255,255,0.2)',
      textColor: 'white',
      onClick: () => navigate('/appointments'),
      btnLabel: 'Xem lịch hẹn',
    },
    {
      label: 'Chờ xác nhận',
      value: stats?.appt_pending ?? '—',
      icon: Clock,
      iconBg: '#fef3c7',
      iconColor: '#d97706',
      valueColor: '#d97706',
      bg: 'white',
      onClick: () => navigate('/appointments'),
      btnLabel: 'Xử lý ngay',
    },
    {
      label: 'Ca làm việc',
      value: null,
      icon: CalendarClock,
      iconBg: '#f0fdf4',
      iconColor: '#16a34a',
      bg: 'white',
      onClick: () => navigate('/schedule'),
      btnLabel: 'Quản lý lịch',
      bodyText: 'Thiết lập & theo dõi lịch bác sĩ'
    },
  ];

  return (
    <AdminLayout pageTitle="">
      {/* Hero greeting */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'var(--gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 16, fontWeight: 800, flexShrink: 0,
            boxShadow: '0 4px 12px rgba(14,165,233,0.3)'
          }}>
            {(user?.display_name || user?.username || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--gray-900)', margin: 0, letterSpacing: '-0.5px' }}>
              {greeting()}, {user?.display_name || user?.username || 'Đối tác'} 👋
            </h1>
            <p style={{ color: 'var(--gray-400)', fontSize: 14, margin: '3px 0 0' }}>
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', flexDirection: 'column', gap: 12, color: 'var(--gray-400)' }}>
          <Activity size={32} className="loading-spinner" />
          <p style={{ fontSize: 14 }}>Đang tải dữ liệu...</p>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 28 }}>
            {statCards.map((card, i) => {
              const Icon = card.icon;
              const isGradient = !!card.gradient;
              return (
                <div
                  key={i}
                  style={{
                    background: card.gradient || card.bg || 'white',
                    borderRadius: 'var(--radius-lg)',
                    padding: 24,
                    border: isGradient ? 'none' : '1px solid var(--gray-200)',
                    boxShadow: isGradient
                      ? '0 8px 24px rgba(14,165,233,0.25)'
                      : 'var(--shadow)',
                    transition: 'var(--transition-slow)',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = isGradient ? '0 16px 32px rgba(14,165,233,0.3)' : 'var(--shadow-lg)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = isGradient ? '0 8px 24px rgba(14,165,233,0.25)' : 'var(--shadow)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: isGradient ? 'rgba(255,255,255,0.8)' : 'var(--gray-500)', marginBottom: 8 }}>
                        {card.label}
                      </div>
                      {card.value !== null ? (
                        <div style={{ fontSize: 40, fontWeight: 900, color: isGradient ? 'white' : (card.valueColor || 'var(--gray-900)'), lineHeight: 1 }}>
                          {card.value}
                        </div>
                      ) : (
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-700)', marginTop: 8, lineHeight: 1.5 }}>
                          {card.bodyText}
                        </div>
                      )}
                    </div>
                    <div style={{
                      width: 48, height: 48, borderRadius: 'var(--radius-md)',
                      background: card.iconBg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isGradient ? 'white' : (card.iconColor || 'var(--gray-600)'),
                      flexShrink: 0
                    }}>
                      <Icon size={22} />
                    </div>
                  </div>
                  <button
                    onClick={card.onClick}
                    style={{
                      width: '100%',
                      background: isGradient ? 'rgba(255,255,255,0.15)' : 'var(--gray-50)',
                      border: isGradient ? '1px solid rgba(255,255,255,0.25)' : '1px solid var(--gray-200)',
                      borderRadius: 'var(--radius)',
                      padding: '8px 16px',
                      color: isGradient ? 'white' : 'var(--gray-600)',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      transition: 'var(--transition)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = isGradient ? 'rgba(255,255,255,0.25)' : 'var(--gray-100)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isGradient ? 'rgba(255,255,255,0.15)' : 'var(--gray-50)'; }}
                  >
                    {card.btnLabel} <ArrowRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Recent appointments table */}
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-200)', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />
                <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--gray-900)' }}>Lịch hẹn mới nhất</h2>
              </div>
              <button
                onClick={() => navigate('/appointments')}
                style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                Xem tất cả <ArrowRight size={13} />
              </button>
            </div>

            {!stats?.recent_appointments?.length ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--gray-400)' }}>
                <CalendarCheck size={36} style={{ opacity: 0.25, margin: '0 auto 12px' }} />
                <p style={{ fontSize: 14 }}>Chưa có lịch hẹn nào</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--gray-50)' }}>
                      {['Bệnh nhân', 'Thời gian', 'Trạng thái'].map(h => (
                        <th key={h} style={{ padding: '11px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1px solid var(--gray-100)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent_appointments.map((a, i) => (
                      <tr
                        key={a.id}
                        style={{ borderBottom: '1px solid var(--gray-50)', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-50)'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}
                      >
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 34, height: 34, borderRadius: '50%',
                              background: 'var(--gray-100)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'var(--gray-500)', flexShrink: 0
                            }}>
                              <User size={16} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--gray-900)' }}>{a.patient_name}</div>
                              <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 1 }}>{a.patient_phone || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--primary)' }}>{formatDate(a.appt_date)}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>
                            <Clock size={11} /> {formatTime(a.appt_time) || '—'}
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <StatusPill status={a.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
