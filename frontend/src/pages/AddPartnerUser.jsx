import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Briefcase } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { createUser } from '../api/user.api';
import { getPartners } from '../api/partner.api';
import { getAuthItems, assignToUser } from '../api/auth_item.api';
import SearchableSelect from '../components/SearchableSelect';
import '../styles/UserForm.css';

export default function AddPartnerUser() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [partners, setPartners] = useState([]);
  const [roleOptions, setRoleOptions] = useState([]);

  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    partner_id: '',
    role_name: '', // Lưu Vai trò chọn từ DB
    status: 1,
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [pRes, rRes] = await Promise.all([
          getPartners({ status: 1 }),
          getAuthItems()
        ]);
        
        if (pRes.success) {
          setPartners(pRes.data.map(p => ({ value: p.id, label: p.name })));
        }

        if (rRes.success) {
          const roles = rRes.data
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
    loadInitialData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.partner_id) {
      setErrors({ partner_id: 'Vui lòng chọn đối tác' });
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

      if (!payload.username) payload.username = payload.email || payload.phone;
      
      payload.role = 2; // Quyền Đối tác

      delete payload.confirmPassword;
      delete payload.role_name;

      const userRes = await createUser(payload);
      if (userRes.success && selectedRole) {
        await assignToUser(userRes.data.id, [selectedRole]);
      }
      alert('Thêm tài khoản đối tác thành công!');
      navigate('/users/partner');
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout pageTitle="Thêm TK Đối tác">
      <div className="form-page-container">
        <div className="form-page-header">
          <button className="btn-back" onClick={() => navigate('/users/partner')}>
            <ChevronLeft size={20} /> Quay lại
          </button>
          <h1 className="form-page-title">Thêm tài khoản Đối tác mới</h1>
        </div>

        <div className="form-page-content">
          <form onSubmit={handleSubmit} className="form-page-form">
            <div className="form-section">
              <h2 className="form-section-title"><Briefcase size={18} /> Thông tin Đối tác & Vai trò</h2>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Đối tác *</label>
                  <SearchableSelect 
                    options={partners}
                    value={formData.partner_id}
                    onChange={(val) => setFormData(p => ({ ...p, partner_id: val }))}
                    placeholder="Chọn đối tác đang hoạt động..."
                  />
                  {errors.partner_id && <span className="form-error">{errors.partner_id}</span>}
                </div>
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
                    <option value={1}>Hoạt động</option>
                    <option value={0}>Tạm ngưng</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2 className="form-section-title">Thông tin định danh</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Tên hiển thị *</label>
                  <input type="text" name="display_name" value={formData.display_name} onChange={handleChange} className="form-input" required />
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
                  <label>Tên đăng nhập (Để trống sẽ lấy Email/SĐT)</label>
                  <input type="text" name="username" value={formData.username} onChange={handleChange} className="form-input" />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2 className="form-section-title">Mật khẩu</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Đặt mật khẩu *</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} className="form-input" required />
                </div>
                <div className="form-group">
                  <label>Nhập lại mật khẩu *</label>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="form-input" required />
                  {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/users/partner')}>Hủy</button>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'Đang lưu...' : 'Thêm tài khoản'}</button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
