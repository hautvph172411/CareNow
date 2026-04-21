import { useState } from 'react'
import AdminLayout from '../layouts/AdminLayout'

export default function Dashboard() {
  const [stats] = useState([
    { label: 'Tổng bác sĩ', value: '24', icon: '👨‍⚕️', color: 'appointments' },
    { label: 'Tổng chuyên khoa', value: '8', icon: '🏥', color: 'patients' },
    { label: 'Tổng người dùng', value: '156', icon: '👥', color: 'doctors' },
    { label: 'Lịch hẹn hôm nay', value: '42', icon: '📅', color: 'revenue' },
  ])

  const [appointments] = useState([
    {
      id: 1,
      patientName: 'Nguyễn Văn A',
      doctor: 'Dr. Trần Thị B',
      time: '09:00',
      status: 'confirmed',
    },
    {
      id: 2,
      patientName: 'Lê Thị C',
      doctor: 'Dr. Phạm Văn D',
      time: '10:30',
      status: 'pending',
    },
    {
      id: 3,
      patientName: 'Hoàng Văn E',
      doctor: 'Dr. Nguyễn Thị F',
      time: '14:00',
      status: 'completed',
    },
  ])

  return (
    <AdminLayout pageTitle="Bảng điều khiển">
      <div className="dashboard-stats">
        {stats.map((stat, idx) => (
          <div key={idx} className="stat-card">
            <div className={`stat-icon ${stat.color}`}>{stat.icon}</div>
            <div className="stat-content">
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-change positive">+12% từ tháng trước</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Lịch hẹn hôm nay</h2>
          <a href="/appointments" className="section-link" onClick={(e) => e.preventDefault()}>Xem tất cả</a>
        </div>

        <div className="appointments-table">
          <table>
            <thead>
              <tr>
                <th>Bệnh nhân</th>
                <th>Bác sĩ</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt) => (
                <tr key={appt.id}>
                  <td>{appt.patientName}</td>
                  <td>{appt.doctor}</td>
                  <td>{appt.time}</td>
                  <td>
                    <span className={`status-badge status-${appt.status}`}>
                      {appt.status === 'confirmed' && 'Xác nhận'}
                      {appt.status === 'pending' && 'Chờ xác nhận'}
                      {appt.status === 'completed' && 'Hoàn tất'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
