import { useEffect, useState } from 'react';
import { Edit2, Eye, Plus, Search, Trash2, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import Pagination from '../components/Pagination';
import { deleteBlogPublic, getBlogPublicList, updateBlogPublic } from '../api/blogPublic.api';
import { getBlogCategories } from '../api/blogCategory.api';

const formatEpoch = (value) => {
  if (!value) return '—';
  return new Date(Number(value) * 1000).toLocaleDateString('vi-VN');
};

export default function BlogPublic() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const fetchCategories = async () => {
    try {
      const res = await getBlogCategories();
      if (res && res.data) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const fetchItems = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await getBlogPublicList({ page, limit, keyword: searchTerm, category_id: categoryId });
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
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchItems(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, categoryId]);

  useEffect(() => {
    if (searchTerm === '' && categoryId === '') fetchItems(currentPage);
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
      <div className="management-header" style={{ flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ flex: 1 }}></div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => setShowSearch(!showSearch)} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Filter size={18} /> Bộ lọc
          </button>
          <button className="btn-primary" onClick={() => navigate('/blog-public/admin/add')}>
            <Plus size={20} /> Thêm bài cẩm nang
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

          <div className="search-box" style={{ flex: 1, margin: 0, minWidth: '250px' }}>
            <Search size={20} />
            <input
              type="text"
              placeholder="Tìm bài cẩm nang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setCurrentPage(1);
            }}
            className="form-input"
            style={{ width: '200px', height: '42px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0 12px' }}
          >
            <option value="">Tất cả danh mục</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
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
