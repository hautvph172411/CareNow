import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit2, Trash2, Eye, UserPlus } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import Pagination from '../components/Pagination';
import { getClinics, deleteClinic } from '../api/clinic.api';
import '../styles/management.css';

export default function PartnerDoctorList() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const limit = 20;

  const loadDoctors = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = { page: currentPage, limit };
      if (searchTerm.trim()) params.keyword = searchTerm.trim();

      const res = await getClinics(params);
      if (res.success) {
        setDoctors(res.data || []);
        setTotalDoctors(res.pagination?.total || 0);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => { loadDoctors(); }, [loadDoctors]);

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa bác sĩ này?')) return;
    try {
      await deleteClinic(id);
      loadDoctors();
    } catch (err) {
      alert(err.response?.data?.message || 'Xóa thất bại');
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <AdminLayout pageTitle="Bác sĩ">
      <div className="management-page">
        <div className="management-header">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
            <div className="search-box" style={{ margin: 0, flex: 1, minWidth: '200px' }}>
              <Search size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên bác sĩ..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/doctors/add')}>
              <UserPlus size={16} /> Thêm bác sĩ
            </button>
          </div>
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
                <table className="specialties-table" style={{ tableLayout: 'fixed', minWidth: '800px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '10%' }}>Ảnh</th>
                      <th style={{ width: '30%' }}>Tên bác sĩ</th>
                      <th style={{ width: '30%' }}>Chuyên khoa</th>
                      <th style={{ width: '15%', textAlign: 'center' }}>Trạng thái</th>
                      <th style={{ width: '15%', textAlign: 'center' }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map(doc => (
                      <tr key={doc.id} className="specialty-row">
                        <td>
                          {doc.picture ? (
                            <img src={doc.picture} alt="" style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover' }} />
                          ) : (
                            <div style={{
                              width: 40, height: 40, borderRadius: 4,
                              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'white', fontWeight: 700, fontSize: 14,
                            }}>
                              {(doc.name || '?').split(' ').slice(-1)[0]?.[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                        </td>
                        <td className="name-cell">
                          <span className="specialty-title" style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                            {doc.title ? `${doc.title} ` : ''}{doc.name}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'normal', wordWrap: 'break-word', color: 'var(--gray-600)' }}>
                          {doc.specialist_names || 'Chưa gán'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`status-badge ${doc.status === 1 ? 'active' : 'inactive'}`}>
                            {doc.status === 1 ? 'Hoạt động' : 'Tắt'}
                          </span>
                        </td>
                        <td className="action-cell">
                          <div className="action-buttons" style={{ justifyContent: 'center' }}>
                            <button className="btn-action edit" onClick={() => navigate(`/doctors/edit/${doc.id}`)} title="Chỉnh sửa">
                              <Edit2 size={16} />
                            </button>
                            <button className="btn-action delete" onClick={() => handleDelete(doc.id)} title="Xóa">
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
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👨‍⚕️</div>
                  <p>Chưa có bác sĩ nào. Bấm "Thêm bác sĩ" để tạo mới.</p>
                </div>
              )}

              {totalPages > 1 && (
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
