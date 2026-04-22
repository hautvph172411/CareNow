import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit2, Trash2, Eye, MapPin, Phone } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { getClinicPlaces, deleteClinicPlace } from '../api/clinic_place.api';
import Pagination from '../components/Pagination';

export default function ClinicPlaceList() {
  const navigate = useNavigate();
  const [clinics, setClinics] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 20;

  const fetchClinics = async (page = 1, keyword = '') => {
    setIsLoading(true);
    try {
      const res = await getClinicPlaces({ page, limit: ITEMS_PER_PAGE, keyword });
      console.log('API Response:', res);
      if (res.success) {
        setClinics(res.data || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalItems(res.pagination.total || 0);
        }
      }
    } catch (error) {
      console.error('Failed to fetch clinics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce tìm kiếm
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchClinics(1, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Chuyển trang
  useEffect(() => {
    fetchClinics(currentPage, searchTerm);
  }, [currentPage]);

  const handleDelete = async (id) => {
    if (window.confirm('Bạn chắc chắn muốn xóa cơ sở y tế này? Hành động này không thể hoàn tác!')) {
      try {
        await deleteClinicPlace(id);
        setClinics(clinics.filter(c => c.id !== id));
        alert('Đã xóa cơ sở y tế thành công!');
      } catch (error) {
        console.error('Delete failed:', error);
        alert('Xóa thất bại. Vui lòng thử lại!');
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 1: return <span className="status-badge active">Hoạt động</span>;
      case 0: return <span className="status-badge inactive">Tạm dừng</span>;
      default: return <span className="status-badge">Không xác định</span>;
    }
  };

  return (
    <AdminLayout pageTitle="Quản lý cơ sở y tế">
      <div className="management-header">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, địa chỉ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/clinic-place/admin/add')}>
          <Plus size={20} />
          Thêm cơ sở y tế
        </button>
      </div>

      <div className="management-section">
        <div className="stats-summary" style={{ marginBottom: '1rem', color: '#6b7280' }}>
          Tổng số: <strong>{totalItems}</strong> cơ sở y tế
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải...</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="specialties-table">
                <thead>
                  <tr>
                    <th style={{ width: '5%' }}>ID</th>
                    <th style={{ width: '10%' }}>Logo</th>
                    <th style={{ width: '20%' }}>Tên cơ sở</th>
                    <th style={{ width: '15%' }}>Điện thoại</th>
                    <th style={{ width: '20%' }}>Địa chỉ</th>
                    <th style={{ width: '8%', textAlign: 'center' }}>Thứ tự</th>
                    <th style={{ width: '10%', textAlign: 'center' }}>Trạng thái</th>
                    <th style={{ width: '12%', textAlign: 'center' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {clinics.map((clinic) => (
                    <tr key={clinic.id} className="specialty-row">
                      <td>{clinic.id}</td>
                      <td>
                        {clinic.logo ? (
                          <img src={clinic.logo} alt="Logo" style={{ width: 50, height: 50, borderRadius: 4, objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 50, height: 50, backgroundColor: '#f3f4f6', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MapPin size={20} color="#9ca3af" />
                          </div>
                        )}
                      </td>
                      <td className="name-cell">
                        <span className="specialty-title" style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                          {clinic.display_name || clinic.name}
                        </span>
                        {clinic.short_name && (
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                            {clinic.short_name}
                          </div>
                        )}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {clinic.phone ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Phone size={14} color="#6b7280" />
                            {clinic.phone}
                          </div>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>-</span>
                        )}
                      </td>
                      <td style={{ whiteSpace: 'normal', wordWrap: 'break-word', color: 'var(--gray-600)', fontSize: '13px' }}>
                        {clinic.address || <span style={{ color: '#9ca3af' }}>Chưa cập nhật</span>}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                        {clinic.order}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {getStatusBadge(clinic.status)}
                      </td>
                      <td className="action-cell">
                        <div className="action-buttons">
                          <button
                            className="btn-icon"
                            onClick={() => navigate(`/clinic-place/admin/edit/${clinic.id}`)}
                            title="Xem chi tiết"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="btn-action edit"
                            onClick={() => navigate(`/clinic-place/admin/edit/${clinic.id}`)}
                            title="Chỉnh sửa"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn-action delete"
                            onClick={() => handleDelete(clinic.id)}
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

            {clinics.length === 0 && (
              <div className="empty-state">
                <p>Không tìm thấy cơ sở y tế nào</p>
              </div>
            )}

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
