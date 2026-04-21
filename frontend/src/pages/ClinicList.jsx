import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit2, Trash2, Eye } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { getClinicPlaces, deleteClinicPlace } from '../api/clinic_place.api';
import Pagination from '../components/Pagination';

export default function ClinicList() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const fetchDoctors = async (page = 1, keyword = '') => {
    setIsLoading(true);
    try {
      const res = await getClinicPlaces({ page, limit: ITEMS_PER_PAGE, keyword });
      if (res && res.data) {
        setDoctors(res.data);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
        }
      }
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce tìm kiếm
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchDoctors(1, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Chuyển trang
  useEffect(() => {
    fetchDoctors(currentPage, searchTerm);
  }, [currentPage]);

  const handleEdit = (doctor) => {
    navigate(`/clinic/admin/edit/${doctor.id}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn chắc chắn muốn xóa bác sĩ này? Hành động này không thể hoàn tác!')) {
      try {
        await deleteClinicPlace(id);
        setDoctors(doctors.filter(d => d.id !== id));
        alert('Đã xóa bác sĩ thành công!');
      } catch (error) {
        console.error('Delete failed:', error);
        alert('Xóa thất bại. Vui lòng liên hệ Admin!');
      }
    }
  };

  return (
    <AdminLayout pageTitle="Quản lý bác sĩ">
      <div className="management-header">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc địa chỉ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/clinic/admin/add')}>
          <Plus size={20} />
          Thêm bác sĩ
        </button>
      </div>

      <div className="management-section">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải...</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="specialties-table">
                <thead>
                  <tr>
                    <th style={{ width: '5%' }}>ID</th>
                    <th style={{ width: '10%' }}>Ảnh</th>
                    <th style={{ width: '20%' }}>Tên</th>
                    <th style={{ width: '15%' }}>Giấy phép</th>
                    <th style={{ width: '20%' }}>Chuyên khoa</th>
                    <th style={{ width: '10%', textAlign: 'center' }}>Dịch vụ</th>
                    <th style={{ width: '10%', textAlign: 'center' }}>Thứ hạng</th>
                    <th style={{ width: '15%', textAlign: 'center' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doctor) => (
                    <tr key={doctor.id} className="specialty-row">
                      <td>{doctor.id}</td>
                      <td>
                        {doctor.picture ? (
                          <img src={doctor.picture} alt="Avatar" style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 40, height: 40, backgroundColor: '#f3f4f6', borderRadius: 4 }}></div>
                        )}
                      </td>
                      <td className="name-cell">
                        <span className="specialty-title" style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                          {doctor.name}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'normal', wordWrap: 'break-word', color: 'var(--gray-600)' }}>
                        {doctor.license || 'Chưa cập nhật'}
                      </td>
                      <td style={{ whiteSpace: 'normal', wordWrap: 'break-word', color: 'var(--gray-600)' }}>
                        {doctor.specialist_ids || 'Không có'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`status-badge ${doctor.service === 1 ? 'active' : 'inactive'}`}>
                          {doctor.service === 1 ? 'Có' : 'Không'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                        {doctor.rank || 0}
                      </td>
                      <td className="action-cell">
                        <div className="action-buttons">
                          <button
                            className="btn-icon"
                            onClick={() => handleEdit(doctor)}
                            title="Xem chi tiết"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="btn-action edit"
                            onClick={() => handleEdit(doctor)}
                            title="Chỉnh sửa"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn-action delete"
                            onClick={() => handleDelete(doctor.id)}
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

            {doctors.length === 0 && (
              <div className="empty-state">
                <p>Không tìm thấy bác sĩ nào</p>
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