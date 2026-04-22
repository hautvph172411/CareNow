import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit2, Trash2, Eye, Building2, Phone, Mail } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { getPartners, deletePartner } from '../api/partner.api';
import Pagination from '../components/Pagination';

export default function PartnerList() {
  const navigate = useNavigate();
  const [partners, setPartners] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 20;

  const fetchPartners = async (page = 1, keyword = '') => {
    setIsLoading(true);
    try {
      const res = await getPartners({ page, limit: ITEMS_PER_PAGE, keyword });
      if (res.success) {
        setPartners(res.data || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalItems(res.pagination.total || 0);
        }
      }
    } catch (error) {
      console.error('Failed to fetch partners:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchPartners(1, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchPartners(currentPage, searchTerm);
  }, [currentPage]);

  const handleDelete = async (id) => {
    if (window.confirm('Bạn chắc chắn muốn xóa đối tác này?')) {
      try {
        await deletePartner(id);
        setPartners(partners.filter(p => p.id !== id));
        alert('Đã xóa đối tác thành công!');
      } catch (error) {
        console.error('Delete failed:', error);
        alert('Xóa thất bại!');
      }
    }
  };

  return (
    <AdminLayout pageTitle="Quản lý đối tác">
      <div className="management-header">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm đối tác..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/partner/admin/add')}>
          <Plus size={20} />
          Thêm đối tác
        </button>
      </div>

      <div className="management-section">
        <div className="stats-summary" style={{ marginBottom: '1rem', color: '#6b7280' }}>
          Tổng số: <strong>{totalItems}</strong> đối tác
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
                    <th style={{ width: '25%' }}>Tên đối tác</th>
                    <th style={{ width: '15%' }}>Tên viết tắt</th>
                    <th style={{ width: '20%' }}>Email / License</th>
                    <th style={{ width: '20%' }}>Địa chỉ</th>
                    <th style={{ width: '8%', textAlign: 'center' }}>Thứ tự</th>
                    <th style={{ width: '10%', textAlign: 'center' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map((partner) => (
                    <tr key={partner.id} className="specialty-row">
                      <td>{partner.id}</td>
                      <td className="name-cell" style={{ fontWeight: '600' }}>
                        {partner.name}
                      </td>
                      <td>{partner.short_name || '-'}</td>
                      <td>
                        <div style={{ fontSize: '13px' }}>
                          {partner.email && <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12} /> {partner.email}</div>}
                          {partner.license && <div style={{ color: '#6b7280' }}>LP: {partner.license}</div>}
                        </div>
                      </td>
                      <td style={{ fontSize: '13px', color: '#6b7280' }}>{partner.address || '-'}</td>
                      <td style={{ textAlign: 'center' }}>{partner.rank}</td>
                      <td className="action-cell">
                        <div className="action-buttons">
                          <button className="btn-action edit" onClick={() => navigate(`/partner/admin/edit/${partner.id}`)}>
                            <Edit2 size={16} />
                          </button>
                          <button className="btn-action delete" onClick={() => handleDelete(partner.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {partners.length === 0 && (
              <div className="empty-state">
                <p>Không tìm thấy đối tác nào</p>
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
