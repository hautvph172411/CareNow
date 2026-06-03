import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  Calendar, Clock, Phone, User, CheckCircle2, XCircle,
  RefreshCw, Search, AlertCircle, X, Filter, ChevronDown, CalendarDays, Download, Eye
} from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import Pagination from '../components/Pagination';
import { getAppointments, updateAppointmentStatus } from '../api/appointment.api';
import { getClinics } from '../api/clinic.api';
import { getClinicPlaces } from '../api/clinic_place.api';

const STATUS = {
  1: { label: 'Chờ xác nhận', bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  2: { label: 'Đã xác nhận',  bg: '#dbeafe', color: '#1d4ed8', dot: '#3b82f6' },
  3: { label: 'Đã khám xong', bg: '#dcfce7', color: '#166534', dot: '#22c55e' },
  4: { label: 'Bệnh nhân hủy',bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  5: { label: 'Phòng khám hủy',bg:'#fee2e2', color: '#991b1b', dot: '#ef4444' },
  6: { label: 'Không đến',    bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' },
};

function StatusBadge({ status }) {
  const s = STATUS[Number(status)] || { label: 'Không rõ', bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 700, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, display: 'inline-block', flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

function formatDate(v) {
  if (!v) return '—';
  return new Date(v).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function formatTime(v) { return v ? String(v).slice(0, 5) : '—'; }



export default function PartnerAppointments() {
  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const initialQ = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(initialQ);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCreatedDate, setFilterCreatedDate] = useState('');
  const [filterApptDate, setFilterApptDate] = useState('');
  const [filterClinic, setFilterClinic] = useState('');
  const [filterPlace, setFilterPlace] = useState('');
  
  const [showFilters, setShowFilters] = useState(false);

  const [clinics, setClinics] = useState([]);
  const [places, setPlaces] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [saving, setSaving] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    Promise.all([
      getClinics({ limit: 500, page: 1 }),
      getClinicPlaces({ limit: 500, page: 1 }),
    ]).then(([cRes, pRes]) => {
      if (cRes?.data) setClinics(cRes.data);
      if (pRes?.data) setPlaces(pRes.data);
    }).catch(console.error);
  }, []);



  const buildParams = useMemo(() => {
    const p = { page, limit };
    if (searchTerm.trim()) p.keyword = searchTerm.trim();
    if (filterStatus) p.status = filterStatus;
    if (filterClinic) p.clinic_id = filterClinic;
    if (filterPlace) p.clinic_place_id = filterPlace;
    if (filterCreatedDate) p.created_date = filterCreatedDate;
    if (filterApptDate) p.appt_date = filterApptDate;
    return p;
  }, [page, searchTerm, filterStatus, filterClinic, filterPlace, filterCreatedDate, filterApptDate]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAppointments(buildParams);
      setRows(res?.data || []);
      setTotalPages(res?.pagination?.totalPages || 1);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [buildParams]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setSearchTerm(q);
      setPage(1);
    }
  }, [searchParams]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const stats = useMemo(() => ({
    total: rows.length,
    pending:   rows.filter(r => r.status === 1).length,
    confirmed: rows.filter(r => r.status === 2).length,
    done:      rows.filter(r => r.status === 3).length,
    noshow:    rows.filter(r => r.status === 6).length,
  }), [rows]);

  const quickUpdate = async (id, status, label) => {
    if (!window.confirm(`Xác nhận: ${label}?`)) return;
    setSaving(id);
    try {
      await updateAppointmentStatus(id, { status });
      await fetchList();
    } catch (e) {
      alert(e.response?.data?.message || 'Cập nhật thất bại');
    } finally { setSaving(null); }
  };

  const resetFilters = () => { setSearchTerm(''); setFilterStatus(''); setFilterClinic(''); setFilterPlace(''); setFilterCreatedDate(''); setFilterApptDate(''); setPage(1); };
  const hasFilter = searchTerm || filterStatus || filterClinic || filterPlace || filterCreatedDate || filterApptDate;

  const handleExport = async () => {
    setExporting(true);
    try {
      const exportParams = { ...buildParams, page: 1, limit: 10000 };
      const res = await getAppointments(exportParams);
      const data = res?.data || [];
      if (data.length === 0) {
        alert('Không có dữ liệu để xuất');
        return;
      }

      const excelData = data.map((r, index) => ({
        'STT': index + 1,
        'Mã lịch': r.booking_code || `#${r.id}`,
        'Ngày đặt': formatDate(r.created_at),
        'Ngày khám': formatDate(r.appt_date),
        'Giờ khám': formatTime(r.appt_time),
        'Trạng thái': STATUS[r.status]?.label || 'Không rõ',
        'Bệnh nhân': r.patient_name,
        'Số điện thoại': r.patient_phone || '',
        'Email': r.patient_email || '',
        'Bác sĩ': r.clinic_name || '',
        'Nơi khám': r.place_name || '',
        'Ghi chú của bệnh nhân': r.patient_notes || ''
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      ws['!cols'] = [
        {wch: 5}, {wch: 15}, {wch: 12}, {wch: 12}, {wch: 10}, 
        {wch: 15}, {wch: 25}, {wch: 15}, {wch: 25}, {wch: 25}, {wch: 25}, {wch: 30}
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "LichHen");

      const fileName = `DanhSachLichHen_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra khi xuất dữ liệu');
    } finally {
      setExporting(false);
    }
  };

  const statItems = [
    { label: 'Tổng cộng', value: stats.total,     color: 'var(--primary)',  bg: 'var(--primary-50)' },
    { label: 'Chờ xác nhận', value: stats.pending,   color: '#d97706', bg: '#fffbeb' },
    { label: 'Đã xác nhận',  value: stats.confirmed, color: '#2563eb', bg: '#eff6ff' },
    { label: 'Đã khám xong', value: stats.done,       color: '#16a34a', bg: '#f0fdf4' },
    { label: 'Không đến',    value: stats.noshow,     color: '#94a3b8', bg: '#f8fafc' },
  ];

  return (
    <AdminLayout pageTitle="">
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--gray-900)', margin: 0, letterSpacing: '-0.4px' }}>
          Lịch hẹn khám bệnh
        </h1>
        <p style={{ color: 'var(--gray-400)', fontSize: 14, margin: '4px 0 0' }}>
          Tiếp nhận, xác nhận và cập nhật trạng thái lịch hẹn
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12, marginBottom: 24 }}>
        {statItems.map((s, i) => (
          <div
            key={i}
            style={{
              background: s.bg,
              border: `1px solid ${s.color}25`,
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              transition: 'var(--transition)',
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 5, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters Header */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: showFilters ? 16 : 24 }}>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="btn btn-secondary btn-sm"
          style={{ borderRadius: 'var(--radius-md)', gap: 6, background: 'white', borderColor: '#10b981', color: '#10b981', padding: '8px 16px', fontWeight: 600, opacity: exporting ? 0.7 : 1 }}
        >
          {exporting ? <RefreshCw size={14} className="loading-spinner" /> : <Download size={14} />} 
          Xuất Excel
        </button>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn btn-secondary btn-sm"
          style={{ borderRadius: 'var(--radius-md)', gap: 6, background: showFilters || hasFilter ? 'var(--primary-50)' : 'white', borderColor: showFilters || hasFilter ? 'var(--primary)' : 'var(--gray-200)', color: showFilters || hasFilter ? 'var(--primary)' : 'var(--gray-700)', padding: '8px 16px' }}
        >
          <Filter size={14} /> Bộ lọc {hasFilter ? 'đang bật' : ''}
        </button>
      </div>

      {/* Filter Panel (Inline Full Width) */}
      {showFilters && (
        <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', padding: 16, marginBottom: 24, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {/* Created Date */}
            <div style={{ flex: '1 1 200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', padding: '9px 12px', height: '100%' }}>
                <CalendarDays size={14} color="var(--gray-400)" />
                <span style={{ fontSize: 13, color: 'var(--gray-500)', whiteSpace: 'nowrap', fontWeight: 500 }}>Ngày đặt:</span>
                <input type="date" value={filterCreatedDate} onChange={e => { setFilterCreatedDate(e.target.value); setPage(1); }} style={{ border: 'none', background: 'none', flex: 1, outline: 'none', fontSize: 13 }} />
              </div>
            </div>

            {/* Status */}
            <div style={{ flex: '1 1 200px' }}>
              <select className="form-input" style={{ width: '100%', fontSize: 13, height: '100%', borderRadius: 'var(--radius-md)', padding: '9px 12px', border: '1px solid var(--gray-200)', background: 'var(--gray-50)' }} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
                <option value="">Tất cả trạng thái</option>
                {Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
              </select>
            </div>

            {/* Search */}
            <div style={{ flex: '1 1 200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', padding: '9px 12px', height: '100%' }}>
                <Search size={14} color="var(--gray-400)" />
                <input
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                  placeholder="Tìm mã, họ tên, SĐT..."
                  style={{ border: 'none', background: 'none', flex: 1, outline: 'none', fontSize: 13 }}
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--gray-400)', display: 'flex' }}>
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Appt Date */}
            <div style={{ flex: '1 1 200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', padding: '9px 12px', height: '100%' }}>
                <Calendar size={14} color="var(--gray-400)" />
                <span style={{ fontSize: 13, color: 'var(--gray-500)', whiteSpace: 'nowrap', fontWeight: 500 }}>Ngày khám:</span>
                <input type="date" value={filterApptDate} onChange={e => { setFilterApptDate(e.target.value); setPage(1); }} style={{ border: 'none', background: 'none', flex: 1, outline: 'none', fontSize: 13 }} />
              </div>
            </div>

            {/* Clinic */}
            <div style={{ flex: '1 1 200px' }}>
              <select className="form-input" style={{ width: '100%', fontSize: 13, height: '100%', borderRadius: 'var(--radius-md)', padding: '9px 12px', border: '1px solid var(--gray-200)', background: 'var(--gray-50)' }} value={filterClinic} onChange={e => { setFilterClinic(e.target.value); setPage(1); }}>
                <option value="">Tất cả bác sĩ</option>
                {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Place */}
            <div style={{ flex: '1 1 200px' }}>
              <select className="form-input" style={{ width: '100%', fontSize: 13, height: '100%', borderRadius: 'var(--radius-md)', padding: '9px 12px', border: '1px solid var(--gray-200)', background: 'var(--gray-50)' }} value={filterPlace} onChange={e => { setFilterPlace(e.target.value); setPage(1); }}>
                <option value="">Tất cả nơi khám</option>
                {places.map(p => <option key={p.id} value={p.id}>{p.display_name || p.name}</option>)}
              </select>
            </div>
          </div>
          
          <div style={{ marginTop: 16 }}>
            <button
              onClick={resetFilters}
              className="btn btn-secondary btn-sm"
              style={{ borderRadius: 'var(--radius-md)', gap: 5, background: 'var(--gray-100)', border: 'none', color: 'var(--gray-700)', padding: '8px 16px', fontWeight: 600 }}
            >
              <RefreshCw size={13} /> Làm mới
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-200)', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
        {loading ? (
          <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--gray-400)' }}>
            <RefreshCw size={28} className="loading-spinner" style={{ margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontSize: 14 }}>Đang tải dữ liệu...</p>
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--gray-400)' }}>
            <Calendar size={40} style={{ opacity: 0.2, margin: '0 auto 16px', display: 'block' }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--gray-500)' }}>Không có lịch hẹn nào</p>
            <p style={{ fontSize: 13, marginTop: 6 }}>Thử chuyển tab hoặc xóa bộ lọc</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                  {['Mã lịch', 'Ngày & Giờ', 'Bệnh nhân', 'Bác sĩ / Nơi khám', 'Trạng thái', 'Thao tác'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.6px', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr
                    key={row.id}
                    style={{ borderBottom: '1px solid var(--gray-50)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-50)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => setSelectedRow(row)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 700, padding: 0, fontSize: 13, fontFamily: 'monospace' }}
                      >
                        {row.booking_code || `#${row.id}`}
                      </button>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600, color: 'var(--gray-800)' }}>
                        <Calendar size={12} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                        {formatDate(row.appt_date)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--gray-400)', marginTop: 3, fontSize: 12 }}>
                        <Clock size={11} /> {formatTime(row.appt_time)}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-500)', flexShrink: 0 }}>
                          <User size={13} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{row.patient_name}</div>
                          <div style={{ fontSize: 12, color: 'var(--gray-400)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <Phone size={11} /> {row.patient_phone || '—'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--gray-800)', fontSize: 13 }}>{row.clinic_name || '—'}</div>
                      <div style={{ color: 'var(--gray-400)', fontSize: 12, marginTop: 2 }}>{row.place_name || '—'}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <select
                        value={row.status}
                        onChange={(e) => quickUpdate(row.id, Number(e.target.value), 'Đổi trạng thái sang ' + STATUS[e.target.value].label)}
                        disabled={saving === row.id}
                        style={{
                          padding: '6px 24px 6px 10px',
                          borderRadius: 999,
                          border: '1px solid transparent',
                          fontSize: 12,
                          fontWeight: 700,
                          background: STATUS[row.status]?.bg || '#f1f5f9',
                          color: STATUS[row.status]?.color || '#475569',
                          cursor: 'pointer',
                          outline: 'none',
                          appearance: 'none',
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(STATUS[row.status]?.color || '#475569')}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 8px center',
                        }}
                      >
                        {Object.entries(STATUS).map(([k, v]) => (
                          <option key={k} value={k} style={{ background: 'white', color: '#1e293b' }}>
                            {v.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => setSelectedRow(row)}
                        style={{ background: 'var(--gray-50)', color: 'var(--primary)', border: '1px solid var(--gray-200)', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-50)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--gray-50)'}
                        title="Xem chi tiết"
                      >
                        <Eye size={14} /> Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && totalPages > 1 && (
        <div style={{ marginTop: 16 }}>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* Detail Modal */}
      {selectedRow && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}
          onClick={() => setSelectedRow(null)}
        >
          <div
            style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: 28, maxWidth: 520, width: '100%', boxShadow: 'var(--shadow-xl)', animation: 'dropIn 0.2s ease' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--gray-900)' }}>Chi tiết lịch hẹn</h2>
                <p style={{ margin: '4px 0 0', color: 'var(--primary)', fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
                  {selectedRow.booking_code || `#${selectedRow.id}`}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <StatusBadge status={selectedRow.status} />
                <button
                  onClick={() => setSelectedRow(null)}
                  style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-100)', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', color: 'var(--gray-500)' }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Info grid */}
            <div style={{ display: 'grid', gap: 0, background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--gray-200)' }}>
              {[
                { label: 'Ngày khám', value: `${formatDate(selectedRow.appt_date)} lúc ${formatTime(selectedRow.appt_time)}` },
                { label: 'Bệnh nhân', value: selectedRow.patient_name },
                { label: 'Số điện thoại', value: selectedRow.patient_phone || '—' },
                { label: 'Email', value: selectedRow.patient_email || '—' },
                { label: 'Bác sĩ', value: selectedRow.clinic_name || '—' },
                { label: 'Nơi khám', value: selectedRow.place_name || '—' },
                { label: 'Ghi chú', value: selectedRow.patient_notes || '—' },
              ].map((item, i) => (
                <div key={item.label} style={{
                  display: 'flex',
                  gap: 12,
                  padding: '10px 16px',
                  borderBottom: i < 6 ? '1px solid var(--gray-200)' : 'none',
                  background: i % 2 === 0 ? 'white' : 'var(--gray-50)',
                }}>
                  <span style={{ color: 'var(--gray-500)', fontSize: 13, width: 120, flexShrink: 0, fontWeight: 500 }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-800)', flex: 1 }}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              {selectedRow.status === 1 && (
                <button
                  onClick={() => { quickUpdate(selectedRow.id, 2, 'Xác nhận lịch hẹn'); setSelectedRow(null); }}
                  className="btn btn-primary"
                >
                  <CheckCircle2 size={15} /> Xác nhận lịch hẹn
                </button>
              )}
              <button
                onClick={() => setSelectedRow(null)}
                className="btn btn-secondary"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
