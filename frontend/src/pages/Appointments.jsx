import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Clock,
  FileText,
  Filter,
  Phone,
  Plus,
  RefreshCw,
  Search,
  User,
  X,
} from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import Pagination from '../components/Pagination';
import {
  createAppointment,
  deleteAppointment,
  getAppointments,
  updateAppointment,
} from '../api/appointment.api';
import '../styles/appointments.css';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: '1', label: 'Chờ xác nhận' },
  { value: '2', label: 'Đã xác nhận' },
  { value: '3', label: 'Đã khám xong' },
  { value: '4', label: 'Bệnh nhân hủy' },
  { value: '5', label: 'Phòng khám hủy' },
  { value: '6', label: 'Không đến' },
];

const STATUS_META = {
  1: { label: 'Chờ xác nhận', bg: '#fef3c7', color: '#92400e' },
  2: { label: 'Đã xác nhận', bg: '#dbeafe', color: '#1d4ed8' },
  3: { label: 'Đã khám xong', bg: '#dcfce7', color: '#166534' },
  4: { label: 'Bệnh nhân hủy', bg: '#fee2e2', color: '#991b1b' },
  5: { label: 'Phòng khám hủy', bg: '#fee2e2', color: '#991b1b' },
  6: { label: 'Không đến', bg: '#e5e7eb', color: '#374151' },
};

const emptyForm = () => ({
  patient_name: '',
  patient_phone: '',
  patient_email: '',
  patient_address: '',
  patient_notes: '',
  admin_notes: '',
  appt_date: '',
  appt_time: '',
  status: '1',
  clinic_id: '',
  clinic_place_id: '',
  specialist_id: '',
  service_id: '',
  amount_vnd: '',
});

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('vi-VN');
}

function formatTime(value) {
  if (!value) return '—';
  return String(value).slice(0, 5);
}

function toDateInput(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function toTimeInput(value) {
  if (!value) return '';
  return String(value).slice(0, 5);
}

function StatusBadge({ status }) {
  const meta = STATUS_META[Number(status)] || { label: 'Không rõ', bg: '#f1f5f9', color: '#475569' };
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      borderRadius: 999,
      padding: '4px 10px',
      fontSize: 12,
      fontWeight: 700,
      background: meta.bg,
      color: meta.color,
      whiteSpace: 'nowrap',
    }}>
      {meta.label}
    </span>
  );
}

