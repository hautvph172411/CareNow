import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import RichTextEditor from '../components/RichTextEditor';
import { getClinics } from '../api/clinic.api';
import { getClinicPlaces } from '../api/clinic_place.api';
import { createClinicReason, getClinicReasonById, updateClinicReason } from '../api/clinicReason.api';
import { slugifyVi } from '../utils/slugify';

const emptyForm = {
  clinic_id: '',
  name: '',
  rank: 99,
  status: 1,
  title: '',
  url: '',
  description: '',
  content: '',
  place_id: '',
  in_trash_clinic_ids: '',
};

const splitCsv = (value) => String(value || '').split(',').filter(Boolean);

export default function ClinicReasonEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [formData, setFormData] = useState(emptyForm);
  const [doctors, setDoctors] = useState([]);
  const [places, setPlaces] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(isEdit);

  const selectedDoctorIds = useMemo(() => splitCsv(formData.clinic_id), [formData.clinic_id]);

  useEffect(() => {
    (async () => {
      try {
        const [clinicRes, placeRes] = await Promise.all([
          getClinics({ limit: 300, status: 1 }),
          getClinicPlaces({ limit: 300, status: 1 }),
        ]);
        setDoctors(clinicRes?.data || []);
        setPlaces(placeRes?.data || []);
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setIsLoading(true);
      try {
        const res = await getClinicReasonById(id);
        setFormData({ ...emptyForm, ...res.data, place_id: res.data.place_id || '' });
      } catch (error) {
        console.error(error);
        alert('Lỗi tải lý do khám');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'name' && !isEdit) {
        next.title = value;
        next.url = slugifyVi(value);
      }
      return next;
    });
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleDoctorChange = (e) => {
    const values = Array.from(e.target.selectedOptions).map((option) => option.value);
    setFormData((prev) => ({ ...prev, clinic_id: values.join(',') }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Tên lý do khám không được để trống';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitted(true);
    try {
      const payload = {
        ...formData,
        rank: parseInt(formData.rank, 10) || 99,
        status: parseInt(formData.status, 10),
        place_id: formData.place_id || null,
      };
      if (isEdit) await updateClinicReason(id, payload);
      else await createClinicReason(payload);
      alert(isEdit ? 'Cập nhật lý do khám thành công!' : 'Thêm lý do khám thành công!');
      navigate('/clinic-reasons/admin');
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || 'Lưu lý do khám thất bại');
    } finally {
      setSubmitted(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout pageTitle="Lý do khám">
        <div style={{ padding: '2rem' }}>Đang tải...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pageTitle="Lý do khám">
      <div className="form-page-container">
        <div className="form-page-header">
          <button className="btn-back" onClick={() => navigate('/clinic-reasons/admin')}>
            <ArrowLeft size={20} />
            Quay lại
          </button>
          <h1 className="form-page-title">{isEdit ? 'Sửa lý do khám' : 'Thêm lý do khám'}</h1>
        </div>

        <div className="form-page-content">
          <form onSubmit={handleSubmit} className="form-page-form">
            <div className="form-section">
              <h3 className="form-section-title">Thông tin chính</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Tên lý do khám *</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`form-input ${errors.name ? 'error' : ''}`}
                    placeholder="VD: Đau đầu kéo dài"
                  />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label>Tiêu đề</label>
                  <input name="title" value={formData.title || ''} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>URL</label>
                  <input name="url" value={formData.url || ''} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Nơi khám</label>
                  <select name="place_id" value={formData.place_id || ''} onChange={handleChange} className="form-input">
                    <option value="">Không chọn</option>
                    {places.map((place) => (
                      <option key={place.id} value={place.id}>{place.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Thứ hạng</label>
                  <input name="rank" type="number" value={formData.rank ?? 99} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select name="status" value={formData.status ?? 1} onChange={handleChange} className="form-input">
                    <option value={1}>Hoạt động</option>
                    <option value={0}>Vô hiệu</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Mô tả</label>
                  <textarea name="description" value={formData.description || ''} onChange={handleChange} className="form-input textarea" rows="2" />
                </div>
                <div className="form-group full-width">
                  <label>Bác sĩ liên quan</label>
                  <select
                    multiple
                    value={selectedDoctorIds}
                    onChange={handleDoctorChange}
                    className="form-input"
                    style={{ minHeight: 180 }}
                  >
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                    ))}
                  </select>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Giữ Ctrl/Cmd để chọn nhiều bác sĩ.</span>
                </div>
                <div className="form-group full-width">
                  <label>Bác sĩ đã loại bỏ khỏi lý do khám</label>
                  <input
                    name="in_trash_clinic_ids"
                    value={formData.in_trash_clinic_ids || ''}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="VD: 1,2,3"
                  />
                </div>
              </div>
            </div>

            <div className="form-section" style={{ zIndex: 1 }}>
              <h3 className="form-section-title">Nội dung</h3>
              <RichTextEditor
                name="content"
                value={formData.content || ''}
                onChange={handleChange}
                placeholder="Mô tả chi tiết lý do khám..."
              />
            </div>

            <div className="form-actions" style={{ marginTop: '2rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/clinic-reasons/admin')}>Hủy bỏ</button>
              <button type="submit" className="btn btn-primary" disabled={submitted}>
                {submitted ? 'Đang xử lý...' : (isEdit ? 'Cập nhật lý do khám' : 'Thêm lý do khám')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
