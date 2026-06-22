import { useState, useEffect, useRef } from 'react';
import { Phone, MapPin, Image as ImageIcon, Save, Loader } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { getClinicPlaces, updateClinicPlace, createClinicPlace } from '../api/clinic_place.api';
import { getProvinces, getWardsByProvince } from '../api/location.api';
import RichTextEditor from '../components/RichTextEditor';
import SearchableSelect from '../components/SearchableSelect';
import ImageUpload from '../components/ImageUpload';
import MultipleImageUpload from '../components/MultipleImageUpload';
import { useAuth } from '../hooks/useAuth';
import '../styles/ClinicPlaceForm.css';

export default function PartnerClinicPlace() {
  const { user } = useAuth();
  const [bootLoading, setBootLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [placeId, setPlaceId] = useState(null);
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '', short_name: '', display_name: '',
    province_id: '', district_id: '', address: '', phone: '',
    status: 1, has_insurance: false,
    patient_guide: '', address_guide: '',
    images: '', description: '', description_detail: '',
    logo: '', url: '',
  });

  // Load clinic place data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [provs, placesRes] = await Promise.all([
          getProvinces(),
          getClinicPlaces({ limit: 1, page: 1 }),
        ]);
        if (cancelled) return;
        setProvinces(provs.map(p => ({ value: String(p.id), label: p.name })));

        if (placesRes?.data?.length > 0) {
          const d = placesRes.data[0];
          setPlaceId(d.id);
          setFormData({
            name: d.name || '',
            short_name: d.short_name || '',
            display_name: d.display_name || '',
            province_id: d.province_id != null ? String(d.province_id) : '',
            district_id: d.district_id != null ? String(d.district_id) : '',
            address: d.address || '',
            phone: d.phone || '',
            status: d.status ?? 1,
            has_insurance: !!d.has_insurance,
            patient_guide: d.patient_guide || '',
            address_guide: d.address_guide || '',
            images: d.images || '',
            description: d.description || '',
            description_detail: d.description_detail || '',
            logo: d.logo || '',
            url: d.url || '',
          });
        }
      } catch (e) { console.error(e); }
      finally { if (!cancelled) setBootLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load wards when province changes
  useEffect(() => {
    if (!formData.province_id) { setWards([]); return; }
    (async () => {
      try {
        const data = await getWardsByProvince(formData.province_id);
        setWards(data.map(d => ({ value: String(d.id), label: d.name })));
      } catch (e) { console.error(e); }
    })();
  }, [formData.province_id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleEditorChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value, ...(name === 'province_id' ? { district_id: '' } : {}) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setErrors({ name: 'Tên cơ sở là bắt buộc' });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        province_id: formData.province_id ? parseInt(formData.province_id, 10) : null,
        district_id: formData.district_id ? parseInt(formData.district_id, 10) : null,
        status: parseInt(formData.status, 10),
        has_insurance: formData.has_insurance ? 1 : 0,
        updated_at: Math.floor(Date.now() / 1000),
      };
      
      if (placeId) {
        await updateClinicPlace(placeId, payload);
        alert('Cập nhật thành công!');
      } else {
        const res = await createClinicPlace({ ...payload, created_at: Math.floor(Date.now() / 1000) });
        setPlaceId(res.data?.id || res.id);
        alert('Tạo nơi khám thành công!');
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra!');
    } finally {
      setIsLoading(false);
    }
  };

  if (bootLoading) {
    return (
      <AdminLayout pageTitle="Nơi khám">
        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
          <Loader size={24} className="spin" style={{ margin: '0 auto 0.5rem' }} />
          <div>Đang tải thông tin nơi khám...</div>
        </div>
      </AdminLayout>
    );
  }

  // Xóa phần render 'Chưa có nơi khám' để cho phép form hiển thị và tạo mới

  return (
    <AdminLayout pageTitle="Nơi khám">
      <div className="form-page-container">
        <div className="form-page-header">
          <h1 className="form-page-title">Thông tin nơi khám</h1>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Đối tác: <strong style={{ color: '#1e293b' }}>{user?.display_name || user?.username || '—'}</strong>
          </div>
        </div>

        <div className="form-page-content">
          <form onSubmit={handleSubmit} className="form-page-form">
            {/* Basic info */}
            <div className="form-section">
              <h2 className="form-section-title">Thông tin cơ bản</h2>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Tên cơ sở *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange}
                    className={errors.name ? 'form-input error' : 'form-input'} />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label>Tên rút gọn</label>
                  <input type="text" name="short_name" value={formData.short_name || ''} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Tên hiển thị</label>
                  <input type="text" name="display_name" value={formData.display_name || ''} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Điện thoại</label>
                  <div className="input-with-icon">
                    <Phone size={16} />
                    <input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} className="form-input" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="form-input">
                    <option value={1}>Hoạt động</option>
                    <option value={0}>Tạm dừng</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Mô tả ngắn</label>
                  <textarea name="description" value={formData.description || ''} onChange={handleChange} className="form-input" rows={2} />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="form-section">
              <h2 className="form-section-title">
                <MapPin size={18} /> Địa chỉ
              </h2>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Địa chỉ</label>
                  <input type="text" name="address" value={formData.address || ''} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Tỉnh / Thành</label>
                  <SearchableSelect options={provinces} value={formData.province_id}
                    onChange={v => handleSelectChange('province_id', v)} placeholder="Chọn" />
                </div>
                <div className="form-group">
                  <label>Phường / Xã</label>
                  <SearchableSelect options={wards} value={formData.district_id}
                    onChange={v => handleSelectChange('district_id', v)} placeholder="Chọn" disabled={!formData.province_id} />
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="form-section">
              <h2 className="form-section-title">
                <ImageIcon size={18} /> Hình ảnh
              </h2>
              <div className="form-grid">
                <div className="form-group">
                  <ImageUpload label="Logo" value={formData.logo}
                    onChange={url => setFormData(p => ({ ...p, logo: url }))} />
                </div>
                <div className="form-group">
                  <MultipleImageUpload label="Ảnh mô tả" value={formData.images}
                    onChange={csvUrls => setFormData(p => ({ ...p, images: csvUrls }))} />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="form-section">
              <h2 className="form-section-title">Nội dung mô tả</h2>
              <div className="form-group full-width">
                <label>Chi tiết giới thiệu</label>
                <RichTextEditor name="description_detail" value={formData.description_detail || ''} onChange={handleEditorChange} />
              </div>
              <div className="form-group full-width" style={{ marginTop: '1.5rem' }}>
                <label>Hướng dẫn bệnh nhân</label>
                <RichTextEditor name="patient_guide" value={formData.patient_guide || ''} onChange={handleEditorChange} />
              </div>
              <div className="form-group full-width" style={{ marginTop: '1.5rem' }}>
                <label>Hướng dẫn đường đi</label>
                <RichTextEditor name="address_guide" value={formData.address_guide || ''} onChange={handleEditorChange} />
              </div>
            </div>

            {/* Options */}
            <div className="form-section">
              <h2 className="form-section-title">Tùy chọn</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label className="checkbox-label">
                    <input type="checkbox" name="has_insurance" checked={!!formData.has_insurance} onChange={handleChange} />
                    <span>Có bảo hiểm</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ minWidth: 160 }}>
                {isLoading ? (
                  <><Loader size={16} className="spin" /> Đang lưu...</>
                ) : (
                  <><Save size={16} /> Lưu thay đổi</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
