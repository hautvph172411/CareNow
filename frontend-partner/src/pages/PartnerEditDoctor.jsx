import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Info, Stethoscope, Save, Loader } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { updateClinic, getClinicById } from '../api/clinic.api';
import { getSpecialties } from '../api/specialty.api';
import { getClinicPlaces } from '../api/clinic_place.api';
import { getProvinces, getWardsByProvince } from '../api/location.api';
import RichTextEditor from '../components/RichTextEditor';
import ImageUpload from '../components/ImageUpload';
import MultiSearchableSelect from '../components/MultiSearchableSelect';
import SearchableSelect from '../components/SearchableSelect';
import { useAuth } from '../hooks/useAuth';
import '../styles/ClinicPlaceForm.css';

const emptyForm = () => ({
  title: '',
  name: '',
  picture: '',
  specialist_ids: [],
  place_ids: [],
  province_id: '',
  district_id: '',
  address: '',
  status: 1,
  content: '',
  summary: '',
  rank: ''
});

export default function PartnerEditDoctor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  
  const [specialties, setSpecialties] = useState([]);
  const [partnerPlaceId, setPartnerPlaceId] = useState(null);
  const [partnerPlaceName, setPartnerPlaceName] = useState('');
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [specRes, placeRes, docRes, provRes] = await Promise.all([
          getSpecialties({ limit: 100, status: 1 }),
          getClinicPlaces({ limit: 1 }),
          id ? getClinicById(id) : Promise.resolve(null),
          getProvinces()
        ]);
        
        if (!cancelled) {
          if (provRes) {
            setProvinces(provRes.map(p => ({ value: p.id, label: p.name })));
          }
          if (specRes.data) {
            setSpecialties(specRes.data.map(s => ({ value: s.id, label: s.name })));
          }
          
          let placeId = null;
          let placeInfo = null;
          if (placeRes.data && placeRes.data.length > 0) {
            placeInfo = placeRes.data[0];
            placeId = placeInfo.id;
            setPartnerPlaceId(placeId);
            setPartnerPlaceName(placeInfo.name || placeInfo.display_name || 'Nơi khám của đối tác');
            
            // Fetch wards if place has province
            if (placeInfo.province_id) {
              getWardsByProvince(placeInfo.province_id)
                .then(wData => {
                  if (!cancelled) setWards(wData.map(d => ({ value: String(d.id), label: d.name })));
                })
                .catch(console.error);
            }
          }

          if (docRes?.data) {
            const d = docRes.data;
            setFormData({
              ...emptyForm(),
              ...d,
              specialist_ids: d.specialist_ids ? d.specialist_ids.split(',').map(v => parseInt(v, 10)).filter(v => !isNaN(v)) : [],
              place_ids: placeId ? [placeId] : (d.place_ids ? d.place_ids.split(',').map(v => parseInt(v, 10)).filter(v => !isNaN(v)) : []),
              province_id: placeInfo?.province_id ? String(placeInfo.province_id) : (d.province_id ? String(d.province_id) : ''),
              district_id: placeInfo?.district_id ? String(placeInfo.district_id) : (d.district_ids ? String(d.district_ids) : ''),
              address: placeInfo?.address || d.address || ''
            });
          }
        }
      } catch (e) {
        console.error(e);
        if (e.response?.status === 404 || e.response?.status === 403) {
          alert("Không tìm thấy bác sĩ hoặc bạn không có quyền!");
          navigate('/doctors');
        }
      } finally {
        if (!cancelled) setBootLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleEditorChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setErrors({ name: 'Họ tên bác sĩ là bắt buộc' });
      alert("Vui lòng kiểm tra lại thông tin");
      return;
    }
    
    if (!partnerPlaceId) {
      alert("Đối tác chưa có nơi khám. Vui lòng cập nhật Nơi khám trước khi lưu bác sĩ.");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        status: parseInt(formData.status, 10),
        rank: formData.rank ? parseInt(formData.rank, 10) : null,
        specialist_ids: formData.specialist_ids.join(','),
        place_ids: partnerPlaceId.toString(),
        province_id: formData.province_id ? parseInt(formData.province_id, 10) : null,
        district_ids: formData.district_id ? String(formData.district_id) : null,
        address: formData.address,
        updated_at: Math.floor(Date.now() / 1000),
      };
      delete payload.district_id;
      delete payload.order;
      delete payload.is_consultant;

      await updateClinic(id, payload);
      alert('Cập nhật bác sĩ thành công!');
      navigate('/doctors');
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra!');
    } finally {
      setIsLoading(false);
    }
  };

  if (bootLoading) {
    return (
      <AdminLayout pageTitle="Chỉnh sửa bác sĩ">
        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
          <Loader size={24} className="spin" style={{ margin: '0 auto 0.5rem' }} />
          <div>Đang tải dữ liệu...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pageTitle="Chỉnh sửa bác sĩ">
      <div className="form-page-container">
        <div className="form-page-header">
          <button type="button" className="btn-back" onClick={() => navigate('/doctors')}>
            <ChevronLeft size={20} /> Quay lại
          </button>
          <h1 className="form-page-title">Chỉnh sửa bác sĩ</h1>
        </div>

        <div className="form-page-content">
          <form onSubmit={handleSubmit} className="form-page-form">
            <div className="form-section">
              <h2 className="form-section-title">
                <Info size={18} /> Thông tin cơ bản
              </h2>
              <div className="form-grid">
                <div className="form-group full-width" style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: '0 0 30%' }}>
                    <label>Chức danh (VD: ThS, BS, PGS, TS...)</label>
                    <input type="text" name="title" value={formData.title || ''} onChange={handleChange} className="form-input" placeholder="VD: ThS. BS." />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Họ tên bác sĩ *</label>
                    <input type="text" name="name" value={formData.name || ''} onChange={handleChange} 
                      className={errors.name ? 'form-input error' : 'form-input'} placeholder="Nguyễn Văn A" />
                    {errors.name && <span className="form-error">{errors.name}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <ImageUpload 
                    label="Ảnh đại diện" 
                    value={formData.picture} 
                    onChange={(url) => setFormData(p => ({...p, picture: url}))} 
                  />
                </div>

                <div className="form-group">
                  <label>Trạng thái</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="form-input">
                    <option value={1}>Hoạt động</option>
                    <option value={0}>Tạm dừng</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2 className="form-section-title">
                <Stethoscope size={18} /> Chuyên khoa &amp; Nơi khám
              </h2>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Chuyên khoa</label>
                  <MultiSearchableSelect
                    options={specialties}
                    value={formData.specialist_ids}
                    onChange={(val) => setFormData(p => ({ ...p, specialist_ids: val }))}
                    placeholder="Chọn chuyên khoa..."
                  />
                </div>
                
                <div className="form-group full-width">
                  <label>Nơi khám (Được gắn tự động)</label>
                  <div style={{ padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', color: '#64748b', fontWeight: 500 }}>
                    {partnerPlaceId ? partnerPlaceName : 'Chưa thiết lập nơi khám!'}
                  </div>
                </div>

                <div className="form-group">
                  <label>Tỉnh / Thành (Tự động theo nơi khám)</label>
                  <div style={{ pointerEvents: 'none', opacity: 0.7 }}>
                    <SearchableSelect options={provinces} value={formData.province_id} onChange={()=>{}} placeholder="Đồng bộ từ nơi khám" disabled={true} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Phường / Xã (Tự động theo nơi khám)</label>
                  <div style={{ pointerEvents: 'none', opacity: 0.7 }}>
                    <SearchableSelect options={wards} value={formData.district_id} onChange={()=>{}} placeholder="Đồng bộ từ nơi khám" disabled={true} />
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>Địa chỉ cụ thể (Tự động theo nơi khám)</label>
                  <input type="text" value={formData.address || ''} readOnly className="form-input" style={{ backgroundColor: '#f8fafc', color: '#64748b', borderColor: '#e2e8f0' }} placeholder="Đồng bộ từ nơi khám" />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2 className="form-section-title">Nội dung giới thiệu</h2>
              <div className="form-group full-width">
                <label>Mô tả ngắn</label>
                <textarea name="summary" value={formData.summary || ''} onChange={handleChange} className="form-input" rows={3} />
              </div>
              <div className="form-group full-width" style={{ marginTop: '1.5rem' }}>
                <label>Chi tiết giới thiệu (Mô tả chi tiết)</label>
                <RichTextEditor name="content" value={formData.content || ''} onChange={handleEditorChange} />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/doctors')}>Hủy</button>
              <button type="submit" className="btn btn-primary" disabled={isLoading || !partnerPlaceId}>
                {isLoading ? <><Loader size={16} className="spin"/> Đang lưu...</> : <><Save size={16}/> Lưu thay đổi</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
