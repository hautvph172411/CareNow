import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, User as UserIcon, Camera } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { getUserById, updateUser } from '../api/user.api';
import { getPartners } from '../api/partner.api';
import { getAuthItems, getUserAssignments, assignToUser } from '../api/auth_item.api';
import SearchableSelect from '../components/SearchableSelect';
import '../styles/UserForm.css';

export default function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState('admin');
  const [partners, setPartners] = useState([]);
  const [roleOptions, setRoleOptions] = useState([]);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    role_name: '', // Lưu Vai trò chọn từ DB
    status: 1,
    partner_id: null,
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    avatar: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const [userRes, partnersRes, rolesRes, assignRes] = await Promise.all([
          getUserById(id),
          getPartners({ status: 1 }),
          getAuthItems(),
          getUserAssignments(id)
        ]);

        if (userRes.success) {
          const user = userRes.data;
          setFormData({
            ...user,
            password: '',
            confirmPassword: '',
            role_name: assignRes.success && assignRes.data.length > 0 ? assignRes.data[0] : ''
          });
          setUserType(user.partner_id ? 'partner' : 'admin');
          if (user.avatar) setAvatarPreview(user.avatar);
        }

        if (partnersRes.success) {
          setPartners(partnersRes.data.map(p => ({ value: p.id, label: p.name })));
        }

        if (rolesRes.success) {
          setRoleOptions(rolesRes.data.filter(i => i.type === 1).map(r => ({ value: r.name, label: r.name })));
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, avatar: `/assets/images/${file.name}` }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: 'Mật khẩu xác nhận không khớp' });
      return;
    }

    setIsLoading(true);
    try {
      const payload = { ...formData };
      const selectedRole = payload.role_name;
      
      delete payload.confirmPassword;
      delete payload.role_name;
      if (!payload.password) delete payload.password;

      await Promise.all([
        updateUser(id, payload),
        assignToUser(id, selectedRole ? [selectedRole] : [])
      ]);

      alert('Cập nhật tài khoản thành công!');
      navigate(userType === 'admin' ? '/users/admin' : '/users/partner');
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout pageTitle="Chỉnh sửa tài khoản">
      <div className="form-page-container">
        <div className="form-page-header">
          <button className="btn-back" onClick={() => navigate(-1)}>
            <ChevronLeft size={20} /> Quay lại
          </button>
          <h1 className="form-page-title">Cập nhật tài khoản</h1>
        </div>

        <div className="form-page-content">
          <form onSubmit={handleSubmit} className="form-page-form">
            <div className="form-section">
              <h2 className="form-section-title"><UserIcon size={18} /> Thông tin tài khoản</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Tên đăng nhập</label>
                  <input type="text" value={formData.username} className="form-input" disabled />
                </div>
                <div className="form-group">
                  <label>Tên hiển thị</label>
                  <input type="text" name="display_name" value={formData.display_name} onChange={handleChange} className="form-input" />
                </div>
                
                {userType === 'partner' && (
                  <div className="form-group">
                    <label>Đối tác</label>
                    <SearchableSelect 
                      options={partners}
                      value={formData.partner_id}
                      onChange={(val) => setFormData(p => ({ ...p, partner_id: val }))}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Quyền hạn (Vai trò) *</label>
                  <SearchableSelect 
                    options={roleOptions}
                    value={formData.role_name}
                    onChange={(val) => setFormData(p => ({ ...p, role_name: val }))}
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
                    <div className="avatar-upload-box">
                        <input type="file" id="av-edit" hidden onChange={handleAvatarChange} />
                        <label htmlFor="av-edit" className="avatar-preview">
                            {avatarPreview ? <img src={avatarPreview} alt="Avatar" /> : <UserIcon size={24} />}
                        </label>
                    </div>
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
              <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'Đang lưu...' : 'Cập nhật tài khoản'}</button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
