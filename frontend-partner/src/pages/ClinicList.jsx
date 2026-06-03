import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit2, Trash2, Eye } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { getClinics, deleteClinic } from '../api/clinic.api';
import { getClinicPlaces } from '../api/clinic_place.api';
import { getSpecialties } from '../api/specialty.api';
import Pagination from '../components/Pagination';
import SearchableSelect from '../components/SearchableSelect';

export default function ClinicList() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPlace, setFilterPlace] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [filterLicense, setFilterLicense] = useState('');
  const [places, setPlaces] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    getClinicPlaces({ limit: 1000 }).then(res => setPlaces(res.data || [])).catch(console.error);
    getSpecialties({ limit: 1000 }).then(res => setSpecialties(res.data || [])).catch(console.error);
  }, []);

  const fetchDoctors = async () => {
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        keyword: searchTerm
      };
      if (filterStatus !== '') params.status = filterStatus;
      if (filterPlace !== '') params.place_id = filterPlace;
      if (filterSpecialty !== '') params.specialist_id = filterSpecialty;
      if (filterLicense !== '') params.license = filterLicense;

      const res = await getClinics(params);
      if (res && res.data) {
        setDoctors(res.data);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalDoctors(res.pagination.total || 0);
        }
      } else if (Array.isArray(res)) {
        setDoctors(res);
        setTotalPages(1);
        setTotalDoctors(res.length);
      }
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDoctors();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, filterStatus, filterPlace, filterSpecialty, filterLicense, currentPage]);

  const handleFilterChange = (setter, value) => {
    setter(value);
    setCurrentPage(1);
  };

  const handleEdit = (doctor) => {
    navigate(`/clinic/admin/edit/${doctor.id}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn chắc chắn muốn xóa bác sĩ này? Hành động này không thể hoàn tác!')) {
      try {
        await deleteClinic(id);
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
        <div className="filter-container" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '1rem', flex: 1 }}>
          <div style={{ width: '180px', margin: 0, zIndex: 12 }}>
            <SearchableSelect
              options={[{ value: '', label: 'Tất cả nơi khám' }, ...places.map(p => ({ value: p.id, label: p.name }))]}
              value={filterPlace !== '' ? parseInt(filterPlace, 10) : ''}
              onChange={(val) => handleFilterChange(setFilterPlace, val === '' ? '' : String(val))}
              placeholder="Tất cả nơi khám"
            />
          </div>

          <div style={{ width: '180px', margin: 0, zIndex: 11 }}>
            <SearchableSelect
              options={[{ value: '', label: 'Tất cả chuyên khoa' }, ...specialties.map(p => ({ value: p.id, label: p.name }))]}
              value={filterSpecialty !== '' ? parseInt(filterSpecialty, 10) : ''}
              onChange={(val) => handleFilterChange(setFilterSpecialty, val === '' ? '' : String(val))}
              placeholder="Tất cả chuyên khoa"
            />
          </div>

          <div style={{ width: '180px', margin: 0, zIndex: 10 }}>
            <SearchableSelect
              options={[
                { value: '', label: 'Tất cả trạng thái' },
                { value: '1', label: 'Đang hoạt động' },
                { value: '0', label: 'Ngưng hoạt động' }
              ]}
              value={filterStatus}
              onChange={(val) => handleFilterChange(setFilterStatus, val)}
              placeholder="Tất cả trạng thái"
            />
          </div>
          
          <div className="search-box" style={{ margin: 0, minWidth: '180px' }}>
            <input
              type="text"
              placeholder="Nhập giấy phép..."
              value={filterLicense}
              onChange={(e) => handleFilterChange(setFilterLicense, e.target.value)}
            />
          </div>

          <div className="search-box" style={{ margin: 0, flex: 1, minWidth: '200px' }}>
            <Search size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc địa chỉ..."
              value={searchTerm}
              onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
            />
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/clinic/admin/add')}>
          <Plus size={20} />
          Thêm bác sĩ
        </button>
      </div>

      <div className="management-section">
        <div style={{ marginBottom: '1rem', fontWeight: 600, color: 'var(--gray-700)' }}>
          Tổng số: {totalDoctors} bác sĩ
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải...</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="specialties-table">
                <thead>
                  <tr>
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
                        {doctor.specialist_names || doctor.specialist_ids || 'Không có'}
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