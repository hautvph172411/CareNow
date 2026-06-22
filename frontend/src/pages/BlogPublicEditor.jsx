import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import ImageUpload from '../components/ImageUpload';
import RichTextEditor from '../components/RichTextEditor';
import Select from 'react-select';
import { getBlogCategories } from '../api/blogCategory.api';
import { createBlogPublic, getBlogPublicById, updateBlogPublic } from '../api/blogPublic.api';
import { getClinicReasons } from '../api/clinicReason.api';
import { getClinics } from '../api/clinic.api';
import { getSpecialties } from '../api/specialty.api';
import { slugifyVi } from '../utils/slugify';

const defaultBlogUi = () => ({
  amp: 0,
  displayFormat: 1,
  locations: { province: '', district: '', place: '' },
  pictureInPost: 1,
  showSupport: 1,
  messageMode: 1,
});

const parseMetadataFromDb = (raw) => {
  const base = { blogUi: defaultBlogUi(), freeform: '' };
  if (!raw || !String(raw).trim()) return base;
  try {
    const j = JSON.parse(raw);
    if (j && typeof j === 'object' && !Array.isArray(j)) {
      return {
        freeform: typeof j.freeform === 'string' ? j.freeform : '',
        blogUi: {
          ...base.blogUi,
          ...(j.blogUi || {}),
          locations: {
            ...base.blogUi.locations,
            ...(j.blogUi?.locations || {}),
          },
        },
      };
    }
  } catch {
    /* legacy plain text */
  }
  return { ...base, freeform: String(raw) };
};

const stringifyMetadataPack = (pack) =>
  JSON.stringify({
    blogUi: pack.blogUi,
    freeform: pack.freeform || '',
  });

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
const dateTimeToEpoch = (value) => (value ? Math.floor(new Date(value).getTime() / 1000) : '');

