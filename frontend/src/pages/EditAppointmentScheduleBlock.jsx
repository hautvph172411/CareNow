import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import {
  getScheduleBlockById,
  updateScheduleBlock,
  getSchedulePricePackages,
  getScheduleInsurancePackages,
} from '../api/appointmentSchedule.api';
import { getClinics } from '../api/clinic.api';
import { getPartners } from '../api/partner.api';
import { getClinicPlaces } from '../api/clinic_place.api';
import { getSpecialties } from '../api/specialty.api';
import { formatTimeInput } from '../utils/scheduleLabels';
import ScheduleTimePresetChips from '../components/ScheduleTimePresetChips';
import ScheduleBlockPricingSection from '../components/ScheduleBlockPricingSection';

export default function EditAppointmentScheduleBlock() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [specialistIds, setSpecialistIds] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [partners, setPartners] = useState([]);
  const [places, setPlaces] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [pricePkgs, setPricePkgs] = useState([]);
  const [insPkgs, setInsPkgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [c, p, sp] = await Promise.all([
          getClinics({ limit: 500, page: 1 }),
          getPartners({ limit: 500, page: 1 }),
          getSpecialties({ limit: 500, page: 1 }),
        ]);
        if (c?.data) setClinics(c.data);
        if (p?.data) setPartners(p.data);
        if (sp?.data) setSpecialties(sp.data);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await getScheduleBlockById(id);
        const d = res?.data;
        if (!d) throw new Error('empty');
        setForm({
          clinic_id: String(d.clinic_id),
          partner_id: String(d.partner_id),
          clinic_place_id: String(d.clinic_place_id),
          day_of_week: String(d.day_of_week),
          session_type: String(d.session_type),
          start_time: formatTimeInput(d.start_time),
          end_time: formatTimeInput(d.end_time),
          slot_step_minutes: d.slot_step_minutes,
          appointment_duration_minutes: d.appointment_duration_minutes,
          cutoff_minutes_before_slot: d.cutoff_minutes_before_slot,
          valid_from: d.valid_from || '',
          valid_to: d.valid_to || '',
          default_price_package_id: d.default_price_package_id != null ? String(d.default_price_package_id) : '',
          default_insurance_package_id: d.default_insurance_package_id != null ? String(d.default_insurance_package_id) : '',
          status: d.status,
          rank: d.rank,
        });
        setSpecialistIds(d.specialist_ids || []);
      } catch (e) {
        console.error(e);
        alert('Không tải được block');
        navigate('/appointment-schedule');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  useEffect(() => {
    if (!form?.partner_id) {
      setPlaces([]);
      return;
    }
    (async () => {
      try {
        const res = await getClinicPlaces({ partner_id: form.partner_id, limit: 500, page: 1 });
        if (res?.data) setPlaces(res.data);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [form?.partner_id]);

  useEffect(() => {
    if (!form?.clinic_id) {
      setPricePkgs([]);
      setInsPkgs([]);
      return;
    }
    (async () => {
      try {
        const [pr, ins] = await Promise.all([
          getSchedulePricePackages(form.clinic_id),
          getScheduleInsurancePackages(form.clinic_id),
        ]);
        if (pr?.data) setPricePkgs(pr.data);
        if (ins?.data) setInsPkgs(ins.data);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [form?.clinic_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleSpec = (sid) => {
    setSpecialistIds((prev) => (prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]));
  };

  const reloadPricePackages = async () => {
    if (!form?.clinic_id) return;
    try {
      const pr = await getSchedulePricePackages(form.clinic_id);
      if (pr?.data) setPricePkgs(pr.data);
    } catch (e) {
      console.error(e);
    }
  };

  const reloadInsurancePackages = async () => {
    if (!form?.clinic_id) return;
    try {
      const ins = await getScheduleInsurancePackages(form.clinic_id);
      if (ins?.data) setInsPkgs(ins.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateScheduleBlock(id, {
        ...form,
        clinic_id: parseInt(form.clinic_id, 10),
        partner_id: parseInt(form.partner_id, 10),
        clinic_place_id: parseInt(form.clinic_place_id, 10),
        day_of_week: parseInt(form.day_of_week, 10),
        session_type: parseInt(form.session_type, 10),
        slot_step_minutes: parseInt(form.slot_step_minutes, 10),
        appointment_duration_minutes: parseInt(form.appointment_duration_minutes, 10),
        cutoff_minutes_before_slot: parseInt(form.cutoff_minutes_before_slot, 10),
        status: parseInt(form.status, 10),
        rank: parseInt(form.rank, 10),
        valid_from: form.valid_from || null,
        valid_to: form.valid_to || null,
        default_price_package_id: form.default_price_package_id || null,
        default_insurance_package_id: form.default_insurance_package_id || null,
        specialist_ids: specialistIds,
      });
      alert('Đã cập nhật');
      navigate('/appointment-schedule');
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Lỗi');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !form) {
    return (
      <AdminLayout pageTitle="Sửa khung lịch">
        <div style={{ padding: '2rem' }}>Đang tải...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pageTitle="Sửa khung lịch">
      <div className="form-page-container">
        <div className="form-page-header">
          <button type="button" className="btn-back" onClick={() => navigate('/appointment-schedule')}>
            <ArrowLeft size={20} />
            Quay lại
          </button>
          <h1 className="form-page-title">Sửa khung lịch #{id}</h1>
          <button
            type="button"
            className="btn-secondary"
            style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 8 }}
            onClick={() => navigate(`/appointment-schedule/blocks/add?from=${id}`)}
          >
            Nhân bản thành ca mới
          </button>
        </div>

        <div className="form-page-content">
          <form onSubmit={handleSubmit} className="form-page-form">
            <div className="form-section">
              <h3 className="form-section-title">Địa điểm & bác sĩ</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Bác sĩ *</label>
                  <select name="clinic_id" className="form-input" value={form.clinic_id} onChange={handleChange} required>
                    {clinics.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Đối tác *</label>
                  <select
                    name="partner_id"
                    className="form-input"
                    value={form.partner_id}
                    onChange={(e) => {
                      handleChange(e);
                      setForm((p) => ({ ...p, partner_id: e.target.value, clinic_place_id: '' }));
                    }}
                    required
                  >
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Nơi khám *</label>
                  <select name="clinic_place_id" className="form-input" value={form.clinic_place_id} onChange={handleChange} required>
                    {places.map((pl) => (
                      <option key={pl.id} value={pl.id}>{pl.display_name || pl.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <ScheduleBlockPricingSection
              clinicId={form.clinic_id}
              partnerId={form.partner_id}
              placeId={form.clinic_place_id}
              defaultPricePackageId={form.default_price_package_id}
              defaultInsurancePackageId={form.default_insurance_package_id}
              pricePkgs={pricePkgs}
              insPkgs={insPkgs}
              patchForm={(patch) => setForm((p) => ({ ...p, ...patch }))}
              reloadPricePackages={reloadPricePackages}
              reloadInsurancePackages={reloadInsurancePackages}
              disabled={!form.clinic_id}
            />

            <div className="form-section">
              <h3 className="form-section-title">Khung thời gian</h3>
              <ScheduleTimePresetChips
                disabled={submitting}
                onApply={({ session_type, start_time, end_time }) => {
                  setForm((p) => ({ ...p, session_type, start_time, end_time }));
                }}
              />
              <div className="form-grid">
                <div className="form-group">
                  <label>Thứ *</label>
                  <select name="day_of_week" className="form-input" value={form.day_of_week} onChange={handleChange} required>
                    {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                      <option key={d} value={d}>{d === 0 ? 'Chủ nhật' : `Thứ ${d + 1}`}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Buổi *</label>
                  <select name="session_type" className="form-input" value={form.session_type} onChange={handleChange} required>
                    <option value={1}>Sáng</option>
                    <option value={2}>Chiều</option>
                    <option value={3}>Tối</option>
                    <option value={4}>Đêm</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Giờ bắt đầu *</label>
                  <input type="time" name="start_time" className="form-input" value={form.start_time} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Giờ kết thúc *</label>
                  <input type="time" name="end_time" className="form-input" value={form.end_time} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Bước slot (phút)</label>
                  <input type="number" name="slot_step_minutes" className="form-input" value={form.slot_step_minutes} onChange={handleChange} min={5} />
                </div>
                <div className="form-group">
                  <label>Thời lượng khám (phút)</label>
                  <input type="number" name="appointment_duration_minutes" className="form-input" value={form.appointment_duration_minutes} onChange={handleChange} min={5} />
                </div>
                <div className="form-group">
                  <label>Hạn đặt trước slot (phút)</label>
                  <input type="number" name="cutoff_minutes_before_slot" className="form-input" value={form.cutoff_minutes_before_slot} onChange={handleChange} min={0} />
                </div>
                <div className="form-group">
                  <label>Valid từ</label>
                  <input type="date" name="valid_from" className="form-input" value={form.valid_from} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Valid đến</label>
                  <input type="date" name="valid_to" className="form-input" value={form.valid_to} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select name="status" className="form-input" value={form.status} onChange={handleChange}>
                    <option value={1}>Bật</option>
                    <option value={0}>Tắt</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Thứ tự</label>
                  <input type="number" name="rank" className="form-input" value={form.rank} onChange={handleChange} />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">Chuyên khoa</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', maxHeight: 220, overflowY: 'auto' }}>
                {specialties.map((s) => (
                  <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                    <input type="checkbox" checked={specialistIds.includes(s.id)} onChange={() => toggleSpec(s.id)} />
                    {s.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/appointment-schedule')}>Hủy</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Đang lưu...' : 'Cập nhật'}</button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
