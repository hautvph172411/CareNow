import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Shield, User as UserIcon, Mail, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import { getUsers, deleteUser } from '../api/user.api';

export default function AdminUserList() {
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
      const res = await getUsers({ type: 'admin' });
      if (res.success) {
        setUsers(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa tài khoản quản trị này?')) return;
    try {
      await deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      alert('Xóa thất bại');
    }
  };

  const filtered = users.filter(u => 
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout pageTitle="Tài khoản Quản trị">
      <div className="management-header">
        <div className="search-box">
          <Search size={20} />
          <input 
            type="text" 
            placeholder="Tìm kiếm tài khoản quản trị..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/users/admin/add')}>
          <Plus size={20} /> Thêm Quản trị viên
        </button>
      </div>

      <div className="management-section">
        {loading ? (
          <div className="loading-state">Đang tải...</div>
        ) : (
          <table className="specialties-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Thông tin</th>
                <th>Quyền hạn</th>
                <th>Liên hệ</th>
                <th style={{ textAlign: 'center' }}>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user.id} className="specialty-row">
                  <td>{user.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="user-avatar-placeholder">
                        <UserIcon size={20} />
                      </div>
                      <div>
                        <div className="user-display-name">{user.display_name || user.username}</div>
                        <div className="user-username">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="role-badge">
                      {user.role === 2 ? 'Quản trị (2)' : 'Nhân viên (1)'}
                    </span>
                  </td>
                  <td>
                    <div className="user-contact-info">
                      {user.email && <div><Mail size={12} /> {user.email}</div>}
                      {user.phone && <div><Phone size={12} /> {user.phone}</div>}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`status-badge ${user.status === 1 ? 'status-active' : 'status-inactive'}`}>
                      {user.status === 1 ? 'Kích hoạt' : 'Ngưng'}
                    </span>
                  </td>
                  <td className="action-cell" style={{ textAlign: 'right' }}>
                    <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                      <button className="btn-action edit" onClick={() => navigate(`/users/admin/edit/${user.id}`)}>
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
        )}
      </div>
    </AdminLayout>
  );
}