function SidebarRadios({ groupName, label, value, onChange, options }) {
  return (
    <div className="blog-sidebar-field">
      <span className="blog-sidebar-label">{label}</span>
      <div className="blog-radio-group" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <label key={String(o.value)} className="blog-radio-option">
            <input
              type="radio"
              name={groupName}
              checked={Number(value) === Number(o.value)}
              onChange={() => onChange(Number(o.value))}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function BlogPublicEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [formData, setFormData] = useState(emptyForm);
  const [metaPack, setMetaPack] = useState(() => ({
    blogUi: defaultBlogUi(),
    freeform: '',
  }));
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
        const parsedMeta = parseMetadataFromDb(res.data.metadata);
        let messageMode = parsedMeta.blogUi.messageMode;
        if (messageMode === undefined || messageMode === null) {
          messageMode = Number(res.data.show_comment) === 0 ? 0 : 1;
        }
        setMetaPack({
          ...parsedMeta,
          blogUi: { ...parsedMeta.blogUi, messageMode },
        });
        setFormData({
          ...emptyForm,
          ...res.data,
          published_time: epochToDateTime(res.data.published_time),
          published_start: epochToDateTime(res.data.published_start),
          reason: res.data.reason || '',
          suggest_specialist: res.data.suggest_specialist || '',
          suggest_doctor: res.data.suggest_doctor || '',
          next_post: res.data.next_post || '',
          metadata: stringifyMetadataPack({
            blogUi: { ...parsedMeta.blogUi, messageMode },
            freeform: parsedMeta.freeform,
          }),
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

  const reasonOptions = useMemo(() => reasons.map(r => ({ value: String(r.id), label: r.name })), [reasons]);
  const selectedReasonOption = useMemo(() => reasonOptions.find(opt => opt.value === String(formData.reason)) || null, [reasonOptions, formData.reason]);

  const handleReasonSelectChange = (selected) => {
    setFormData((prev) => ({ ...prev, reason: selected ? selected.value : '' }));
  };

  const setBlogUi = (patch) => {
    setMetaPack((prev) => ({
      ...prev,
      blogUi: { ...prev.blogUi, ...patch },
    }));
  };

  const setLocation = (key, value) => {
    setMetaPack((prev) => ({
      ...prev,
      blogUi: {
        ...prev.blogUi,
        locations: { ...prev.blogUi.locations, [key]: value },
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Tiêu đề bài viết không được để trống';
    if (!formData.url.trim()) newErrors.url = 'URL bài viết không được để trống';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      alert("Vui lòng kiểm tra lại các thông tin bắt buộc!");
      return;
    }

    const messageMode = Number(metaPack.blogUi.messageMode ?? 1);
    const show_comment = messageMode === 0 ? 0 : 1;

    const payloadMetadata = stringifyMetadataPack(metaPack);

    setSubmitted(true);
    try {
      const payload = {
        ...formData,
        published_time: dateTimeToEpoch(formData.published_time),
        published_start: dateTimeToEpoch(formData.published_start),
        show_comment,
        metadata: payloadMetadata,
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

  const ui = metaPack.blogUi;

  return (
    <AdminLayout pageTitle="Bài cẩm nang">
      <div className="form-page-container blog-editor-page">
        <div className="form-page-header">
          <button type="button" className="btn-back" onClick={() => navigate('/blog-public/admin')}>
            <ArrowLeft size={20} />
            Quay lại
          </button>
          <h1 className="form-page-title">{isEdit ? 'Sửa bài cẩm nang' : 'Thêm bài cẩm nang'}</h1>
        </div>

        <div className="form-page-content blog-editor-content-outer">
          <form onSubmit={handleSubmit} className="blog-editor-form">
            <div className="blog-editor-split">
              <div className="blog-editor-main">
                <div className="form-group">
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

                <div className="form-group blog-editor-rich-wrap">
                  <label>Nội dung</label>
                  <RichTextEditor
                    name="content"
                    value={formData.content || ''}
                    onChange={handleChange}
                    placeholder="Soạn nội dung bài cẩm nang..."
                    height={520}
                  />
                </div>
              </div>

              <aside className="blog-editor-sidebar" aria-label="Thiết lập bài viết">
                <div className="blog-sidebar-section">
                  <h3 className="blog-sidebar-section-title">Đường dẫn & SEO</h3>
                  <div className="form-group">
                    <label>URL *</label>
                    <input
                      name="url"
                      value={formData.url}
                      onChange={handleChange}
                      className={`form-input ${errors.url ? 'error' : ''}`}
                    />
                    {errors.url && <span className="form-error">{errors.url}</span>}
                  </div>
                  <div className="form-group">
                    <label>Tóm tắt</label>
                    <textarea
                      name="summary"
                      value={formData.summary || ''}
                      onChange={handleChange}
                      className="form-input textarea"
                      rows={3}
                    />
                  </div>
                  <div className="form-group">
                    <label>Mô tả SEO</label>
                    <textarea
                      name="description"
                      value={formData.description || ''}
                      onChange={handleChange}
                      className="form-input textarea"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="blog-sidebar-section">
                  <h3 className="blog-sidebar-section-title">Hiển thị & định dạng</h3>
                  <SidebarRadios
                    groupName="blog_amp"
                    label="AMP"
                    value={ui.amp}
                    onChange={(v) => setBlogUi({ amp: v })}
                    options={[
                      { value: 1, label: 'Bật' },
                      { value: 0, label: 'Tắt' },
                    ]}
                  />
                  <SidebarRadios
                    groupName="blog_display_format"
                    label="Dạng hiển thị"
                    value={ui.displayFormat}
                    onChange={(v) => setBlogUi({ displayFormat: v })}
                    options={[
                      { value: 1, label: 'Cũ' },
                      { value: 2, label: 'Mới' },
                      { value: 3, label: 'Được tài trợ' },
                    ]}
                  />
                  <SidebarRadios
                    groupName="blog_post_type"
                    label="Loại bài"
                    value={formData.type ?? 1}
                    onChange={(v) => setFormData((prev) => ({ ...prev, type: v }))}
                    options={[
                      { value: 1, label: 'Dành cho bệnh nhân' },
                      { value: 2, label: 'Dành cho bác sĩ' },
                      { value: 3, label: 'Sống khỏe' },
                      { value: 4, label: 'Hỏi đáp' },
                    ]}
                  />
                  <SidebarRadios
                    groupName="blog_is_check"
                    label="Chuyên môn"
                    value={formData.is_check ?? 0}
                    onChange={(v) => setFormData((prev) => ({ ...prev, is_check: v }))}
                    options={[
                      { value: 2, label: 'Không duyệt' },
                      { value: 1, label: 'Đã duyệt' },
                      { value: 0, label: 'Chưa duyệt' },
                    ]}
                  />
                  <SidebarRadios
                    groupName="blog_message_mode"
                    label="Hiện tin nhắn"
                    value={ui.messageMode ?? 1}
                    onChange={(v) => setBlogUi({ messageMode: v })}
                    options={[
                      { value: 1, label: 'Chỉ TN' },
                      { value: 2, label: 'TN & đặt nhanh' },
                      { value: 0, label: 'Ẩn' },
                    ]}
                  />
                  <SidebarRadios
                    groupName="blog_show_phone"
                    label="Hiện số điện thoại"
                    value={formData.show_phone ?? 0}
                    onChange={(v) => setFormData((prev) => ({ ...prev, show_phone: v }))}
                    options={[
                      { value: 1, label: 'Hiện' },
                      { value: 0, label: 'Ẩn' },
                    ]}
                  />
                  <SidebarRadios
                    groupName="blog_show_support"
                    label="Hiện thông tin hỗ trợ"
                    value={ui.showSupport ?? 1}
                    onChange={(v) => setBlogUi({ showSupport: v })}
                    options={[
                      { value: 1, label: 'Hiện' },
                      { value: 0, label: 'Ẩn' },
                    ]}
                  />
                  <div className="form-group">
                    <label>Trạng thái</label>
                    <select name="status" value={formData.status ?? 1} onChange={handleChange} className="form-input">
                      <option value={1}>Hiển thị</option>
                      <option value={0}>Không hiển thị</option>
                    </select>
                  </div>
                </div>

                <div className="blog-sidebar-section">
                  <h3 className="blog-sidebar-section-title">Vị trí (tuỳ chọn)</h3>
                  <div className="form-group">
                    <label>Vị trí tỉnh thành</label>
                    <input
                      className="form-input"
                      value={ui.locations?.province || ''}
                      onChange={(e) => setLocation('province', e.target.value)}
                      placeholder="Tỉnh / Thành phố"
                    />
                  </div>
                  <div className="form-group">
                    <label>Vị trí quận huyện</label>
                    <input
                      className="form-input"
                      value={ui.locations?.district || ''}
                      onChange={(e) => setLocation('district', e.target.value)}
                      placeholder="Quận / Huyện"
                    />
                  </div>
                  <div className="form-group">
                    <label>Vị trí</label>
                    <input
                      className="form-input"
                      value={ui.locations?.place || ''}
                      onChange={(e) => setLocation('place', e.target.value)}
                      placeholder="Địa chỉ chi tiết"
                    />
                  </div>
                </div>

                <div className="blog-sidebar-section">
                  <h3 className="blog-sidebar-section-title">Ảnh đại diện</h3>
                  <ImageUpload
                    label=""
                    value={formData.picture || ''}
                    onChange={(url) => setFormData((prev) => ({ ...prev, picture: url }))}
                  />
                  <div className="form-group">
                    <label>ALT ảnh</label>
                    <input name="picture_alt" value={formData.picture_alt || ''} onChange={handleChange} className="form-input" />
                  </div>
                  <SidebarRadios
                    groupName="blog_picture_in_post"
                    label="Ảnh trong bài"
                    value={ui.pictureInPost ?? 1}
                    onChange={(v) => setBlogUi({ pictureInPost: v })}
                    options={[
                      { value: 1, label: 'Hiện trong bài' },
                      { value: 0, label: 'Không hiện' },
                    ]}
                  />
                </div>

                <div className="blog-sidebar-section">
                  <h3 className="blog-sidebar-section-title">Danh mục & gợi ý khám</h3>
                  <div className="form-group">
                    <label>Danh mục cẩm nang</label>
                    <select
                      multiple
                      value={selectedCategoryIds}
                      onChange={handleCategoryChange}
                      className="form-input blog-sidebar-multiselect"
                      size={6}
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                    <span className="blog-sidebar-hint">Giữ Ctrl/Cmd để chọn nhiều danh mục.</span>
                  </div>
                  <div className="form-group">
                    <label>Lý do khám</label>
                    <Select
                      options={reasonOptions}
                      value={selectedReasonOption}
                      onChange={handleReasonSelectChange}
                      isClearable
                      placeholder="Tìm và chọn lý do khám..."
                      className="react-select-container"
                      classNamePrefix="react-select"
                    />
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

                <div className="blog-sidebar-section">
                  <h3 className="blog-sidebar-section-title">Xuất bản</h3>
                  <div className="form-group">
                    <label>Thời gian xuất bản</label>
                    <input name="published_time" type="datetime-local" value={formData.published_time || ''} onChange={handleChange} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label>Bắt đầu xuất bản</label>
                    <input name="published_start" type="datetime-local" value={formData.published_start || ''} onChange={handleChange} className="form-input" />
                  </div>
                  <div className="blog-sidebar-grid">
                    <div className="form-group">
                      <label>Thứ hạng</label>
                      <input name="rank" type="number" value={formData.rank ?? 99} onChange={handleChange} className="form-input" />
                    </div>
                    <div className="form-group">
                      <label>Lượt xem</label>
                      <input name="views" type="number" value={formData.views ?? 0} onChange={handleChange} className="form-input" />
                    </div>
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
                </div>

                <div className="blog-sidebar-section">
                  <h3 className="blog-sidebar-section-title">Thông tin bổ sung</h3>
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
                  <div className="form-group">
                    <label>Tài liệu tham khảo</label>
                    <textarea name="references" value={formData.references || ''} onChange={handleChange} className="form-input textarea" rows={3} />
                  </div>
                  <div className="form-group">
                    <label>Ghi chú / metadata tự do</label>
                    <textarea
                      value={metaPack.freeform}
                      onChange={(e) => setMetaPack((prev) => ({ ...prev, freeform: e.target.value }))}
                      className="form-input textarea"
                      rows={3}
                      placeholder="Lưu kèm trong JSON metadata (freeform)"
                    />
                  </div>
                </div>

                <div className="blog-sidebar-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => navigate('/blog-public/admin')}>
                    Hủy bỏ
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitted}>
                    {submitted ? 'Đang xử lý...' : isEdit ? 'Cập nhật bài cẩm nang' : 'Thêm bài cẩm nang'}
                  </button>
                </div>
              </aside>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
