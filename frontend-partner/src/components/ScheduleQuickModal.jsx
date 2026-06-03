import { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { formatTimeInput, SCHEDULE_TIME_PRESETS } from '../utils/scheduleLabels';

export default function ScheduleQuickModal({ 
  isOpen, 
  onClose, 
  mode, 
  initialData, 
  clinics, 
  partners, 
  places,
  onSave,
  onDelete,
  onOpenFullForm 
}) {
  const [form, setForm] = useState({
    clinic_id: '',
    partner_id: '',
    clinic_place_id: '',
    day_of_week: '1',
    session_type: '1',
    start_time: '08:00',
    end_time: '12:00',
    slot_step_minutes: 30,
    appointment_duration_minutes: 30,
    status: 1
  });

  const [selectedDays, setSelectedDays] = useState([]);


  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && initialData) {
      if (mode === 'edit') {
        setForm({
          clinic_id: String(initialData.clinic_id || ''),
          partner_id: String(initialData.partner_id || ''),
          clinic_place_id: String(initialData.clinic_place_id || ''),
          day_of_week: String(initialData.day_of_week ?? '1'),
          session_type: String(initialData.session_type || '1'),
          start_time: formatTimeInput(initialData.start_time || '08:00'),
          end_time: formatTimeInput(initialData.end_time || '12:00'),
          slot_step_minutes: initialData.slot_step_minutes || 30,
          appointment_duration_minutes: initialData.appointment_duration_minutes || 30,
          status: initialData.status ?? 1
        });
        setSelectedDays([String(initialData.day_of_week ?? '1')]);
      } else {
        // mode === 'add'
        setForm({
          clinic_id: String(initialData.clinic_id || ''),
          partner_id: String(initialData.partner_id || ''),
          clinic_place_id: String(initialData.clinic_place_id || ''),
          day_of_week: String(initialData.day_of_week ?? '1'),
          session_type: '1',
          start_time: '08:00',
          end_time: '12:00',
          slot_step_minutes: 30,
          appointment_duration_minutes: 30,
          status: 1
        });
        setSelectedDays([String(initialData.day_of_week ?? '1')]);
      }
    }
  }, [isOpen, initialData, mode]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSave({ ...form, selectedDays });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const applyPreset = (preset) => {
    setForm(prev => ({
      ...prev,
      session_type: preset.session_type,
      start_time: preset.start_time,
      end_time: preset.end_time
    }));
  };

  const generateSlotPreview = () => {
    if (!form.start_time || !form.end_time || !form.slot_step_minutes) return [];
    const slots = [];
    let [h, m] = form.start_time.split(':').map(Number);
    let [eh, em] = form.end_time.split(':').map(Number);
    
    let currentMin = h * 60 + m;
    const endMin = eh * 60 + em;
    const step = Number(form.slot_step_minutes);
    
    let limit = 0;
    while (currentMin + step <= endMin && limit < 40) { // max 40 slots to prevent infinite
      const sh = Math.floor(currentMin / 60).toString().padStart(2, '0');
      const sm = (currentMin % 60).toString().padStart(2, '0');
      const nh = Math.floor((currentMin + step) / 60).toString().padStart(2, '0');
      const nm = ((currentMin + step) % 60).toString().padStart(2, '0');
      slots.push(`${sh}:${sm}-${nh}:${nm}`);
      currentMin += step;
      limit++;
    }
    return slots;
  };

  const toggleDay = (d) => {
    const ds = String(d);
    setSelectedDays(prev => prev.includes(ds) ? prev.filter(x => x !== ds) : [...prev, ds]);
  };

  const clinicName = clinics.find(c => String(c.id) === String(form.clinic_id))?.name || 'Bác sĩ';
  const dayName = form.day_of_week === '0' ? 'Chủ nhật' : `Thứ ${parseInt(form.day_of_week) + 1}`;

  const availablePlaces = places.filter(pl => String(pl.partner_id) === String(form.partner_id));

  return (
    <div className="quick-modal-overlay" onMouseDown={(e) => {
      if (e.target.classList.contains('quick-modal-overlay')) onClose();
    }}>
      <div className="quick-modal-content">
        <div className="quick-modal-header">
          <h3 className="quick-modal-title">
            {mode === 'edit' ? 'Sửa ca làm việc' : 'Thêm ca làm việc'}
          </h3>
          <button type="button" className="quick-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="quick-modal-body">
            <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
              <strong>{clinicName}</strong> • {dayName}
            </div>

            <div className="form-group">
              <label>Khung giờ nhanh</label>
              <div className="quick-modal-presets">
                {SCHEDULE_TIME_PRESETS.map(preset => (
                  <button
                    key={preset.key}
                    type="button"
                    className={`preset-chip ${form.session_type === preset.session_type && form.start_time === preset.start_time ? 'active' : ''}`}
                    onClick={() => applyPreset(preset)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Buổi *</label>
                <select 
                  className="form-input" 
                  value={form.session_type}
                  onChange={e => setForm(p => ({ ...p, session_type: e.target.value }))}
                  required
                >
                  <option value="1">Sáng</option>
                  <option value="2">Chiều</option>
                  <option value="3">Tối</option>
                  <option value="4">Đêm</option>
                </select>
              </div>
              <div className="form-group">
                <label>Trạng thái</label>
                <select 
                  className="form-input" 
                  value={form.status}
                  onChange={e => setForm(p => ({ ...p, status: parseInt(e.target.value) }))}
                >
                  <option value={1}>Đang bật</option>
                  <option value={0}>Tắt</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Giờ bắt đầu *</label>
                <input 
                  type="time" 
                  className="form-input" 
                  value={form.start_time}
                  onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Giờ kết thúc *</label>
                <input 
                  type="time" 
                  className="form-input" 
                  value={form.end_time}
                  onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Thời lượng 1 ca (phút)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={form.slot_step_minutes}
                  onChange={e => setForm(p => ({ ...p, slot_step_minutes: e.target.value, appointment_duration_minutes: e.target.value }))}
                  required
                  min="5"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Giờ còn trống (Preview)</label>
              <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5, background: '#f8fafc', padding: '0.5rem', borderRadius: '4px' }}>
                {generateSlotPreview().length > 0 ? generateSlotPreview().join(', ') : 'Không có ca khám nào được tạo'}
              </div>
            </div>

            {mode === 'add' && (
              <div className="form-group" style={{ marginTop: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                <label style={{ color: '#2563eb', fontWeight: 600 }}>Áp dụng lịch này cho các ngày khác</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  {[1, 2, 3, 4, 5, 6, 0].map(d => (
                    <label key={d} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedDays.includes(String(d))} 
                        onChange={() => toggleDay(d)} 
                      />
                      {d === 0 ? 'CN' : `T${d+1}`}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginTop: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              <label>Đối tác *</label>
              <select 
                className="form-input" 
                value={form.partner_id}
                onChange={e => setForm(p => ({ ...p, partner_id: e.target.value, clinic_place_id: '' }))}
                required
              >
                <option value="">— Chọn đối tác —</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Nơi khám *</label>
              <select 
                className="form-input" 
                value={form.clinic_place_id}
                onChange={e => setForm(p => ({ ...p, clinic_place_id: e.target.value }))}
                required
                disabled={!form.partner_id}
              >
                <option value="">— Chọn nơi khám —</option>
                {availablePlaces.map(pl => (
                  <option key={pl.id} value={pl.id}>{pl.display_name || pl.name}</option>
                ))}
              </select>
            </div>

          </div>

          <div className="quick-modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={onOpenFullForm}
            >
              <ExternalLink size={16} /> Chi tiết
            </button>

            {mode === 'edit' && (
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ color: '#ef4444' }}
                onClick={() => {
                  if (window.confirm('Xác nhận xóa ca này?')) {
                    onDelete();
                    onClose();
                  }
                }}
              >
                Xóa
              </button>
            )}

            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Đang lưu...' : 'Lưu lại'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
