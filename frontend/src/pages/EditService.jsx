import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import AdminLayout from '../layouts/AdminLayout'
import RichTextEditor from '../components/RichTextEditor'
import ImageUpload from '../components/ImageUpload'
import { updateService, getServiceById } from '../api/service.api'

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

export default function EditService() {
    const navigate = useNavigate()
    const { id } = useParams()
    const [formData, setFormData] = useState({
        name: '',
        url: '',
        description: '',
        image: '',
        content: '',
        rank: 99,
        status: 1,
    })
    const [errors, setErrors] = useState({})
    const [submitted, setSubmitted] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (!id) return;
        (async () => {
            setIsLoading(true);
            try {
                const res = await getServiceById(id);
                if (res?.data) {
                    setFormData({
                        name: res.data.name || '',
                        url: res.data.url || '',
                        description: res.data.description || '',
                        image: res.data.image || '',
                        content: res.data.content || '',
                        rank: res.data.rank ?? 99,
                        status: res.data.status ?? 1,
                    });
                }
            } catch (e) {
                console.error(e);
                alert('Lỗi tải dữ liệu dịch vụ');
            } finally {
                setIsLoading(false);
            }
        })();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => {
            const updated = { ...prev, [name]: value };
            if (name === 'name') updated.url = generateSlug(value);
            return updated;
        })
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const newErrors = {}
        if (!formData.name.trim()) newErrors.name = 'Tên dịch vụ không được để trống'
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }
        setSubmitted(true)
        try {
            const payload = {
                ...formData,
                rank: parseInt(formData.rank, 10) || 99,
                status: parseInt(formData.status, 10),
            };
            await updateService(id, payload);
            alert('Cập nhật dịch vụ thành công!');
            navigate('/services/admin');
        } catch (error) {
            console.error('Error:', error);
            alert(error?.response?.data?.message || 'Có lỗi xảy ra khi lưu dịch vụ');
        } finally {
            setSubmitted(false);
        }
    }

    if (isLoading) {
        return (
            <AdminLayout pageTitle="Chỉnh sửa Dịch vụ">
                <div style={{ padding: '2rem' }}>Đang tải...</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout pageTitle="Quản lý Dịch vụ">
            <div className="form-page-container">
                <div className="form-page-header">
                    <button className="btn-back" onClick={() => navigate('/services/admin')}>
                        <ArrowLeft size={20} />
                        Quay lại
                    </button>
                    <h1 className="form-page-title">Sửa Dịch vụ</h1>
                </div>

                <div className="form-page-content">
                    <form onSubmit={handleSubmit} className="form-page-form">

                        <div className="form-section">
                            <h3 className="form-section-title">Thông tin chính</h3>
                            <div className="form-grid">

                                <div className="form-group full-width">
                                    <label>Tên dịch vụ (name) *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
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

                            </div>
                        </div>

                        <div className="form-section">
                            <h3 className="form-section-title">Hình ảnh</h3>
                            <div className="form-group full-width">
                                <ImageUpload
                                    label="Ảnh dịch vụ"
                                    value={formData.image}
                                    onChange={(url) => setFormData(prev => ({ ...prev, image: url }))}
                                />
                            </div>
                        </div>

                        <div className="form-section" style={{ zIndex: 1 }}>
                            <h3 className="form-section-title">Nội dung chi tiết (content)</h3>
                            <div className="form-group full-width">
                                <RichTextEditor
                                    name="content"
                                    value={formData.content}
                                    onChange={handleChange}
                                    placeholder="Mô tả chi tiết, ưu điểm, quy trình của dịch vụ..."
                                />
                            </div>
                        </div>

                        <div className="form-actions" style={{ marginTop: '2rem' }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => navigate('/services/admin')}
                            >
                                Hủy bỏ
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={submitted}>
                                {submitted ? 'Đang xử lý...' : 'Cập nhật dịch vụ'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    )
}
