import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import AdminLayout from '../layouts/AdminLayout'
import RichTextEditor from '../components/RichTextEditor'
import { updateSpecialty, getSpecialtyById } from '../api/specialty.api'

export default function EditSpecialty() {
    const navigate = useNavigate()
    const { id } = useParams()
    const [formData, setFormData] = useState({
        name: '',
        url: '',
        title: '',
        keyword: '',
        description: '',
        content: '',
        picture: '',
        parent_id: 0,
        status: 1,
        type: 1,
        rank: 0,
    })
    const [errors, setErrors] = useState({})
    const [submitted, setSubmitted] = useState(false)
    const [imagePreview, setImagePreview] = useState(null)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (id) {
            const loadData = async () => {
                setIsLoading(true);
                try {
                    const res = await getSpecialtyById(id);
                    if (res && res.data) {
                        setFormData(res.data);
                    }
                } catch (e) {
                    console.error(e);
                    alert('Lỗi tải dữ liệu chuyên khoa');
                } finally {
                    setIsLoading(false);
                }
            };
            loadData();
        }
    }, [id]);

    const generateSlug = (text) => {
        if (!text) return '';
        return text.toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') 
            .replace(/đ/g, 'd').replace(/Đ/g, 'D')
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') 
            .trim()
            .replace(/\s+/g, '-') 
            .replace(/-+/g, '-'); 
    };

    const validateForm = () => {
        const newErrors = {}
        if (!formData.name.trim()) newErrors.name = 'Tên chuyên khoa không được để trống'
        return newErrors
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => {
            const updated = { ...prev, [name]: value };
            if (name === 'name') {
                updated.url = generateSlug(value);
                updated.title = value;
            }
            return updated;
        })
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }))
        }
    }

    const handleImageChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setImagePreview(URL.createObjectURL(file));
        setFormData(prev => ({
          ...prev,
          picture: `assets/images/${file.name}`
        }));
      }
    };

    const handleSubmit = async (e) => {
        e.preventDefault()
        const newErrors = validateForm()
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }
        setSubmitted(true)
        try {
            const payload = { ...formData };
            payload.parent_id = parseInt(payload.parent_id, 10) || 0;
            payload.status = parseInt(payload.status, 10);
            payload.type = parseInt(payload.type, 10);
            payload.rank = parseInt(payload.rank, 10) || 0;

            await updateSpecialty(id, payload);
            alert('Cập nhật chuyên khoa thành công!');
            navigate('/specialisies/admin');
        } catch (error) {
            console.error('Error:', error);
            alert('Có lỗi xảy ra khi lưu chuyên khoa');
        } finally {
            setSubmitted(false);
        }
    }

    if (isLoading) return <AdminLayout pageTitle="Chỉnh sửa Chuyên Khoa"><div style={{padding:'2rem'}}>Đang tải...</div></AdminLayout>;

    return (
        <AdminLayout pageTitle="Quản lý Chuyên Khoa">
            <div className="form-page-container">
                <div className="form-page-header">
                    <button className="btn-back" onClick={() => navigate('/specialisies/admin')}>
                        <ArrowLeft size={20} />
                        Quay lại
                    </button>
                    <h1 className="form-page-title">Sửa Chuyên Khoa</h1>
                </div>

                <div className="form-page-content">
                    <form onSubmit={handleSubmit} className="form-page-form">
                        
                        {/* ── Thông tin chính ── */}
                        <div className="form-section">
                            <h3 className="form-section-title">Thông tin chính</h3>
                            <div className="form-grid">
                                
                                <div className="form-group full-width">
                                    <label>Tên chuyên khoa (name) *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Ví dụ: Tim Mạch, Nhi Khoa"
                                        className={`form-input ${errors.name ? 'error' : ''}`}
                                    />
                                    {errors.name && <span className="form-error">{errors.name}</span>}
                                </div>

                                <div className="form-group full-width">
                                    <label>Mô tả ngắn (description)</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Khám và điều trị..."
                                        className="form-input textarea" rows="2"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Đường dẫn URL (url)</label>
                                    <input
                                        type="text"
                                        name="url"
                                        value={formData.url}
                                        onChange={handleChange}
                                        placeholder="tim-mach"
                                        className="form-input"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Thứ tự hiển thị (rank)</label>
                                    <input
                                        type="number"
                                        name="rank"
                                        value={formData.rank}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className="form-input"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Trạng thái (status)</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="form-input"
                                    >
                                        <option value={1}>Hoạt động</option>
                                        <option value={0}>Vô hiệu</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Loại (type)</label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        className="form-input"
                                    >
                                        <option value={1}>Thường</option>
                                        <option value={2}>Đặc biệt</option>
                                    </select>
                                </div>
                                
                            </div>
                        </div>

                        {/* ── Ảnh đại diện ── */}
                        <div className="form-section">
                            <h3 className="form-section-title">Hình ảnh</h3>
                            <div className="form-group full-width">
                                <label>Ảnh (picture) - Tạm thời lưu dạng nội bộ</label>
                                <input type="file" accept="image/*" onChange={handleImageChange} className="form-input" style={{ padding: '0.5rem' }} />
                                {imagePreview && (
                                    <div style={{ marginTop: '10px' }}>
                                        <img src={imagePreview} alt="Preview" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                    </div>
                                )}
                                {formData.picture && !imagePreview && (
                                    <p style={{ marginTop: '8px', fontSize: '13px', color: '#64748b' }}>Đường dẫn: {formData.picture}</p>
                                )}
                            </div>
                        </div>

                        {/* ── Bài viết / Nội dung ── */}
                        <div className="form-section" style={{ zIndex: 1 }}>
                            <h3 className="form-section-title">Nội dung chi tiết (content)</h3>
                            <div className="form-group full-width">
                                <RichTextEditor
                                    name="content"
                                    value={formData.content}
                                    onChange={handleChange}
                                    placeholder="Điểm mạnh, Đội ngũ, Trang thiết bị của chuyên khoa..."
                                />
                            </div>
                        </div>

                        {/* ── SEO / Mở rộng ── */}
                        <div className="form-section">
                            <h3 className="form-section-title">SEO & Khác</h3>
                            <div className="form-grid">
                            
                                <div className="form-group full-width">
                                    <label>Tiêu đề Trang SEO (title)</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="Chuyên khoa Tim mạch..."
                                        className="form-input"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label>Từ khóa SEO (keyword)</label>
                                    <input
                                        type="text"
                                        name="keyword"
                                        value={formData.keyword}
                                        onChange={handleChange}
                                        placeholder="tim mach, kham tim..."
                                        className="form-input"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label>Mục cha ID (parent_id)</label>
                                    <input
                                        type="number"
                                        name="parent_id"
                                        value={formData.parent_id}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className="form-input"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ── Hành động ── */}
                        <div className="form-actions" style={{ marginTop: '2rem' }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => navigate('/specialisies/admin')}
                            >
                                Hủy bỏ
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={submitted}>
                                {submitted ? 'Đang xử lý...' : 'Cập nhật chuyên khoa'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    )
}
