import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import RichTextEditor from '../components/RichTextEditor';
import { createBlogCategory, getBlogCategoryById, updateBlogCategory } from '../api/blogCategory.api';
import { slugifyVi } from '../utils/slugify';

const emptyForm = {
  name: '',
  title: '',
  url: '',
  description: '',
  content: '',
  rank: 99,
  status: 1,
};

export default function BlogCategoryEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(isEdit);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setIsLoading(true);
      try {
        const res = await getBlogCategoryById(id);
        setFormData({ ...emptyForm, ...res.data });
      } catch (error) {
        console.error(error);
        alert('Lỗi tải danh mục cẩm nang');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'name' && !isEdit) {
        next.title = value;
        next.url = slugifyVi(value);
      }
      return next;
    });
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Tên danh mục không được để trống';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitted(true);
    try {
      const payload = {
        ...formData,
        rank: parseInt(formData.rank, 10) || 99,
        status: parseInt(formData.status, 10),
      };
      if (isEdit) await updateBlogCategory(id, payload);
      else await createBlogCategory(payload);
      alert(isEdit ? 'Cập nhật danh mục thành công!' : 'Thêm danh mục thành công!');
      navigate('/blog-categories/admin');
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || 'Lưu danh mục thất bại');
    } finally {
      setSubmitted(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout pageTitle="Danh mục cẩm nang">
        <div style={{ padding: '2rem' }}>Đang tải...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pageTitle="Danh mục cẩm nang">
      <div className="form-page-container">
        <div className="form-page-header">
          <button className="btn-back" onClick={() => navigate('/blog-categories/admin')}>
            <ArrowLeft size={20} />
            Quay lại
          </button>
          <h1 className="form-page-title">{isEdit ? 'Sửa danh mục cẩm nang' : 'Thêm danh mục cẩm nang'}</h1>
        </div>

        <div className="form-page-content">
          <form onSubmit={handleSubmit} className="form-page-form">
            <div className="form-section">
              <h3 className="form-section-title">Thông tin chính</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Tên danh mục *</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`form-input ${errors.name ? 'error' : ''}`}
                    placeholder="VD: Sức khỏe tổng quát"
                  />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label>Tiêu đề</label>
                  <input name="title" value={formData.title || ''} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>URL</label>
                  <input name="url" value={formData.url || ''} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Thứ hạng</label>
                  <input name="rank" type="number" value={formData.rank ?? 99} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select name="status" value={formData.status ?? 1} onChange={handleChange} className="form-input">
                    <option value={1}>Hoạt động</option>
                    <option value={0}>Vô hiệu</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Mô tả</label>
                  <textarea name="description" value={formData.description || ''} onChange={handleChange} className="form-input textarea" rows="2" />
                </div>
              </div>
            </div>

            <div className="form-section" style={{ zIndex: 1 }}>
              <h3 className="form-section-title">Nội dung</h3>
              <RichTextEditor
                name="content"
                value={formData.content || ''}
                onChange={handleChange}
                placeholder="Nội dung mô tả danh mục..."
              />
            </div>

            <div className="form-actions" style={{ marginTop: '2rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/blog-categories/admin')}>Hủy bỏ</button>
              <button type="submit" className="btn btn-primary" disabled={submitted}>
                {submitted ? 'Đang xử lý...' : (isEdit ? 'Cập nhật danh mục' : 'Thêm danh mục')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
