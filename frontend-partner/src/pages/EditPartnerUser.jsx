import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { getUserById, updateUser } from '../api/user.api';
import { useAuth } from '../hooks/useAuth';

export default function EditPartnerUser() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, updateUserSession } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    password: '',
    confirmPassword: '',
    email: '',
    phone: '',
    display_name: '',
    partner_role: 'staff',
    status: 1,
  });
  const [username, setUsername] = useState('');

  useEffect(() => {
    getUserById(id)
      .then(res => {
        if (res?.data) {
          setUsername(res.data.username);
          setForm({
            password: '',
            confirmPassword: '',
            email: res.data.email || '',
            phone: res.data.phone || '',
            display_name: res.data.display_name || '',
            partner_role: res.data.partner_role || 'staff',
            status: res.data.status,
          });
        }
      })
      .catch(e => {
        alert(e.response?.data?.message || 'Lỗi tải dữ liệu');
        navigate('/team');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirmPassword) {
      alert('Mật khẩu nhập lại không khớp!');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.password) {
        delete payload.password;
        delete payload.confirmPassword;
      }
      await updateUser(id, payload);
      
      if (user?.id === parseInt(id, 10) || user?.id === id) {
        updateUserSession({
          display_name: payload.display_name,
          email: payload.email,
          phone: payload.phone,
        });
      }

      alert('Đã cập nhật tài khoản');
      navigate('/team');
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi cập nhật tài khoản');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <AdminLayout pageTitle="Cập nhật tài khoản"><div style={{ padding: 40 }}>Đang tải...</div></AdminLayout>;

  return (
    <AdminLayout pageTitle="Cập nhật tài khoản">
      <div className="form-page-container" style={{ maxWidth: 600 }}>
        <div className="form-page-header">
          <button type="button" className="btn-back" onClick={() => navigate('/team')}>
            <ArrowLeft size={20} /> Quay lại
          </button>
          <h1 className="form-page-title">Sửa tài khoản: {username}</h1>
        </div>

        <div className="form-page-content">
          <form onSubmit={handleSubmit} className="form-page-form">
            <div className="form-section">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Tên hiển thị *</label>
                  <input type="text" name="display_name" className="form-input" value={form.display_name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Mật khẩu mới</label>
                  <input type="password" name="password" className="form-input" placeholder="(Bỏ trống nếu không đổi)" value={form.password} onChange={handleChange} minLength={6} />
                </div>
                <div className="form-group">
                  <label>Nhập lại mật khẩu mới</label>
                  <input type="password" name="confirmPassword" className="form-input" value={form.confirmPassword} onChange={handleChange} />
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
                {submitting ? 'Đang lưu...' : 'Lưu cập nhật'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
