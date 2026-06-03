import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, Plus, Edit2, Trash2, Loader, Check, X } from 'lucide-react';
import {
  getScheduleBlocks,
  createScheduleBlock,
  updateScheduleBlock,
  deleteScheduleBlock,
} from '../api/appointmentSchedule.api';
import {
  getSchedulePricePackages,
  getScheduleInsurancePackages,
} from '../api/appointmentSchedule.api';
import { getPricePackages, createPricePackage, updatePricePackage, deletePricePackage } from '../api/clinicPrice.api';
import { getInsurancePackages, createInsurancePackage, updateInsurancePackage, deleteInsurancePackage } from '../api/clinicInsurance.api';
import { getClinicPlaces } from '../api/clinic_place.api';
import { SCHEDULE_TIME_PRESETS, formatTimeInput } from '../utils/scheduleLabels';

const SESSIONS = [
  { type: 1, label: 'Sáng', defaultStart: '07:00', defaultEnd: '12:00', color: '#3b82f6' },
  { type: 2, label: 'Chiều', defaultStart: '13:00', defaultEnd: '17:30', color: '#f59e0b' },
  { type: 3, label: 'Tối', defaultStart: '18:00', defaultEnd: '21:00', color: '#8b5cf6' },
  { type: 4, label: 'Đêm', defaultStart: '20:00', defaultEnd: '23:00', color: '#475569' },
];

