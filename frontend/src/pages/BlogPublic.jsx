import { useEffect, useState } from 'react';
import { Edit2, Eye, Plus, Search, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import Pagination from '../components/Pagination';
import { deleteBlogPublic, getBlogPublicList, updateBlogPublic } from '../api/blogPublic.api';

const formatEpoch = (value) => {
  if (!value) return '—';
  return new Date(Number(value) * 1000).toLocaleDateString('vi-VN');
};

export default function BlogPublic() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const fetchItems = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await getBlogPublicList({ page, limit, keyword: searchTerm });
      setItems(res?.data || []);
      setTotalPages(res?.pagination?.totalPages || 1);
    } catch (error) {
      console.error(error);
      alert('Lỗi tải danh sách cẩm nang');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchItems(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (searchTerm === '') fetchItems(currentPage);
  }, [currentPage]);

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa bài cẩm nang này?')) return;
    try {
      await deleteBlogPublic(id);
      fetchItems(currentPage);
    } catch (error) {
      console.error(error);
      alert('Xóa bài cẩm nang thất bại');
    }
  };

  const handleToggleStatus = async (item) => {
    const nextStatus = item.status === 1 ? 0 : 1;
    try {
      await updateBlogPublic(item.id, { status: nextStatus });
      setItems(items.map((row) => row.id === item.id ? { ...row, status: nextStatus } : row));
    } catch (error) {
      console.error(error);
      alert('Cập nhật trạng thái thất bại');
    }
  };

  return (
    <AdminLayout pageTitle="Bài cẩm nang">
      <div className="management-header">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Tìm bài cẩm nang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={() => navigate('/blog-public/admin/add')}>
          <Plus size={20} />
          Thêm bài cẩm nang
        </button>
      </div>

      <div className="management-section">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải...</div>
        ) : items.length > 0 ? (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="specialties-table">
                <thead>
                  <tr>
                    <th style={{ width: 80 }}>ID</th>
                    <th style={{ width: 92 }}>Ảnh</th>
                    <th>Tiêu đề</th>
                    <th>Lý do khám</th>
                    <th style={{ width: 120, textAlign: 'center' }}>Xuất bản</th>
                    <th style={{ width: 130, textAlign: 'center' }}>Trạng thái</th>
                    <th style={{ width: 160, textAlign: 'center' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="specialty-row">
                      <td style={{ fontWeight: 500 }}>{item.id}</td>
                      <td>
                        {item.picture ? (
                          <img src={item.picture} alt="" style={{ width: 60, height: 42, objectFit: 'cover', borderRadius: 4 }} />
                        ) : (
                          <div style={{ width: 60, height: 42, background: '#f1f5f9', borderRadius: 4 }} />
                        )}
                      </td>
                      <td className="name-cell">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span className="specialty-title" style={{ fontWeight: 600 }}>{item.title}</span>
                          {item.summary && <span style={{ fontSize: 12, color: '#64748b' }}>{item.summary}</span>}
                        </div>
                      </td>
                      <td>{item.reason_name || '—'}</td>
                      <td style={{ textAlign: 'center' }}>{formatEpoch(item.published_time)}</td>
                      <td className="status-cell">
                        <span
                          onClick={() => handleToggleStatus(item)}
                          style={{ cursor: 'pointer' }}
                          className={`status-badge ${item.status === 1 ? 'active' : 'inactive'}`}
                        >
                          {item.status === 1 ? 'Hiển thị' : 'Ẩn'}
                        </span>
                      </td>
                      <td className="action-cell">
                        <div className="action-buttons">
                          <button className="btn-icon" onClick={() => navigate(`/blog-public/admin/edit/${item.id}`)} title="Xem chi tiết">
                            <Eye size={16} />
                          </button>
                          <button className="btn-action edit" onClick={() => navigate(`/blog-public/admin/edit/${item.id}`)} title="Chỉnh sửa">
                            <Edit2 size={16} />
                          </button>
                          <button className="btn-action delete" onClick={() => handleDelete(item.id)} title="Xóa">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
          </>
        ) : (
          <div className="empty-state">
            <p>Không tìm thấy bài cẩm nang nào</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
