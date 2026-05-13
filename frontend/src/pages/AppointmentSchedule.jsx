import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, Plus, Edit2, Trash2, AlertTriangle, Copy } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import {
  getScheduleBlocks,
  deleteScheduleBlock,
  getScheduleOverrides,
  createScheduleOverride,
  deleteScheduleOverride,
} from '../api/appointmentSchedule.api';
import { getClinics } from '../api/clinic.api';
import { getPartners } from '../api/partner.api';
import { getClinicPlaces } from '../api/clinic_place.api';
import Pagination from '../components/Pagination';
import { DAY_LABELS, SESSION_LABELS, formatTimeInput } from '../utils/scheduleLabels';

export default function AppointmentSchedule() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('blocks'); // blocks | overrides

  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const [clinics, setClinics] = useState([]);
  const [partners, setPartners] = useState([]);
  const [places, setPlaces] = useState([]);
  const [ovPlaces, setOvPlaces] = useState([]);

  const [filterClinic, setFilterClinic] = useState('');
  const [filterPartner, setFilterPartner] = useState('');
  const [filterPlace, setFilterPlace] = useState('');

  const [overrides, setOverrides] = useState([]);
  const [ovClinic, setOvClinic] = useState('');
  const [ovPlace, setOvPlace] = useState('');
  const [ovDate, setOvDate] = useState('');
  const [ovClosed, setOvClosed] = useState(true);
  const [ovNote, setOvNote] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [cRes, pRes] = await Promise.all([
          getClinics({ limit: 500, page: 1 }),
          getPartners({ limit: 500, page: 1 }),
        ]);
        if (cRes?.data) setClinics(cRes.data);
        if (pRes?.data) setPartners(pRes.data);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await getClinicPlaces({
          partner_id: filterPartner || undefined,
          limit: 500,
          page: 1,
        });
        if (res?.data) setPlaces(res.data);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [filterPartner]);

  const fetchBlocks = async (p = page) => {
    setLoading(true);
    try {
      const params = { page: p, limit };
      if (filterClinic) params.clinic_id = filterClinic;
      if (filterPartner) params.partner_id = filterPartner;
      if (filterPlace) params.clinic_place_id = filterPlace;
      const res = await getScheduleBlocks(params);
      if (res?.data) {
        setBlocks(res.data);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || 'Không tải được danh sách lịch');
    } finally {
      setLoading(false);
    }
  };

  const fetchOverrides = async () => {
    try {
      const params = { limit: 200 };
      if (ovClinic) params.clinic_id = ovClinic;
      if (ovPlace) params.clinic_place_id = ovPlace;
      const res = await getScheduleOverrides(params);
      if (Array.isArray(res?.data)) setOverrides(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (tab !== 'blocks') return;
    fetchBlocks(page);
  }, [tab, page, filterClinic, filterPartner, filterPlace]);

  useEffect(() => {
    if (tab !== 'overrides') return;
    (async () => {
      try {
        const res = await getClinicPlaces({ limit: 500, page: 1 });
        if (res?.data) setOvPlaces(res.data);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [tab]);

  useEffect(() => {
    if (tab === 'overrides') fetchOverrides();
  }, [tab, ovClinic, ovPlace]);

  /** Nhóm theo bác sĩ — dễ quét lịch tuần cùng một người */
  const groupedBlocks = useMemo(() => {
    const map = new Map();
    for (const b of blocks) {
      const key = String(b.clinic_id);
      if (!map.has(key)) {
        map.set(key, {
          clinicId: b.clinic_id,
          clinicName: b.clinic_name || `Bác sĩ #${b.clinic_id}`,
          rows: [],
        });
      }
      map.get(key).rows.push(b);
    }
    return [...map.values()]
      .map((g) => ({
        ...g,
        rows: [...g.rows].sort((a, b2) => {
          const da = Number(a.day_of_week) - Number(b2.day_of_week);
          if (da !== 0) return da;
          return String(a.start_time).localeCompare(String(b2.start_time));
        }),
      }))
      .sort((a, b) => a.clinicName.localeCompare(b.clinicName, 'vi'));
  }, [blocks]);

  const quickAddHref = (b) =>
    `/appointment-schedule/blocks/add?clinic_id=${encodeURIComponent(b.clinic_id)}&partner_id=${encodeURIComponent(b.partner_id)}&clinic_place_id=${encodeURIComponent(b.clinic_place_id)}`;

  const handleDeleteBlock = async (id) => {
    if (!window.confirm('Xóa khung lịch này?')) return;
    try {
      await deleteScheduleBlock(id);
      fetchBlocks(page);
    } catch (e) {
      alert(e.response?.data?.message || 'Xóa thất bại');
    }
  };

  const handleAddOverride = async (e) => {
    e.preventDefault();
    if (!ovClinic || !ovDate) {
      alert('Chọn bác sĩ và ngày');
      return;
    }
    try {
      await createScheduleOverride({
        clinic_id: ovClinic,
        clinic_place_id: ovPlace || '',
        override_date: ovDate,
        is_closed: ovClosed,
        note: ovNote,
      });
      setOvNote('');
      fetchOverrides();
      alert('Đã thêm ngoại lệ');
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi thêm');
    }
  };

  const handleDeleteOverride = async (id) => {
    if (!window.confirm('Xóa ngoại lệ?')) return;
    try {
      await deleteScheduleOverride(id);
      fetchOverrides();
    } catch (e) {
      alert(e.response?.data?.message || 'Lỗi');
    }
  };

  return (
    <AdminLayout pageTitle="Quản lý lịch hẹn">
      <div className="management-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <CalendarClock size={22} />
          <button
            type="button"
            className={tab === 'blocks' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.5rem 1rem' }}
            onClick={() => setTab('blocks')}
          >
            Khung lịch (block)
          </button>
          <button
            type="button"
            className={tab === 'overrides' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.5rem 1rem' }}
            onClick={() => setTab('overrides')}
          >
            Ngày nghỉ / ngoại lệ
          </button>
          <span style={{ width: 1, height: 24, background: '#e2e8f0', margin: '0 4px' }} aria-hidden />
          <button type="button" className="btn-secondary" style={{ padding: '0.5rem 1rem' }} onClick={() => navigate('/appointment-schedule/price-packages')}>
            Gói giá
          </button>
          <button type="button" className="btn-secondary" style={{ padding: '0.5rem 1rem' }} onClick={() => navigate('/appointment-schedule/insurance-packages')}>
            Gói BH
          </button>
        </div>
      </div>

      {tab === 'blocks' && (
        <>
          <div className="management-header" style={{ flexWrap: 'wrap', marginTop: 12 }}>
            <select
              className="form-input"
              style={{ minWidth: 180 }}
              value={filterClinic}
              onChange={(e) => { setFilterClinic(e.target.value); setPage(1); }}
            >
              <option value="">Tất cả bác sĩ</option>
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              className="form-input"
              style={{ minWidth: 180 }}
              value={filterPartner}
              onChange={(e) => {
                setFilterPartner(e.target.value);
                setFilterPlace('');
                setPage(1);
              }}
            >
              <option value="">Tất cả đối tác</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select
              className="form-input"
              style={{ minWidth: 200 }}
              value={filterPlace}
              onChange={(e) => { setFilterPlace(e.target.value); setPage(1); }}
            >
              <option value="">Tất cả nơi khám</option>
              {places.map((pl) => (
                <option key={pl.id} value={pl.id}>{pl.display_name || pl.name}</option>
              ))}
            </select>
            <button className="btn-primary" type="button" onClick={() => navigate('/appointment-schedule/blocks/add')}>
              <Plus size={18} />
              Thêm khung lịch
            </button>
          </div>

          <div className="management-section" style={{ marginTop: 16 }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>Đang tải...</div>
            ) : blocks.length > 0 ? (
              <>
                <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
                  Lịch được gom theo <strong>bác sĩ</strong>. Dùng <strong>Nhân bản</strong> để mở form thêm với cùng cấu hình (đổi thứ/giờ nếu cần).
                </p>
                {groupedBlocks.map((g) => (
                  <div
                    key={g.clinicId}
                    style={{
                      marginBottom: 20,
                      border: '1px solid #e2e8f0',
                      borderRadius: 12,
                      overflow: 'hidden',
                      background: '#fff',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        padding: '12px 16px',
                        background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
                        borderBottom: '1px solid #e2e8f0',
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: 16 }}>{g.clinicName}</strong>
                        <span style={{ marginLeft: 10, fontSize: 13, color: '#64748b' }}>
                          {g.rows.length} ca / tuần (trang hiện tại)
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}
                        onClick={() => navigate(quickAddHref(g.rows[0]))}
                      >
                        <Plus size={16} />
                        Thêm ca (giữ địa điểm mẫu)
                      </button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="specialties-table" style={{ margin: 0 }}>
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Đối tác / Nơi khám</th>
                            <th>Thứ · Buổi</th>
                            <th>Giờ</th>
                            <th>Slot</th>
                            <th>Chuyên khoa</th>
                            <th>Trạng thái</th>
                            <th style={{ minWidth: 120 }}>Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {g.rows.map((b) => (
                            <tr key={b.id}>
                              <td style={{ fontVariantNumeric: 'tabular-nums' }}>{b.id}</td>
                              <td>
                                <div style={{ fontSize: 13 }}>{b.partner_name || '—'}</div>
                                <div style={{ fontSize: 12, color: '#64748b' }}>{b.place_name || '—'}</div>
                              </td>
                              <td>
                                <span style={{ whiteSpace: 'nowrap' }}>
                                  {DAY_LABELS[b.day_of_week]} · {SESSION_LABELS[b.session_type]}
                                </span>
                              </td>
                              <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                                {formatTimeInput(b.start_time)} – {formatTimeInput(b.end_time)}
                              </td>
                              <td style={{ fontSize: 12, color: '#475569' }}>
                                bước {b.slot_step_minutes}′ · khám {b.appointment_duration_minutes}′ · hạn {b.cutoff_minutes_before_slot}′
                              </td>
                              <td style={{ fontVariantNumeric: 'tabular-nums' }}>{b.specialist_count ?? 0}</td>
                              <td>
                                <span
                                  style={{
                                    padding: '2px 8px',
                                    borderRadius: 6,
                                    fontSize: 12,
                                    background: b.status === 1 ? '#dcfce7' : '#f1f5f9',
                                    color: b.status === 1 ? '#166534' : '#64748b',
                                  }}
                                >
                                  {b.status === 1 ? 'Đang bật' : 'Tắt'}
                                </span>
                              </td>
                              <td>
                                <div className="action-buttons">
                                  <button
                                    type="button"
                                    className="btn-action edit"
                                    title="Sửa"
                                    onClick={() => navigate(`/appointment-schedule/blocks/edit/${b.id}`)}
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-action edit"
                                    title="Nhân bản → form thêm"
                                    onClick={() => navigate(`/appointment-schedule/blocks/add?from=${b.id}`)}
                                  >
                                    <Copy size={16} />
                                  </button>
                                  <button type="button" className="btn-action delete" title="Xóa" onClick={() => handleDeleteBlock(b.id)}>
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
                {totalPages > 1 && (
                  <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                )}
              </>
            ) : (
              <div className="empty-state">
                <p>Chưa có khung lịch. Chạy migration DB và thêm block mới.</p>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'overrides' && (
        <div className="management-section" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Bác sĩ</label>
              <select className="form-input" value={ovClinic} onChange={(e) => setOvClinic(e.target.value)}>
                <option value="">—</option>
                {clinics.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Nơi khám (tuỳ chọn)</label>
              <select className="form-input" value={ovPlace} onChange={(e) => setOvPlace(e.target.value)}>
                <option value="">Tất cả / không gán</option>
                {ovPlaces.map((pl) => (
                  <option key={pl.id} value={pl.id}>{pl.display_name || pl.name}</option>
                ))}
              </select>
            </div>
            <button type="button" className="btn-secondary" onClick={fetchOverrides}>Lọc</button>
          </div>

          <form onSubmit={handleAddOverride} style={{ marginBottom: 24, padding: 16, background: '#f8fafc', borderRadius: 8 }}>
            <h3 style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} /> Thêm ngày nghỉ / ngoại lệ
            </h3>
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              <div className="form-group">
                <label>Ngày</label>
                <input type="date" className="form-input" value={ovDate} onChange={(e) => setOvDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>
                  <input type="checkbox" checked={ovClosed} onChange={(e) => setOvClosed(e.target.checked)} style={{ marginRight: 8 }} />
                  Đóng đặt (nghỉ)
                </label>
              </div>
              <div className="form-group full-width">
                <label>Ghi chú</label>
                <input className="form-input" value={ovNote} onChange={(e) => setOvNote(e.target.value)} placeholder="VD: Nghỉ lễ, bác sĩ công tác" />
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: 12 }}>Lưu ngoại lệ</button>
          </form>

          <div style={{ overflowX: 'auto' }}>
            <table className="specialties-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Bác sĩ ID</th>
                  <th>Nơi khám</th>
                  <th>Ngày</th>
                  <th>Đóng</th>
                  <th>Ghi chú</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {overrides.map((o) => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td>{o.clinic_id}</td>
                    <td>{o.place_name || (o.clinic_place_id ? `#${o.clinic_place_id}` : '—')}</td>
                    <td>{o.override_date}</td>
                    <td>{o.is_closed ? 'Có' : 'Không'}</td>
                    <td>{o.note || '—'}</td>
                    <td>
                      <button type="button" className="btn-action delete" onClick={() => handleDeleteOverride(o.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {overrides.length === 0 && <p style={{ padding: 16, color: '#64748b' }}>Không có ngoại lệ</p>}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
