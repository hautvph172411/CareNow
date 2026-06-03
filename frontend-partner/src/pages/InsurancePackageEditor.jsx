import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import {
  getInsurancePackageDetail,
  createInsurancePackage,
  updateInsurancePackage,
} from '../api/clinicInsurance.api';
import { getClinics } from '../api/clinic.api';
import { getPartners } from '../api/partner.api';
import { getClinicPlaces } from '../api/clinic_place.api';

const emptyItem = () => ({
  key: Math.random().toString(36).slice(2),
  clinic_place_id: '',
  insurer_name: '',
  insurer_code: '',
  coverage_note: '',
  copay_note: '',
  requires_referral: false,
  status: 1,
  rank: 99,
});

export default function InsurancePackageEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [clinics, setClinics] = useState([]);
  const [partners, setPartners] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [pkg, setPkg] = useState({
    clinic_id: '',
    partner_id: '',
    name: '',
    description: '',
    status: 1,
    rank: 99,
  });
  const [items, setItems] = useState([emptyItem()]);

  useEffect(() => {
    (async () => {
      const [c, p] = await Promise.all([
        getClinics({ limit: 500, page: 1 }),
        getPartners({ limit: 500, page: 1 }),
      ]);
      if (c?.data) setClinics(c.data);
      if (p?.data) setPartners(p.data);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const pl = await getClinicPlaces({ limit: 500, page: 1 });
      if (pl?.data) setPlaces(pl.data);
    })();
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const res = await getInsurancePackageDetail(id);
        const d = res.data;
        if (!d) throw new Error('empty');
        setPkg({
          clinic_id: String(d.clinic_id),
          partner_id: d.partner_id != null ? String(d.partner_id) : '',
          name: d.name || '',
          description: d.description || '',
          status: d.status,
          rank: d.rank,
        });
        if (Array.isArray(d.items) && d.items.length > 0) {
          setItems(
            d.items.map((it) => ({
              key: String(it.id),
              clinic_place_id: it.clinic_place_id != null ? String(it.clinic_place_id) : '',
              insurer_name: it.insurer_name || '',
              insurer_code: it.insurer_code || '',
              coverage_note: it.coverage_note || '',
              copay_note: it.copay_note || '',
              requires_referral: !!it.requires_referral,
              status: it.status,
              rank: it.rank,
            }))
          );
        } else {
          setItems([emptyItem()]);
        }
      } catch (e) {
        console.error(e);
        alert('Không tải được gói');
        navigate('/appointment-schedule/insurance-packages');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit, navigate]);

  const updateItem = (key, field, value) => {
    setItems((prev) => prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)));
  };

  const addRow = () => setItems((prev) => [...prev, emptyItem()]);
  const removeRow = (key) => setItems((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.key !== key)));

  const buildPayload = () => ({
    clinic_id: pkg.clinic_id,
    partner_id: pkg.partner_id || null,
    name: pkg.name,
    description: pkg.description || null,
    status: parseInt(pkg.status, 10),
    rank: parseInt(pkg.rank, 10),
    items: items.map((it) => ({
      clinic_place_id: it.clinic_place_id,
      insurer_name: it.insurer_name,
      insurer_code: it.insurer_code,
      coverage_note: it.coverage_note,
      copay_note: it.copay_note,
      requires_referral: it.requires_referral,
      status: parseInt(it.status, 10),
      rank: parseInt(it.rank, 10),
    })),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) await updateInsurancePackage(id, buildPayload());
      else await createInsurancePackage(buildPayload());
      alert('Đã lưu');
      navigate('/appointment-schedule/insurance-packages');
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Lỗi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout pageTitle="Gói BH">
        <div style={{ padding: '2rem' }}>Đang tải...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pageTitle={isEdit ? `Sửa gói BH #${id}` : 'Thêm gói BH'}>
      <div className="form-page-container">
        <div className="form-page-header">
          <button type="button" className="btn-back" onClick={() => navigate('/appointment-schedule/insurance-packages')}>
            <ArrowLeft size={20} />
            Quay lại
          </button>
          <h1 className="form-page-title">{isEdit ? 'Sửa gói bảo hiểm' : 'Thêm gói bảo hiểm'}</h1>
        </div>

        <form onSubmit={handleSubmit} className="form-page-content form-page-form">
          <div className="form-section">
            <h3 className="form-section-title">Thông tin gói</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Bác sĩ *</label>
                <select
                  className="form-input"
                  value={pkg.clinic_id}
                  onChange={(e) => setPkg((p) => ({ ...p, clinic_id: e.target.value }))}
                  required
                  disabled={isEdit}
                >
                  <option value="">—</option>
                  {clinics.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Đối tác (tuỳ chọn)</label>
                <select className="form-input" value={pkg.partner_id} onChange={(e) => setPkg((p) => ({ ...p, partner_id: e.target.value }))}>
                  <option value="">— Không gắn —</option>
                  {partners.map((x) => (
                    <option key={x.id} value={x.id}>{x.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group full-width">
                <label>Tên gói *</label>
                <input className="form-input" value={pkg.name} onChange={(e) => setPkg((p) => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="form-group full-width">
                <label>Mô tả</label>
                <textarea className="form-input textarea" rows={2} value={pkg.description} onChange={(e) => setPkg((p) => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Trạng thái</label>
                <select className="form-input" value={pkg.status} onChange={(e) => setPkg((p) => ({ ...p, status: e.target.value }))}>
                  <option value={1}>Bật</option>
                  <option value={0}>Tắt</option>
                </select>
              </div>
              <div className="form-group">
                <label>Hạng</label>
                <input type="number" className="form-input" value={pkg.rank} onChange={(e) => setPkg((p) => ({ ...p, rank: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="form-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 className="form-section-title" style={{ margin: 0 }}>Các dòng BH</h3>
              <button type="button" className="btn-secondary" onClick={addRow}>
                <Plus size={16} /> Thêm dòng
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="specialties-table" style={{ fontSize: 13 }}>
                <thead>
                  <tr>
                    <th>Nơi khám</th>
                    <th>Tên BH *</th>
                    <th>Mã</th>
                    <th>Phạm vi</th>
                    <th>Đồng chi trả</th>
                    <th>Giấy GT</th>
                    <th>TT</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.key}>
                      <td>
                        <select className="form-input" style={{ minWidth: 130 }} value={it.clinic_place_id} onChange={(e) => updateItem(it.key, 'clinic_place_id', e.target.value)}>
                          <option value="">— Mọi nơi —</option>
                          {places.map((pl) => (
                            <option key={pl.id} value={pl.id}>{pl.short_name || pl.name}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input className="form-input" style={{ width: 120 }} value={it.insurer_name} onChange={(e) => updateItem(it.key, 'insurer_name', e.target.value)} required />
                      </td>
                      <td>
                        <input className="form-input" style={{ width: 80 }} value={it.insurer_code} onChange={(e) => updateItem(it.key, 'insurer_code', e.target.value)} />
                      </td>
                      <td>
                        <input className="form-input" style={{ width: 140 }} value={it.coverage_note} onChange={(e) => updateItem(it.key, 'coverage_note', e.target.value)} />
                      </td>
                      <td>
                        <input className="form-input" style={{ width: 120 }} value={it.copay_note} onChange={(e) => updateItem(it.key, 'copay_note', e.target.value)} />
                      </td>
                      <td>
                        <label style={{ fontSize: 12 }}>
                          <input type="checkbox" checked={it.requires_referral} onChange={(e) => updateItem(it.key, 'requires_referral', e.target.checked)} />
                          {' '}Cần GT
                        </label>
                      </td>
                      <td>
                        <select className="form-input" value={it.status} onChange={(e) => updateItem(it.key, 'status', e.target.value)}>
                          <option value={1}>Bật</option>
                          <option value={0}>Tắt</option>
                        </select>
                      </td>
                      <td>
                        <button type="button" className="btn-action delete" onClick={() => removeRow(it.key)}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/appointment-schedule/insurance-packages')}>Hủy</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