const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DOW_LABELS = { 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7', 0: 'CN' };

function generateSlots(start, end, step) {
  if (!start || !end || !step) return [];
  const slots = [];
  let [h, m] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let cur = h * 60 + m;
  const endM = eh * 60 + em;
  const s = Number(step);
  let limit = 0;
  while (cur + s <= endM && limit < 50) {
    const sh = Math.floor(cur / 60).toString().padStart(2, '0');
    const sm = (cur % 60).toString().padStart(2, '0');
    const nh = Math.floor((cur + s) / 60).toString().padStart(2, '0');
    const nm = ((cur + s) % 60).toString().padStart(2, '0');
    slots.push(`${sh}:${sm}–${nh}:${nm}`);
    cur += s;
    limit++;
  }
  return slots;
}

/* ── Session Inline Form ─────────────────────────────────── */
function SessionInlineForm({ session, clinicId, doctor, partners, onSave, onCancel, existingBlock }) {
  const defaultPartnerId = existingBlock?.partner_id || (doctor?.partner_ids ? String(doctor.partner_ids).split(',')[0].trim() : '');
  const defaultPlaceId = existingBlock?.clinic_place_id || (doctor?.place_ids ? String(doctor.place_ids).split(',')[0].trim() : '');

  const [places, setPlaces] = useState([]);
  const [form, setForm] = useState({
    partner_id: defaultPartnerId,
    clinic_place_id: defaultPlaceId,
    start_time: existingBlock ? formatTimeInput(existingBlock.start_time) : session.defaultStart,
    end_time: existingBlock ? formatTimeInput(existingBlock.end_time) : session.defaultEnd,
    slot_step_minutes: existingBlock?.slot_step_minutes || 30,
    appointment_duration_minutes: existingBlock?.appointment_duration_minutes || 30,
    status: existingBlock?.status ?? 1,
  });
  const [selectedDays, setSelectedDays] = useState(
    existingBlock ? [String(existingBlock.day_of_week)] : ['1']
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!form.partner_id) { setPlaces([]); return; }
    getClinicPlaces({ partner_id: form.partner_id, limit: 200, page: 1 })
      .then(r => { if (r?.data) setPlaces(r.data); })
      .catch(() => {});
  }, [form.partner_id]);

  const slots = generateSlots(form.start_time, form.end_time, form.slot_step_minutes);

  const toggleDay = (d) => {
    const ds = String(d);
    setSelectedDays(prev => prev.includes(ds) ? prev.filter(x => x !== ds) : [...prev, ds]);
  };

  const handleSave = async () => {
    if (!form.partner_id || !form.clinic_place_id) {
      alert('Bác sĩ này chưa được thiết lập Đối tác/Nơi khám trong hồ sơ. Vui lòng cập nhật hồ sơ bác sĩ trước khi tạo lịch.'); return;
    }
    setSaving(true);
    try {
      const base = {
        clinic_id: clinicId,
        partner_id: parseInt(form.partner_id),
        clinic_place_id: parseInt(form.clinic_place_id),
        session_type: session.type,
        start_time: form.start_time,
        end_time: form.end_time,
        slot_step_minutes: parseInt(form.slot_step_minutes),
        appointment_duration_minutes: parseInt(form.appointment_duration_minutes),
        cutoff_minutes_before_slot: 0,
        status: form.status,
        rank: 0,
      };
      if (existingBlock) {
        await updateScheduleBlock(existingBlock.id, { ...base, day_of_week: existingBlock.day_of_week });
      } else {
        await Promise.all(
          selectedDays.map(d => createScheduleBlock({ ...base, day_of_week: parseInt(d) }))
        );
      }
      onSave();
    } catch (err) {
      alert(err.response?.data?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="session-inline-form">
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {SCHEDULE_TIME_PRESETS.filter(p => String(p.session_type) === String(session.type)).map(p => (
          <button
            key={p.key}
            type="button"
            className="preset-chip"
            onClick={() => setForm(f => ({ ...f, start_time: p.start_time, end_time: p.end_time }))}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
        <div>
          <label>Từ giờ</label>
          <input className="form-input" type="time" value={form.start_time}
            onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
        </div>
        <div>
          <label>Đến giờ</label>
          <input className="form-input" type="time" value={form.end_time}
            onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
        </div>
        <div>
          <label>Thời lượng (phút)</label>
          <input className="form-input" type="number" min="5" value={form.slot_step_minutes}
            onChange={e => setForm(f => ({ ...f, slot_step_minutes: e.target.value, appointment_duration_minutes: e.target.value }))} />
        </div>
      </div>

      <div>
        <label>Giờ còn trống ({slots.length} slot)</label>
        <div className="slot-preview">
          {slots.length > 0 ? slots.join(', ') : 'Không có slot'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
        <div>
          <label>Đối tác *</label>
          <select className="form-input" value={form.partner_id} disabled={true}
            onChange={e => setForm(f => ({ ...f, partner_id: e.target.value, clinic_place_id: '' }))}>
            <option value="">— Chưa cài đặt —</option>
            {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label>Nơi khám *</label>
          <select className="form-input" value={form.clinic_place_id} disabled={true}
            onChange={e => setForm(f => ({ ...f, clinic_place_id: e.target.value }))}>
            <option value="">— Chưa cài đặt —</option>
            {places.map(pl => <option key={pl.id} value={pl.id}>{pl.display_name || pl.name}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
        <div>
          <label>Trạng thái</label>
          <select className="form-input" value={form.status}
            onChange={e => setForm(f => ({ ...f, status: parseInt(e.target.value) }))}>
            <option value={1}>Đang bật</option>
            <option value={0}>Tắt</option>
          </select>
        </div>
      </div>

      {!existingBlock && (
        <div>
          <label style={{ marginBottom: '0.375rem' }}>Áp dụng cho các ngày</label>
          <div className="day-apply-row">
            {DOW_ORDER.map(d => (
              <span
                key={d}
                className={`day-apply-chip ${selectedDays.includes(String(d)) ? 'active' : ''}`}
                onClick={() => toggleDay(d)}
              >
                {DOW_LABELS[d]}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel} style={{ fontSize: '0.8rem' }}>
          Hủy
        </button>
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ fontSize: '0.8rem' }}>
          {saving ? <Loader size={14} className="spin" /> : <Check size={14} />}
          {saving ? 'Đang lưu...' : existingBlock ? 'Cập nhật' : 'Lưu'}
        </button>
      </div>
    </div>
  );
}

/* ── Session Accordion ───────────────────────────────────── */
function SessionAccordion({ session, blocks, clinicId, doctor, partners, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState(null);

  const sessionBlocks = blocks.filter(b => String(b.session_type) === String(session.type))
    .sort((a, b) => a.day_of_week - b.day_of_week);

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa ca này?')) return;
    try {
      await deleteScheduleBlock(id);
      onRefresh();
    } catch (err) {
      alert('Xóa thất bại');
    }
  };

  return (
    <div className="session-accordion">
      <div className="session-accordion-header" onClick={() => setOpen(o => !o)}>
        <div className="session-accordion-title">
          <span className={`session-dot session-${session.type}`} />
          {session.label}
          <span className="session-accordion-meta">
            {sessionBlocks.length > 0 ? `${sessionBlocks.length} ca` : 'Chưa có lịch'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </div>

      {open && (
        <div className="session-accordion-body">
          {sessionBlocks.map(block => (
            <div key={block.id}>
              {editingBlockId === block.id ? (
                <SessionInlineForm
                  session={session}
                  clinicId={clinicId}
                  doctor={doctor}
                  partners={partners}
                  existingBlock={block}
                  onSave={() => { setEditingBlockId(null); onRefresh(); }}
                  onCancel={() => setEditingBlockId(null)}
                />
              ) : (
                <div className="session-block-row">
                  <span className="session-block-time">
                    {formatTimeInput(block.start_time)}–{formatTimeInput(block.end_time)}
                  </span>
                  <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '3px', background: '#e2e8f0', color: '#475569' }}>
                    {DOW_LABELS[block.day_of_week]}
                  </span>
                  <span className="session-block-place">
                    {block.clinic_place_name || `Nơi khám #${block.clinic_place_id}`}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: block.status === 1 ? '#22c55e' : '#94a3b8' }}>
                    ●
                  </span>
                  <div className="session-block-actions">
                    <button onClick={() => setEditingBlockId(block.id)} title="Sửa">
                      <Edit2 size={13} />
                    </button>
                    <button className="delete" onClick={() => handleDelete(block.id)} title="Xóa">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {showAddForm ? (
            <SessionInlineForm
              session={session}
              clinicId={clinicId}
              doctor={doctor}
              partners={partners}
              existingBlock={null}
              onSave={() => { setShowAddForm(false); onRefresh(); }}
              onCancel={() => setShowAddForm(false)}
            />
          ) : (
            <button className="session-add-btn" onClick={() => setShowAddForm(true)}>
              <Plus size={13} style={{ display: 'inline', marginRight: 4 }} />
              Tạo lịch {session.label.toLowerCase()} theo mẫu
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Price Tab ───────────────────────────────────────────── */
function PriceTab({ clinicId }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', price_type: 'exam', price_min: '', price_max: '', note: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getPricePackages({ clinic_id: clinicId, limit: 100, page: 1 });
      if (r?.data) setPackages(r.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [clinicId]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => setForm({ name: '', price_type: 'exam', price_min: '', price_max: '', note: '' });

  const handleSave = async () => {
    if (!form.name) { alert('Nhập tên gói'); return; }
    setSaving(true);
    try {
      const payload = { ...form, clinic_id: clinicId };
      if (editItem) await updatePricePackage(editItem.id, payload);
      else await createPricePackage(payload);
      setShowForm(false); setEditItem(null); resetForm(); load();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa gói này?')) return;
    try { await deletePricePackage(id); load(); } catch { alert('Xóa thất bại'); }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Đang tải...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" style={{ fontSize: '0.8125rem' }}
          onClick={() => { setShowForm(true); setEditItem(null); resetForm(); }}>
          <Plus size={14} /> Thêm gói
        </button>
      </div>

      {(showForm || editItem) && (
        <div className="pi-section">
          <div className="pi-section-header">
            <span>{editItem ? 'Sửa gói giá' : 'Thêm gói giá'}</span>
          </div>
          <div className="pi-inline-form">
            <div>
              <label>Tên gói *</label>
              <input placeholder="VD: Giá khám sản" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="pi-inline-form-grid">
              <div>
                <label>Loại giá</label>
                <select value={form.price_type} onChange={e => setForm(f => ({ ...f, price_type: e.target.value }))}>
                  <option value="exam">Khám</option>
                  <option value="service">Dịch vụ</option>
                </select>
              </div>
            </div>
            <div className="pi-inline-form-grid">
              <div>
                <label>Giá thấp nhất (đ)</label>
                <input type="number" placeholder="200000" value={form.price_min}
                  onChange={e => setForm(f => ({ ...f, price_min: e.target.value }))} />
              </div>
              <div>
                <label>Giá cao nhất (đ)</label>
                <input type="number" placeholder="300000" value={form.price_max}
                  onChange={e => setForm(f => ({ ...f, price_max: e.target.value }))} />
              </div>
            </div>
            <div>
              <label>Ghi chú</label>
              <textarea rows={2} value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }}
                onClick={() => { setShowForm(false); setEditItem(null); }}>Hủy</button>
              <button className="btn btn-primary" style={{ fontSize: '0.8rem' }}
                onClick={handleSave} disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {packages.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem', fontSize: '0.875rem' }}>
          Chưa có gói giá nào. Bấm "+ Thêm gói" để tạo.
        </div>
      ) : packages.map(pkg => (
        <div key={pkg.id} className="pi-section">
          <div className="pi-section-header">
            <span>{pkg.name}</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button style={{ border: 'none', background: 'rgba(255,255,255,0.2)', borderRadius: '0.25rem', padding: '0.25rem 0.5rem', cursor: 'pointer', color: 'white', fontSize: '0.75rem' }}
                onClick={() => { setEditItem(pkg); setForm({ name: pkg.name, price_type: pkg.price_type || 'exam', price_min: pkg.price_min || '', price_max: pkg.price_max || '', note: pkg.note || '' }); setShowForm(false); }}>
                <Edit2 size={12} />
              </button>
              <button style={{ border: 'none', background: 'rgba(255,100,100,0.3)', borderRadius: '0.25rem', padding: '0.25rem 0.5rem', cursor: 'pointer', color: 'white', fontSize: '0.75rem' }}
                onClick={() => handleDelete(pkg.id)}>
                <Trash2 size={12} />
              </button>
            </div>
          </div>
          <div className="pi-section-body">
            <div className="pi-item-row">
              <span className="pi-item-name">Giá khám</span>
              <span className="pi-item-price">
                {pkg.price_min && pkg.price_max ? `${Number(pkg.price_min).toLocaleString('vi')}đ – ${Number(pkg.price_max).toLocaleString('vi')}đ` : '—'}
              </span>
            </div>
            {pkg.note && (
              <div className="pi-item-row" style={{ color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic' }}>
                {pkg.note}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Insurance Tab ───────────────────────────────────────── */
function InsuranceTab({ clinicId }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', note: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getInsurancePackages({ clinic_id: clinicId, limit: 100, page: 1 });
      if (r?.data) setPackages(r.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [clinicId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.name) { alert('Nhập tên gói'); return; }
    setSaving(true);
    try {
      const payload = { ...form, clinic_id: clinicId };
      if (editItem) await updateInsurancePackage(editItem.id, payload);
      else await createInsurancePackage(payload);
      setShowForm(false); setEditItem(null); setForm({ name: '', note: '' }); load();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa gói bảo hiểm?')) return;
    try { await deleteInsurancePackage(id); load(); } catch { alert('Xóa thất bại'); }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Đang tải...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" style={{ fontSize: '0.8125rem' }}
          onClick={() => { setShowForm(true); setEditItem(null); setForm({ name: '', note: '' }); }}>
          <Plus size={14} /> Thêm gói BH
        </button>
      </div>

      {(showForm || editItem) && (
        <div className="pi-section">
          <div className="pi-section-header">{editItem ? 'Sửa gói bảo hiểm' : 'Thêm gói bảo hiểm'}</div>
          <div className="pi-inline-form">
            <div>
              <label>Tên gói *</label>
              <input placeholder="VD: Bảo hiểm Y tế Nhà nước" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label>Ghi chú</label>
              <textarea rows={2} placeholder="VD: Áp dụng cho bệnh nhân đăng ký KCB ban đầu..." value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }}
                onClick={() => { setShowForm(false); setEditItem(null); }}>Hủy</button>
              <button className="btn btn-primary" style={{ fontSize: '0.8rem' }}
                onClick={handleSave} disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {packages.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem', fontSize: '0.875rem' }}>
          Chưa có gói bảo hiểm nào.
        </div>
      ) : packages.map(pkg => (
        <div key={pkg.id} className="pi-section">
          <div className="pi-section-header">
            <span>{pkg.name}</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button style={{ border: 'none', background: 'rgba(255,255,255,0.2)', borderRadius: '0.25rem', padding: '0.25rem 0.5rem', cursor: 'pointer', color: 'white', fontSize: '0.75rem' }}
                onClick={() => { setEditItem(pkg); setForm({ name: pkg.name, note: pkg.note || '' }); setShowForm(false); }}>
                <Edit2 size={12} />
              </button>
              <button style={{ border: 'none', background: 'rgba(255,100,100,0.3)', borderRadius: '0.25rem', padding: '0.25rem 0.5rem', cursor: 'pointer', color: 'white', fontSize: '0.75rem' }}
                onClick={() => handleDelete(pkg.id)}>
                <Trash2 size={12} />
              </button>
            </div>
          </div>
          {pkg.note && (
            <div className="pi-section-body">
              <div className="pi-item-row" style={{ color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic' }}>
                Ghi chú: {pkg.note}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Main DoctorPanel ────────────────────────────────────── */
export default function DoctorPanel({ doctor, partners, onRefresh }) {
  const [tab, setTab] = useState('schedule');
  const [blocks, setBlocks] = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);

  const loadBlocks = useCallback(async () => {
    if (!doctor?.id) return;
    setLoadingBlocks(true);
    try {
      const r = await getScheduleBlocks({ clinic_id: doctor.id, limit: 200, page: 1 });
      if (r?.data) setBlocks(r.data);
    } catch (e) { console.error(e); }
    finally { setLoadingBlocks(false); }
  }, [doctor?.id]);

  useEffect(() => {
    setBlocks([]);
    if (tab === 'schedule') loadBlocks();
  }, [doctor?.id, tab, loadBlocks]);

  const initials = doctor?.name
    ? doctor.name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase()
    : '?';

  const TABS = [
    { key: 'schedule', label: 'Lịch' },
    { key: 'price', label: 'Giá' },
    { key: 'insurance', label: 'Bảo hiểm' },
  ];

  return (
    <div className="doctor-panel">
      <div className="doctor-panel-header">
        <div className="doctor-panel-avatar">{initials}</div>
        <div className="doctor-panel-info">
          <h4>{doctor?.name}</h4>
          <span>ID: {doctor?.id} {doctor?.specialty_name ? `· ${doctor.specialty_name}` : ''}</span>
        </div>
      </div>

      <div className="doctor-panel-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`doctor-panel-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="doctor-panel-body">
        {tab === 'schedule' && (
          loadingBlocks ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
              <Loader size={20} className="spin" style={{ margin: '0 auto 0.5rem' }} />
              Đang tải lịch...
            </div>
          ) : (
            SESSIONS.map(session => (
              <SessionAccordion
                key={session.type}
                session={session}
                blocks={blocks}
                clinicId={doctor?.id}
                doctor={doctor}
                partners={partners}
                onRefresh={() => { loadBlocks(); onRefresh && onRefresh(); }}
              />
            ))
          )
        )}

        {tab === 'price' && <PriceTab clinicId={doctor?.id} />}
        {tab === 'insurance' && <InsuranceTab clinicId={doctor?.id} />}
      </div>
    </div>
  );
}
