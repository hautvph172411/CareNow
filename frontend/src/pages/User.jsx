import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Shield, Briefcase, Mail, Phone, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import { getUsers, deleteUser } from '../api/user.api';

export default function UserPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers();
      if (res.success) {
        setUsers(res.data || []);
      }
    } catch (err) {
      console.error('Lỗi tải người dùng:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn xoá tài khoản này?')) return;
    try {
      await deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      alert('Xoá thất bại');
    }
  };

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout pageTitle="Quản lý tài khoản">
      <div className="management-header">
        <div className="search-box">
          <Search size={20} />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên đăng nhập, email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/users/add')}>
          <Plus size={20} /> Thêm tài khoản
        </button>
      </div>

      <div className="management-section">
        <div className="stats-summary" style={{ marginBottom: '1rem', color: '#6b7280' }}>
            Tổng số: <strong>{filteredUsers.length}</strong> tài khoản
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="specialties-table">
              <thead>
                <tr>
                  <th style={{ width: '5%' }}>ID</th>
                  <th style={{ width: '25%' }}>Người dùng</th>
                  <th style={{ width: '15%' }}>Loại tài khoản</th>
                  <th style={{ width: '15%' }}>Vai trò</th>
                  <th style={{ width: '15%' }}>Liên hệ</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>Trạng thái</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="specialty-row">
                    <td>{user.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                          <UserIcon size={20} />
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#1f2937' }}>{user.display_name || user.username}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {user.partner_id ? (
                        <span className="type-badge partner" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontSize: '13px' }}>
                          <Briefcase size={14} /> Đối tác
                        </span>
                      ) : (
                        <span className="type-badge admin" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6366f1', fontSize: '13px' }}>
                          <Shield size={14} /> Quản trị
                        </span>
                      )}
                    </td>
                    <td>
                       <span style={{ fontSize: '13px', padding: '4px 8px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
                          {user.role === 2 ? 'Quản lý / Super' : 'Nhân viên / Sub'}
                       </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {user.email && <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12} /> {user.email}</div>}
                        {user.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} /> {user.phone}</div>}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`status-badge ${user.status === 1 ? 'status-active' : 'status-inactive'}`}>
                        {user.status === 1 ? 'Hoạt động' : user.status === 0 ? 'Ngưng' : 'Đã xóa'}
                      </span>
                    </td>
                    <td className="action-cell">
                      <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn-action edit" onClick={() => navigate(`/users/edit/${user.id}`)}>
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
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
