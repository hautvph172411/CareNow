import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Phone, MapPin, Image as ImageIcon, Link as LinkIcon, Settings, Info } from 'lucide-react'
import AdminLayout from '../layouts/AdminLayout'
import { updateClinicPlace, getClinicPlaceById } from '../api/clinic_place.api'
import { getProvinces, getDistrictsByProvince } from '../api/location.api'
import RichTextEditor from '../components/RichTextEditor'
import SearchableSelect from '../components/SearchableSelect'
import '../styles/ClinicPlaceForm.css'

export default function EditClinicPlace() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [logoPreview, setLogoPreview] = useState(null)
  const [imagesPreviews, setImagesPreviews] = useState([])
  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])

  const [formData, setFormData] = useState({
    name: '',
    short_name: '',
    display_name: '',
    province_id: '',
    district_id: '',
    address: '',
    info: '',
    phone: '',
    status: 1,
    has_insurance: false,
    patient_guide: '',
    address_guide: '',
    logo: '',
    images: '',
    title: '',
    description: '',
    description_detail: '',
    url: '',
    page_type: 0,
    rank: 0,
    order: 99,
    admin_note: '',
    custom_button_text: '',
    custom_button_link: '',
    metadata: '',
    partner_id: null,
    parent_id: null,
    show_children: false,
    self_supported: 0,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const provs = await getProvinces();
        setProvinces(provs.map(p => ({ value: p.id, label: p.name })));

        if (id) {
          setIsLoading(true);
          const res = await getClinicPlaceById(id);
          if (res && res.data) {
            setFormData({
                ...res.data,
                has_insurance: !!res.data.has_insurance,
                show_children: !!res.data.show_children
            });
            if (res.data.logo) setLogoPreview(res.data.logo);
            if (res.data.images) setImagesPreviews(res.data.images.split(',').filter(i => i));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (formData.province_id) {
      const loadDistricts = async () => {
        try {
          const data = await getDistrictsByProvince(formData.province_id);
          setDistricts(data.map(d => ({ value: d.id, label: d.name })));
        } catch (e) {
          console.error(e);
        }
      };
      loadDistricts();
    }
  }, [formData.province_id]);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, logo: `/assets/images/${file.name}` }));
    }
  };

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map(f => URL.createObjectURL(f));
    setImagesPreviews(previews);
    setFormData(prev => ({
      ...prev,
      images: files.map(f => `/assets/images/${f.name}`).join(',')
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditorChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
        setErrors({ name: 'Tên là bắt buộc' });
        return;
    }

    setIsLoading(true)
    try {
      const payload = {
        ...formData,
        province_id: formData.province_id ? parseInt(formData.province_id) : null,
        district_id: formData.district_id ? parseInt(formData.district_id) : null,
        status: parseInt(formData.status),
        order: parseInt(formData.order) || 99,
        rank: parseInt(formData.rank) || 0,
        has_insurance: formData.has_insurance ? 1 : 0,
        show_children: formData.show_children ? 1 : 0,
        updated_at: Math.floor(Date.now() / 1000)
      };

      await updateClinicPlace(id, payload);
      alert('Cập nhật thành công!')
      navigate('/clinic-place/admin')
    } catch (error) {
      console.error(error)
      alert('Có lỗi xảy ra!')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AdminLayout pageTitle="Chỉnh sửa cơ sở y tế">
      <div className="form-page-container">
        <div className="form-page-header">
          <button type="button" className="btn-back" onClick={() => navigate('/clinic-place/admin')}>
            <ChevronLeft size={20} /> Quay lại
          </button>
          <h1 className="form-page-title">Chỉnh sửa cơ sở y tế</h1>
        </div>

        <div className="form-page-content">
          <form onSubmit={handleSubmit} className="form-page-form">
            
            {/* Section 1: Thông tin cơ bản */}
            <div className="form-section">
              <h2 className="form-section-title"><Info size={18} /> Thông tin cơ bản</h2>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Tên cơ sở y tế *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className={errors.name ? 'form-input error' : 'form-input'} />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label>Tên rút gọn (short_name)</label>
                  <input type="text" name="short_name" value={formData.short_name} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Tên hiển thị (display_name)</label>
                  <input type="text" name="display_name" value={formData.display_name} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Điện thoại</label>
                  <div className="input-with-icon">
                    <Phone size={16} />
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="form-input" />
                  </div>
                </div>
                <div className="form-group">
                   <label>URL (Slug)</label>
                   <input type="text" name="url" value={formData.url} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group full-width">
                   <label>Mô tả ngắn (description)</label>
                   <textarea name="description" value={formData.description} onChange={handleChange} className="form-input" rows={2} />
                </div>
              </div>
            </div>

            {/* Section 2: Địa chỉ */}
            <div className="form-section">
              <h2 className="form-section-title"><MapPin size={18} /> Địa chỉ & Vị trí</h2>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Địa chỉ cụ thể</label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Tỉnh/Thành phố</label>
                  <SearchableSelect options={provinces} value={formData.province_id} onChange={(val) => handleSelectChange('province_id', val)} placeholder="Chọn tỉnh/thành" />
                </div>
                <div className="form-group">
                  <label>Quận/Huyện</label>
                  <SearchableSelect options={districts} value={formData.district_id} onChange={(val) => handleSelectChange('district_id', val)} placeholder="Chọn quận/huyện" disabled={!formData.province_id} />
                </div>
              </div>
            </div>

            {/* Section 3: Hình ảnh */}
            <div className="form-section">
              <h2 className="form-section-title"><ImageIcon size={18} /> Hình ảnh</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Logo</label>
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="form-input" />
                  {logoPreview && (
                    <div className="image-preview-container" style={{ marginTop: '10px' }}>
                      <img src={logoPreview} alt="Logo" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: '8px' }} />
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Hình ảnh mô tả (Nhiều ảnh)</label>
                  <input type="file" accept="image/*" multiple onChange={handleImagesChange} className="form-input" />
                  <div className="images-preview-grid" style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                    {imagesPreviews.map((url, idx) => (
                      <img key={idx} src={url} alt="Preview" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: '4px' }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Nội dung chi tiết */}
            <div className="form-section">
              <h2 className="form-section-title">Nội dung chi tiết</h2>
              <div className="form-group full-width">
                <label>Thông tin tổng quát (info)</label>
                <RichTextEditor name="info" value={formData.info} onChange={handleEditorChange} />
              </div>
              <div className="form-group full-width" style={{ marginTop: '1.5rem' }}>
                <label>Mô tả chi tiết (description_detail)</label>
                <RichTextEditor name="description_detail" value={formData.description_detail} onChange={handleEditorChange} />
              </div>
              <div className="form-group full-width" style={{ marginTop: '1.5rem' }}>
                <label>Hướng dẫn bệnh nhân (patient_guide)</label>
                <RichTextEditor name="patient_guide" value={formData.patient_guide} onChange={handleEditorChange} />
              </div>
              <div className="form-group full-width" style={{ marginTop: '1.5rem' }}>
                <label>Hướng dẫn đường đi (address_guide)</label>
                <RichTextEditor name="address_guide" value={formData.address_guide} onChange={handleEditorChange} />
              </div>
            </div>

            {/* Section 5: Phân cấp & SEO */}
            <div className="form-section">
              <h2 className="form-section-title"><Settings size={18} /> Cấu hình & SEO</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Thứ tự (Order)</label>
                  <input type="number" name="order" value={formData.order} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Thứ hạng (Rank)</label>
                  <input type="number" name="rank" value={formData.rank} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="form-input">
                    <option value={1}>Hoạt động</option>
                    <option value={0}>Tạm dừng</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Metadata (JSON string)</label>
                  <textarea name="metadata" value={formData.metadata} onChange={handleChange} className="form-input" rows={2} />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/clinic-place/admin')}>Hủy bỏ</button>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'Đang lưu...' : 'Lưu cập nhật'}</button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  )
}
