import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Building2, Save } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { getPartnerById, updatePartner } from '../api/partner.api';
import RichTextEditor from '../components/RichTextEditor';

export default function EditPartner() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    short_name: '',
    description: '',
    address: '',
    status: 1,
    group: 1,
    license: '',
    rank: 99,
    email: '',
    payment_method: 0,
    booking_fee: 0,
    payment_scope: 0,
    features: '',
    documents: '',
    note: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getPartnerById(id);
        if (res.success && res.data) {
          setFormData(res.data);
        }
      } catch (error) {
        console.error('Fetch failed:', error);
        alert('Không thể tải thông tin đối tác');
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditorChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updatePartner(id, formData);
      alert('Cập nhật đối tác thành công!');
      navigate('/partner/admin');
    } catch (error) {
      console.error('Error:', error);
      alert('Có lỗi xảy ra!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout pageTitle="Chỉnh sửa đối tác">
      <div className="form-page-container">
        <div className="form-page-header">
          <button className="btn-back" onClick={() => navigate('/partner/admin')}>
            <ChevronLeft size={20} /> Quay lại
          </button>
          <h1 className="form-page-title">Sửa thông tin đối tác</h1>
        </div>

        <div className="form-page-content">
          <form onSubmit={handleSubmit} className="form-page-form">
            <div className="form-section">
              <h2 className="form-section-title"><Building2 size={18} /> Thông tin chung</h2>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Tên đối tác *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className="form-input" required />
                </div>
                <div className="form-group">
                  <label>Tên viết tắt</label>
                  <input type="text" name="short_name" value={formData.short_name} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Mã số kinh doanh / License</label>
                  <input type="text" name="license" value={formData.license} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Thứ tự ưu tiên (Rank)</label>
                  <input type="number" name="rank" value={formData.rank} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group full-width">
                  <label>Địa chỉ</label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} className="form-input" />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2 className="form-section-title">Mô tả & Chi tiết</h2>
              <div className="form-group full-width">
                <label>Mô tả đối tác</label>
                <RichTextEditor name="description" value={formData.description} onChange={handleEditorChange} />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/partner/admin')}>Hủy bỏ</button>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
