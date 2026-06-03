import { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { getAllSettings, updateSettings } from '../api/settings.api';
import { Camera, Save } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';
import '../styles/UserForm.css';

export default function Settings() {
  const [formData, setFormData] = useState({
    site_logo: '',
    site_name: '',
    hotline: '',
    address: '',
    site_description: '',
    site_keywords: '',
    facebook_url: '',
    zalo_url: '',
    footer_text: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await getAllSettings();
      if (res.success && res.data) {
        setFormData(prev => ({
          ...prev,
          ...res.data
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateSettings(formData);
      alert('Cập nhật cài đặt thành công! Reload trang để xem thay đổi.');
      window.location.reload(); // Reload to refresh Sidebar logo if needed
    } catch (err) {
      alert('Lỗi cập nhật cài đặt');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout pageTitle="Cài đặt hệ thống">
      <div className="form-page-container">
        <div className="form-page-header">
          <h1 className="form-page-title">Cài đặt chung</h1>
        </div>

        <div className="form-page-content">
          <form onSubmit={handleSubmit} className="form-page-form">
            
            <div className="form-section">
              <h2 className="form-section-title">Nhận diện thương hiệu & SEO</h2>
              <div className="form-grid">
                
                <div className="form-group full-width">
                  <ImageUpload 
                    label="Logo Website"
                    value={formData.site_logo} 
                    onChange={(url) => setFormData(prev => ({ ...prev, site_logo: url }))} 
                    variant="avatar"
                    size={120}
                  />
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                    Nên sử dụng ảnh PNG có nền trong suốt, kích thước khoảng 200x50.
                  </p>
                </div>

                <div className="form-group full-width">
                  <label>Tên Website (Tiêu đề)</label>
                  <input 
                    type="text" 
                    name="site_name" 
                    value={formData.site_name} 
                    onChange={handleChange} 
                    className="form-input" 
                    placeholder="VD: CareNow"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Mô tả SEO trang chủ (site_description)</label>
                  <textarea 
                    name="site_description" 
                    value={formData.site_description} 
                    onChange={handleChange} 
                    className="form-input" 
                    rows={3}
                    placeholder="Nhập mô tả ngắn cho website hiển thị trên Google..."
                    style={{ minHeight: '80px', padding: '10px' }}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Từ khóa SEO (site_keywords)</label>
                  <input 
                    type="text" 
                    name="site_keywords" 
                    value={formData.site_keywords} 
                    onChange={handleChange} 
                    className="form-input" 
                    placeholder="VD: đặt lịch khám, bác sĩ giỏi, carenow, y tế"
                  />
                </div>

              </div>
            </div>

            <div className="form-section" style={{ marginTop: '24px' }}>
              <h2 className="form-section-title">Thông tin liên hệ & Hỗ trợ</h2>
              <div className="form-grid">
                
                <div className="form-group">
                  <label>Hotline hỗ trợ</label>
                  <input 
                    type="text" 
                    name="hotline" 
                    value={formData.hotline} 
                    onChange={handleChange} 
                    className="form-input" 
                    placeholder="VD: 1900 1234"
                  />
                </div>

                <div className="form-group">
                  <label>Địa chỉ văn phòng</label>
                  <input 
                    type="text" 
                    name="address" 
                    value={formData.address} 
                    onChange={handleChange} 
                    className="form-input" 
                    placeholder="Địa chỉ trụ sở chính..."
                  />
                </div>

              </div>
            </div>

            <div className="form-section" style={{ marginTop: '24px' }}>
              <h2 className="form-section-title">Mạng xã hội & Chân trang</h2>
              <div className="form-grid">
                
                <div className="form-group">
                  <label>Link Fanpage Facebook</label>
                  <input 
                    type="text" 
                    name="facebook_url" 
                    value={formData.facebook_url} 
                    onChange={handleChange} 
                    className="form-input" 
                    placeholder="https://facebook.com/..."
                  />
                </div>

                <div className="form-group">
                  <label>Link Zalo OA</label>
                  <input 
                    type="text" 
                    name="zalo_url" 
                    value={formData.zalo_url} 
                    onChange={handleChange} 
                    className="form-input" 
                    placeholder="https://zalo.me/..."
                  />
                </div>

                <div className="form-group full-width">
                  <label>Bản quyền chân trang (Footer Text)</label>
                  <input 
                    type="text" 
                    name="footer_text" 
                    value={formData.footer_text} 
                    onChange={handleChange} 
                    className="form-input" 
                    placeholder="VD: © 2026 CareNow. All rights reserved."
                  />
                </div>

              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                <Save size={18} /> {isLoading ? 'Đang lưu...' : 'Lưu Cài đặt'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
