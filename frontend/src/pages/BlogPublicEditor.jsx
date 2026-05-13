import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import ImageUpload from '../components/ImageUpload';
import RichTextEditor from '../components/RichTextEditor';
import { getBlogCategories } from '../api/blogCategory.api';
import { createBlogPublic, getBlogPublicById, updateBlogPublic } from '../api/blogPublic.api';
import { getClinicReasons } from '../api/clinicReason.api';
import { getClinics } from '../api/clinic.api';
import { getSpecialties } from '../api/specialty.api';
import { slugifyVi } from '../utils/slugify';

const emptyForm = {
  type: 1,
  title: '',
  picture: '',
  picture_alt: '',
  summary: '',
  content: '',
  url: '',
  description: '',
  published_time: '',
  published_start: '',
  status: 1,
  views: 0,
  categories: '',
  rank: 99,
  show_related_article: 1,
  show_list_category: 1,
  is_check: 0,
  show_comment: 1,
  show_phone: 0,
  reason: '',
  references: '',
  next_post: '',
  suggest_specialist: '',
  suggest_doctor: '',
  suggest_content: '',
  custom_button_text: '',
  custom_button_link: '',
  author: '',
  advisor: '',
  censor: '',
  tag: '',
  metadata: '',
};

const splitCsv = (value) => String(value || '').split(',').filter(Boolean);
const epochToDateTime = (value) => {
  if (!value) return '';
  const date = new Date(Number(value) * 1000);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const dateTimeToEpoch = (value) => value ? Math.floor(new Date(value).getTime() / 1000) : '';

export default function BlogPublicEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [formData, setFormData] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [reasons, setReasons] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(isEdit);

  const selectedCategoryIds = useMemo(() => splitCsv(formData.categories), [formData.categories]);

  useEffect(() => {
    (async () => {
      try {
        const [categoryRes, reasonRes, doctorRes, specialtyRes] = await Promise.all([
          getBlogCategories({ limit: 300, status: 1 }),
          getClinicReasons({ limit: 300, status: 1 }),
          getClinics({ limit: 300, status: 1 }),
          getSpecialties({ limit: 300, status: 1 }),
        ]);
        setCategories(categoryRes?.data || []);
        setReasons(reasonRes?.data || []);
        setDoctors(doctorRes?.data || []);
        setSpecialties(specialtyRes?.data || []);
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setIsLoading(true);
      try {
        const res = await getBlogPublicById(id);
        setFormData({
          ...emptyForm,
          ...res.data,
          published_time: epochToDateTime(res.data.published_time),
          published_start: epochToDateTime(res.data.published_start),
          reason: res.data.reason || '',
          suggest_specialist: res.data.suggest_specialist || '',
          suggest_doctor: res.data.suggest_doctor || '',
          next_post: res.data.next_post || '',
        });
      } catch (error) {
        console.error(error);
        alert('Lỗi tải bài cẩm nang');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'title' && !isEdit) next.url = slugifyVi(value);
      return next;
    });
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleCategoryChange = (e) => {
    const values = Array.from(e.target.selectedOptions).map((option) => option.value);
    setFormData((prev) => ({ ...prev, categories: values.join(',') }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Tiêu đề bài viết không được để trống';
    if (!formData.url.trim()) newErrors.url = 'URL bài viết không được để trống';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitted(true);
    try {
      const payload = {
        ...formData,
        published_time: dateTimeToEpoch(formData.published_time),
        published_start: dateTimeToEpoch(formData.published_start),
      };
      if (isEdit) await updateBlogPublic(id, payload);
      else await createBlogPublic(payload);
      alert(isEdit ? 'Cập nhật bài cẩm nang thành công!' : 'Thêm bài cẩm nang thành công!');
      navigate('/blog-public/admin');
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || 'Lưu bài cẩm nang thất bại');
    } finally {
      setSubmitted(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout pageTitle="Bài cẩm nang">
        <div style={{ padding: '2rem' }}>Đang tải...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pageTitle="Bài cẩm nang">
      <div className="form-page-container">
        <div className="form-page-header">
          <button className="btn-back" onClick={() => navigate('/blog-public/admin')}>
            <ArrowLeft size={20} />
            Quay lại
          </button>
          <h1 className="form-page-title">{isEdit ? 'Sửa bài cẩm nang' : 'Thêm bài cẩm nang'}</h1>
        </div>

        <div className="form-page-content">
          <form onSubmit={handleSubmit} className="form-page-form">
            <div className="form-section">
              <h3 className="form-section-title">Thông tin bài viết</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Tiêu đề bài viết *</label>
                  <input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className={`form-input ${errors.title ? 'error' : ''}`}
                    placeholder="Nhập tiêu đề bài viết"
                  />
                  {errors.title && <span className="form-error">{errors.title}</span>}
                </div>
                <div className="form-group">
                  <label>URL *</label>
                  <input name="url" value={formData.url} onChange={handleChange} className={`form-input ${errors.url ? 'error' : ''}`} />
                  {errors.url && <span className="form-error">{errors.url}</span>}
                </div>
                <div className="form-group">
                  <label>Loại</label>
                  <input name="type" type="number" value={formData.type ?? 1} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group full-width">
                  <label>Tóm tắt</label>
                  <textarea name="summary" value={formData.summary || ''} onChange={handleChange} className="form-input textarea" rows="3" />
                </div>
                <div className="form-group full-width">
                  <label>Mô tả SEO</label>
                  <textarea name="description" value={formData.description || ''} onChange={handleChange} className="form-input textarea" rows="2" />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">Ảnh minh họa</h3>
              <ImageUpload
                label="Ảnh đại diện"
                value={formData.picture || ''}
                onChange={(url) => setFormData((prev) => ({ ...prev, picture: url }))}
              />
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>ALT ảnh đại diện</label>
                <input name="picture_alt" value={formData.picture_alt || ''} onChange={handleChange} className="form-input" />
              </div>
            </div>

            <div className="form-section" style={{ zIndex: 1 }}>
              <h3 className="form-section-title">Nội dung</h3>
              <RichTextEditor
                name="content"
                value={formData.content || ''}
                onChange={handleChange}
                placeholder="Soạn nội dung bài cẩm nang..."
              />
            </div>

            <div className="form-section">
              <h3 className="form-section-title">Danh mục và gợi ý khám</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Danh mục cẩm nang</label>
                  <select multiple value={selectedCategoryIds} onChange={handleCategoryChange} className="form-input" style={{ minHeight: 140 }}>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Giữ Ctrl/Cmd để chọn nhiều danh mục.</span>
                </div>
                <div className="form-group">
                  <label>Lý do khám</label>
                  <select name="reason" value={formData.reason || ''} onChange={handleChange} className="form-input">
                    <option value="">Không chọn</option>
                    {reasons.map((reason) => (
                      <option key={reason.id} value={reason.id}>{reason.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Gợi ý chuyên khoa</label>
                  <select name="suggest_specialist" value={formData.suggest_specialist || ''} onChange={handleChange} className="form-input">
                    <option value="">Không chọn</option>
                    {specialties.map((specialty) => (
                      <option key={specialty.id} value={specialty.id}>{specialty.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Gợi ý bác sĩ</label>
                  <select name="suggest_doctor" value={formData.suggest_doctor || ''} onChange={handleChange} className="form-input">
                    <option value="">Không chọn</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Thông điệp gợi ý</label>
                  <input name="suggest_content" value={formData.suggest_content || ''} onChange={handleChange} className="form-input" />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">Xuất bản và hiển thị</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select name="status" value={formData.status ?? 1} onChange={handleChange} className="form-input">
                    <option value={1}>Hiển thị</option>
                    <option value={0}>Ẩn</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Duyệt bài</label>
                  <select name="is_check" value={formData.is_check ?? 0} onChange={handleChange} className="form-input">
                    <option value={0}>Chưa duyệt</option>
                    <option value={1}>Đã duyệt</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Thời gian xuất bản</label>
                  <input name="published_time" type="datetime-local" value={formData.published_time || ''} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Bắt đầu xuất bản</label>
                  <input name="published_start" type="datetime-local" value={formData.published_start || ''} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Thứ hạng</label>
                  <input name="rank" type="number" value={formData.rank ?? 99} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Lượt xem</label>
                  <input name="views" type="number" value={formData.views ?? 0} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Hiện bài viết liên quan</label>
                  <select name="show_related_article" value={formData.show_related_article ?? 1} onChange={handleChange} className="form-input">
                    <option value={1}>Hiện</option>
                    <option value={0}>Ẩn</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Hiện danh mục</label>
                  <select name="show_list_category" value={formData.show_list_category ?? 1} onChange={handleChange} className="form-input">
                    <option value={1}>Hiện</option>
                    <option value={0}>Ẩn</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Hiện góp ý</label>
                  <select name="show_comment" value={formData.show_comment ?? 1} onChange={handleChange} className="form-input">
                    <option value={1}>Hiện</option>
                    <option value={0}>Ẩn</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Hiện số điện thoại</label>
                  <select name="show_phone" value={formData.show_phone ?? 0} onChange={handleChange} className="form-input">
                    <option value={1}>Hiện</option>
                    <option value={0}>Ẩn</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">Thông tin bổ sung</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Tác giả</label>
                  <input name="author" value={formData.author || ''} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Cố vấn</label>
                  <input name="advisor" value={formData.advisor || ''} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Người kiểm duyệt</label>
                  <input name="censor" value={formData.censor || ''} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Tag</label>
                  <input name="tag" value={formData.tag || ''} onChange={handleChange} className="form-input" placeholder="tim mạch, sức khỏe" />
                </div>
                <div className="form-group">
                  <label>Nội dung nút tùy chỉnh</label>
                  <input name="custom_button_text" value={formData.custom_button_text || ''} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Link nút tùy chỉnh</label>
                  <input name="custom_button_link" value={formData.custom_button_link || ''} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group full-width">
                  <label>Tài liệu tham khảo</label>
                  <textarea name="references" value={formData.references || ''} onChange={handleChange} className="form-input textarea" rows="3" />
                </div>
                <div className="form-group full-width">
                  <label>Metadata</label>
                  <textarea name="metadata" value={formData.metadata || ''} onChange={handleChange} className="form-input textarea" rows="3" />
                </div>
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: '2rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/blog-public/admin')}>Hủy bỏ</button>
              <button type="submit" className="btn btn-primary" disabled={submitted}>
                {submitted ? 'Đang xử lý...' : (isEdit ? 'Cập nhật bài cẩm nang' : 'Thêm bài cẩm nang')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
