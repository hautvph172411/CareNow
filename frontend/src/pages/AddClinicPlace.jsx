import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Phone, MapPin, Image as ImageIcon, Link as LinkIcon, Settings, Info } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { createClinicPlace, getClinicPlaceParentOptions } from '../api/clinic_place.api';
import { getPartners } from '../api/partner.api';
import { getProvinces, getDistrictsByProvince } from '../api/location.api';
import RichTextEditor from '../components/RichTextEditor';
import SearchableSelect from '../components/SearchableSelect';
import { PLACE_KIND_LABELS, PLACE_KIND_RULE_LINES, showParentField, resolveParentIdForSubmit, parentFieldLabel } from '../utils/clinicPlaceHierarchy';
import { slugifyVi } from '../utils/slugify';
import { mkContentBlock, serializeContentBlocks } from '../utils/clinicPlacePageContent';
import '../styles/ClinicPlaceForm.css';

const emptyForm = () => ({
  name: '',
  short_name: '',
  display_name: '',
  province_id: '',
  district_id: '',
  address: '',
  phone: '',
  status: 1,
  partner_id: '',
  place_kind: 3,
  parent_id: '',
  show_children: false,
  admin_note: '',
  has_insurance: false,
  patient_guide: '',
  address_guide: '',
  images: '',
  title: '',
  description: '',
  url: '',
  description_detail: '',
  logo: '',
  page_type: 0,
  rank: '',
  order: 99,
  custom_button_text: '',
  custom_button_link: '',
  metadata: '',
  self_supported: 0,
});

