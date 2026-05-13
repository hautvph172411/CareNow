import { useState, useEffect } from 'react'
import { Search, Plus, Edit2, Trash2, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../layouts/AdminLayout'
import { getSpecialties, deleteSpecialty, updateSpecialty } from '../api/specialty.api'
import { getServices } from '../api/service.api'
import Pagination from '../components/Pagination'

export default function Specialties() {
    const navigate = useNavigate()
    const [specialties, setSpecialties] = useState([])
    const [services, setServices] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [serviceFilter, setServiceFilter] = useState('')
    const [isLoading, setIsLoading] = useState(true)

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const limit = 20

    const fetchSpecialties = async (page = 1) => {
        setIsLoading(true);
        try {
            const params = { page, limit, keyword: searchTerm };
            if (serviceFilter !== '') params.service_id = serviceFilter;
            const res = await getSpecialties(params);
            if (res && res.data) {
                setSpecialties(res.data);
                if (res.pagination) {
                    setTotalPages(res.pagination.totalPages);
                }
            }
        } catch (error) {
            console.error('Failed to fetch specialties:', error);
            alert('Lỗi tải danh sách chuyên khoa');
        } finally {
            setIsLoading(false);
        }
    };

    // Load services 1 lần
    useEffect(() => {
        (async () => {
            try {
                const res = await getServices({ status: 1, limit: 200 });
                if (res?.data) setServices(res.data);
            } catch (e) {
                console.error('Lỗi tải danh sách dịch vụ', e);
            }
        })();
    }, []);

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchSpecialties(1);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(debounce);
    }, [searchTerm, serviceFilter]);

    useEffect(() => {
        if (searchTerm === '') {
            fetchSpecialties(currentPage);
        }
    }, [currentPage]);

    const handleSearch = (value) => {
        setSearchTerm(value)
    }

    const handleDelete = async (id) => {
        if (window.confirm('Bạn chắc chắn muốn xóa chuyên khoa này?')) {
            try {
                await deleteSpecialty(id);
                fetchSpecialties(currentPage);
            } catch (error) {
                console.error(error);
                alert('Có lỗi xảy ra khi xóa!');
            }
        }
    }

    const handleToggleStatus = async (item) => {
        try {
            const newStatus = item.status === 1 ? 0 : 1;
            await updateSpecialty(item.id, { status: newStatus });
            setSpecialties(specialties.map(s => s.id === item.id ? { ...s, status: newStatus } : s));
        } catch (error) {
            console.error(error);
            alert('Lỗi khi cập nhật trạng thái');
        }
    }

    return (
        <AdminLayout pageTitle="Quản lý Chuyên Khoa">
            <div className="management-header">
                <div className="search-box">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Tìm chuyên khoa..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>
                <select
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value)}
                    style={{
                        padding: '0.6rem 0.8rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: 6,
                        fontSize: 14,
                        background: '#fff',
                        minWidth: 200,
                    }}
                >
                    <option value="">Tất cả dịch vụ</option>
                    {services.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
                <button className="btn-primary" onClick={() => navigate('/specialties/admin/add')}>
                    <Plus size={20} />
                    Thêm chuyên khoa
                </button>
            </div>

            <div className="management-section">
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải...</div>
                ) : specialties.length > 0 ? (
                    <>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="specialties-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '8%' }}>ID</th>
                                        <th style={{ width: '40%' }}>Tên Chuyên Khoa</th>
                                        <th style={{ width: '22%' }}>Dịch vụ</th>
                                        <th style={{ width: '12%', textAlign: 'center' }}>Trạng Thái</th>
                                        <th style={{ width: '18%', textAlign: 'center' }}>Hành Động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {specialties.map((specialty) => (
                                        <tr key={specialty.id} className="specialty-row">
                                            <td style={{ fontWeight: '500' }}>{specialty.id}</td>
                                            <td className="name-cell">
                                                <span className="specialty-title" style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                                                    {specialty.name}
                                                </span>
                                            </td>
                                            <td>
                                                {specialty.service_name ? (
                                                    <span style={{
                                                        display: 'inline-block',
                                                        padding: '2px 8px',
                                                        background: '#eff6ff',
                                                        color: '#2563eb',
                                                        borderRadius: 4,
                                                        fontSize: 12,
                                                        fontWeight: 500,
                                                    }}>
                                                        {specialty.service_name}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>
                                                )}
                                            </td>
                                            <td className="status-cell">
                                                <span
                                                    onClick={() => handleToggleStatus(specialty)}
                                                    style={{ cursor: 'pointer' }}
                                                    className={`status-badge ${specialty.status === 1 ? 'active' : 'inactive'}`}
                                                >
                                                    {specialty.status === 1 ? 'Hoạt động' : 'Vô hiệu'}
                                                </span>
                                            </td>
                                            <td className="action-cell">
                                                <div className="action-buttons">
                                                    <button
                                                        className="btn-icon"
                                                        onClick={() => navigate(`/specialties/admin/edit/${specialty.id}`)}
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        className="btn-action edit"
                                                        onClick={() => navigate(`/specialties/admin/edit/${specialty.id}`)}
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        className="btn-action delete"
                                                        onClick={() => handleDelete(specialty.id)}
                                                        title="Xóa"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {totalPages > 1 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        )}
                    </>
                ) : (
                    <div className="empty-state">
                        <p>Không tìm thấy chuyên khoa nào</p>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}