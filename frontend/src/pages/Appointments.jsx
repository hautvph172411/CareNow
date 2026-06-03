import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Download,
  FileText,
  Phone,
  Plus,
  RefreshCw,
  Search,
  User,
  X,
  Stethoscope,
  MapPin,
  Trash2,
  Pencil,
  Pin,
  PinOff,
  Save,
} from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import Pagination from '../components/Pagination';
import {
  createAppointment,
  deleteAppointment,
  getAppointments,
  updateAppointment,
} from '../api/appointment.api';
import { getClinics } from '../api/clinic.api';
import { getClinicPlaces } from '../api/clinic_place.api';
import { getSpecialties } from '../api/specialty.api';
import { getServices } from '../api/service.api';
import { getPartners } from '../api/partner.api';
import SearchableSelect from '../components/SearchableSelect';
import '../styles/appointments.css';
import { useAuth } from '../hooks/useAuth';

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
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [status, setStatus] = useState('');
  const [apptDate, setApptDate] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [placeFilterId, setPlaceFilterId] = useState('');
  const [filterNotice, setFilterNotice] = useState('');
  const [showSearch, setShowSearch] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [rowStatusDraft, setRowStatusDraft] = useState({});
  const [pinnedIds, setPinnedIds] = useState([]);
  const [internalNoteDraft, setInternalNoteDraft] = useState({});
  const [noteEditingId, setNoteEditingId] = useState(null);
  const noticeTimerRef = useRef(null);
  const limit = 20;

  // Dropdown data
  const [clinics, setClinics] = useState([]);
  const [places, setPlaces] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [services, setServices] = useState([]);
  const [partners, setPartners] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [cRes, pRes, sRes, svRes, ptRes] = await Promise.all([
          getClinics({ limit: 500, page: 1 }),
          getClinicPlaces({ limit: 500, page: 1 }),
          getSpecialties({ limit: 500, page: 1 }),
          getServices({ limit: 500, page: 1 }),
          getPartners({ limit: 500, page: 1 }),
        ]);
        if (cRes?.data)  setClinics(cRes.data);
        if (pRes?.data)  setPlaces(pRes.data);
        if (sRes?.data)  setSpecialties(sRes.data);
        if (svRes?.data) setServices(svRes.data);
        if (ptRes?.data) setPartners(ptRes.data);
      } catch (e) {
        console.error('[appointments] dropdown load error', e);
      }
    })();
  }, []);

  const params = useMemo(() => {
    const next = { page, limit };
    if (searchTerm.trim()) next.keyword = searchTerm.trim();
    if (status) next.status = status;
    if (apptDate) next.appt_date = apptDate;
    if (partnerId) next.partner_id = partnerId;
    if (placeFilterId) next.clinic_place_id = placeFilterId;
    return next;
  }, [page, searchTerm, status, apptDate, partnerId, placeFilterId]);

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

  useEffect(() => () => {
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('appointments_pinned_ids_v1');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setPinnedIds(parsed.map((x) => Number(x)).filter(Boolean));
    } catch (e) {
      console.error('Load pinned ids failed', e);
    }
  }, []);

  useEffect(() => {
    const map = {};
    rows.forEach((r) => { map[r.id] = r.admin_notes || ''; });
    setInternalNoteDraft((prev) => ({ ...map, ...prev }));
  }, [rows]);

  const resetFilters = () => {
    setSearchTerm('');
    setStatus('');
    setApptDate('');
    setPartnerId('');
    setPlaceFilterId('');
    setFilterNotice('Đã reset bộ lọc đối tác.');
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

  const updateStatusQuick = async (row, nextStatus) => {
    try {
      await updateAppointment(row.id, { status: nextStatus });
      await fetchList();
    } catch (err) {
      alert(err.response?.data?.message || 'Cập nhật trạng thái thất bại');
    }
  };

  const handleConfirmRowStatus = async (row) => {
    const nextStatus = Number(rowStatusDraft[row.id] ?? row.status);
    if (nextStatus === Number(row.status)) return;
    await updateStatusQuick(row, nextStatus);
    setRowStatusDraft((prev) => ({ ...prev, [row.id]: undefined }));
  };

  const handlePartnerFilterChange = (val) => {
    setPartnerId(val || '');
    setPage(1);
    const selected = (partners || []).find((p) => String(p.id) === String(val));
    setFilterNotice(selected ? `Đang lọc theo đối tác: ${selected.name}` : 'Đã bỏ lọc đối tác.');
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => setFilterNotice(''), 2500);
  };

  const togglePin = (rowId) => {
    setPinnedIds((prev) => {
      const exists = prev.includes(rowId);
      const next = exists ? prev.filter((id) => id !== rowId) : [rowId, ...prev];
      localStorage.setItem('appointments_pinned_ids_v1', JSON.stringify(next));
      return next;
    });
  };

  const readNotes = (adminNotes) => {
    if (!adminNotes) return [];
    if (typeof adminNotes !== 'string') return [];
    const text = adminNotes.trim();
    if (!text) return [];
    if (text.startsWith('__NOTES_JSON__')) {
      try {
        return JSON.parse(text.replace('__NOTES_JSON__', '')) || [];
      } catch {
        return [];
      }
    }
    return [{ id: `legacy-${Date.now()}`, text, at: null, by: null }];
  };

  const writeNotes = (notes) => `__NOTES_JSON__${JSON.stringify(notes)}`;

  const saveInternalNote = async (row) => {
    try {
      const rawNote = (internalNoteDraft[row.id] ?? '').trim();
      if (!rawNote) return;
      const actor = user?.display_name || user?.username || 'Nhân viên';
      const nowIso = new Date().toISOString();
      const existing = readNotes(row.admin_notes);
      const next = [
        ...existing,
        { id: `n-${Date.now()}`, by: actor, at: nowIso, text: rawNote },
      ];
      await updateAppointment(row.id, { admin_notes: writeNotes(next) });
      setInternalNoteDraft((prev) => ({ ...prev, [row.id]: '' }));
      setNoteEditingId(null);
      await fetchList();
    } catch (err) {
      alert(err.response?.data?.message || 'Lưu ghi chú nội bộ thất bại');
    }
  };

  const deleteInternalNote = async (row, noteId) => {
    try {
      const existing = readNotes(row.admin_notes);
      const next = existing.filter((n) => n.id !== noteId);
      await updateAppointment(row.id, { admin_notes: writeNotes(next) });
      await fetchList();
    } catch (err) {
      alert(err.response?.data?.message || 'Xóa ghi chú nội bộ thất bại');
    }
  };

  const exportAppointmentsCsv = async () => {
    try {
      const exportParams = { ...params, page: 1, limit: 2000 };
      const res = await getAppointments(exportParams);
      const data = res?.data || [];
      const lines = [
        [
          'Mã lịch',
          'ID',
          'Ngày khám',
          'Giờ khám',
          'Bệnh nhân',
          'SĐT',
          'Email',
          'Bác sĩ',
          'Nơi khám',
          'Trạng thái',
          'Lý do khám',
          'Ghi chú nội bộ',
        ].join(','),
      ];
      data.forEach((r) => {
        const row = [
          r.booking_code || '',
          r.id || '',
          formatDate(r.appt_date),
          formatTime(r.appt_time),
          r.patient_name || '',
          r.patient_phone || '',
          r.patient_email || '',
          r.clinic_name || '',
          r.place_name || '',
          STATUS_META[Number(r.status)]?.label || '',
          (r.patient_notes || '').replace(/\n/g, ' '),
          readNotes(r.admin_notes).map((n) => `${n.by || 'Nhân viên'} - ${n.at ? new Date(n.at).toLocaleString('vi-VN') : ''}: ${n.text}`).join(' | '),
        ].map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`);
        lines.push(row.join(','));
      });
      const csv = `\uFEFF${lines.join('\n')}`;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `don-dat-kham-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.response?.data?.message || 'Xuất Excel thất bại');
    }
  };

  const displayRows = useMemo(() => {
    if (!rows?.length) return [];
    return [...rows].sort((a, b) => {
      const ap = pinnedIds.includes(a.id) ? 1 : 0;
      const bp = pinnedIds.includes(b.id) ? 1 : 0;
      if (ap !== bp) return bp - ap;
      return 0;
    });
  }, [rows, pinnedIds]);
  const cancelledByPatientCount = useMemo(
    () => (rows || []).filter((r) => Number(r.status) === 4).length,
    [rows]
  );

  return (
    <AdminLayout pageTitle="Đơn đặt khám" defaultSidebarCollapsed={true}>
      <div className="appointments-page">
        {cancelledByPatientCount > 0 ? (
          <div style={{
            marginBottom: 12,
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid #fecaca',
            background: '#fff1f2',
            color: '#b91c1c',
            fontWeight: 700,
            fontSize: 14,
          }}>
            Có {cancelledByPatientCount} lịch vừa được bệnh nhân hủy. Vui lòng xử lý.
          </div>
        ) : null}
        {filterNotice ? (
          <div style={{
            marginBottom: 12,
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid #bfdbfe',
            background: '#eff6ff',
            color: '#1d4ed8',
            fontWeight: 600,
            fontSize: 14,
          }}>
            {filterNotice}
          </div>
        ) : null}
        <div className="appointments-hero">
          <button type="button" className="btn btn-secondary" onClick={exportAppointmentsCsv}>
            <Download size={16} />
            Xuất Excel
          </button>
          <button type="button" className="btn-primary" onClick={openCreateModal}>
            <Plus size={18} />
            Thêm lịch hẹn
          </button>
        </div>

        <div className="management-header" style={{ justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            {/* Bộ lọc luôn hiển thị */}
          </div>
        </div>

        <div className={`filter-section ${showSearch ? 'show' : ''}`}>
          <div className="filter-container">
          <div className="search-box" style={{ margin: 0, flex: 1, minWidth: '300px' }}>
              <Search size={20} />
              <input
                placeholder="Tìm theo #id, Họ và tên, Số điện thoại đặt lịch"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              />
            </div>
            <div style={{ minWidth: 220 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>
                Ngày khám (lọc theo ngày hẹn)
              </label>
              <input
                className="form-input"
                style={{ width: '100%', height: '42px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0 12px' }}
                type="date"
                value={apptDate}
                onChange={(e) => { setApptDate(e.target.value); setPage(1); }}
              />
            </div>
            <div style={{ minWidth: 220 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>
                Trạng thái lịch (lọc tiến trình)
              </label>
              <select
                className="form-input"
                style={{ width: '100%', height: '42px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0 12px' }}
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div style={{ width: '260px', minWidth: '260px' }}>
              <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>
                Đối tác (lọc theo nơi quản lý)
              </label>
              <SearchableSelect
                name="partner_filter"
                options={[
                  { label: 'Tất cả đối tác', value: '' },
                  ...(partners || []).map((p) => ({ label: p.name, value: p.id })),
                ]}
                value={partnerId}
                onChange={handlePartnerFilterChange}
                placeholder="Chọn đối tác"
              />
            </div>
            <div style={{ width: '280px', minWidth: '280px' }}>
              <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>
                Nơi khám (lọc theo cơ sở)
              </label>
              <SearchableSelect
                name="place_filter"
                options={[
                  { label: 'Tất cả nơi khám', value: '' },
                  ...(places || []).map((p) => ({ label: p.display_name || p.name, value: p.id })),
                ]}
                value={placeFilterId}
                onChange={(val) => { setPlaceFilterId(val || ''); setPage(1); }}
                placeholder="Chọn nơi khám"
              />
            </div>
            <button type="button" className="btn btn-secondary" onClick={resetFilters} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <RefreshCw size={16} />
              Làm mới
            </button>
          </div>
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
                    <th>Thông tin lịch khám</th>
                    <th>Bệnh nhân & liên hệ</th>
                    <th>TT Admin</th>
                    <th>TT Đối tác</th>
                    <th>Lý do / ghi chú</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((row) => {
                    const isPatientCancelled = Number(row.status) === 4;
                    return (
                    <tr key={row.id} style={isPatientCancelled ? { background: '#fff7f7' } : undefined}>
                      <td>
                        <div><strong style={isPatientCancelled ? { textDecoration: 'line-through', color: '#9ca3af' } : undefined}>{row.booking_code || `#${row.id}`}</strong></div>
                        <div className="appointments-muted">#{row.id}</div>
                        {pinnedIds.includes(row.id) ? (
                          <div className="appointments-muted" style={{ color: '#2563eb', fontWeight: 700, marginTop: 4 }}>Đã ghim</div>
                        ) : null}
                      </td>
                      <td>
                        <div className="appointments-date">
                          <Calendar size={15} />
                          <strong style={isPatientCancelled ? { textDecoration: 'line-through', color: '#9ca3af' } : undefined}>{formatDate(row.appt_date)}</strong>
                        </div>
                        <div className="appointments-muted appointments-date">
                          <Clock size={13} />
                          {formatTime(row.appt_time)}
                        </div>
                        <div className="appointments-muted appointments-person">
                          <Stethoscope size={13} />
                          <strong style={isPatientCancelled ? { textDecoration: 'line-through', color: '#9ca3af' } : undefined}>{row.clinic_name || 'Chưa chọn bác sĩ'}</strong>
                        </div>
                        <div className="appointments-muted appointments-person">
                          <MapPin size={13} />
                          {row.place_name || 'Chưa chọn cơ sở'}
                        </div>
                        <div style={{ marginTop: 6 }}>
                          <span className="appointments-specialty-chip">
                            {row.specialist_name || row.service_name || 'Khám bệnh'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="appointments-person">
                          <User size={15} />
                          <strong style={isPatientCancelled ? { textDecoration: 'line-through', color: '#9ca3af' } : undefined}>{row.patient_name}</strong>
                        </div>
                        <div className="appointments-muted appointments-person">
                          <Phone size={13} />
                          {row.patient_phone || '—'}
                        </div>
                        {row.patient_email ? <div className="appointments-muted">{row.patient_email}</div> : null}
                      </td>
                      <td>
                        <div className="appointments-status-actions">
                          <select
                            className="form-input appointments-admin-status-select"
                            style={{ minWidth: 220, height: 38, margin: 0, borderRadius: 8, fontSize: 13 }}
                            value={String(rowStatusDraft[row.id] ?? row.status ?? 1)}
                            onChange={(e) => setRowStatusDraft((prev) => ({ ...prev, [row.id]: Number(e.target.value) }))}
                          >
                            {STATUS_OPTIONS.filter((option) => option.value).map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ height: 34, padding: '0 10px', fontSize: 12 }}
                            onClick={() => handleConfirmRowStatus(row)}
                            disabled={Number(rowStatusDraft[row.id] ?? row.status) === Number(row.status)}
                          >
                            Xác nhận
                          </button>
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={row.partner_status ?? row.status} />
                      </td>
                      <td>
                        {isPatientCancelled ? (
                          <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 700, color: '#b91c1c' }}>
                            Bệnh nhân đã hủy lịch
                          </div>
                        ) : null}
                        <div className="appointments-note">
                          <FileText size={14} />
                          <span>{row.patient_notes || '—'}</span>
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <button
                            type="button"
                            className="appointments-action-text"
                            onClick={() => setNoteEditingId((prev) => (prev === row.id ? null : row.id))}
                          >
                            <Pencil size={14} /> Ghi chú nội bộ
                          </button>
                        </div>
                        {noteEditingId === row.id && (
                          <div style={{ marginTop: 8 }}>
                            <textarea
                              className="form-input"
                              rows={2}
                              style={{ width: '100%', minWidth: 220, resize: 'vertical' }}
                              placeholder="Nhập ghi chú nội bộ..."
                              value={internalNoteDraft[row.id] ?? ''}
                              onChange={(e) => setInternalNoteDraft((prev) => ({ ...prev, [row.id]: e.target.value }))}
                            />
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ marginTop: 6, height: 32, padding: '0 10px', fontSize: 12 }}
                              onClick={() => saveInternalNote(row)}
                            >
                              <Save size={13} /> Lưu ghi chú
                            </button>
                          </div>
                        )}
                        {readNotes(row.admin_notes).length > 0 ? (
                          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {readNotes(row.admin_notes).map((n) => (
                              <div key={n.id} className="appointments-muted" style={{ whiteSpace: 'normal', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                <span style={{ flex: 1 }}>
                                  <strong>{n.by || 'Nhân viên'}</strong>
                                  {n.at ? ` - ${new Date(n.at).toLocaleString('vi-VN')}` : ''}: {n.text}
                                </span>
                                {String(n.id || '').startsWith('n-') ? (
                                  <button
                                    type="button"
                                    className="appointments-action-text danger"
                                    style={{ fontSize: 13, lineHeight: 1, padding: 0 }}
                                    onClick={() => deleteInternalNote(row, n.id)}
                                    title="Xóa ghi chú"
                                  >
                                    x
                                  </button>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </td>
                      <td>
                        <div className="appointments-actions">
                          <button
                            type="button"
                            className="appointments-action-text"
                            onClick={() => togglePin(row.id)}
                            title={pinnedIds.includes(row.id) ? 'Bỏ ghim lịch hẹn' : 'Ghim lịch hẹn'}
                          >
                            {pinnedIds.includes(row.id) ? <PinOff size={14} /> : <Pin size={14} />}
                            {pinnedIds.includes(row.id) ? 'Bỏ ghim' : 'Ghim'}
                          </button>
                          <button
                            type="button"
                            className="appointments-action-text"
                            onClick={() => openEditModal(row)}
                          >
                            <Pencil size={14} /> Sửa
                          </button>
                          {row.patient_phone ? (
                            <a className="appointments-action-text" href={`tel:${row.patient_phone}`}>
                              <Phone size={14} /> Gọi
                            </a>
                          ) : null}
                          <button
                            type="button"
                            className="appointments-action-text danger"
                            onClick={() => handleDelete(row)}
                          >
                            <Trash2 size={14} /> Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})}
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
                  <label>Bác sĩ</label>
                  <SearchableSelect
                    name="clinic_id"
                    options={[{label: '— Chưa chọn —', value: ''}, ...clinics.map(c => ({ label: c.name, value: c.id }))]}
                    value={form.clinic_id}
                    onChange={(val) => handleFormChange({ target: { name: 'clinic_id', value: val } })}
                    placeholder="— Chưa chọn —"
                  />
                </div>
                <div className="form-group">
                  <label>Cơ sở khám</label>
                  <SearchableSelect
                    name="clinic_place_id"
                    options={[{label: '— Chưa chọn —', value: ''}, ...places.map(p => ({ label: p.display_name || p.name, value: p.id }))]}
                    value={form.clinic_place_id}
                    onChange={(val) => handleFormChange({ target: { name: 'clinic_place_id', value: val } })}
                    placeholder="— Chưa chọn —"
                  />
                </div>
                <div className="form-group">
                  <label>Chuyên khoa</label>
                  <SearchableSelect
                    name="specialist_id"
                    options={[{label: '— Chưa chọn —', value: ''}, ...specialties.map(s => ({ label: s.name, value: s.id }))]}
                    value={form.specialist_id}
                    onChange={(val) => handleFormChange({ target: { name: 'specialist_id', value: val } })}
                    placeholder="— Chưa chọn —"
                  />
                </div>
                <div className="form-group">
                  <label>Dịch vụ</label>
                  <SearchableSelect
                    name="service_id"
                    options={[{label: '— Chưa chọn —', value: ''}, ...services.map(sv => ({ label: sv.name, value: sv.id }))]}
                    value={form.service_id}
                    onChange={(val) => handleFormChange({ target: { name: 'service_id', value: val } })}
                    placeholder="— Chưa chọn —"
                  />
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
