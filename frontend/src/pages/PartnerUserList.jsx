import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Briefcase, User as UserIcon, Mail, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import { getUsers, deleteUser } from '../api/user.api';
import { getPartners } from '../api/partner.api';

export default function PartnerUserList() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [partners, setPartners] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [uRes, pRes] = await Promise.all([
        getUsers({ type: 'partner' }),
        getPartners()
      ]);
      
      if (uRes.success) setUsers(uRes.data || []);
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

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa tài khoản đối tác này?')) return;
    try {
      await deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      alert('Xóa thất bại');
    }
  };

  const filtered = users.filter(u => 
    u.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout pageTitle="Tài khoản Đối tác">
      <div className="management-header">
        <div className="search-box">
          <Search size={20} />
          <input 
            type="text" 
            placeholder="Tìm kiếm tài khoản đối tác..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/users/partner/add')}>
          <Plus size={20} /> Thêm TK Đối tác
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
                <th>Người dùng</th>
                <th>Đối tác</th>
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
                    <span className="role-badge">
                      {user.role === 2 ? 'Quản lý (2)' : 'Nhân viên (1)'}
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
        )}
      </div>
    </AdminLayout>
  );
}
