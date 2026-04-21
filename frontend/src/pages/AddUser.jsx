import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import AdminLayout from '../layouts/AdminLayout'

export default function AddUser() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'Bác sĩ',
    address: '',
    status: 'active'
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Tên không được để trống'
    if (!formData.email.trim()) newErrors.email = 'Email không được để trống'
    if (!formData.password.trim()) newErrors.password = 'Mật khẩu không được để trống'
    if (formData.password.length < 6) newErrors.password = 'Mật khẩu phải tối thiểu 6 ký tự'
    if (!formData.phone.trim()) newErrors.phone = 'Số điện thoại không được để trống'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert('Thêm người dùng thành công!')
      navigate('/users')
    } catch (error) {
      console.error('Error:', error)
      alert('Có lỗi xảy ra!')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AdminLayout pageTitle="Thêm người dùng mới">
      <div className="form-page-container">
        {/* Header */}
        <div className="form-page-header">
          <button className="btn-back" onClick={() => navigate('/users')}>
            <ChevronLeft size={20} />
            Quay lại
          </button>
          <h1 className="form-page-title">Thêm người dùng mới</h1>
        </div>

        {/* Form */}
        <div className="form-page-content">
          <form onSubmit={handleSubmit} className="form-page-form">
            {/* Basic Info Section */}
            <div className="form-section">
              <h2 className="form-section-title">Thông tin cơ bản</h2>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Tên người dùng *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Nhập tên đầy đủ"
                    className={errors.name ? 'form-input error' : 'form-input'}
                  />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="admin@carenow.vn"
                    className={errors.email ? 'form-input error' : 'form-input'}
                  />
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label>Mật khẩu *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={errors.password ? 'form-input error' : 'form-input'}
                  />
                  {errors.password && <span className="form-error">{errors.password}</span>}
                </div>

                <div className="form-group">
                  <label>Số điện thoại *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0123456789"
                    className={errors.phone ? 'form-input error' : 'form-input'}
                  />
                  {errors.phone && <span className="form-error">{errors.phone}</span>}
                </div>
              </div>
            </div>

            {/* Role & Status Section */}
            <div className="form-section">
              <h2 className="form-section-title">Vai trò & Trạng thái</h2>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Vai trò *</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option>Admin</option>
                    <option>Bác sĩ</option>
                    <option>Tiếp tân</option>
                    <option>Y tá</option>
                    <option>Quản lý</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Trạng thái *</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Không hoạt động</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div className="form-section">
              <h2 className="form-section-title">Địa chỉ</h2>
              
              <div className="form-group full-width">
                <label>Địa chỉ</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Đường ABC, Quận XYZ, TP HCM"
                  className="form-input"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/users')}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Đang xử lý...' : 'Thêm người dùng'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  )
}
