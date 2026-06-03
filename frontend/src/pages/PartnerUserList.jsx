import { useState, useEffect, useContext } from 'react';
import { Search, Plus, Edit2, Trash2, User as UserIcon, Mail, Phone, Filter, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import { getUsers, deleteUser } from '../api/user.api';
import { getPartners } from '../api/partner.api';
import { AuthContext } from '../contexts/AuthContext';
import Pagination from '../components/Pagination';

export default function PartnerUserList() {
  const navigate = useNavigate();
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [partners, setPartners] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const loadData = async (page = 1, keyword = '', status = '', role = '') => {
    setLoading(true);
    try {
      const [uRes, pRes] = await Promise.all([
        getUsers({ type: 'partner', page, limit: ITEMS_PER_PAGE, keyword }),
        getPartners()
      ]);
      
      if (uRes && uRes.data) {
        if (uRes.data.data) {
          setUsers(uRes.data.data);
          if (uRes.data.pagination) {
            setTotalPages(uRes.data.pagination.totalPages || 1);
          }
        } else {
          setUsers(uRes.data);
          setTotalPages(1);
        }
      }
      if (pRes.success) {
        const pMap = {};
        pRes.data.forEach(p => pMap[p.id] = p.name);
        setPartners(pMap);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      loadData(1, searchTerm, filterStatus, filterRole);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, filterStatus, filterRole]);

  // Handle page change
  useEffect(() => {
    loadData(currentPage, searchTerm, filterStatus, filterRole);
  }, [currentPage]);

  const handleDelete = async (id) => {
    if (currentUser && currentUser.id === id) {
      alert('Không thể tự xóa tài khoản của chính mình!');
      return;
    }
    if (!window.confirm('Xóa tài khoản đối tác này?')) return;
    try {
      await deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      alert('Xóa thành công');
    } catch (err) {
      alert('Xóa thất bại');
    }
  };

  return (
    <AdminLayout pageTitle="Tài khoản Đối tác">
      <div className="management-header">
        <div style={{ flex: 1 }}></div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => setShowSearch(!showSearch)} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Filter size={18} /> Bộ lọc
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/users/partner/add')}>
            <Plus size={20} /> Thêm TK Đối tác
          </button>
        </div>
      </div>

      <div className={`filter-section ${showSearch ? 'show' : ''}`}>
        <div className="filter-container">
          
          
          <select 
            className="form-input" 
            style={{ width: '150px', margin: 0 }}
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            
            <option value="">Tất cả chức vụ</option>
            <option value="manager">Manager</option>
            <option value="staff">Staff</option>
        
          </select>
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

          <div className="search-box" style={{ margin: 0, flex: 1, minWidth: '250px' }}>
            <Search size={20} />
            <input 
              type="text" 
              placeholder="Tìm kiếm tài khoản đối tác..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="management-section">
        {loading ? (
          <div className="loading-state">Đang tải...</div>
        ) : (
          <>
            <table className="specialties-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Người dùng</th>
                  <th>Đối tác</th>
                  <th>Quyền hạn</th>
                  <th>Liên hệ</th>
                  <th style={{ textAlign: 'center' }}>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="specialty-row">
                    <td>{user.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="user-avatar-placeholder">
                          <UserIcon size={20} />
                        </div>
                        <div>
                          <div className="user-display-name">{user.display_name || user.username}</div>
                          <div className="user-email">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontSize: '13px', fontWeight: '500' }}>
                        <Briefcase size={14} />
                        {partners[user.partner_id] || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge ${user.partner_role === 'manager' ? 'role-manager' : 'role-staff'}`}>
                        {user.partner_role === 'manager' ? 'Quản lý' : 'Nhân viên'}
                      </span>
                    </td>
                    <td>
                      <div className="user-contact-info">
                         {user.phone && <div><Phone size={12} /> {user.phone}</div>}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`status-badge ${user.status === 1 ? 'status-active' : 'status-inactive'}`}>
                        {user.status === 1 ? 'Hoạt động' : 'Tạm ngưng'}
                      </span>
                    </td>
                    <td className="action-cell" style={{ textAlign: 'right' }}>
                      <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn-action edit" onClick={() => navigate(`/users/partner/edit/${user.id}`)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="btn-action delete" onClick={() => handleDelete(user.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <div className="empty-state">
                <p>Không tìm thấy tài khoản đối tác nào</p>
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