export default function Appointments() {
  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [status, setStatus] = useState('');
  const [apptDate, setApptDate] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const limit = 20;

  const params = useMemo(() => {
    const next = { page, limit };
    if (searchTerm.trim()) next.keyword = searchTerm.trim();
    if (status) next.status = status;
    if (apptDate) next.appt_date = apptDate;
    return next;
  }, [page, searchTerm, status, apptDate]);

  useEffect(() => {
    const keyword = searchParams.get('q') || '';
    setSearchTerm(keyword);
    setPage(1);
  }, [searchParams]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAppointments(params);
      setRows(res?.data || []);
      setTotalPages(res?.pagination?.totalPages || 1);
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || 'Không tải được danh sách đơn đặt khám');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const resetFilters = () => {
    setSearchTerm('');
    setStatus('');
    setApptDate('');
    setPage(1);
  };

  const openCreateModal = () => {
    setEditingRow(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEditModal = (row) => {
    setEditingRow(row);
    setForm({
      patient_name: row.patient_name || '',
      patient_phone: row.patient_phone || '',
      patient_email: row.patient_email || '',
      patient_address: row.patient_address || '',
      patient_notes: row.patient_notes || '',
      admin_notes: row.admin_notes || '',
      appt_date: toDateInput(row.appt_date),
      appt_time: toTimeInput(row.appt_time),
      status: String(row.status || 1),
      clinic_id: row.clinic_id || '',
      clinic_place_id: row.clinic_place_id || '',
      specialist_id: row.specialist_id || '',
      service_id: row.service_id || '',
      amount_vnd: row.amount_vnd || '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingRow(null);
    setForm(emptyForm());
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const buildPayload = () => ({
    ...form,
    status: Number(form.status || 1),
    clinic_id: form.clinic_id || undefined,
    clinic_place_id: form.clinic_place_id || undefined,
    specialist_id: form.specialist_id || undefined,
    service_id: form.service_id || undefined,
    amount_vnd: form.amount_vnd || undefined,
  });

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingRow) {
        await updateAppointment(editingRow.id, buildPayload());
        alert('Đã cập nhật lịch hẹn');
      } else {
        await createAppointment(buildPayload());
        alert('Đã thêm lịch hẹn');
      }
      closeModal();
      await fetchList();
    } catch (err) {
      alert(err.response?.data?.message || 'Lưu lịch hẹn thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Xóa lịch hẹn ${row.booking_code || `#${row.id}`}?`)) return;
    try {
      await deleteAppointment(row.id);
      await fetchList();
    } catch (err) {
      alert(err.response?.data?.message || 'Xóa lịch hẹn thất bại');
    }
  };

  return (
    <AdminLayout pageTitle="Đơn đặt khám">
      <div className="appointments-page">
        <div className="appointments-hero">
          <div>
            <h1>Đơn đặt khám</h1>
            <p>Quản lý lịch hẹn khám bệnh</p>
          </div>
          <button type="button" className="btn-primary" onClick={openCreateModal}>
            <Plus size={18} />
            Thêm lịch hẹn
          </button>
        </div>

        <div className="appointments-toolbar">
          <div className="appointments-search">
            <Search size={18} />
            <input
              placeholder="Tìm theo #id, Họ và tên, Số điện thoại đặt lịch"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>
          <button type="button" className="appointments-filter-btn" onClick={resetFilters}>
            <RefreshCw size={16} />
            Làm mới
          </button>
          <button type="button" className="appointments-filter-btn" title="Lọc theo ngày và trạng thái">
            <Filter size={16} />
            Lọc
          </button>
          <input
            className="appointments-filter-input"
            type="date"
            value={apptDate}
            onChange={(e) => { setApptDate(e.target.value); setPage(1); }}
          />
          <select
            className="appointments-filter-input"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="appointments-table-shell">
          <div className="appointments-card">
            {loading ? (
              <div className="appointments-loading">Đang tải...</div>
            ) : (
              <>
              <table className="appointments-table">
                <thead>
                  <tr>
                    <th>Mã lịch</th>
                    <th>Ngày khám</th>
                    <th>Bệnh nhân</th>
                    <th>Bác sĩ</th>
                    <th>Chuyên khoa</th>
                    <th>Trạng thái</th>
                    <th>Ghi chú</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <strong>{row.booking_code || `#${row.id}`}</strong>
                      </td>
                      <td>
                        <div className="appointments-date">
                          <Calendar size={15} />
                          <strong>{formatDate(row.appt_date)}</strong>
                        </div>
                        <div className="appointments-muted appointments-date">
                          <Clock size={13} />
                          {formatTime(row.appt_time)}
                        </div>
                      </td>
                      <td>
                        <div className="appointments-person">
                          <User size={15} />
                          <strong>{row.patient_name}</strong>
                        </div>
                        <div className="appointments-muted appointments-person">
                          <Phone size={13} />
                          {row.patient_phone || '—'}
                        </div>
                      </td>
                      <td>
                        <strong>{row.clinic_name || 'Chưa chọn bác sĩ'}</strong>
                        <div className="appointments-muted">{row.place_name || 'Chưa chọn cơ sở'}</div>
                      </td>
                      <td>
                        <span className="appointments-specialty-chip">
                          {row.specialist_name || row.service_name || 'Khám bệnh'}
                        </span>
                      </td>
                      <td><StatusBadge status={row.status} /></td>
                      <td>
                        <div className="appointments-note">
                          <FileText size={14} />
                          <span>{row.patient_notes || row.admin_notes || '—'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="appointments-actions">
                          <button
                            type="button"
                            className="appointments-action-text"
                            onClick={() => openEditModal(row)}
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="appointments-action-text danger"
                            onClick={() => handleDelete(row)}
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length === 0 && <p className="appointments-empty">Chưa có đơn đặt khám nào</p>}
              {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
              </>
            )}
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content appointments-crud-modal">
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{editingRow ? 'Sửa lịch hẹn' : 'Thêm lịch hẹn mới'}</h2>
                <p className="appointments-modal-subtitle">Nhập thông tin bệnh nhân và lịch khám bệnh</p>
              </div>
              <button type="button" className="modal-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="modal-body appointments-modal-body">
              <div className="appointments-form-section-title">Thông tin bệnh nhân</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Họ tên bệnh nhân *</label>
                  <input className="form-input" name="patient_name" value={form.patient_name} onChange={handleFormChange} placeholder="Nhập họ tên" required />
                </div>
                <div className="form-group">
                  <label>Số điện thoại *</label>
                  <input className="form-input" name="patient_phone" value={form.patient_phone} onChange={handleFormChange} placeholder="0xxx-xxxx-xxxx" required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input className="form-input" name="patient_email" type="email" value={form.patient_email} onChange={handleFormChange} placeholder="email@example.com" />
                </div>
                <div className="form-group">
                  <label>Địa chỉ</label>
                  <input className="form-input" name="patient_address" value={form.patient_address} onChange={handleFormChange} placeholder="Nhập địa chỉ" />
                </div>
              </div>

              <div className="appointments-form-divider" />
              <div className="appointments-form-section-title">Thông tin lịch khám</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Ngày khám *</label>
                  <input className="form-input" name="appt_date" type="date" value={form.appt_date} onChange={handleFormChange} required />
                </div>
                <div className="form-group">
                  <label>Giờ khám *</label>
                  <input className="form-input" name="appt_time" type="time" value={form.appt_time} onChange={handleFormChange} required />
                </div>
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select className="form-input" name="status" value={form.status} onChange={handleFormChange}>
                    {STATUS_OPTIONS.filter((option) => option.value).map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Số tiền (VND)</label>
                  <input className="form-input" name="amount_vnd" type="number" min="0" value={form.amount_vnd} onChange={handleFormChange} />
                </div>
                <div className="form-group">
                  <label>ID bác sĩ</label>
                  <input className="form-input" name="clinic_id" type="number" min="1" value={form.clinic_id} onChange={handleFormChange} />
                </div>
                <div className="form-group">
                  <label>ID cơ sở</label>
                  <input className="form-input" name="clinic_place_id" type="number" min="1" value={form.clinic_place_id} onChange={handleFormChange} />
                </div>
                <div className="form-group">
                  <label>ID chuyên khoa</label>
                  <input className="form-input" name="specialist_id" type="number" min="1" value={form.specialist_id} onChange={handleFormChange} />
                </div>
                <div className="form-group">
                  <label>ID dịch vụ</label>
                  <input className="form-input" name="service_id" type="number" min="1" value={form.service_id} onChange={handleFormChange} />
                </div>
                <div className="form-group full-width">
                  <label>Ghi chú bệnh nhân</label>
                  <textarea className="form-input" name="patient_notes" rows={3} value={form.patient_notes} onChange={handleFormChange} placeholder="Nhập ghi chú (triệu chứng, lý do khám...)" />
                </div>
                <div className="form-group full-width">
                  <label>Ghi chú nội bộ</label>
                  <textarea className="form-input" name="admin_notes" rows={3} value={form.admin_notes} onChange={handleFormChange} />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal} disabled={saving}>Hủy</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu lịch hẹn'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
