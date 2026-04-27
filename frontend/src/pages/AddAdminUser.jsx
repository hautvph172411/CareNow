import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Shield } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { createUser } from '../api/user.api';
import { getAuthItems, assignToUser } from '../api/auth_item.api';
import SearchableSelect from '../components/SearchableSelect';
import ImageUpload from '../components/ImageUpload';
import '../styles/UserForm.css';

export default function AddAdminUser() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [roleOptions, setRoleOptions] = useState([]);

  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    role_name: '', // Lưu tên vai trò chọn từ DB
    status: 1,
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    avatar: '',
    partner_id: null
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const res = await getAuthItems();
        if (res.success) {
          const roles = res.data
            .filter(i => i.type === 1)
            .map(r => ({ value: r.name, label: r.name }));
          setRoleOptions(roles);
          if (roles.length > 0) {
            setFormData(prev => ({ ...prev, role_name: roles[0].value }));
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadRoles();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username) {
      setErrors({ username: 'Tên đăng nhập là bắt buộc' });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: 'Mật khẩu xác nhận không khớp' });
      return;
    }

    setIsLoading(true);
    try {
      const payload = { ...formData };
      const selectedRole = payload.role_name;
      
      // Map role_name sang role (integer) nếu cần cho backend cũ, 
      // nhưng quan trọng là gán vào tbl_auth_assignment
      payload.role = 1; 

      delete payload.confirmPassword;
      delete payload.role_name;

      const userRes = await createUser(payload);
      if (userRes.success && selectedRole) {
        await assignToUser(userRes.data.id, [selectedRole]);
      }
      alert('Thêm quản trị viên thành công!');
      navigate('/users/admin');
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout pageTitle="Thêm Quản trị viên">
      <div className="form-page-container">
        <div className="form-page-header">
          <button className="btn-back" onClick={() => navigate('/users/admin')}>
            <ChevronLeft size={20} /> Quay lại
          </button>
          <h1 className="form-page-title">Thêm Quản trị viên mới</h1>
        </div>

        <div className="form-page-content">
          <form onSubmit={handleSubmit} className="form-page-form">
            <div className="form-section">
              <h2 className="form-section-title"><Shield size={18} /> Thông tin tài khoản</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Tên đăng nhập *</label>
                  <input type="text" name="username" value={formData.username} onChange={handleChange} className="form-input" required />
                  {errors.username && <span className="form-error">{errors.username}</span>}
                </div>
                <div className="form-group">
                  <label>Tên hiển thị</label>
                  <input type="text" name="display_name" value={formData.display_name} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Quyền hạn (Vai trò) *</label>
                  <SearchableSelect 
                    options={roleOptions}
                    value={formData.role_name}
                    onChange={(val) => setFormData(p => ({ ...p, role_name: val }))}
                    placeholder="Chọn vai trò..."
                  />
                </div>
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="form-input">
                    <option value={1}>Kích hoạt</option>
                    <option value={0}>Ngưng kích hoạt</option>
                    <option value={-1}>Đã xóa</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
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
              <h2 className="form-section-title">Thiết lập mật khẩu</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Mật khẩu mới *</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} className="form-input" required />
                </div>
                <div className="form-group">
                  <label>Nhập lại mật khẩu mới *</label>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="form-input" required />
                  {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/users/admin')}>Hủy</button>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'Đang lưu...' : 'Thêm tài khoản'}</button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
