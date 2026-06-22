import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, Plus, Edit2, Trash2, Loader, Check, X, Minus } from 'lucide-react';
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
import { getPricePackages, getPricePackageDetail, createPricePackage, updatePricePackage, deletePricePackage } from '../api/clinicPrice.api';
import {
  getInsurancePackages,
  getInsurancePackageDetail,
  createInsurancePackage,
  updateInsurancePackage,
  deleteInsurancePackage,
} from '../api/clinicInsurance.api';
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
                  <button
                    type="button"
                    title={block.status === 1 ? "Đang bật (Click để tắt)" : "Đang tắt (Click để bật)"}
                    onClick={async () => {
                      if (!window.confirm(`Bạn muốn ${block.status === 1 ? 'tắt' : 'bật'} lịch ca này?`)) return;
                      try {
                        await updateScheduleBlock(block.id, { ...block, status: block.status === 1 ? 0 : 1 });
                        onRefresh();
                      } catch (e) {
                        alert('Lỗi cập nhật');
                      }
                    }}
                    style={{
                      border: 'none', background: 'transparent', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4,
                      color: block.status === 1 ? '#22c55e' : '#94a3b8',
                      fontSize: '0.75rem', fontWeight: 600, padding: 0
                    }}
                  >
                    <span style={{ fontSize: '1rem' }}>{block.status === 1 ? '●' : '○'}</span>
                    {block.status === 1 ? 'Bật' : 'Tắt'}
                  </button>
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

const today = () => new Date().toISOString().slice(0, 10);

const emptyPriceItem = () => ({
  key: Math.random().toString(36).slice(2),
  clinic_place_id: '',
  effective_from: today(),
  effective_to: '',
  day_of_week: 'all',
  session_type: 'all',
  amount_vnd: '',
  currency: 'VND',
  label: '',
  status: 1,
  rank: 99,
});

const emptyPriceForm = (clinicId) => ({
  id: null,
  clinic_id: clinicId,
  name: '',
  description: '',
  status: 1,
  rank: 99,
  items: [{ ...emptyPriceItem(), label: 'Giá khám' }],
});

const money = (value) => {
  const n = Number(value);
  if (Number.isNaN(n) || n < 0) return '—';
  return `${n.toLocaleString('vi-VN')}đ`;
};

const priceRange = (items = []) => {
  const amounts = items
    .map((it) => Number(it.amount_vnd))
    .filter((n) => !Number.isNaN(n) && n >= 0);
  if (!amounts.length) return '—';
  const min = Math.min(...amounts);
  const max = Math.max(...amounts);
  return min === max ? money(min) : `${money(min)} – ${money(max)}`;
};

const normalizePriceDetail = (pkg) => ({
  ...pkg,
  items: Array.isArray(pkg.items) ? pkg.items : [],
});

const priceDetailToForm = (pkg, clinicId) => ({
  id: pkg?.id || null,
  clinic_id: String(pkg?.clinic_id || clinicId || ''),
  name: pkg?.name || '',
  description: pkg?.description || '',
  status: pkg?.status ?? 1,
  rank: pkg?.rank ?? 99,
  items: Array.isArray(pkg?.items) && pkg.items.length > 0
    ? pkg.items.map((it) => ({
        key: String(it.id || Math.random().toString(36).slice(2)),
        clinic_place_id: it.clinic_place_id != null ? String(it.clinic_place_id) : '',
        effective_from: it.effective_from ? String(it.effective_from).slice(0, 10) : today(),
        effective_to: it.effective_to ? String(it.effective_to).slice(0, 10) : '',
        day_of_week: it.day_of_week == null ? 'all' : String(it.day_of_week),
        session_type: it.session_type == null ? 'all' : String(it.session_type),
        amount_vnd: String(it.amount_vnd ?? ''),
        currency: it.currency || 'VND',
        label: it.label || '',
        status: it.status ?? 1,
        rank: it.rank ?? 99,
      }))
    : [{ ...emptyPriceItem(), label: 'Giá khám' }],
});

