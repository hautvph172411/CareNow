import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, User as UserIcon } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { getUserById, updateUser } from '../api/user.api';
import { useAuth } from '../hooks/useAuth';
import ImageUpload from '../components/ImageUpload';
import '../styles/UserForm.css';

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateUserSession } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    avatar: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!user?.id) return;
    const loadData = async () => {
      try {
        const userRes = await getUserById(user.id);
        if (userRes.success) {
          const fetchedUser = userRes.data;
          
          // Auto-sync session if it's stale
          if (
            fetchedUser.display_name !== user.display_name ||
            fetchedUser.email !== user.email ||
            fetchedUser.phone !== user.phone ||
            fetchedUser.avatar !== user.avatar
          ) {
            updateUserSession({
              display_name: fetchedUser.display_name,
              email: fetchedUser.email,
              phone: fetchedUser.phone,
              avatar: fetchedUser.avatar,
            });
          }

          setFormData(prev => ({
            ...prev,
            ...fetchedUser,
            password: '',
            confirmPassword: ''
          }));
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, [user?.id, updateUserSession, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: 'Mật khẩu xác nhận không khớp' });
      alert("Vui lòng kiểm tra lại các thông tin bắt buộc!");
      return;
    }

    setIsLoading(true);
    try {
      const payload = { ...formData };
      delete payload.confirmPassword;
      if (!payload.password) delete payload.password;

      await updateUser(user.id, payload);

      updateUserSession({
        display_name: payload.display_name,
        email: payload.email,
        phone: payload.phone,
        avatar: payload.avatar,
      });

      alert('Cập nhật hồ sơ thành công!');
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout pageTitle="Hồ sơ cá nhân">
      <div className="form-page-container">
        <div className="form-page-header">
          <button className="btn-back" onClick={() => navigate(-1)}>
            <ChevronLeft size={20} /> Quay lại
          </button>
          <h1 className="form-page-title">Cập nhật hồ sơ</h1>
        </div>

        <div className="form-page-content">
          <form onSubmit={handleSubmit} className="form-page-form">
            <div className="form-section">
              <h2 className="form-section-title"><UserIcon size={18} /> Thông tin cá nhân</h2>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>ID Tài khoản</label>
                  <input type="text" value={user?.id || ''} className="form-input" disabled />
                </div>
                <div className="form-group">
                  <label>Tên đăng nhập</label>
                  <input type="text" value={formData.username} className="form-input" disabled />
                </div>
                <div className="form-group">
                  <label>Tên hiển thị</label>
                  <input type="text" name="display_name" value={formData.display_name} onChange={handleChange} className="form-input" required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" required />
                </div>
                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group full-width">
                  <label>Ảnh đại diện</label>
                  <ImageUpload
                    variant="avatar"
                    value={formData.avatar}
                    onChange={(url) => setFormData(prev => ({ ...prev, avatar: url }))}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2 className="form-section-title">Đổi mật khẩu (nếu cần)</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Mật khẩu mới</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} className="form-input" placeholder="Để trống nếu không đổi" />
                </div>
                <div className="form-group">
                  <label>Nhập lại mật khẩu mới</label>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="form-input" placeholder="Để trống nếu không đổi" />
                  {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Hủy</button>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
