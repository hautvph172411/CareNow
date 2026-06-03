import React, { useState, useEffect } from 'react';
import { getConsultations, updateConsultationStatus, deleteConsultation } from '../api/consultation.api';
import { Loader2, RefreshCw, Filter, Trash2, Eye, X, Search } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import Pagination from '../components/Pagination';

export default function Consultations() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 15;

  // Modal Detail
  const [selectedPatient, setSelectedPatient] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const query = { page, limit };
      if (filterStatus) query.status = filterStatus;
      if (searchTerm) query.keyword = searchTerm;
      const res = await getConsultations(query);
      if (res && res.data) {
        setConsultations(res.data);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages);
          setTotalItems(res.pagination.total || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching consultations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(timer);
  }, [page, filterStatus, searchTerm]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateConsultationStatus(id, newStatus);
      fetchData();
      window.dispatchEvent(new Event('consultations_updated'));
    } catch (error) {
      alert('Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Cảnh báo: Hành động này sẽ xóa vĩnh viễn yêu cầu. Bạn có tiếp tục?')) return;
    try {
      await deleteConsultation(id);
      fetchData();
      window.dispatchEvent(new Event('consultations_updated'));
    } catch (error) {
      alert('Có lỗi xảy ra khi xóa');
    }
  };

  return (
    <AdminLayout pageTitle="Yêu cầu Tư vấn thêm">
      <div className="management-header">
        <div style={{ flex: 1 }}></div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <RefreshCw size={18} /> Làm mới
          </button>
        </div>
      </div>

      <div className="filter-section show">
        <div className="filter-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={18} color="#6b7280" />
            <span style={{ fontWeight: 500, color: '#374151' }}>Trạng thái:</span>
          </div>
          <select 
            className="form-input" 
            style={{ width: '200px', margin: 0 }}
            value={filterStatus} 
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả</option>
            <option value="1">Chưa xử lý</option>
            <option value="2">Đã xử lý</option>
          </select>
          
          <div className="search-box" style={{ margin: 0, flex: 1, minWidth: '250px' }}>
            <Search size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm tên, số điện thoại..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>
        </div>
      </div>

      <div className="management-section">
        <div className="stats-summary" style={{ marginBottom: '1rem', color: '#6b7280' }}>
          Tổng số: <strong>{totalItems}</strong> yêu cầu
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto', color: '#3b82f6' }} />
            <p style={{ marginTop: '10px', color: '#6b7280' }}>Đang tải dữ liệu...</p>
          </div>
        ) : consultations.length === 0 ? (
          <div className="empty-state" style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
            <p>Không tìm thấy yêu cầu tư vấn nào.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="specialties-table">
                <thead>
                  <tr>
                    <th style={{ width: '5%' }}>ID</th>
                    <th style={{ width: '20%' }}>Người bệnh</th>
                    <th style={{ width: '20%' }}>Thông tin liên lạc</th>
                    <th style={{ width: '30%' }}>Tình trạng bệnh hiện tại</th>
                    <th style={{ width: '10%', textAlign: 'center' }}>Ngày gửi</th>
                    <th style={{ width: '10%', textAlign: 'center' }}>Trạng thái</th>
                    <th style={{ width: '5%', textAlign: 'center' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {consultations.map((item) => (
                    <tr key={item.id} className="specialty-row">
                      <td style={{ fontWeight: '500' }}>#{item.id}</td>
                      <td className="name-cell">
                        <span className="specialty-title" style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                          {item.patient_name}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: '500' }}>{item.patient_phone}</div>
                        {item.patient_email && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{item.patient_email}</div>}
                      </td>
                      <td style={{ whiteSpace: 'normal', wordWrap: 'break-word', color: '#4b5563', fontSize: '13px' }}>
                        <p style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }} title={item.symptoms}>
                          {item.symptoms}
                        </p>
                      </td>
                      <td style={{ textAlign: 'center', fontSize: '13px', color: '#6b7280' }}>
                        {new Date(item.created_at).toLocaleDateString('vi-VN')}
                        <br/>
                        {new Date(item.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <select
                          style={{ 
                            fontSize: '13px', 
                            padding: '6px 12px', 
                            borderRadius: '9999px', 
                            border: '1px solid transparent',
                            cursor: 'pointer',
                            outline: 'none',
                            fontWeight: 600,
                            backgroundColor: item.status == 1 ? '#fef3c7' : '#dcfce7',
                            color: item.status == 1 ? '#92400e' : '#166534',
                            textAlign: 'center',
                            appearance: 'none', // Ẩn mũi tên mặc định để trông giống badge hơn (tùy chọn)
                            WebkitAppearance: 'none'
                          }}
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        >
                          <option value="1">Chưa xử lý</option>
                          <option value="2">Đã xử lý</option>
                        </select>
                      </td>
                      <td className="action-cell" style={{ textAlign: 'center' }}>
                        <div className="action-buttons" style={{ justifyContent: 'center' }}>
                          <button
                            className="btn-icon"
                            onClick={() => setSelectedPatient(item)}
                            title="Xem chi tiết"
                          >
                            <Eye size={16} />
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
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>

      {/* Modal Chi tiết Bệnh nhân */}
      {selectedPatient && (
        <div 
          className="modal-overlay" 
          onClick={() => setSelectedPatient(null)} 
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}
        >
          <div 
            className="modal-content" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              backgroundColor: '#fff', borderRadius: '12px', width: '500px', maxWidth: '90%', 
              padding: '24px', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
            }}
          >
            <button 
              style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px' }} 
              onClick={() => setSelectedPatient(null)}
              className="hover:bg-gray-100"
            >
              <X size={20} color="#6b7280" />
            </button>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
              Chi tiết yêu cầu tư vấn
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <strong style={{ color: '#6b7280', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Họ và tên</strong> 
                <div style={{ color: '#111827', fontWeight: 500 }}>{selectedPatient.patient_name}</div>
              </div>
              <div>
                <strong style={{ color: '#6b7280', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Số điện thoại</strong> 
                <div style={{ color: '#111827', fontWeight: 500 }}>{selectedPatient.patient_phone}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <strong style={{ color: '#6b7280', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Email</strong> 
                <div style={{ color: '#111827', fontWeight: 500 }}>{selectedPatient.patient_email || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Không có</span>}</div>
              </div>
              <div>
                <strong style={{ color: '#6b7280', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Thời gian gửi</strong> 
                <div style={{ color: '#111827', fontWeight: 500 }}>{new Date(selectedPatient.created_at).toLocaleString('vi-VN')}</div>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <strong style={{ color: '#6b7280', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Tình trạng bệnh hiện tại</strong>
              <div style={{ 
                backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', 
                color: '#374151', fontSize: '15px', whiteSpace: 'pre-wrap', border: '1px solid #f3f4f6',
                lineHeight: '1.6'
              }}>
                {selectedPatient.symptoms}
              </div>
            </div>
            
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setSelectedPatient(null)}
              >
                Đóng
              </button>
              {selectedPatient.status == 1 && (
                <button 
                  className="btn btn-primary" 
                  onClick={async () => {
                    await handleStatusChange(selectedPatient.id, 2);
                    setSelectedPatient(prev => ({...prev, status: 2}));
                  }}
                >
                  Đánh dấu Đã xử lý
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
