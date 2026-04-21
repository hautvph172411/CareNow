import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import AdminLayout from '../layouts/AdminLayout'
import { createClinicPlace } from '../api/clinic_place.api'
import { getProvinces, getWardsByProvince } from '../api/location.api'
import { getSpecialties } from '../api/specialty.api'
import SearchableSelect from '../components/SearchableSelect'
import RichTextEditor from '../components/RichTextEditor'
import { useEffect } from 'react'

export default function AddDoctor() {
  const navigate = useNavigate()

  // Toàn bộ fields tương ứng với tbl_clinic
  const [formData, setFormData] = useState({
    // Thông tin cơ bản
    name: '',
    title: '',
    url: '',
    picture: '',
    address: '',
    license: '',
    search_text: '',
    // Nội dung
    summary: '',
    content: '',
    // Vị trí & liên kết
    province_id: '',
    district_ids: '',
    specialist_ids: '',
    place_ids: '',
    partner_ids: '',
    forward_place: 0,
    // Dịch vụ & tài chính
    price_min: '',
    service: 0,
    payment_method: 0,
    payment_scope: 0,
    rank: 0,
    appointment_total: 0,
    // Cấu hình & trạng thái
    status: 1,
    is_work: 1,
    sponsor: 0,
    show_in_root_place: 0,
    show_feedback: 1,
    show_phone: 1,
    rebook_nextday_suggest: 0,
    self_supported: 0,
    sync_status: 1,
    approvers: '',
    // Dữ liệu mở rộng
    metadata: '',
  })

  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)

  const [provinces, setProvinces] = useState([])
  const [wards, setWards] = useState([])
  const [specialtyOptions, setSpecialtyOptions] = useState([])

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const data = await getProvinces();
        setProvinces(data.map(p => ({ value: p.id, label: p.name })));
      } catch (e) {
        console.error('Failed to grab provinces', e);
      }
    };
    const loadSpecialties = async () => {
      try {
        const sp = await getSpecialties({ status: 1, limit: 100 });
        if (sp && sp.data && sp.data.data) {
          setSpecialtyOptions(sp.data.data.map(s => ({ value: s.id, label: s.name })));
        }
      } catch (e) {
        console.error('Failed to load specialties', e);
      }
    };
    loadLocations();
    loadSpecialties();
  }, []);

  useEffect(() => {
    if (formData.province_id) {
      const loadWards = async () => {
        try {
          const data = await getWardsByProvince(formData.province_id);
          setWards(data.map(w => ({ value: w.id, label: w.name })));
        } catch (e) {
          console.error(e)
        }
      };
      loadWards();
    } else {
      setWards([]);
    }
  }, [formData.province_id]);

  const specialties = [
    'Tim mạch', 'Nhi khoa', 'Sản phụ khoa', 'Ngoại khoa',
    'Nội khoa', 'Tâm thần', 'Phục hồi chức năng', 'Nha khoa'
  ]

  const generateSlug = (text) => {
    if (!text) return '';
    return text.toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Remove consecutive hyphens
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      setFormData(prev => ({
        ...prev,
        picture: `/assets/images/${file.name}`
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => {
      const updated = { ...prev, [name]: value }

      // Auto-generate URL and Title when Name changes
      if (name === 'name') {
        updated.url = generateSlug(value);
        updated.title = value;
      }

      return updated;
    })
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Tên bác sĩ không được để trống'
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

      alert('Thêm bác sĩ thành công!')
      navigate('/clinic/admin')
    } catch (error) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Có lỗi xảy ra!')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AdminLayout pageTitle="Thêm bác sĩ mới">
      <div className="form-page-container">
        <div className="form-page-header">
          <button type="button" className="btn-back" onClick={() => navigate('/clinic/admin')}>
            <ChevronLeft size={20} />
            Quay lại
          </button>
          <h1 className="form-page-title">Thêm bác sĩ mới</h1>
        </div>

        <div className="form-page-content">
          <form onSubmit={handleSubmit} className="form-page-form">

            {/* ── 1. Thông tin chính ── */}
            <div className="form-section">
              <h2 className="form-section-title">Thông tin chính</h2>
              <div className="form-grid">

                <div className="form-group full-width">
                  <label>Họ tên (name) *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange}
                    placeholder="Dr. Nguyễn Văn A"
                    className={errors.name ? 'form-input error' : 'form-input'} />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>

                <div className="form-group full-width">
                  <label>Tóm tắt (summary)</label>
                  <textarea name="summary" value={formData.summary} onChange={handleChange}
                    placeholder="Giới thiệu ngắn về bác sĩ, chuyên môn chính..."
                    className="form-input textarea" rows="3" />
                </div>

                <div className="form-group" style={{ zIndex: 11 }}>
                  <label>Chuyên khoa (specialist_ids)</label>
                  <SearchableSelect
                    options={specialtyOptions}
                    value={formData.specialist_ids ? parseInt(formData.specialist_ids, 10) : ''}
                    onChange={(val) => setFormData(p => ({ ...p, specialist_ids: String(val) }))}
                    placeholder="Tìm kiếm chuyên khoa..."
                  />
                </div>

                <div className="form-group" style={{ zIndex: 10 }}>
                  <label>Tỉnh/thành (province_id)</label>
                  <SearchableSelect
                    options={provinces}
                    value={formData.province_id ? parseInt(formData.province_id, 10) : ''}
                    onChange={(val) => setFormData(p => ({ ...p, province_id: val, district_ids: '' }))}
                    placeholder="Tìm kiếm tỉnh/thành..."
                  />
                </div>

                <div className="form-group" style={{ zIndex: 9 }}>
                  <label>Quận/huyện (district_ids)</label>
                  <SearchableSelect
                    options={wards}
                    value={formData.district_ids ? parseInt(formData.district_ids, 10) : ''}
                    onChange={(val) => setFormData(p => ({ ...p, district_ids: String(val) }))}
                    placeholder={formData.province_id ? "Tìm kiếm quận/huyện/xã/phường..." : "Vui lòng chọn tỉnh/thành trước"}
                    disabled={!formData.province_id}
                  />
                </div>

                <div className="form-group">
                  <label>Giấy phép (license)</label>
                  <input type="text" name="license" value={formData.license} onChange={handleChange}
                    placeholder="GP-12345" className="form-input" />
                </div>

                <div className="form-group">
                  <label>Nơi khám (place_ids)</label>
                  <input type="text" name="place_ids" value={formData.place_ids} onChange={handleChange}
                    placeholder="VD: 1,2" className="form-input" />
                </div>

                <div className="form-group">
                  <label>Ghi chú (search_text / metadata)</label>
                  <input type="text" name="metadata" value={formData.metadata} onChange={handleChange}
                    placeholder="Ghi chú thêm..." className="form-input" />
                </div>

              </div>
            </div>

            {/* ── 2. Ảnh bác sĩ ── */}
            <div className="form-section">
              <h2 className="form-section-title">Ảnh bác sĩ</h2>
              <div className="form-group full-width">
                <label>Ảnh đại diện (picture) - Tạm thời lưu dạng folder nội bộ</label>
                <input type="file" accept="image/*" onChange={handleImageChange} className="form-input" style={{ padding: '0.5rem' }} />
                {imagePreview && (
                  <div style={{ marginTop: '10px' }}>
                    <img src={imagePreview} alt="Preview" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  </div>
                )}
                {/* Nếu đã có picture string nhưng chưa có preview object */}
                {formData.picture && !imagePreview && (
                  <p style={{ marginTop: '8px', fontSize: '13px', color: '#64748b' }}>Đường dẫn: {formData.picture}</p>
                )}
              </div>
            </div>

            {/* ── 3. Giới thiệu (content) ── */}
            <div className="form-section" style={{ zIndex: 1 }}>
              <h2 className="form-section-title">Giới thiệu (content)</h2>
              <div className="form-group full-width">
                <RichTextEditor
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="Quá trình công tác, thành tích, chứng chỉ..."
                />
              </div>
            </div>

            {/* ── 4. Cấu hình & Các mục còn lại ── */}
            <div className="form-section">
              <h2 className="form-section-title">Các thông tin còn lại</h2>
              <div className="form-grid">
                
                <div className="form-group full-width">
                  <label>Địa chỉ cụ thể (address) *</label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange}
                    placeholder="123 Lê Lợi, Q.1, TP.HCM"
                    className={errors.address ? 'form-input error' : 'form-input'} />
                  {errors.address && <span className="form-error">{errors.address}</span>}
                </div>

                <div className="form-group">
                  <label>Từ khóa tìm kiếm (search_text)</label>
                  <input type="text" name="search_text" value={formData.search_text} onChange={handleChange}
                    placeholder="bac si tim mach ha noi..." className="form-input" />
                </div>

                <div className="form-group">
                  <label>Tiêu đề / SEO (title)</label>
                  <input type="text" name="title" value={formData.title} onChange={handleChange}
                    placeholder="Tiêu đề hiển thị, SEO..." className="form-input" />
                </div>

                <div className="form-group">
                  <label>Đường dẫn tĩnh (url)</label>
                  <input type="text" name="url" value={formData.url} onChange={handleChange}
                    placeholder="bac-si-nguyen-van-a" className="form-input" />
                </div>

                <div className="form-group">
                  <label>Đối tác liên kết (partner_ids)</label>
                  <input type="text" name="partner_ids" value={formData.partner_ids} onChange={handleChange}
                    placeholder="VD: 4,8" className="form-input" />
                </div>

                <div className="form-group">
                  <label>Chuyển hướng đến (forward_place)</label>
                  <input type="number" name="forward_place" value={formData.forward_place} onChange={handleChange}
                    placeholder="0" className="form-input" />
                </div>

                <div className="form-group">
                  <label>Giá khám tối thiểu (price_min)</label>
                  <input type="number" name="price_min" value={formData.price_min} onChange={handleChange}
                    placeholder="150000" min="0" className="form-input" />
                </div>

                <div className="form-group">
                  <label>Tổng số lịch hẹn (appointment_total)</label>
                  <input type="number" name="appointment_total" value={formData.appointment_total} onChange={handleChange}
                    placeholder="0" className="form-input" />
                </div>

                <div className="form-group">
                  <label>Thứ hạng ưu tiên (rank)</label>
                  <input type="number" name="rank" value={formData.rank} onChange={handleChange}
                    placeholder="0" className="form-input" />
                </div>

                <div className="form-group">
                  <label>Số ngày gợi ý tái khám (rebook_nextday_suggest)</label>
                  <input type="number" name="rebook_nextday_suggest" value={formData.rebook_nextday_suggest} onChange={handleChange}
                    placeholder="0" min="0" className="form-input" />
                </div>

                <div className="form-group">
                  <label>Có cung cấp dịch vụ (service)</label>
                  <select name="service" value={formData.service} onChange={handleChange} className="form-input">
                    <option value={1}>Có</option>
                    <option value={0}>Không</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Phương thức thanh toán (payment_method)</label>
                  <select name="payment_method" value={formData.payment_method} onChange={handleChange} className="form-input">
                    <option value={0}>Tiền mặt</option>
                    <option value={1}>Thẻ / Chuyển khoản</option>
                    <option value={2}>Cả hai</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Phạm vi thanh toán (payment_scope)</label>
                  <select name="payment_scope" value={formData.payment_scope} onChange={handleChange} className="form-input">
                    <option value={0}>Tại chỗ</option>
                    <option value={1}>Phạm vi chung</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Trạng thái (status)</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="form-input">
                    <option value={1}>Hoạt động</option>
                    <option value={0}>Tạm ngưng</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Nhận lịch khám (is_work)</label>
                  <select name="is_work" value={formData.is_work} onChange={handleChange} className="form-input">
                    <option value={1}>Đang nhận</option>
                    <option value={0}>Không nhận</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Tài trợ / nổi bật (sponsor)</label>
                  <select name="sponsor" value={formData.sponsor} onChange={handleChange} className="form-input">
                    <option value={0}>Không</option>
                    <option value={1}>Có</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Hiển thị trang chủ (show_in_root_place)</label>
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
                  <label>Hiển thị sđt (show_phone)</label>
                  <select name="show_phone" value={formData.show_phone} onChange={handleChange} className="form-input">
                    <option value={1}>Có</option>
                    <option value={0}>Không</option>
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
                  <label>Đồng bộ (sync_status)</label>
                  <select name="sync_status" value={formData.sync_status} onChange={handleChange} className="form-input">
                    <option value={1}>Đã đồng bộ</option>
                    <option value={0}>Chưa đồng bộ</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Người / role duyệt (approvers)</label>
                  <input type="text" name="approvers" value={formData.approvers} onChange={handleChange}
                    placeholder="VD: admin, manager" className="form-input" />
                </div>

              </div>
            </div>

            {/* ── Actions ── */}
            <div className="form-actions" style={{ marginTop: '2rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/clinic/admin')}>
                Hủy
              </button>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? 'Đang xử lý...' : 'Thêm bác sĩ'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </AdminLayout>
  )
}
