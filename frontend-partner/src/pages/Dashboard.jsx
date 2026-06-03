import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import { getDashboardStats } from '../api/dashboard.api';

const STATUS_META = {
  1: { label: 'Chờ xác nhận', bg: '#fef3c7', color: '#92400e' },
  2: { label: 'Đã xác nhận', bg: '#dbeafe', color: '#1d4ed8' },
  3: { label: 'Đã khám xong', bg: '#dcfce7', color: '#166534' },
  4: { label: 'Bệnh nhân hủy', bg: '#fee2e2', color: '#991b1b' },
  5: { label: 'Phòng khám hủy', bg: '#fee2e2', color: '#991b1b' },
  6: { label: 'Không đến', bg: '#e5e7eb', color: '#374151' },
};

function formatDate(val) {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('vi-VN');
}

function formatTime(val) {
  if (!val) return '';
  return String(val).slice(0, 5);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await getDashboardStats();
        if (res.success) setStats(res.data);
      } catch (e) {
        console.error(e);
        setError('Không tải được thống kê');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const statCards = stats
    ? [
        { label: 'Tổng bác sĩ', value: stats.total_clinics, icon: '👨‍⚕️', color: 'appointments' },
        { label: 'Tổng chuyên khoa', value: stats.total_specialties, icon: '🏥', color: 'patients' },
        { label: 'Lịch hẹn hôm nay', value: stats.appt_today, icon: '📅', color: 'doctors' },
        { label: 'Chờ xác nhận', value: stats.appt_pending, icon: '⏳', color: 'revenue' },
      ]
    : [];

  return (
    <AdminLayout pageTitle="Bảng điều khiển">
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Đang tải thống kê...</div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>{error}</div>
      ) : (
        <>
          <div className="dashboard-stats">
            {statCards.map((stat, idx) => (
              <div key={idx} className="stat-card">
                <div className={`stat-icon ${stat.color}`}>{stat.icon}</div>
                <div className="stat-content">
                  <div className="stat-label">{stat.label}</div>
                  <div className="stat-value">{stat.value ?? 0}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="dashboard-section">
            <div className="section-header">
              <h2 className="section-title">5 lịch hẹn gần nhất</h2>
              <button
                className="section-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-color)', fontWeight: 600 }}
                onClick={() => navigate('/appointments/admin')}
              >
                Xem tất cả →
              </button>
            </div>

            <div className="appointments-table">
              <table>
                <thead>
                  <tr>
                    <th>Mã lịch</th>
                    <th>Bệnh nhân</th>
                    <th>Bác sĩ</th>
                    <th>Ngày khám</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats?.recent_appointments || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>
                        Chưa có lịch hẹn nào
                      </td>
                    </tr>
                  ) : (
                    (stats.recent_appointments || []).map((appt) => {
                      const meta = STATUS_META[appt.status] || { label: 'Không rõ', bg: '#f1f5f9', color: '#475569' };
                      return (
                        <tr key={appt.id}>
                          <td><strong>{appt.booking_code || `#${appt.id}`}</strong></td>
                          <td>{appt.patient_name}</td>
                          <td>{appt.clinic_name || '—'}</td>
                          <td>{formatDate(appt.appt_date)} {formatTime(appt.appt_time)}</td>
                          <td>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              borderRadius: 999,
                              padding: '3px 10px',
                              fontSize: 12,
                              fontWeight: 700,
                              background: meta.bg,
                              color: meta.color,
                              whiteSpace: 'nowrap',
                            }}>
                              {meta.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
