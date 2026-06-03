import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import {
  getPricePackageDetail,
  createPricePackage,
  updatePricePackage,
} from '../api/clinicPrice.api';
import { getClinics } from '../api/clinic.api';
import { getClinicPlaces } from '../api/clinic_place.api';

const emptyItem = () => ({
  key: Math.random().toString(36).slice(2),
  clinic_place_id: '',
  effective_from: new Date().toISOString().slice(0, 10),
  effective_to: '',
  day_of_week: 'all',
  session_type: 'all',
  amount_vnd: '',
  currency: 'VND',
  label: '',
  status: 1,
  rank: 99,
});

export default function PricePackageEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [clinics, setClinics] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [pkg, setPkg] = useState({
    clinic_id: '',
    name: '',
    description: '',
    status: 1,
    rank: 99,
  });
  const [items, setItems] = useState([emptyItem()]);

  useEffect(() => {
    (async () => {
      const c = await getClinics({ limit: 500, page: 1 });
      if (c?.data) setClinics(c.data);
      const pl = await getClinicPlaces({ limit: 500, page: 1 });
      if (pl?.data) setPlaces(pl.data);
    })();
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const res = await getPricePackageDetail(id);
        const d = res.data;
        if (!d) throw new Error('empty');
        setPkg({
          clinic_id: String(d.clinic_id),
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
              effective_from: it.effective_from ? String(it.effective_from).slice(0, 10) : '',
              effective_to: it.effective_to ? String(it.effective_to).slice(0, 10) : '',
              day_of_week: it.day_of_week == null ? 'all' : String(it.day_of_week),
              session_type: it.session_type == null ? 'all' : String(it.session_type),
              amount_vnd: String(it.amount_vnd ?? ''),
              currency: it.currency || 'VND',
              label: it.label || '',
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
        navigate('/appointment-schedule/price-packages');
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
    name: pkg.name,
    description: pkg.description || null,
    status: parseInt(pkg.status, 10),
    rank: parseInt(pkg.rank, 10),
    items: items.map((it) => ({
      clinic_place_id: it.clinic_place_id,
      effective_from: it.effective_from,
      effective_to: it.effective_to,
      day_of_week: it.day_of_week,
      session_type: it.session_type,
      amount_vnd: it.amount_vnd,
      currency: it.currency,
      label: it.label,
      status: parseInt(it.status, 10),
      rank: parseInt(it.rank, 10),
    })),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await updatePricePackage(id, buildPayload());
      } else {
        await createPricePackage(buildPayload());
      }
      alert('Đã lưu');
      navigate('/appointment-schedule/price-packages');
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Lỗi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout pageTitle="Gói giá">
        <div style={{ padding: '2rem' }}>Đang tải...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pageTitle={isEdit ? `Sửa gói giá #${id}` : 'Thêm gói giá'}>
      <div className="form-page-container">
        <div className="form-page-header">
          <button type="button" className="btn-back" onClick={() => navigate('/appointment-schedule/price-packages')}>
            <ArrowLeft size={20} />
            Quay lại
          </button>
          <h1 className="form-page-title">{isEdit ? 'Sửa gói giá' : 'Thêm gói giá'}</h1>
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
              <h3 className="form-section-title" style={{ margin: 0 }}>Các dòng giá (điều kiện áp dụng)</h3>
              <button type="button" className="btn-secondary" onClick={addRow}>
                <Plus size={16} /> Thêm dòng
              </button>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
              Thứ / buổi để &quot;Tất cả&quot; = không lọc. Nơi khám để trống = mọi chi nhánh.
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table className="specialties-table" style={{ fontSize: 13 }}>
                <thead>
                  <tr>
                    <th>Nơi khám</th>
                    <th>Từ ngày</th>
                    <th>Đến ngày</th>
                    <th>Thứ</th>
                    <th>Buổi</th>
                    <th>Giá (VND)</th>
                    <th>Nhãn</th>
                    <th>TT</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.key}>
                      <td>
                        <select
                          className="form-input"
                          style={{ minWidth: 140 }}
                          value={it.clinic_place_id}
                          onChange={(e) => updateItem(it.key, 'clinic_place_id', e.target.value)}
                        >
                          <option value="">— Mọi nơi —</option>
                          {places.map((pl) => (
                            <option key={pl.id} value={pl.id}>{pl.short_name || pl.name}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input type="date" className="form-input" value={it.effective_from} onChange={(e) => updateItem(it.key, 'effective_from', e.target.value)} required />
                      </td>
                      <td>
                        <input type="date" className="form-input" value={it.effective_to} onChange={(e) => updateItem(it.key, 'effective_to', e.target.value)} />
                      </td>
                      <td>
                        <select className="form-input" value={it.day_of_week} onChange={(e) => updateItem(it.key, 'day_of_week', e.target.value)}>
                          <option value="all">Tất cả</option>
                          {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                            <option key={d} value={d}>{d === 0 ? 'CN' : `T${d + 1}`}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select className="form-input" value={it.session_type} onChange={(e) => updateItem(it.key, 'session_type', e.target.value)}>
                          <option value="all">Tất cả</option>
                          <option value={1}>Sáng</option>
                          <option value={2}>Chiều</option>
                          <option value={3}>Tối</option>
                          <option value={4}>Đêm</option>
                        </select>
                      </td>
                      <td>
                        <input className="form-input" style={{ width: 120 }} value={it.amount_vnd} onChange={(e) => updateItem(it.key, 'amount_vnd', e.target.value)} required />
                      </td>
                      <td>
                        <input className="form-input" style={{ width: 100 }} value={it.label} onChange={(e) => updateItem(it.key, 'label', e.target.value)} />
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
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/appointment-schedule/price-packages')}>Hủy</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
