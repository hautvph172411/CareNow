import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import AdminLayout from '../layouts/AdminLayout'
import { createClinic } from '../api/clinic.api'
import { getProvinces, getWardsByProvince } from '../api/location.api'
import { getSpecialties } from '../api/specialty.api'
import { getClinicPlaces } from '../api/clinic_place.api'
import { getPartners } from '../api/partner.api'
import SearchableSelect from '../components/SearchableSelect'
import MultiSearchableSelect from '../components/MultiSearchableSelect'
import RichTextEditor from '../components/RichTextEditor'
import ImageUpload from '../components/ImageUpload'
import ToggleSwitch from '../components/ToggleSwitch'

export default function AddClinic() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '', title: '', url: '', picture: '', address: '', license: '', search_text: '',
    summary: '', content: '',
    province_id: '', district_ids: '', specialist_ids: '', place_ids: '', partner_ids: '', forward_place: 0,
    price_min: '', service: 0, payment_method: 0, payment_scope: 0, rank: 0, appointment_total: 0,
    status: 1, is_work: 1, sponsor: 0, show_in_root_place: 0, show_feedback: 1, show_phone: 1,
    rebook_nextday_suggest: 0, self_supported: 0, sync_status: 1, approvers: '', metadata: '',
  })

  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  const [provinces, setProvinces] = useState([])
  const [wards, setWards] = useState([])
  const [specialtyOptions, setSpecialtyOptions] = useState([])
  const [placeOptions, setPlaceOptions] = useState([])
  const [partnerOptions, setPartnerOptions] = useState([])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [provRes, specRes, placeRes, partnerRes] = await Promise.all([
          getProvinces(),
          getSpecialties({ limit: 1000 }),
          getClinicPlaces({ limit: 1000 }),
          getPartners({ limit: 1000 })
        ]);
        setProvinces(provRes.map(p => ({ value: p.id, label: p.name })));
        if (specRes && specRes.data) setSpecialtyOptions(specRes.data.map(s => ({ value: s.id, label: s.name })));
        if (placeRes && placeRes.data) setPlaceOptions(placeRes.data.map(p => ({ value: p.id, label: p.name, address: p.address, province_id: p.province_id, district_id: p.district_id })));
        if (partnerRes && partnerRes.data) setPartnerOptions(partnerRes.data.map(p => ({ value: p.id, label: p.name })));
      } catch (e) {
        console.error('Failed to grab options', e);
      }
    };
    loadData();
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

  const generateSlug = (text) => {
    if (!text) return '';
    return text.toString()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
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
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleToggle = (name, checked) => {
    setFormData(prev => ({ ...prev, [name]: checked ? 1 : 0 }));
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Tên bác sĩ không được để trống'
    if (!formData.address?.trim()) newErrors.address = 'Địa chỉ không được để trống'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) {
      alert("Vui lòng kiểm tra lại các thông tin bắt buộc!");
      return;
    }setIsLoading(true)
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

      await createClinic(payload);
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
    <AdminLayout pageTitle="Thêm bác sĩ">
      <div className="form-page-container">
        <div className="form-page-header">
          <button type="button" className="btn-back" onClick={() => navigate('/clinic/admin')}>
            <ChevronLeft size={20} />
            Quay lại
          </button>
          <h1 className="form-page-title">Thêm bác sĩ</h1>
        </div>

        <div className="form-page-content">
          <form onSubmit={handleSubmit} className="form-page-form">

            {/* ── 1. Thông tin chính ── */}
            <div className="form-section">
              <h2 className="form-section-title">Thông tin chính</h2>
              <div className="form-grid">
                <div className="form-group half-width">
                  <label>Chức danh (VD: ThS, BS, PGS, TS...)</label>
                  <input type="text" name="title" value={formData.title} onChange={handleChange}
                    placeholder="VD: PGS. TS. Bác sĩ" className="form-input" />
                </div>
                <div className="form-group half-width">
                  <label>Họ tên (name) *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange}
                    placeholder="Nguyễn Văn A" className={errors.name ? 'form-input error' : 'form-input'} />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>

                <div className="form-group full-width">
                  <label>Tóm tắt (summary)</label>
                  <textarea name="summary" value={formData.summary || ''} onChange={handleChange}
                    placeholder="Giới thiệu ngắn về bác sĩ, chuyên môn chính..."
                    className="form-input textarea" rows="3" />
                </div>

                <div className="form-group" style={{ zIndex: 11 }}>
                  <label>Chuyên khoa</label>
                  <MultiSearchableSelect
                    options={specialtyOptions}
                    value={formData.specialist_ids ? formData.specialist_ids.split(',').filter(Boolean).map(id => parseInt(id.trim(), 10)) : []}
                    onChange={(val) => setFormData(p => ({ ...p, specialist_ids: val.join(',') }))}
                    placeholder="Tìm kiếm chuyên khoa..."
                  />
                </div>

                <div className="form-group" style={{ zIndex: 10 }}>
                  <label>Cơ sở y tế (Nơi khám chính)</label>
                  <MultiSearchableSelect
                    options={placeOptions}
                    value={formData.place_ids ? String(formData.place_ids).split(',').filter(Boolean).map(id => parseInt(id.trim(), 10)) : []}
                    onChange={(val) => {
                      const newPlaceIds = val.join(',');
                      setFormData(p => {
                        let updated = { ...p, place_ids: newPlaceIds };
                        if (val.length > 0) {
                          const firstPlace = placeOptions.find(opt => opt.value === val[0]);
                          if (firstPlace) {
                            if (firstPlace.address) updated.address = firstPlace.address;
                            if (firstPlace.province_id) updated.province_id = firstPlace.province_id;
                            if (firstPlace.district_id) updated.district_ids = String(firstPlace.district_id);
                          }
                        }
                        return updated;
                      });
                    }}
                    placeholder="Tìm kiếm cơ sở y tế..."
                  />
                </div>

                <div className="form-group" style={{ zIndex: 9 }}>
                  <label>Tỉnh/thành</label>
                  <SearchableSelect
                    options={provinces}
                    value={formData.province_id ? parseInt(formData.province_id, 10) : ''}
                    onChange={(val) => setFormData(p => ({ ...p, province_id: val, district_ids: '' }))}
                    placeholder="Tìm kiếm tỉnh/thành..."
                  />
                </div>

                <div className="form-group" style={{ zIndex: 8 }}>
                  <label>Phường/xã</label>
                  <SearchableSelect
                    options={wards}
                    value={formData.district_ids ? parseInt(formData.district_ids, 10) : ''}
                    onChange={(val) => setFormData(p => ({ ...p, district_ids: String(val) }))}
                    placeholder={formData.province_id ? "Tìm kiếm phường/xã..." : "Vui lòng chọn tỉnh/thành trước"}
                    disabled={!formData.province_id}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Địa chỉ cụ thể *</label>
                  <input type="text" name="address" value={formData.address || ''} onChange={handleChange}
                    placeholder="123 Lê Lợi, Q.1, TP.HCM"
                    className={errors.address ? 'form-input error' : 'form-input'} />
                  {errors.address && <span className="form-error">{errors.address}</span>}
                </div>
              </div>
            </div>

            {/* ── 2. Ảnh bác sĩ ── */}
            <div className="form-section">
              <h2 className="form-section-title">Ảnh bác sĩ</h2>
              <div className="form-group full-width">
                <ImageUpload
                  label="Ảnh đại diện"
                  value={formData.picture}
                  onChange={(url) => setFormData(prev => ({ ...prev, picture: url }))}
                />
              </div>
            </div>

            {/* ── 3. Giới thiệu (content) ── */}
            <div className="form-section" style={{ zIndex: 1 }}>
              <h2 className="form-section-title">Giới thiệu chi tiết</h2>
              <div className="form-group full-width">
                <RichTextEditor
                  name="content"
                  value={formData.content || ''}
                  onChange={handleChange}
                  placeholder="Quá trình công tác, thành tích, chứng chỉ..."
                />
              </div>
            </div>

            {/* ── 4. Setup Thông tin còn lại ── */}
            <div className="form-section">
              <h2 className="form-section-title">Các thiết lập còn lại</h2>
              
              <div className="setup-cards-container">
                {/* Card 1: Tài chính & Dịch vụ */}
                <div className="setup-card">
                  <h3 className="setup-card-title">Tài chính & Dịch vụ</h3>
                  <div className="setup-card-content">
                    <div className="form-group">
                      <label>Giá khám tối thiểu (VNĐ)</label>
                      <input type="number" name="price_min" value={formData.price_min || ''} onChange={handleChange}
                        placeholder="VD: 150000" min="0" className="form-input" />
                    </div>
                    <div className="form-group">
                      <ToggleSwitch 
                        label="Có cung cấp dịch vụ" 
                        checked={formData.service === 1} 
                        onChange={(val) => handleToggle('service', val)} 
                      />
                    </div>
                    <div className="form-group">
                      <label>Phương thức thanh toán</label>
                      <select name="payment_method" value={formData.payment_method || 0} onChange={handleChange} className="form-input">
                        <option value={0}>Tiền mặt</option>
                        <option value={1}>Thẻ / Chuyển khoản</option>
                        <option value={2}>Cả hai</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Phạm vi thanh toán</label>
                      <select name="payment_scope" value={formData.payment_scope || 0} onChange={handleChange} className="form-input">
                        <option value={0}>Tại chỗ</option>
                        <option value={1}>Phạm vi chung</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Card 2: Hiển thị & Thuật toán */}
                <div className="setup-card">
                  <h3 className="setup-card-title">Hiển thị & Thuật toán</h3>
                  <div className="setup-card-content">
                    <div className="form-group">
                      <label>Thứ hạng ưu tiên (Nhỏ xếp trước)</label>
                      <input type="number" name="rank" value={formData.rank || ''} onChange={handleChange}
                        placeholder="VD: 1" className="form-input" />
                    </div>
                    <div className="form-group">
                      <ToggleSwitch 
                        label="Tài trợ / Nổi bật (Đẩy lên đầu)" 
                        checked={formData.sponsor === 1} 
                        onChange={(val) => handleToggle('sponsor', val)} 
                      />
                    </div>
                    <div className="form-group">
                      <ToggleSwitch 
                        label="Hiển thị ở Trang chủ" 
                        checked={formData.show_in_root_place === 1} 
                        onChange={(val) => handleToggle('show_in_root_place', val)} 
                      />
                    </div>
                    <div className="form-group">
                      <ToggleSwitch 
                        label="Hiển thị đánh giá của Bệnh nhân" 
                        checked={formData.show_feedback === 1} 
                        onChange={(val) => handleToggle('show_feedback', val)} 
                      />
                    </div>
                    <div className="form-group">
                      <ToggleSwitch 
                        label="Hiển thị Số điện thoại" 
                        checked={formData.show_phone === 1} 
                        onChange={(val) => handleToggle('show_phone', val)} 
                      />
                    </div>
                    <div className="form-group" style={{marginTop: '10px'}}>
                      <label>Đường dẫn tĩnh (URL SEO)</label>
                      <input type="text" name="url" value={formData.url || ''} onChange={handleChange}
                        placeholder="bac-si-nguyen-van-a" className="form-input" />
                    </div>

                    <div className="form-group">
                      <label>Từ khóa tìm kiếm (Search Text)</label>
                      <input type="text" name="search_text" value={formData.search_text || ''} onChange={handleChange}
                        placeholder="bac si tim mach..." className="form-input" />
                    </div>
                  </div>
                </div>

                {/* Card 3: Lịch khám & Vận hành */}
                <div className="setup-card">
                  <h3 className="setup-card-title">Lịch khám & Vận hành</h3>
                  <div className="setup-card-content">
                    <div className="form-group">
                      <ToggleSwitch 
                        label="Trạng thái (Hoạt động)" 
                        checked={formData.status === 1} 
                        onChange={(val) => handleToggle('status', val)} 
                      />
                    </div>
                    <div className="form-group">
                      <ToggleSwitch 
                        label="Đang nhận lịch khám" 
                        checked={formData.is_work === 1} 
                        onChange={(val) => handleToggle('is_work', val)} 
                      />
                    </div>
                    <div className="form-group">
                      <ToggleSwitch 
                        label="Tự vận hành (Không qua tổng đài)" 
                        checked={formData.self_supported === 1} 
                        onChange={(val) => handleToggle('self_supported', val)} 
                      />
                    </div>
                    <div className="form-group" style={{marginTop: '10px'}}>
                      <label>Tổng số lượt khám (Seeding UI)</label>
                      <input type="number" name="appointment_total" value={formData.appointment_total || ''} onChange={handleChange}
                        placeholder="VD: 1500" className="form-input" />
                    </div>
                    <div className="form-group">
                      <label>Số ngày gợi ý tái khám</label>
                      <input type="number" name="rebook_nextday_suggest" value={formData.rebook_nextday_suggest || ''} onChange={handleChange}
                        placeholder="VD: 7" min="0" className="form-input" />
                    </div>
                    <div className="form-group" style={{ zIndex: 7 }}>
                      <label>Chuyển hướng đặt khám đến Cơ sở</label>
                      <SearchableSelect
                        options={[{value: 0, label: 'Không chuyển hướng'}, ...placeOptions]}
                        value={formData.forward_place ? parseInt(formData.forward_place, 10) : 0}
                        onChange={(val) => setFormData(p => ({ ...p, forward_place: val }))}
                        placeholder="Chọn cơ sở y tế..."
                      />
                    </div>
                  </div>
                </div>

                {/* Card 4: Hệ thống & Đối tác */}
                <div className="setup-card">
                  <h3 className="setup-card-title">Hệ thống & Đối tác</h3>
                  <div className="setup-card-content">
                    <div className="form-group" style={{ zIndex: 6 }}>
                      <label>Đối tác liên kết</label>
                      <MultiSearchableSelect
                        options={partnerOptions}
                        value={formData.partner_ids ? String(formData.partner_ids).split(',').filter(Boolean).map(id => parseInt(id.trim(), 10)) : []}
                        onChange={(val) => setFormData(p => ({ ...p, partner_ids: val.join(',') }))}
                        placeholder="Tìm kiếm đối tác..."
                      />
                    </div>
                    <div className="form-group">
                      <ToggleSwitch 
                        label="Đã đồng bộ dữ liệu" 
                        checked={formData.sync_status === 1} 
                        onChange={(val) => handleToggle('sync_status', val)} 
                      />
                    </div>
                    <div className="form-group" style={{marginTop: '10px'}}>
                      <label>Người / Role duyệt (Approvers)</label>
                      <input type="text" name="approvers" value={formData.approvers || ''} onChange={handleChange}
                        placeholder="VD: admin, manager" className="form-input" />
                    </div>
                    <div className="form-group">
                      <label>Ghi chú (Metadata / Giấy phép)</label>
                      <input type="text" name="metadata" value={formData.metadata || ''} onChange={handleChange}
                        placeholder="Ghi chú thêm..." className="form-input" style={{marginBottom: '5px'}}/>
                      <input type="text" name="license" value={formData.license || ''} onChange={handleChange}
                        placeholder="GP-12345" className="form-input" />
                    </div>
                  </div>
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
