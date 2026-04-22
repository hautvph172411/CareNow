import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Shield, Briefcase, Camera } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { createUser } from '../api/user.api';
import { getPartners } from '../api/partner.api';
import SearchableSelect from '../components/SearchableSelect';
import '../styles/UserForm.css';

export default function AddUser() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState('admin'); // 'admin' | 'partner'
  const [isLoading, setIsLoading] = useState(false);
  const [partners, setPartners] = useState([]);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    display_name: '',
    password: '',
    newPassword: '',
    confirmPassword: '',
    role: 1, // 1: Staff/Sub-admin, 2: Manager/Super-admin
    status: 1, // 1: Active, 0: Inactive, -1: Deleted
    partner_id: null,
    avatar: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (userType === 'partner') {
      const loadPartners = async () => {
        try {
          const res = await getPartners({ status: 1 }); // Chỉ lấy đối tác đang hoạt động
          if (res.success) {
            setPartners(res.data.map(p => ({ value: p.id, label: p.name })));
          }
        } catch (e) {
          console.error('Failed to load partners', e);
        }
      };
      loadPartners();
    }
  }, [userType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, avatar: `/assets/images/${file.name}` }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.username && userType === 'admin') newErrors.username = 'Tên đăng nhập là bắt buộc';
    if (!formData.display_name) newErrors.display_name = 'Tên hiển thị là bắt buộc';
    if (!formData.password) newErrors.password = 'Mật khẩu là bắt buộc';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    if (userType === 'partner' && !formData.partner_id) newErrors.partner_id = 'Vui lòng chọn đối tác';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        // Role prefix mapping if needed, or just numbers
        // Admin: type specific role logic
        // Partner: type specific role logic
      };
      
      // If partner type, maybe use email/phone as username if not provided
      if (userType === 'partner' && !payload.username) {
        payload.username = formData.email || formData.phone;
      }

      await createUser(payload);
      alert('Thêm tài khoản thành công!');
      navigate('/users');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout pageTitle="Thêm tài khoản mới">
      <div className="form-page-container">
        <div className="form-page-header">
          <button className="btn-back" onClick={() => navigate('/users')}>
            <ChevronLeft size={20} /> Quay lại
          </button>
          <h1 className="form-page-title">Thêm tài khoản mới</h1>
        </div>

        <div className="user-type-selector">
          <button 
            className={`type-btn ${userType === 'admin' ? 'active' : ''}`}
            onClick={() => setUserType('admin')}
          >
            <Shield size={20} /> Tài khoản Quản trị
          </button>
          <button 
            className={`type-btn ${userType === 'partner' ? 'active' : ''}`}
            onClick={() => setUserType('partner')}
          >
            <Briefcase size={20} /> Tài khoản Đối tác
          </button>
        </div>

        <div className="form-page-content">
          <form onSubmit={handleSubmit} className="form-page-form">
            
            <div className="form-section">
              <h2 className="form-section-title">
                {userType === 'admin' ? 'Thông tin Quản trị viên' : 'Thông tin nhân viên Đối tác'}
              </h2>
              
              <div className="form-grid">
                {userType === 'admin' && (
                  <div className="form-group">
                    <label>Tên đăng nhập *</label>
                    <input type="text" name="username" value={formData.username} onChange={handleChange} className={errors.username ? 'form-input error' : 'form-input'} />
                    {errors.username && <span className="form-error">{errors.username}</span>}
                  </div>
                )}

                {userType === 'partner' && (
                  <div className="form-group full-width">
                    <label>Đối tác *</label>
                    <SearchableSelect 
                      options={partners}
                      value={formData.partner_id}
                      onChange={(val) => handleSelectChange('partner_id', val)}
                      placeholder="Chọn đối tác đang hoạt động..."
                    />
                    {errors.partner_id && <span className="form-error">{errors.partner_id}</span>}
                  </div>
                )}

                <div className="form-group">
                  <label>Tên hiển thị *</label>
                  <input type="text" name="display_name" value={formData.display_name} onChange={handleChange} className={errors.display_name ? 'form-input error' : 'form-input'} />
                  {errors.display_name && <span className="form-error">{errors.display_name}</span>}
                </div>

                <div className="form-group">
                  <label>Quyền hạn *</label>
                  <SearchableSelect 
                    options={userType === 'admin' ? [
                      { value: 1, label: 'Nhân viên (1)' },
                      { value: 2, label: 'Quản trị (2)' }
                    ] : [
                      { value: 1, label: 'Nhân viên (1)' },
                      { value: 2, label: 'Quản lý (2)' }
                    ]}
                    value={formData.role}
                    onChange={(val) => handleSelectChange('role', val)}
                  />
                </div>

                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="form-input" />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" />
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
                  <label>Ảnh đại diện</label>
                  <div className="avatar-upload-box">
                    <input type="file" onChange={handleAvatarChange} id="avatar-input" hidden />
                    <label htmlFor="avatar-input" className="avatar-preview">
                      {avatarPreview ? <img src={avatarPreview} alt="Avatar" /> : <Camera size={24} />}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2 className="form-section-title">Mật khẩu</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Mật khẩu mới *</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} className={errors.password ? 'form-input error' : 'form-input'} />
                  {errors.password && <span className="form-error">{errors.password}</span>}
                </div>
                <div className="form-group">
                  <label>Nhập lại mật khẩu mới *</label>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className={errors.confirmPassword ? 'form-input error' : 'form-input'} />
                  {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/users')}>Hủy</button>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? 'Đang xử lý...' : 'Thêm tài khoản'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