function PricePackageModal({ form, saving, onChange, onSave, onClose }) {
  const update = (field, value) => onChange((prev) => ({ ...prev, [field]: value }));
  const updateItem = (key, field, value) => {
    onChange((prev) => ({
      ...prev,
      items: prev.items.map((row) => (row.key === key ? { ...row, [field]: value } : row)),
    }));
  };
  const addItem = () => onChange((prev) => ({ ...prev, items: [...prev.items, emptyPriceItem()] }));
  const removeItem = (key) => {
    onChange((prev) => ({
      ...prev,
      items: prev.items.length <= 1 ? prev.items : prev.items.filter((row) => row.key !== key),
    }));
  };

  return (
    <div className="price-modal-backdrop">
      <div className="price-modal">
        <div className="price-modal-header">
          <h3>{form.id ? 'Sửa gói giá khám' : 'Thêm gói giá khám'}</h3>
          <button type="button" onClick={onClose}><X size={22} /></button>
        </div>

        <div className="price-modal-body">
          <div className="price-form-grid">
            <div className="price-form-field full">
              <label>Tên gói *</label>
              <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="VD: Giá khám" />
            </div>
            <div className="price-form-field full">
              <label>Mô tả</label>
              <textarea rows={2} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Giá khám chưa bao gồm chi phí chụp chiếu, xét nghiệm" />
            </div>
            <div className="price-form-field">
              <label>Trạng thái</label>
              <select value={form.status} onChange={(e) => update('status', e.target.value)}>
                <option value={1}>Hiển thị</option>
                <option value={0}>Ẩn</option>
              </select>
            </div>
            <div className="price-form-field">
              <label>Hạng</label>
              <input type="number" value={form.rank} onChange={(e) => update('rank', e.target.value)} />
            </div>
          </div>

          <div className="price-modal-section-head">
            <h4>Dòng giá</h4>
            <button type="button" className="btn btn-secondary" onClick={addItem}>
              <Plus size={15} /> Thêm giá
            </button>
          </div>

          <div className="price-item-editor-list">
            {form.items.map((item, index) => (
              <div key={item.key} className="price-item-editor">
                <div className="price-item-editor-title">
                  <span>{index + 1}. {item.label || 'Giá khám'}</span>
                  <button type="button" disabled={form.items.length <= 1} onClick={() => removeItem(item.key)}>
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="price-form-grid">
                  <div className="price-form-field full">
                    <label>Tên dòng giá</label>
                    <input value={item.label} onChange={(e) => updateItem(item.key, 'label', e.target.value)} placeholder="VD: Giá khám, Siêu âm khớp..." />
                  </div>
                  <div className="price-form-field">
                    <label>Giá (VND) *</label>
                    <input value={item.amount_vnd} onChange={(e) => updateItem(item.key, 'amount_vnd', e.target.value)} placeholder="500000" />
                  </div>
                  <div className="price-form-field">
                    <label>Phạm vi</label>
                    <input value="Áp dụng cho bác sĩ này" disabled />
                  </div>
                  <div className="price-form-field">
                    <label>Từ ngày *</label>
                    <input type="date" value={item.effective_from} onChange={(e) => updateItem(item.key, 'effective_from', e.target.value)} />
                  </div>
                  <div className="price-form-field">
                    <label>Đến ngày</label>
                    <input type="date" value={item.effective_to} onChange={(e) => updateItem(item.key, 'effective_to', e.target.value)} />
                  </div>
                  <div className="price-form-field">
                    <label>Thứ</label>
                    <select value={item.day_of_week} onChange={(e) => updateItem(item.key, 'day_of_week', e.target.value)}>
                      <option value="all">Tất cả</option>
                      {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                        <option key={d} value={d}>{DOW_LABELS[d]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="price-form-field">
                    <label>Buổi</label>
                    <select value={item.session_type} onChange={(e) => updateItem(item.key, 'session_type', e.target.value)}>
                      <option value="all">Tất cả</option>
                      {SESSIONS.map((s) => <option key={s.type} value={s.type}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="price-form-field">
                    <label>TT</label>
                    <select value={item.status} onChange={(e) => updateItem(item.key, 'status', e.target.value)}>
                      <option value={1}>Bật</option>
                      <option value={0}>Tắt</option>
                    </select>
                  </div>
                  <div className="price-form-field">
                    <label>Hạng</label>
                    <input type="number" value={item.rank} onChange={(e) => updateItem(item.key, 'rank', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="price-modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button type="button" className="btn btn-primary" onClick={onSave} disabled={saving}>
            {saving ? 'Đang lưu...' : form.id ? 'Cập nhật' : 'Thêm'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Price Tab ───────────────────────────────────────────── */
function PriceTab({ clinicId }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(() => emptyPriceForm(clinicId));
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getPricePackages({ clinic_id: clinicId, limit: 100, page: 1 });
      const list = r?.data || [];
      const detailed = await Promise.all(
        list.map((pkg) =>
          getPricePackageDetail(pkg.id)
            .then((res) => normalizePriceDetail(res.data || pkg))
            .catch(() => normalizePriceDetail(pkg))
        )
      );
      setPackages(detailed);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [clinicId]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setForm(emptyPriceForm(clinicId));
    setModalOpen(true);
  };

  const openEdit = (pkg) => {
    setForm(priceDetailToForm(pkg, clinicId));
    setModalOpen(true);
  };

  const buildPayload = () => ({
    clinic_id: clinicId,
    name: form.name,
    description: form.description || null,
    status: parseInt(form.status, 10),
    rank: parseInt(form.rank, 10),
    items: form.items.map((it) => ({
      clinic_place_id: '',
      effective_from: it.effective_from,
      effective_to: it.effective_to,
      day_of_week: it.day_of_week,
      session_type: it.session_type,
      amount_vnd: it.amount_vnd,
      currency: it.currency || 'VND',
      label: it.label,
      status: parseInt(it.status, 10),
      rank: parseInt(it.rank, 10),
    })),
  });

  const handleSave = async () => {
    if (!form.name) { alert('Nhập tên gói'); return; }
    if (!form.items.every((it) => it.effective_from && String(it.amount_vnd).trim() !== '')) {
      alert('Mỗi dòng giá cần ngày áp dụng và giá'); return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (form.id) await updatePricePackage(form.id, payload);
      else await createPricePackage(payload);
      setModalOpen(false);
      setForm(emptyPriceForm(clinicId));
      load();
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
    <div className="price-tab-panel">
      <div className="price-tab-toolbar">
        <button className="btn btn-primary price-add-package-btn" onClick={openCreate}>
          <Plus size={16} /> Thêm gói giá
        </button>
      </div>

      {modalOpen && (
        <PricePackageModal
          form={form}
          saving={saving}
          onChange={setForm}
          onSave={handleSave}
          onClose={() => { if (!saving) setModalOpen(false); }}
        />
      )}

      {packages.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem', fontSize: '0.875rem' }}>
          Chưa có gói giá nào. Bấm "+ Thêm gói" để tạo.
        </div>
      ) : packages.map(pkg => (
        <div key={pkg.id} className="price-package-card">
          <div className="price-package-card-head">
            <div>
              <h4>{pkg.name}</h4>
              <span>ID: {pkg.id} · {pkg.items?.length || 0} dòng giá · {pkg.status === 1 ? 'Hiển thị' : 'Ẩn'}</span>
            </div>
            <div className="price-package-actions">
              <button type="button" title="Sửa gói" onClick={() => openEdit(pkg)}>
                <Edit2 size={16} />
              </button>
              <button type="button" title="Xóa gói" className="delete" onClick={() => handleDelete(pkg.id)}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <div className="price-package-summary">
            <strong>{priceRange(pkg.items)}</strong>
            {pkg.description && <span>{pkg.description}</span>}
          </div>
          <div className="price-package-items">
            {(pkg.items || []).map((item) => (
              <div key={item.id || item.label} className={item.status === 1 ? 'price-package-row' : 'price-package-row muted'}>
                <div>
                  <strong>{item.label || 'Giá khám'}</strong>
                  <span>
                    Áp dụng cho bác sĩ này
                    {item.day_of_week != null ? ` · ${DOW_LABELS[item.day_of_week]}` : ''}
                    {item.session_type != null ? ` · ${SESSIONS.find((s) => s.type === item.session_type)?.label || `Buổi ${item.session_type}`}` : ''}
                  </span>
                </div>
                <strong>{money(item.amount_vnd)}</strong>
              </div>
            ))}
            {(pkg.items || []).length === 0 && (
              <div className="price-package-row muted">
                <div><strong>Chưa có dòng giá</strong><span>Bấm sửa để thêm giá áp dụng</span></div>
                <strong>—</strong>
              </div>
            )}
            <button type="button" className="price-add-item-row" onClick={() => openEdit(pkg)}>
              <Plus size={16} /> Thêm/sửa dòng giá
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

const emptyInsuranceItem = (type = 'private') => ({
  key: Math.random().toString(36).slice(2),
  clinic_place_id: '',
  insurance_type: type,
  insurer_name: '',
  insurer_code: '',
  coverage_note: '',
  copay_note: '',
  requires_referral: false,
  status: 1,
  rank: 99,
});

const emptyInsuranceForm = (clinicId) => ({
  id: null,
  clinic_id: clinicId,
  partner_id: '',
  insurance_type: 'public',
  name: '',
  description: '',
  status: 1,
  rank: 99,
  items: [],
});

const normalizeInsuranceDetail = (pkg) => ({
  ...pkg,
  items: Array.isArray(pkg.items) ? pkg.items : [],
});

const packageInsuranceType = (pkg) => {
  const items = Array.isArray(pkg?.items) ? pkg.items : [];
  if (items.some((it) => it.insurance_type === 'public')) return 'public';
  const text = `${pkg?.name || ''} ${pkg?.description || ''}`.toLowerCase();
  return text.includes('bhyt') || text.includes('y tế nhà nước') ? 'public' : 'private';
};

const cleanInsurancePackageName = (pkg) => {
  const raw = String(pkg?.name || '').trim();
  const isPlaceholder = /mặc định|default|seed|test/i.test(raw);
  if (isPlaceholder || !raw) {
    return packageInsuranceType(pkg) === 'public' ? 'Bảo hiểm y tế nhà nước' : 'Bảo hiểm bảo lãnh';
  }
  return raw;
};

const MASTER_INSURANCE_PACKAGE_NAME = 'Danh mục công ty bảo hiểm';
const DEFAULT_INSURANCE_COMPANIES = [
  { name: 'Bảo hiểm Bảo Việt', status: 1 },
  { name: 'Bảo hiểm PVI', status: 1 },
  { name: 'Bảo hiểm Bưu điện PTI', status: 1 },
  { name: 'Bảo hiểm Bảo Minh', status: 1 },
  { name: 'Bảo hiểm Quân đội MIC', status: 1 },
  { name: 'Bảo hiểm PJICO', status: 1 },
  { name: 'Bảo hiểm VBI', status: 1 },
  { name: 'Bảo hiểm VietinBank VBI', status: 1 },
  { name: 'Bảo hiểm BIDV BIC', status: 1 },
  { name: 'Bảo hiểm Liberty', status: 1 },
  { name: 'Bảo hiểm AIA', status: 1 },
  { name: 'Bảo hiểm Manulife Việt Nam', status: 1 },
  { name: 'Bảo hiểm Prudential Việt Nam', status: 1 },
  { name: 'Bảo hiểm Sun Life Việt Nam', status: 1 },
  { name: 'Bảo hiểm Dai-ichi Life Việt Nam', status: 1 },
  { name: 'Bảo hiểm FWD Việt Nam', status: 1 },
  { name: 'Bảo hiểm Chubb Life Việt Nam', status: 1 },
  { name: 'Bảo hiểm Generali Việt Nam', status: 1 },
  { name: 'Bảo hiểm Hanwha Life Việt Nam', status: 1 },
  { name: 'Bảo hiểm MB Ageas Life', status: 1 },
  { name: 'Bảo hiểm Tokio Marine Việt Nam', status: 1 },
  { name: 'Bảo hiểm Pacific Cross Việt Nam', status: 1 },
  { name: 'Bảo hiểm Fullerton Health Việt Nam', status: 1 },
  { name: 'Bảo hiểm Insmart', status: 1 },
  { name: 'Bảo hiểm CarePlus', status: 1 },
  { name: 'South Asia Services', status: 1 },
  { name: 'AXA Assistance', status: 1 },
  { name: 'LUMA Care', status: 1 },
  { name: 'April International', status: 1 },
  { name: 'Bảo hiểm MSIG Việt Nam', status: 1 }
];
const isMasterInsurancePackage = (pkg) => String(pkg?.name || '').trim().toLowerCase() === MASTER_INSURANCE_PACKAGE_NAME.toLowerCase();

const insuranceDetailToForm = (pkg, clinicId) => ({
  id: pkg?.id || null,
  clinic_id: String(pkg?.clinic_id || clinicId || ''),
  partner_id: pkg?.partner_id != null ? String(pkg.partner_id) : '',
  insurance_type: packageInsuranceType(pkg),
  name: cleanInsurancePackageName(pkg),
  description: pkg?.description || '',
  status: pkg?.status ?? 1,
  rank: pkg?.rank ?? 99,
  items: Array.isArray(pkg?.items)
    ? pkg.items.map((it) => ({
        key: String(it.id || Math.random().toString(36).slice(2)),
        clinic_place_id: it.clinic_place_id != null ? String(it.clinic_place_id) : '',
        insurance_type: it.insurance_type === 'public' ? 'public' : 'private',
        insurer_name: it.insurer_name || '',
        insurer_code: it.insurer_code || '',
        coverage_note: it.coverage_note || '',
        copay_note: it.copay_note || '',
        requires_referral: !!it.requires_referral,
        status: it.status ?? 1,
        rank: it.rank ?? 99,
      }))
    : [],
});

function InsuranceTypeModal({ form, saving, onChange, onSave, onDelete, onClose }) {
  const type = form.insurance_type || (form.items.some((it) => it.insurance_type === 'public') ? 'public' : 'private');
  const noteItem = form.items[0] || emptyInsuranceItem(type);
  const update = (field, value) => onChange((prev) => ({ ...prev, [field]: value }));
  const updateNoteItem = (field, value) => {
    onChange((prev) => {
      const items = prev.items.length ? prev.items : [{ ...emptyInsuranceItem(type), insurer_name: prev.name }];
      return {
        ...prev,
        items: items.map((it, idx) => (idx === 0 ? { ...it, [field]: value } : it)),
      };
    });
  };

  return (
    <div className="price-modal-backdrop">
      <div className="insurance-type-modal">
        <div className="price-modal-header">
          <h3>{form.id ? 'Sửa loại bảo hiểm' : 'Thêm loại bảo hiểm'}</h3>
          <button type="button" onClick={onClose}><X size={22} /></button>
        </div>
        <div className="price-modal-body">
          <div className="price-form-grid">
            <div className="price-form-field full">
              <label>Tên loại *</label>
              <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Tên loại" />
            </div>
            <div className="price-form-field full">
              <label>Hiển thị danh sách công ty bảo hiểm</label>
              <div className="inline-radio-row">
                <label>
                  <input type="radio" checked={type === 'private'} onChange={() => update('insurance_type', 'private')} /> Có
                </label>
                <label>
                  <input type="radio" checked={type !== 'private'} onChange={() => update('insurance_type', 'public')} /> Không
                </label>
              </div>
            </div>
            <div className="price-form-field full">
              <label>Mô tả</label>
              <textarea rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Mô tả loại bảo hiểm" />
            </div>
            <div className="price-form-field full">
              <label>Ghi chú</label>
              <textarea rows={3} value={noteItem.copay_note || ''} onChange={(e) => updateNoteItem('copay_note', e.target.value)} placeholder="Ghi chú" />
            </div>
            <div className="price-form-field">
              <label>Vị trí</label>
              <input value={form.rank} onChange={(e) => update('rank', e.target.value)} placeholder="Vị trí" />
            </div>
            <div className="price-form-field">
              <label>Trạng thái hiển thị</label>
              <select value={form.status} onChange={(e) => update('status', e.target.value)}>
                <option value={1}>Hiển thị</option>
                <option value={0}>Không hiển thị</option>
              </select>
            </div>
          </div>
        </div>
        <div className="price-modal-actions">
          {form.id && <button type="button" className="btn btn-secondary" onClick={onDelete}>Xoá</button>}
          <button type="button" className="btn btn-primary" onClick={onSave} disabled={saving}>
            {saving ? 'Đang lưu...' : form.id ? 'Lưu' : 'Thêm'}
          </button>
        </div>
      </div>
    </div>
  );
}

function InsuranceCompanyModal({
  pkg,
  company,
  editing,
  saving,
  onChange,
  onNew,
  onEdit,
  onSave,
  onDelete,
  onClose,
}) {
  const update = (field, value) => onChange((prev) => ({ ...prev, [field]: value }));
  const companies = Array.isArray(pkg?.items) ? pkg.items : [];

  return (
    <div className="price-modal-backdrop">
      <div className="insurance-company-manager-modal">
        <div className="price-modal-header">
          <h3>Quản lý công ty bảo hiểm</h3>
          <button type="button" onClick={onClose}><X size={22} /></button>
        </div>
        <div className="price-modal-body">
          <div className="insurance-company-manager-head">
            <div>
              <strong>{cleanInsurancePackageName(pkg) || 'Bảo hiểm bảo lãnh'}</strong>
              <span>{companies.length} công ty bảo hiểm</span>
            </div>
            <button type="button" className="btn btn-primary" onClick={onNew}>
              <Plus size={15} /> Thêm công ty
            </button>
          </div>

          <div className="insurance-company-manager-list">
            {companies.length === 0 ? (
              <div className="insurance-company-empty">Chưa có công ty bảo hiểm nào.</div>
            ) : companies.map((item, index) => (
              <div key={item.id || `${item.insurer_name}-${index}`} className="insurance-company-manager-row">
                <span className="insurance-company-index">{index + 1}</span>
                <div>
                  <strong>{item.insurer_name}</strong>
                  {item.coverage_note && <span>{item.coverage_note}</span>}
                </div>
                <span className={item.status === 1 ? 'status-on' : 'status-off'}>
                  {item.status === 1 ? 'Hiển thị' : 'Không hiển thị'}
                </span>
                <div className="insurance-company-manager-actions">
                  <button type="button" title="Sửa" onClick={() => onEdit(item)}>
                    <Edit2 size={15} />
                  </button>
                  <button type="button" title="Xóa" className="delete" onClick={() => onDelete(item)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {editing && (
            <div className="insurance-company-editor">
              <h4>{company.key ? 'Sửa công ty bảo hiểm' : 'Chọn công ty bảo hiểm'}</h4>
              <div className="price-form-grid">
                <div className="price-form-field full">
                  <label>Tên công ty bảo hiểm *</label>
                  <input
                    value={company.insurer_name || ''}
                    onChange={(e) => update('insurer_name', e.target.value)}
                    placeholder="Tên công ty bảo hiểm"
                  />
                </div>
                <div className="price-form-field full">
                  <label>Mô tả</label>
                  <textarea rows={3} value={company.coverage_note || ''} onChange={(e) => update('coverage_note', e.target.value)} placeholder="Mô tả" />
                </div>
                <div className="price-form-field">
                  <label>Mã công ty</label>
                  <input value={company.insurer_code || ''} onChange={(e) => update('insurer_code', e.target.value)} placeholder="Mã" />
                </div>
                <div className="price-form-field">
                  <label>Trạng thái hiển thị</label>
                  <select value={company.status ?? 1} onChange={(e) => update('status', e.target.value)}>
                    <option value={1}>Hiển thị</option>
                    <option value={0}>Không hiển thị</option>
                  </select>
                </div>
              </div>
              <div className="insurance-company-editor-actions">
                <button type="button" className="btn btn-primary" onClick={onSave} disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Insurance Tab ───────────────────────────────────────── */
function InsuranceTab({ clinicId }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [companyPickerOpen, setCompanyPickerOpen] = useState(false);
  const [companyEditing, setCompanyEditing] = useState(false);
  const [form, setForm] = useState(() => emptyInsuranceForm(clinicId));
  const [companyForm, setCompanyForm] = useState({ ...emptyInsuranceItem('private'), key: '' });
  const [companyPackage, setCompanyPackage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedCompanyNames, setSelectedCompanyNames] = useState([]);
  const [companySearch, setCompanySearch] = useState('');
  const [companyStatusFilter, setCompanyStatusFilter] = useState('all');
  const masterPackage = packages.find(isMasterInsurancePackage) || null;
  const appliedPackages = packages.filter((pkg) => !isMasterInsurancePackage(pkg));

  const masterCompanies = Array.from(
    (masterPackage?.items || []).reduce((map, it) => {
      const name = String(it.insurer_name || '').trim();
      if (!name) return map;
      if (!map.has(name)) {
        map.set(name, {
          name,
          status: Number(it.status ?? 1),
        });
      } else if (Number(it.status ?? 1) === 1) {
        map.set(name, { name, status: 1 });
      }
      return map;
    }, new Map()).values()
  ).sort((a, b) => a.name.localeCompare(b.name, 'vi'));

  const fallbackMasterCompanies = Array.from(
    packages
      .flatMap((pkg) => Array.isArray(pkg.items) ? pkg.items : [])
      .reduce((map, it) => {
        const name = String(it.insurer_name || '').trim();
        if (!name) return map;
        if (!map.has(name)) {
          map.set(name, {
            name,
            status: Number(it.status ?? 1),
          });
        } else if (Number(it.status ?? 1) === 1) {
          map.set(name, { name, status: 1 });
        }
        return map;
      }, new Map())
      .values()
  ).sort((a, b) => a.name.localeCompare(b.name, 'vi'));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getInsurancePackages({ clinic_id: clinicId, limit: 100, page: 1 });
      const list = r?.data || [];
      const detailed = await Promise.all(
        list.map((pkg) =>
          getInsurancePackageDetail(pkg.id)
            .then((res) => normalizeInsuranceDetail(res.data || pkg))
            .catch(() => normalizeInsuranceDetail(pkg))
        )
      );
      setPackages(detailed);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [clinicId]);

  useEffect(() => { load(); }, [load]);

  const ensureMasterPackage = useCallback(async () => {
    if (masterPackage) return masterPackage;
    const seedSource = packages.find((pkg) => packageInsuranceType(pkg) === 'private') || null;
    const payload = buildPayload({
      ...emptyInsuranceForm(clinicId),
      insurance_type: 'private',
      name: MASTER_INSURANCE_PACKAGE_NAME,
      description: 'Danh mục công ty bảo hiểm dùng để gắn cho nơi khám/bác sĩ',
      status: 1,
      rank: 1,
      items: (seedSource?.items || []).map((it, idx) => ({
        ...emptyInsuranceItem('private'),
        insurer_name: it.insurer_name || '',
        insurer_code: it.insurer_code || '',
        coverage_note: it.coverage_note || '',
        copay_note: it.copay_note || '',
        status: Number(it.status ?? 1),
        rank: Number(it.rank ?? (idx + 1)),
      })).filter((it) => it.insurer_name),
    });
    const created = await createInsurancePackage(payload);
    const createdData = normalizeInsuranceDetail(created?.data || created);
    await load();
    return createdData;
  }, [masterPackage, packages, clinicId, load]);

  const buildPayload = (data = form) => ({
    clinic_id: clinicId,
    partner_id: data.partner_id || null,
    name: data.name,
    description: data.description || null,
    status: parseInt(data.status, 10),
    rank: parseInt(data.rank, 10),
    items: data.items.map((it) => ({
      clinic_place_id: it.clinic_place_id || '',
      insurance_type: it.insurance_type || data.insurance_type || 'private',
      insurer_name: it.insurer_name || data.name,
      insurer_code: it.insurer_code,
      coverage_note: it.coverage_note,
      copay_note: it.copay_note,
      requires_referral: !!it.requires_referral,
      status: parseInt(it.status, 10),
      rank: parseInt(it.rank, 10),
    })),
  });

  const openCreateType = () => {
    setForm({
      ...emptyInsuranceForm(clinicId),
      insurance_type: 'public',
      items: [{ ...emptyInsuranceItem('public'), insurer_name: '' }],
    });
    setTypeModalOpen(true);
  };

  const openEditType = (pkg) => {
    setForm(insuranceDetailToForm(pkg, clinicId));
    setTypeModalOpen(true);
  };

  const toCompanyForm = (item = null) => item ? {
    key: String(item.id || item.key),
    clinic_place_id: item.clinic_place_id != null ? String(item.clinic_place_id) : '',
    insurance_type: 'private',
    insurer_name: item.insurer_name || '',
    insurer_code: item.insurer_code || '',
    coverage_note: item.coverage_note || '',
    copay_note: item.copay_note || '',
    requires_referral: !!item.requires_referral,
    status: item.status ?? 1,
    rank: item.rank ?? 99,
  } : { ...emptyInsuranceItem('private'), key: '' };

  const openCompanyManager = (pkg = null) => {
    setCompanyPackage(pkg);
    setCompanyForm({ ...emptyInsuranceItem('private'), key: '' });
    setCompanyEditing(false);
    setCompanyModalOpen(true);
  };

  const openCompanyPicker = async (pkg) => {
    await load();
    setCompanyPackage(pkg);
    const currentNames = (pkg?.items || [])
      .map((it) => String(it.insurer_name || '').trim())
      .filter(Boolean);
    setSelectedCompanyNames(Array.from(new Set(currentNames)));
    setCompanySearch('');
    setCompanyStatusFilter('all');
    setCompanyPickerOpen(true);
  };

  const startNewCompany = () => {
    setCompanyForm({ ...emptyInsuranceItem('private'), key: '', insurer_name: '' });
    setCompanyEditing(true);
  };

  const startEditCompany = (item) => {
    setCompanyForm(toCompanyForm(item));
    setCompanyEditing(true);
  };

  const handleSaveType = async () => {
    if (!form.name) { alert('Nhập tên loại bảo hiểm'); return; }
    setSaving(true);
    try {
      const insuranceType = form.insurance_type || 'public';
      const next = {
        ...form,
        items: form.items.length
          ? form.items.map((it) => ({
              ...it,
              insurance_type: it.insurance_type || insuranceType,
              insurer_name: it.insurer_name || form.name,
            }))
          : insuranceType === 'public'
            ? [{ ...emptyInsuranceItem('public'), insurer_name: form.name }]
            : [],
      };
      const payload = buildPayload(next);
      if (form.id) await updateInsurancePackage(form.id, payload);
      else await createInsurancePackage(payload);
      setTypeModalOpen(false);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi');
    } finally { setSaving(false); }
  };

  const handleSaveCompany = async () => {
    if (!companyForm.insurer_name) { alert('Nhập tên công ty bảo hiểm'); return; }
    setSaving(true);
    try {
      let targetPackage = companyPackage;
      if (!targetPackage || !isMasterInsurancePackage(targetPackage)) {
        targetPackage = await ensureMasterPackage();
      }
      if (!targetPackage?.id) {
        throw new Error('Không tìm thấy gói danh mục công ty bảo hiểm');
      }
      const base = insuranceDetailToForm(targetPackage, clinicId);
      const nextItems = companyForm.key
        ? base.items.map((it) => (String(it.key) === String(companyForm.key) ? { ...it, ...companyForm } : it))
        : [...base.items, { ...companyForm, key: Math.random().toString(36).slice(2) }];
      const next = { ...base, items: nextItems.map((it) => ({ ...it, insurance_type: 'private' })) };
      try {
        await updateInsurancePackage(targetPackage.id, buildPayload(next));
      } catch (err) {
        // fallback: package có thể vừa bị stale do đổi context -> tạo mới master rồi lưu lại
        const recreated = await ensureMasterPackage();
        if (!recreated?.id) throw err;
        const rebase = insuranceDetailToForm(recreated, clinicId);
        const reitems = companyForm.key
          ? rebase.items.map((it) => (String(it.key) === String(companyForm.key) ? { ...it, ...companyForm } : it))
          : [...rebase.items, { ...companyForm, key: Math.random().toString(36).slice(2) }];
        await updateInsurancePackage(recreated.id, buildPayload({ ...rebase, items: reitems.map((it) => ({ ...it, insurance_type: 'private' })) }));
        targetPackage = recreated;
      }
      const refreshed = await getInsurancePackageDetail(targetPackage.id).catch(() => null);
      if (refreshed?.data) setCompanyPackage(normalizeInsuranceDetail(refreshed.data));
      setCompanyEditing(false);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Lỗi');
    } finally { setSaving(false); }
  };

  const handleDeleteCompany = async (item) => {
    if (!companyPackage) return;
    if (!window.confirm('Xóa công ty bảo hiểm này?')) return;
    setSaving(true);
    try {
      let targetPackage = companyPackage;
      if (!targetPackage || !isMasterInsurancePackage(targetPackage)) {
        targetPackage = await ensureMasterPackage();
      }
      const base = insuranceDetailToForm(targetPackage, clinicId);
      const nextItems = base.items.filter((it) => String(it.key) !== String(item.id || item.key));
      await updateInsurancePackage(targetPackage.id, buildPayload({ ...base, items: nextItems }));
      const refreshed = await getInsurancePackageDetail(targetPackage.id).catch(() => null);
      if (refreshed?.data) setCompanyPackage(normalizeInsuranceDetail(refreshed.data));
      // Đồng bộ: gỡ luôn công ty này khỏi toàn bộ gói áp dụng private
      const deletedName = String(item?.insurer_name || '').trim();
      if (deletedName) {
        await Promise.all(
          appliedPackages
            .filter((pkg) => packageInsuranceType(pkg) === 'private')
            .map(async (pkg) => {
              const pkgBase = insuranceDetailToForm(pkg, clinicId);
              const pkgNextItems = pkgBase.items.filter(
                (it) => String(it.insurer_name || '').trim() !== deletedName
              );
              if (pkgNextItems.length !== pkgBase.items.length) {
                await updateInsurancePackage(pkg.id, buildPayload({ ...pkgBase, items: pkgNextItems }));
              }
            })
        );
      }
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Xóa thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFromAppliedPackage = async (pkg, item) => {
    if (!pkg?.id) return;
    if (!window.confirm('Loại công ty bảo hiểm này khỏi nơi khám hiện tại?')) return;
    setSaving(true);
    try {
      const base = insuranceDetailToForm(pkg, clinicId);
      const nextItems = base.items.filter((it) => String(it.key) !== String(item.id || item.key));
      await updateInsurancePackage(pkg.id, buildPayload({ ...base, items: nextItems }));
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const toggleCompanyName = (name) => {
    setSelectedCompanyNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleAddCompanyFromPicker = async () => {
    if (!companyPackage) return;
    setSaving(true);
    try {
      const base = insuranceDetailToForm(companyPackage, clinicId);
      const oldByName = new Map(
        base.items
          .map((it) => [String(it.insurer_name || '').trim(), it])
          .filter(([name]) => Boolean(name))
      );
      const companySource = masterCompanies.length ? masterCompanies : (fallbackMasterCompanies.length ? fallbackMasterCompanies : DEFAULT_INSURANCE_COMPANIES);
      const selectableNames = new Set(
        companySource.filter((c) => Number(c.status) === 1).map((c) => c.name)
      );
      const finalNames = selectedCompanyNames.filter((name) => selectableNames.has(name));
      const nextItems = finalNames.map((name, idx) => {
        const old = oldByName.get(name);
        if (old) return { ...old, insurance_type: 'private', status: 1, rank: old.rank ?? (idx + 1) };
        return {
          ...emptyInsuranceItem('private'),
          key: Math.random().toString(36).slice(2),
          insurer_name: name,
          status: 1,
          rank: idx + 1,
        };
      });
      await updateInsurancePackage(companyPackage.id, buildPayload({ ...base, items: nextItems }));
      await load();
      setCompanyPickerOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Thêm thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa gói bảo hiểm?')) return;
    try { await deleteInsurancePackage(id); load(); } catch { alert('Xóa thất bại'); }
  };

  const privatePackage = appliedPackages.find((pkg) => packageInsuranceType(pkg) === 'private');
  const companySource = masterCompanies.length ? masterCompanies : (fallbackMasterCompanies.length ? fallbackMasterCompanies : DEFAULT_INSURANCE_COMPANIES);
  const filteredCompanySource = companySource.filter((company) => {
    const isVisible = Number(company.status) === 1;
    if (companyStatusFilter === 'visible' && !isVisible) return false;
    if (companyStatusFilter === 'hidden' && isVisible) return false;
    if (companySearch.trim()) {
      return company.name.toLowerCase().includes(companySearch.trim().toLowerCase());
    }
    return true;
  });

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Đang tải...</div>;

  return (
    <div className="insurance-tab-panel">
      <div className="insurance-tab-toolbar">
        <button className="btn btn-secondary" onClick={openCreateType}>
          Thêm loại
        </button>
        <button
          className="btn btn-secondary"
          onClick={async () => {
            const pkg = await ensureMasterPackage();
            openCompanyManager(pkg || null);
          }}
        >
          Quản lý công ty bảo hiểm
        </button>
      </div>

      {typeModalOpen && (
        <InsuranceTypeModal
          form={form}
          saving={saving}
          onChange={setForm}
          onSave={handleSaveType}
          onDelete={() => {
            if (form.id) handleDelete(form.id).then(() => setTypeModalOpen(false));
          }}
          onClose={() => { if (!saving) setTypeModalOpen(false); }}
        />
      )}

      {companyModalOpen && (
        <InsuranceCompanyModal
          pkg={companyPackage}
          company={companyForm}
          editing={companyEditing}
          saving={saving}
          onChange={setCompanyForm}
          onNew={startNewCompany}
          onEdit={startEditCompany}
          onSave={handleSaveCompany}
          onDelete={handleDeleteCompany}
          onClose={() => {
            if (!saving) {
              setCompanyModalOpen(false);
              setCompanyPackage(null);
              setCompanyEditing(false);
            }
          }}
        />
      )}

      {companyPickerOpen && (
        <div className="price-modal-backdrop">
          <div className="insurance-company-modal">
            <div className="price-modal-header">
              <h3>Chọn công ty bảo hiểm</h3>
              <button type="button" onClick={() => setCompanyPickerOpen(false)}><X size={22} /></button>
            </div>
            <div className="price-modal-body">
              <div className="price-form-grid" style={{ marginBottom: 12 }}>
                <div className="price-form-field">
                  <label>Tìm kiếm</label>
                  <input
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    placeholder="Nhập tên công ty bảo hiểm..."
                  />
                </div>
                <div className="price-form-field">
                  <label>Trạng thái</label>
                  <select value={companyStatusFilter} onChange={(e) => setCompanyStatusFilter(e.target.value)}>
                    <option value="all">Tất cả</option>
                    <option value="visible">Hiển thị</option>
                    <option value="hidden">Ẩn</option>
                  </select>
                </div>
              </div>
              <div className="price-form-grid">
                <div className="price-form-field full">
                  <label>Danh sách công ty bảo hiểm</label>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, maxHeight: 320, overflowY: 'auto' }}>
                    {filteredCompanySource.map((company) => {
                      const checked = selectedCompanyNames.includes(company.name);
                      const isVisible = Number(company.status) === 1;
                      return (
                        <label
                          key={company.name}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            padding: '10px 12px',
                            borderBottom: '1px solid #f1f5f9',
                            cursor: 'pointer',
                            background: checked ? '#eff6ff' : '#fff',
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={!isVisible}
                              onChange={() => toggleCompanyName(company.name)}
                            />
                            <span>{company.name}</span>
                          </span>
                          <span style={{ fontSize: 12, color: isVisible ? '#16a34a' : '#94a3b8', fontWeight: 600 }}>
                            {isVisible ? 'Hiển thị' : 'Ẩn'}
                          </span>
                        </label>
                      );
                    })}
                    {filteredCompanySource.length === 0 && (
                      <div style={{ padding: 12, color: '#64748b', fontSize: 13 }}>
                        Không có công ty bảo hiểm phù hợp bộ lọc.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="price-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setCompanyPickerOpen(false)}>Hủy</button>
              <button type="button" className="btn btn-primary" onClick={handleAddCompanyFromPicker} disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {appliedPackages.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem', fontSize: '0.875rem' }}>
          Chưa có gói bảo hiểm nào.
        </div>
      ) : appliedPackages.map(pkg => (
        <div key={pkg.id} className="insurance-package-card">
          <div className="insurance-package-head">
            <h4>{cleanInsurancePackageName(pkg)}</h4>
            <div className="price-package-actions">
              <button type="button" title="Sửa loại" onClick={() => openEditType(pkg)}>
                <Edit2 size={16} />
              </button>
            </div>
          </div>
          <div className="insurance-package-body">
            {(pkg.description || pkg.items?.[0]?.copay_note || pkg.items?.[0]?.coverage_note) && (
              <div className="insurance-note">
                <strong>Ghi chú:</strong> {pkg.description || pkg.items?.[0]?.copay_note || pkg.items?.[0]?.coverage_note}
              </div>
            )}
            {packageInsuranceType(pkg) === 'private' && (
              <div className="insurance-company-list">
                <button type="button" className="insurance-company-add" onClick={() => { openCompanyPicker(pkg); }}>
                  <Plus size={18} />
                </button>
                {(pkg.items || []).filter((item) => {
                  const source = masterCompanies.length ? masterCompanies : (fallbackMasterCompanies.length ? fallbackMasterCompanies : DEFAULT_INSURANCE_COMPANIES);
                  const ref = source.find((c) => c.name === String(item.insurer_name || '').trim());
                  return ref ? Number(ref.status) === 1 : false;
                }).map((item) => (
                  <div key={item.id || item.insurer_name} className="insurance-company-row">
                    <span>{item.insurer_name}</span>
                    <button
                      type="button"
                      title="Loại khỏi danh sách bảo hiểm áp dụng"
                      onClick={() => handleRemoveFromAppliedPackage(pkg, item)}
                    >
                      <Minus size={15} />
                    </button>
                  </div>
                ))}
                {(pkg.items || []).length === 0 && (
                  <div className="insurance-company-row muted">
                    <span>Chưa có công ty bảo hiểm</span>
                    <button type="button" onClick={() => {
                      openCompanyManager(pkg);
                      startNewCompany();
                    }}>
                      <Plus size={15} />
                    </button>
                  </div>
                )}
              </div>
            )}
            {packageInsuranceType(pkg) === 'public' && !(pkg.description || pkg.items?.[0]?.copay_note || pkg.items?.[0]?.coverage_note) && (
              <div className="insurance-note muted">Chưa có ghi chú.</div>
            )}
          </div>
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
          <h4>{doctor?.title ? `${doctor.title} ` : ''}{doctor?.name}</h4>
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
