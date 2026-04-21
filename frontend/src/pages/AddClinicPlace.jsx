import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import AdminLayout from '../layouts/AdminLayout'
import { createClinicPlace } from '../api/clinic_place.api'
import { getProvinces, getWardsByProvince } from '../api/location.api'
import SearchableSelect from '../components/SearchableSelect'
import RichTextEditor from '../components/RichTextEditor'
import { useEffect } from 'react'

export default function AddClinicPlace() {
  const navigate = useNavigate()
  
  // State maps to tbl_clinic schema
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    picture: '',
    address: '',
    summary: '',
    content: '',
    title: '',
    show_in_root_place: 0,
    status: 1,
    rank: 0,
    price_min: '',
    is_work: 1,
    service: 0,
    metadata: '',
    show_phone: 1,
    show_feedback: 1,
    sponsor: 0,
    specialist_ids: '',
    province_id: '',
    district_ids: '',
    place_ids: '',
    partner_ids: '',
    forward_place: 0,
    appointment_total: 0,
    sync_status: 1,
    license: '',
    rebook_nextday_suggest: 0,
    payment_method: 0,
    payment_scope: 0,
    search_text: '',
    approvers: '',
    self_supported: 0,
  })
  
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  
  const [provinces, setProvinces] = useState([])
  const [wards, setWards] = useState([])

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const data = await getProvinces();
        setProvinces(data.map(p => ({ value: p.id, label: p.name })));
      } catch (e) {
         console.error('Failed to grab provinces', e);
      }
    };
    loadLocations();
  }, []);

  useEffect(() => {
    if (formData.province_id) {
      const loadWards = async () => {
        try {
          const data = await getWardsByProvince(formData.province_id);
          setWards(data.map(w => ({ value: w.id, label: w.name })));
        } catch(e) {
          console.error(e)
        }
      };
      loadWards();
    } else {
      setWards([]);
    }
  }, [formData.province_id]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      setFormData(prev => ({
        ...prev,
        picture: `assets/images/${file.name}`
      }));
    }
  };

  const generateSlug = (text) => {
    if (!text) return '';
    return text.toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      
      if (name === 'name') {
        updated.url = generateSlug(value);
        updated.title = value;
      }
      
      return updated;
    })
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Tên phòng khám không được để trống'
    if (!formData.address.trim()) newErrors.address = 'Địa chỉ không được để trống'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const payload = { ...formData };
      
      const numericFields = ['rank', 'price_min', 'province_id', 'forward_place', 'appointment_total', 'rebook_nextday_suggest'];
      numericFields.forEach(f => {
        if (payload[f] === '') payload[f] = null;
        else payload[f] = parseInt(payload[f], 10);
      });
      
      const intFields = ['show_in_root_place', 'status', 'is_work', 'service', 'payment_method', 'payment_scope', 'sponsor', 'show_feedback', 'show_phone', 'self_supported', 'sync_status'];
      intFields.forEach(f => {
        payload[f] = parseInt(payload[f] || 0, 10);
      });

      await createClinicPlace(payload);
      
      alert('Thêm phòng khám thành công!')
      navigate('/clinic-place/admin')
    } catch (error) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Có lỗi xảy ra!')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AdminLayout pageTitle="Thêm phòng khám mới">
      <div className="form-page-container">
        <div className="form-page-header">
          <button type="button" className="btn-back" onClick={() => navigate('/clinic-place/admin')}>
            <ChevronLeft size={20} />
            Quay lại
          </button>
          <h1 className="form-page-title">Thêm phòng khám mới</h1>
        </div>

        <div className="form-page-content">
          <form onSubmit={handleSubmit} className="form-page-form">
            
            {/* Thông tin cơ bản */}
            <div className="form-section">
              <h2 className="form-section-title">Thông tin cơ bản</h2>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Tên phòng khám (name) *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nhập tên phòng khám" className={errors.name ? 'form-input error' : 'form-input'} />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label>Tiêu đề (title)</label>
                  <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Tiêu đề hiển thị..." className="form-input" />
                </div>

                <div className="form-group">
                  <label>Đường dẫn tĩnh (url)</label>
                  <input type="text" name="url" value={formData.url} onChange={handleChange} placeholder="phong-kham-a..." className="form-input" />
                </div>

                <div className="form-group full-width">
                  <label>Ảnh đại diện (picture) - Tạm thời lưu dạng folder nội bộ</label>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="form-input" style={{ padding: '0.5rem' }} />
                  {imagePreview && (
                    <div style={{ marginTop: '10px' }}>
                      <img src={imagePreview} alt="Preview" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    </div>
                  )}
                  {formData.picture && !imagePreview && (
                    <p style={{ marginTop: '8px', fontSize: '13px', color: '#64748b' }}>Đường dẫn: {formData.picture}</p>
                  )}
                </div>

                <div className="form-group full-width">
                  <label>Địa chỉ (address) *</label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Địa chỉ cụ thể" className={errors.address ? 'form-input error' : 'form-input'} />
                  {errors.address && <span className="form-error">{errors.address}</span>}
                </div>
                
                <div className="form-group">
                  <label>Giấy phép (license)</label>
                  <input type="text" name="license" value={formData.license} onChange={handleChange} placeholder="Mã giấy phép hoạt động" className="form-input" />
                </div>
                
                <div className="form-group">
                  <label>Từ khóa tìm kiếm (search_text)</label>
                  <input type="text" name="search_text" value={formData.search_text} onChange={handleChange} placeholder="Từ khóa tìm kiếm..." className="form-input" />
                </div>
              </div>
            </div>

            {/* Chi tiết nội dung */}
            <div className="form-section">
              <h2 className="form-section-title">Chi tiết nội dung</h2>
              
              <div className="form-group full-width" style={{ marginBottom: '1.5rem' }}>
                <label>Tóm tắt (summary)</label>
                <textarea name="summary" value={formData.summary} onChange={handleChange} placeholder="Giới thiệu kết nối..." className="form-input textarea" rows="3"></textarea>
              </div>

              <div className="form-group full-width">
                <label>Nội dung chi tiết (content)</label>
                <RichTextEditor 
                  name="content" 
                  value={formData.content} 
                  onChange={handleChange}
                  placeholder="Đội ngũ bác sĩ, thiết bị y tế..." 
                />
              </div>
            </div>

            {/* Thông tin vị trí & Hệ thống kết nối */}
            <div className="form-section">
              <h2 className="form-section-title">Vị trí & Liên kết (ID)</h2>
              <div className="form-grid">
                <div className="form-group" style={{ zIndex: 10 }}>
                  <label>Tỉnh/Thành phố ID (province_id)</label>
                  <SearchableSelect 
                    options={provinces}
                    value={formData.province_id ? parseInt(formData.province_id, 10) : ''}
                    onChange={(val) => setFormData(p => ({ ...p, province_id: val, district_ids: '' }))}
                    placeholder="Tìm kiếm tỉnh/thành..."
                  />
                </div>

                <div className="form-group" style={{ zIndex: 9 }}>
                  <label>Quận/Huyện ID (district_ids)</label>
                  <SearchableSelect 
                    options={wards}
                    value={formData.district_ids ? parseInt(formData.district_ids, 10) : ''}
                    onChange={(val) => setFormData(p => ({ ...p, district_ids: String(val) }))}
                    placeholder={formData.province_id ? "Tìm kiếm quận/huyện/xã/phường..." : "Vui lòng chọn tỉnh/thành trước"}
                    disabled={!formData.province_id}
                  />
                </div>

                <div className="form-group">
                  <label>Chuyên khoa ID (specialist_ids)</label>
                  <input type="text" name="specialist_ids" value={formData.specialist_ids} onChange={handleChange} placeholder="VD: 1,5,7" className="form-input" />
                </div>

                <div className="form-group">
                  <label>Địa điểm ID (place_ids)</label>
                  <input type="text" name="place_ids" value={formData.place_ids} onChange={handleChange} placeholder="VD: 1,2" className="form-input" />
                </div>

                <div className="form-group">
                  <label>Đối tác ID (partner_ids)</label>
                  <input type="text" name="partner_ids" value={formData.partner_ids} onChange={handleChange} placeholder="VD: 4,8" className="form-input" />
                </div>
                
                <div className="form-group">
                  <label>Chuyển viện ID (forward_place)</label>
                  <input type="number" name="forward_place" value={formData.forward_place} onChange={handleChange} placeholder="VD: 0" className="form-input" />
                </div>
              </div>
            </div>

            {/* Dịch vụ & Cấu hình */}
            <div className="form-section">
              <h2 className="form-section-title">Dịch vụ & Tùy chọn hoạt động</h2>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Giá khám tối thiểu (price_min)</label>
                  <input type="number" name="price_min" value={formData.price_min} onChange={handleChange} placeholder="150000" min="0" className="form-input" />
                </div>
                
                <div className="form-group">
                  <label>Loại dịch vụ (service)</label>
                  <select name="service" value={formData.service} onChange={handleChange} className="form-input">
                    <option value={0}>Cơ bản</option>
                    <option value={1}>Chuyên sâu</option>
                    <option value={2}>VIP</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Hình thức thanh toán (payment_method)</label>
                  <select name="payment_method" value={formData.payment_method} onChange={handleChange} className="form-input">
                    <option value={0}>Tiền mặt</option>
                    <option value={1}>Thẻ / Chuyển khoản</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Phạm vi thanh toán (payment_scope)</label>
                  <select name="payment_scope" value={formData.payment_scope} onChange={handleChange} className="form-input">
                    <option value={0}>Trong viện</option>
                    <option value={1}>Phạm vi chung</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Thứ hạng ưu tiên (rank)</label>
                  <input type="number" name="rank" value={formData.rank} onChange={handleChange} placeholder="0" className="form-input" />
                </div>
                
                <div className="form-group">
                  <label>Tổng cuộc hẹn (appointment_total)</label>
                  <input type="number" name="appointment_total" value={formData.appointment_total} onChange={handleChange} placeholder="0" className="form-input" />
                </div>
              </div>
            </div>

            {/* Trạng thái hệ thống */}
            <div className="form-section">
              <h2 className="form-section-title">Cấu hình Hệ thống & Trạng thái</h2>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Trạng thái (status)</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="form-input">
                    <option value={1}>Hoạt động</option>
                    <option value={0}>Tạm ngưng</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Khám bệnh (is_work)</label>
                  <select name="is_work" value={formData.is_work} onChange={handleChange} className="form-input">
                    <option value={1}>Đang khám</option>
                    <option value={0}>Nghỉ</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Tài trợ (sponsor)</label>
                  <select name="sponsor" value={formData.sponsor} onChange={handleChange} className="form-input">
                    <option value={0}>Không</option>
                    <option value={1}>Có</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Hiển thị ở trang chủ (show_in_root_place)</label>
                  <select name="show_in_root_place" value={formData.show_in_root_place} onChange={handleChange} className="form-input">
                    <option value={0}>Không</option>
                    <option value={1}>Hiển thị</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Hiển thị đánh giá (show_feedback)</label>
                  <select name="show_feedback" value={formData.show_feedback} onChange={handleChange} className="form-input">
                    <option value={1}>Có</option>
                    <option value={0}>Không</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Hiển thị Số ĐT (show_phone)</label>
                  <select name="show_phone" value={formData.show_phone} onChange={handleChange} className="form-input">
                    <option value={1}>Có</option>
                    <option value={0}>Không</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Đề xuất khám ngày mai (rebook_nextday_suggest)</label>
                  <select name="rebook_nextday_suggest" value={formData.rebook_nextday_suggest} onChange={handleChange} className="form-input">
                    <option value={0}>Không</option>
                    <option value={1}>Có</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Tự vận hành (self_supported)</label>
                  <select name="self_supported" value={formData.self_supported} onChange={handleChange} className="form-input">
                    <option value={0}>Không</option>
                    <option value={1}>Có</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Trạng thái đồng bộ (sync_status)</label>
                  <select name="sync_status" value={formData.sync_status} onChange={handleChange} className="form-input">
                    <option value={1}>Đã đồng bộ</option>
                    <option value={0}>Chưa</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Người duyệt (approvers)</label>
                  <input type="text" name="approvers" value={formData.approvers} onChange={handleChange} placeholder="VD: Admin, Manager" className="form-input" />
                </div>
              </div>
            </div>

            {/* JSON Data */}
            <div className="form-section">
              <h2 className="form-section-title">Dữ liệu mở rộng</h2>
              <div className="form-group full-width">
                <label>Metadata (JSON text)</label>
                <textarea name="metadata" value={formData.metadata} onChange={handleChange} placeholder="{'key': 'value'}" className="form-input textarea" rows="4"></textarea>
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions" style={{ marginTop: '2rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/clinic-place/admin')}>
                Hủy
              </button>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? 'Đang xử lý...' : 'Tạo phòng khám'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  )
}
