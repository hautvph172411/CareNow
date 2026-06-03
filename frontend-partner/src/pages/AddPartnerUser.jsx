import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { createUser } from '../api/user.api';

export default function AddPartnerUser() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    phone: '',
    display_name: '',
    partner_role: 'staff',
    status: 1,
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      alert('Mật khẩu nhập lại không khớp!');
      return;
    }
    setSubmitting(true);
    try {
      await createUser(form);
      alert('Đã thêm tài khoản');
      navigate('/team');
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi thêm tài khoản');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout pageTitle="Thêm tài khoản nhân viên">
      <div className="form-page-container" style={{ maxWidth: 600 }}>
        <div className="form-page-header">
          <button type="button" className="btn-back" onClick={() => navigate('/team')}>
            <ArrowLeft size={20} /> Quay lại
          </button>
          <h1 className="form-page-title">Thêm tài khoản mới</h1>
        </div>

        <div className="form-page-content">
          <form onSubmit={handleSubmit} className="form-page-form">
            <div className="form-section">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Tên đăng nhập *</label>
                  <input type="text" name="username" className="form-input" value={form.username} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Mật khẩu *</label>
                  <input type="password" name="password" className="form-input" value={form.password} onChange={handleChange} required minLength={6} />
                </div>
                <div className="form-group">
                  <label>Nhập lại mật khẩu *</label>
                  <input type="password" name="confirmPassword" className="form-input" value={form.confirmPassword} onChange={handleChange} required />
                </div>
                <div className="form-group full-width">
                  <label>Tên hiển thị *</label>
                  <input type="text" name="display_name" className="form-input" value={form.display_name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input type="text" name="phone" className="form-input" value={form.phone} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" name="email" className="form-input" value={form.email} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Phân quyền *</label>
                  <select name="partner_role" className="form-input" value={form.partner_role} onChange={handleChange} required>
                    <option value="staff">Nhân viên (Chỉ xem/xử lý lịch)</option>
                    <option value="manager">Quản lý (Toàn quyền đối tác)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select name="status" className="form-input" value={form.status} onChange={handleChange}>
                    <option value={1}>Hoạt động</option>
                    <option value={0}>Khóa</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/team')}>Hủy</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Đang lưu...' : 'Lưu tài khoản'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