export default function AddClinicPlace() {
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [imagesPreviews, setImagesPreviews] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [partners, setPartners] = useState([]);
  const [parentOptions, setParentOptions] = useState([]);
  const [contentBlocks, setContentBlocks] = useState(() => [mkContentBlock()]);
  const [formData, setFormData] = useState(emptyForm);
  const urlAutoRef = useRef(true);

  useEffect(() => {
    (async () => {
      try {
        const [provs, pRes] = await Promise.all([getProvinces(), getPartners({ status: 1, limit: 500, page: 1 })]);
        setProvinces(provs.map((p) => ({ value: String(p.id), label: p.name })));
        if (pRes.success) {
          setPartners(pRes.data.map((p) => ({ value: p.id, label: p.name })));
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  useEffect(() => {
    if (!formData.province_id) {
      setDistricts([]);
      return;
    }
    (async () => {
      try {
        const data = await getDistrictsByProvince(formData.province_id);
        setDistricts(data.map((d) => ({ value: String(d.id), label: d.name })));
      } catch (e) {
        console.error(e);
      }
    })();
  }, [formData.province_id]);

  useEffect(() => {
    let cancelled = false;
    const pid = formData.partner_id;
    const pk = formData.place_kind;
    if (!pid || !showParentField(pk)) {
      setParentOptions([]);
      return;
    }
    (async () => {
      try {
        const res = await getClinicPlaceParentOptions({
          partner_id: pid,
          place_kind: pk,
        });
        if (cancelled || !res.success) return;
        setParentOptions(
          res.data.map((p) => ({
            value: p.id,
            label: `${p.display_name || p.name || p.short_name || `#${p.id}`} (${PLACE_KIND_LABELS[p.place_kind] ?? p.place_kind})`,
          })),
        );
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          setParentOptions([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [formData.partner_id, formData.place_kind]);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
      setFormData((prev) => ({ ...prev, logo: `/assets/images/${file.name}` }));
    }
  };

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setImagesPreviews(files.map((f) => URL.createObjectURL(f)));
    setFormData((prev) => ({
      ...prev,
      images: files.map((f) => `/assets/images/${f.name}`).join(','),
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleNameChange = (e) => {
    const nameVal = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name: nameVal,
      ...(urlAutoRef.current ? { url: slugifyVi(nameVal) } : {}),
    }));
    if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
  };

  const updateContentBlock = (blockId, field, value) => {
    setContentBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, [field]: value } : b)));
  };

  const addContentBlock = () => setContentBlocks((prev) => [...prev, mkContentBlock()]);

  const removeContentBlock = (blockId) => {
    setContentBlocks((prev) => (prev.length <= 1 ? prev : prev.filter((b) => b.id !== blockId)));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value, ...(name === 'province_id' ? { district_id: '' } : {}) }));
  };

  const handleEditorChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrors({ name: 'Tên là bắt buộc' });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        province_id: formData.province_id ? parseInt(formData.province_id, 10) : null,
        district_id: formData.district_id ? parseInt(formData.district_id, 10) : null,
        partner_id: formData.partner_id ? parseInt(formData.partner_id, 10) : null,
        place_kind: parseInt(formData.place_kind, 10) || 3,
        parent_id: resolveParentIdForSubmit(formData.place_kind, formData.parent_id),
        page_content_blocks: serializeContentBlocks(contentBlocks),
        info: null,
        status: parseInt(formData.status, 10),
        order: parseInt(formData.order, 10) || 99,
        rank: formData.rank === '' || formData.rank == null ? null : parseInt(formData.rank, 10),
        page_type: parseInt(formData.page_type, 10) || 0,
        self_supported: parseInt(formData.self_supported, 10) || 0,
        has_insurance: formData.has_insurance ? 1 : 0,
        show_children: formData.show_children ? 1 : 0,
        created_at: Math.floor(Date.now() / 1000),
      };

      await createClinicPlace(payload);
      alert('Thêm thành công!');
      navigate('/clinic-place/admin');
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout pageTitle="Thêm nơi khám">
      <div className="form-page-container">
        <div className="form-page-header">
          <button type="button" className="btn-back" onClick={() => navigate('/clinic-place/admin')}>
            <ChevronLeft size={20} /> Quay lại
          </button>
          <h1 className="form-page-title">Thêm nơi khám</h1>
        </div>

        <div className="form-page-content">
          <form onSubmit={handleSubmit} className="form-page-form">
            <div className="form-section">
              <h2 className="form-section-title">
                <Info size={18} /> Thông tin cơ bản
              </h2>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Tên cơ sở *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleNameChange} className={errors.name ? 'form-input error' : 'form-input'} />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label>Tên rút gọn</label>
                  <input type="text" name="short_name" value={formData.short_name || ''} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Tên hiển thị</label>
                  <input type="text" name="display_name" value={formData.display_name || ''} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Điện thoại</label>
                  <div className="input-with-icon">
                    <Phone size={16} />
                    <input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} className="form-input" />
                  </div>
                </div>
                <div className="form-group">
                  <label>URL (slug)</label>
                  <input
                    type="text"
                    name="url"
                    value={formData.url || ''}
                    onChange={(e) => {
                      urlAutoRef.current = false;
                      handleChange(e);
                    }}
                    className="form-input"
                  />
                  <span className="form-hint" style={{ display: 'block', color: '#64748b', fontSize: '0.8rem', marginTop: 4 }}>
                    Gợi ý từ tên khi bạn gõ; nếu bạn sửa slug tay thì không còn đồng bộ theo tên.
                  </span>
                </div>
                <div className="form-group">
                  <label>Đối tác (xuất bản / hoạt động)</label>
                  <SearchableSelect
                    options={partners}
                    value={formData.partner_id}
                    onChange={(val) => setFormData((p) => ({ ...p, partner_id: val, parent_id: '' }))}
                    placeholder="Chọn đối tác..."
                  />
                </div>
                <div className="form-group">
                  <label>Loại cơ sở</label>
                  <select
                    name="place_kind"
                    className="form-input"
                    value={formData.place_kind}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      setFormData((p) => ({ ...p, place_kind: v, parent_id: '' }));
                    }}
                  >
                    {Object.entries(PLACE_KIND_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <ul className="place-kind-rules">
                    {PLACE_KIND_RULE_LINES.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
                {showParentField(formData.place_kind) ? (
                  <div className="form-group full-width">
                    <label>{parentFieldLabel(formData.place_kind)}</label>
                    <SearchableSelect
                      options={parentOptions}
                      value={formData.parent_id}
                      onChange={(val) => setFormData((p) => ({ ...p, parent_id: val }))}
                      placeholder={formData.partner_id ? 'Chọn trong danh sách (đã lọc theo loại cha)' : 'Chọn đối tác trước'}
                      disabled={!formData.partner_id}
                    />
                  </div>
                ) : null}
                <div className="form-group full-width">
                  <label>Mô tả ngắn</label>
                  <textarea name="description" value={formData.description || ''} onChange={handleChange} className="form-input" rows={2} />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2 className="form-section-title">
                <MapPin size={18} /> Địa chỉ
              </h2>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Địa chỉ</label>
                  <input type="text" name="address" value={formData.address || ''} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Tỉnh / Thành</label>
                  <SearchableSelect options={provinces} value={formData.province_id} onChange={(v) => handleSelectChange('province_id', v)} placeholder="Chọn" />
                </div>
                <div className="form-group">
                  <label>Quận / Huyện</label>
                  <SearchableSelect options={districts} value={formData.district_id} onChange={(v) => handleSelectChange('district_id', v)} placeholder="Chọn" disabled={!formData.province_id} />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2 className="form-section-title">
                <ImageIcon size={18} /> Hình ảnh
              </h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Logo</label>
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="form-input" />
                  {logoPreview && (
                    <div className="image-preview-container" style={{ marginTop: 10 }}>
                      <img src={logoPreview} alt="Logo" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8 }} />
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Ảnh mô tả (nhiều)</label>
                  <input type="file" accept="image/*" multiple onChange={handleImagesChange} className="form-input" />
                  <div className="images-preview-grid" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {imagesPreviews.map((u, i) => (
                      <img key={i} src={u} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2 className="form-section-title">Nội dung trên trang Cơ sở y tế</h2>
              <p className="form-hint" style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Thêm một hoặc nhiều khối, mỗi khối có tiêu đề và nội dung HTML.
              </p>
              <div className="clinic-place-page-content-blocks">
                {contentBlocks.map((block) => (
                  <div key={block.id} className="clinic-place-content-block">
                    <input
                      type="text"
                      className="form-input clinic-place-content-block__title"
                      placeholder="Tiêu đề"
                      value={block.title}
                      onChange={(e) => updateContentBlock(block.id, 'title', e.target.value)}
                    />
                    <RichTextEditor
                      key={`${block.id}-body`}
                      name={`${block.id}-body`}
                      value={block.body}
                      onChange={(e) => updateContentBlock(block.id, 'body', e.target.value)}
                    />
                    {contentBlocks.length > 1 ? (
                      <div className="clinic-place-content-block__actions">
                        <button type="button" className="btn-text-danger" onClick={() => removeContentBlock(block.id)}>
                          Xóa
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
              <button type="button" className="btn-outline clinic-place-content-block__add" onClick={addContentBlock}>
                + Thêm khối nội dung
              </button>
              <div className="form-group full-width" style={{ marginTop: '1.5rem' }}>
                <label>Chi tiết (description_detail)</label>
                <RichTextEditor name="description_detail" value={formData.description_detail || ''} onChange={handleEditorChange} />
              </div>
              <div className="form-group full-width" style={{ marginTop: '1.5rem' }}>
                <label>Hướng dẫn bệnh nhân</label>
                <RichTextEditor name="patient_guide" value={formData.patient_guide || ''} onChange={handleEditorChange} />
              </div>
              <div className="form-group full-width" style={{ marginTop: '1.5rem' }}>
                <label>Hướng dẫn đường đi</label>
                <RichTextEditor name="address_guide" value={formData.address_guide || ''} onChange={handleEditorChange} />
              </div>
            </div>

            <div className="form-section">
              <h2 className="form-section-title">
                <Settings size={18} /> SEO &amp; cấu hình
              </h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Tiêu đề SEO</label>
                  <input type="text" name="title" value={formData.title || ''} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Thứ tự (order)</label>
                  <input type="number" name="order" value={formData.order} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Rank</label>
                  <input type="number" name="rank" value={formData.rank} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Page type</label>
                  <input type="number" name="page_type" value={formData.page_type} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Self supported</label>
                  <input type="number" name="self_supported" value={formData.self_supported} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="form-input">
                    <option value={1}>Hoạt động</option>
                    <option value={0}>Tạm dừng</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Ghi chú admin</label>
                  <textarea name="admin_note" value={formData.admin_note || ''} onChange={handleChange} className="form-input" rows={2} />
                </div>
                <div className="form-group full-width">
                  <label>Metadata</label>
                  <textarea name="metadata" value={formData.metadata || ''} onChange={handleChange} className="form-input" rows={2} />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2 className="form-section-title">
                <LinkIcon size={18} /> Tùy chọn
              </h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Text nút</label>
                  <input type="text" name="custom_button_text" value={formData.custom_button_text || ''} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Link nút</label>
                  <input type="text" name="custom_button_link" value={formData.custom_button_link || ''} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input type="checkbox" name="has_insurance" checked={!!formData.has_insurance} onChange={handleChange} />
                    <span>Có bảo hiểm</span>
                  </label>
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input type="checkbox" name="show_children" checked={!!formData.show_children} onChange={handleChange} />
                    <span>Hiển thị cơ sở con</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/clinic-place/admin')}>
                Hủy
              </button>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
