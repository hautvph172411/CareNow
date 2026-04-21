
import { Edit2, Trash2, Lock, Unlock } from 'lucide-react'
import '../styles/user-table.css'

export default function DoctorTable({ doctors, onEdit, onDelete }) {
  return (
    <div className="table-wrapper">
      <table className="management-table">
        <thead>
          <tr>
            <th>Tên bác sĩ</th>
            <th>Khoa</th>
            <th>Ảnh</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {doctors.map((doctor) => (
            <tr key={doctor.id}>
              <td>{doctor.name}</td>
              <td>{doctor.address}</td>
              <td>
                <img src={doctor.picture} alt="Doctor" style={{ width: 80, height: 40, objectFit: 'cover', borderRadius: 4 }} />
              </td>
              <td>
                <button className="action-btn edit-btn" onClick={() => onEdit(doctor)} title="Chỉnh sửa">
                  <Edit2 size={16} />
                </button>
                <button className="action-btn delete-btn" onClick={() => onDelete(doctor.id)} title="Xóa">
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
