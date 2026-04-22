import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Building2, Save } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { createPartner } from '../api/partner.api';
import RichTextEditor from '../components/RichTextEditor';

export default function AddPartner() {
  const navigate = useNavigate();
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
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên đối tác');
      return;
    }
    setIsLoading(true);
    try {
      await createPartner(formData);
      alert('Thêm đối tác thành công!');
      navigate('/partner/admin');
    } catch (error) {
      console.error('Error:', error);
      alert('Có lỗi xảy ra!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout pageTitle="Thêm đối tác mới">
      <div className="form-page-container">
        <div className="form-page-header">
          <button className="btn-back" onClick={() => navigate('/partner/admin')}>
            <ChevronLeft size={20} /> Quay lại
          </button>
          <h1 className="form-page-title">Thêm đối tác mới</h1>
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
              <h2 className="form-section-title">Cấu hình & Thanh toán</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nhóm đối tác (Group)</label>
                  <input type="number" name="group" value={formData.group} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Phí đặt lịch (Booking Fee)</label>
                  <input type="number" name="booking_fee" value={formData.booking_fee} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Phương thức thanh toán</label>
                  <select name="payment_method" value={formData.payment_method} onChange={handleChange} className="form-input">
                    <option value={0}>Tiền mặt</option>
                    <option value={1}>Chuyển khoản</option>
                    <option value={2}>Cả hai</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="form-input">
                    <option value={1}>Hoạt động</option>
                    <option value={0}>Tạm ngưng</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2 className="form-section-title">Mô tả & Chi tiết</h2>
              <div className="form-group full-width">
                <label>Mô tả đối tác</label>
                <RichTextEditor name="description" value={formData.description} onChange={handleEditorChange} />
              </div>
              <div className="form-group full-width" style={{ marginTop: '1rem' }}>
                <label>Ghi chú nội bộ</label>
                <textarea name="note" value={formData.note} onChange={handleChange} className="form-input" rows={3} />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/partner/admin')}>Hủy bỏ</button>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? 'Đang lưu...' : 'Thêm đối tác'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
