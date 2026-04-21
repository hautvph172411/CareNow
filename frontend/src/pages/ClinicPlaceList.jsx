import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { getClinicPlaces } from '../api/clinic_place.api';
import Pagination from '../components/Pagination';

export default function ClinicPlaceList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const [clinics, setClinics] = useState([]);

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    try {
      const data = await getClinicPlaces();
      setClinics(data || []);
    } catch (error) {
      console.error('Failed to fetch clinic places:', error);
    }
  };

  const filteredClinics = clinics.filter((clinic) => {
    const term = searchTerm.toLowerCase();
    const cName = clinic.name ? clinic.name.toLowerCase() : '';
    const cAddress = clinic.address ? clinic.address.toLowerCase() : '';
    return cName.includes(term) || cAddress.includes(term);
  });

  const totalPages = Math.ceil(filteredClinics.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentClinics = filteredClinics.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleDelete = (id) => {
    if (window.confirm('Bạn chắc chắn muốn xóa phòng khám này khỏi hệ thống?')) {
      setClinics(clinics.filter(c => c.id !== id));
    }
  };

  const formatPrice = (val) => {
    if (!val) return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <AdminLayout pageTitle="Quản lý phòng khám">
      <div className="management-header">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên phòng khám, địa chỉ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/clinic-place/admin/add')}>
          <Plus size={20} />
          Thêm phòng khám
        </button>
      </div>

      <div className="management-section">
        <div className="table-wrapper">
          <table className="management-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Hình ảnh</th>
                <th>Tên phòng khám</th>
                <th>Địa chỉ</th>
                <th>Giá khám từ</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {currentClinics.map(clinic => (
                <tr key={clinic.id}>
                  <td>{clinic.id}</td>
                  <td>
                    {clinic.picture ? (
                      <img src={clinic.picture} alt="Avatar" style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 40, height: 40, backgroundColor: '#f3f4f6', borderRadius: 4 }}></div>
                    )}
                  </td>
                  <td><strong className="user-name">{clinic.name}</strong></td>
                  <td>{clinic.address}</td>
                  <td>{formatPrice(clinic.price_min)}</td>
                  <td>
                    <span className={`status-badge ${clinic.status === 1 ? 'status-active' : 'status-inactive'}`}>
                      {clinic.status === 1 ? 'Hoạt động' : 'Tạm ngưng'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn edit-btn" title="Chỉnh sửa">
                        <Edit2 size={16} />
                      </button>
                      <button className="action-btn delete-btn" title="Xóa" onClick={() => handleDelete(clinic.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {currentClinics.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-state" style={{ textAlign: 'center', padding: '2rem' }}>Không tìm thấy dữ liệu</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>Hiển thị {currentClinics.length} trên tổng {filteredClinics.length} kết quả</span>
        </div>

        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </AdminLayout>
  );
}
