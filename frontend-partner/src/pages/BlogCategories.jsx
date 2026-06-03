import { useEffect, useState } from 'react';
import { Edit2, Eye, Plus, Search, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import Pagination from '../components/Pagination';
import { deleteBlogCategory, getBlogCategories, updateBlogCategory } from '../api/blogCategory.api';

export default function BlogCategories() {
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
      const res = await getBlogCategories({ page, limit, keyword: searchTerm });
      setItems(res?.data || []);
      setTotalPages(res?.pagination?.totalPages || 1);
    } catch (error) {
      console.error(error);
      alert('Lỗi tải danh mục cẩm nang');
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
    if (!window.confirm('Bạn chắc chắn muốn xóa danh mục cẩm nang này?')) return;
    try {
      await deleteBlogCategory(id);
      fetchItems(currentPage);
    } catch (error) {
      console.error(error);
      alert('Xóa danh mục thất bại');
    }
  };

  const handleToggleStatus = async (item) => {
    const nextStatus = item.status === 1 ? 0 : 1;
    try {
      await updateBlogCategory(item.id, { status: nextStatus });
      setItems(items.map((row) => row.id === item.id ? { ...row, status: nextStatus } : row));
    } catch (error) {
      console.error(error);
      alert('Cập nhật trạng thái thất bại');
    }
  };

  return (
    <AdminLayout pageTitle="Danh mục cẩm nang">
      <div className="management-header">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Tìm danh mục cẩm nang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={() => navigate('/blog-categories/admin/add')}>
          <Plus size={20} />
          Thêm danh mục
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
                    <th>Tên danh mục</th>
                    <th>URL</th>
                    <th style={{ width: 100, textAlign: 'center' }}>Thứ tự</th>
                    <th style={{ width: 130, textAlign: 'center' }}>Trạng thái</th>
                    <th style={{ width: 160, textAlign: 'center' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="specialty-row">
                      <td style={{ fontWeight: 500 }}>{item.id}</td>
                      <td className="name-cell">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span className="specialty-title" style={{ fontWeight: 600 }}>{item.name}</span>
                          {item.description && <span style={{ fontSize: 12, color: '#64748b' }}>{item.description}</span>}
                        </div>
                      </td>
                      <td>{item.url}</td>
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
                          <button className="btn-icon" onClick={() => navigate(`/blog-categories/admin/edit/${item.id}`)} title="Xem chi tiết">
                            <Eye size={16} />
                          </button>
                          <button className="btn-action edit" onClick={() => navigate(`/blog-categories/admin/edit/${item.id}`)} title="Chỉnh sửa">
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
            <p>Không tìm thấy danh mục cẩm nang nào</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
