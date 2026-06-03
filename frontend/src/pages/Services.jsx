import { useState, useEffect } from 'react'
import { Search, Plus, Edit2, Trash2, Eye, Filter } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../layouts/AdminLayout'
import { getServices, deleteService, updateService } from '../api/service.api'
import Pagination from '../components/Pagination'

export default function Services() {
    const navigate = useNavigate()
    const [services, setServices] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [showSearch, setShowSearch] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const limit = 20

    const fetchServices = async (page = 1) => {
        setIsLoading(true);
        try {
            const res = await getServices({ page, limit, keyword: searchTerm, status: filterStatus });
            if (res && res.data) {
                setServices(res.data);
                if (res.pagination) setTotalPages(res.pagination.totalPages);
            }
        } catch (error) {
            console.error('Failed to fetch services:', error);
            alert('Lỗi tải danh sách dịch vụ');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchServices(1);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(debounce);
    }, [searchTerm, filterStatus]);

    useEffect(() => {
        if (searchTerm === '') fetchServices(currentPage);
    }, [currentPage]);

    const handleDelete = async (id) => {
        if (window.confirm('Bạn chắc chắn muốn xóa dịch vụ này?\n(Các chuyên khoa thuộc dịch vụ này sẽ bị tách khỏi dịch vụ, không bị xóa)')) {
            try {
                await deleteService(id);
                fetchServices(currentPage);
            } catch (error) {
                console.error(error);
                alert('Có lỗi xảy ra khi xóa!');
            }
        }
    }

    const handleToggleStatus = async (item) => {
        try {
            const newStatus = item.status === 1 ? 0 : 1;
            await updateService(item.id, { status: newStatus });
            setServices(services.map(s => s.id === item.id ? { ...s, status: newStatus } : s));
        } catch (error) {
            console.error(error);
            alert('Lỗi khi cập nhật trạng thái');
        }
    }

    return (
        <AdminLayout pageTitle="Quản lý Dịch vụ">
            <div className="management-header">
                <div style={{ flex: 1 }}></div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-secondary" onClick={() => setShowSearch(!showSearch)} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Filter size={18} /> Bộ lọc
                    </button>
                    <button className="btn-primary" onClick={() => navigate('/services/admin/add')}>
                        <Plus size={20} />
                        Thêm dịch vụ
                    </button>
                </div>
            </div>

            <div className={`filter-section ${showSearch ? 'show' : ''}`}>
                <div className="filter-container">
                    
          <select 
            className="form-input" 
            style={{ width: '180px', margin: 0 }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="1">Đang hoạt động</option>
            <option value="0">Ngưng hoạt động</option>
          </select>

          <div className="search-box" style={{ margin: 0, flex: 1, minWidth: '250px' }}>
                        <Search size={20} />
                        <input
                            type="text"
                            placeholder="Tìm dịch vụ..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="management-section">
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải...</div>
                ) : services.length > 0 ? (
                    <>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="specialties-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '80px' }}>ID</th>
                                        <th style={{ width: '90px' }}>Ảnh</th>
                                        <th>Tên dịch vụ</th>
                                        <th style={{ width: '110px', textAlign: 'center' }}>Thứ tự</th>
                                        <th style={{ width: '130px', textAlign: 'center' }}>Trạng thái</th>
                                        <th style={{ width: '160px', textAlign: 'center' }}>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {services.map((item) => (
                                        <tr key={item.id} className="specialty-row">
                                            <td style={{ fontWeight: '500' }}>{item.id}</td>
                                            <td>
                                                {item.image ? (
                                                    <img
                                                        src={item.image}
                                                        alt=""
                                                        style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 4 }}
                                                    />
                                                ) : (
                                                    <div style={{ width: 56, height: 40, background: '#f1f5f9', borderRadius: 4 }} />
                                                )}
                                            </td>
                                            <td className="name-cell">
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                    <span className="specialty-title" style={{ fontWeight: 600 }}>{item.name}</span>
                                                    {item.description && (
                                                        <span style={{ fontSize: 12, color: '#64748b' }}>{item.description}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>{item.rank}</td>
                                            <td className="status-cell">
                                                <span
                                                    onClick={() => handleToggleStatus(item)}
                                                    style={{ cursor: 'pointer' }}
                                                    className={`status-badge ${item.status === 1 ? 'active' : 'inactive'}`}
                                                >
                                                    {item.status === 1 ? 'Hoạt động' : 'Vô hiệu'}
                                                </span>
                                            </td>
                                            <td className="action-cell">
                                                <div className="action-buttons">
                                                    <button
                                                        className="btn-icon"
                                                        onClick={() => navigate(`/services/admin/edit/${item.id}`)}
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        className="btn-action edit"
                                                        onClick={() => navigate(`/services/admin/edit/${item.id}`)}
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        className="btn-action delete"
                                                        onClick={() => handleDelete(item.id)}
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
                        <p>Không tìm thấy dịch vụ nào</p>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
