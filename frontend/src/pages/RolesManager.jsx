import { useState, useEffect } from 'react';
import { Shield, Plus, Edit2, Trash2, Search, X } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { getAuthItems, createAuthItem, deleteAuthItem } from '../api/auth_item.api';

export default function RolesManager() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', type: 1 });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const res = await getAuthItems();
      if (res.success) {
        // Filter only roles (type 1)
        setRoles(res.data.filter(i => i.type === 1));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createAuthItem(formData);
      setShowModal(false);
      setFormData({ name: '', description: '', type: 1 });
      loadRoles();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (name) => {
    if (!window.confirm(`Xóa vai trò "${name}"?`)) return;
    try {
      await deleteAuthItem(name);
      setRoles(prev => prev.filter(r => r.name !== name));
    } catch (err) {
      alert('Xóa thất bại');
    }
  };

  const filtered = roles.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout pageTitle="Quản lý Vai trò">
       <div className="content-header">
        <div>
          <h1 className="content-title">Quản lý Vai trò</h1>
          <p className="content-subtitle">Hệ thống vai trò và quyền hạn truy cập</p>
        </div>
      </div>

      <div className="management-header">
        <div className="search-box">
          <Search size={20} />
          <input 
            type="text" 
            placeholder="Tìm kiếm vai trò..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={20} /> Thêm vai trò
        </button>
      </div>

      <div className="management-section">
        {loading ? (
          <div>Đang tải...</div>
        ) : (
          <table className="management-table">
            <thead>
              <tr>
                <th style={{ width: '25%' }}>TÊN VAI TRÒ</th>
                <th>MÔ TẢ</th>
                <th style={{ textAlign: 'right', width: '15%' }}>HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(role => (
                <tr key={role.name}>
                  <td className="font-bold">{role.name}</td>
                  <td style={{ color: '#64748b' }}>{role.description || 'Chưa có mô tả'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                      <button className="btn-icon">
                        <Edit2 size={16} />
                      </button>
                      <button className="btn-icon delete" onClick={() => handleDelete(role.name)}>
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

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Thêm vai trò mới</h3>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Tên vai trò *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="VD: Admin, Tiếp tân..."
                  required 
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Mô tả</label>
                <textarea 
                  className="form-input textarea" 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Mô tả chức năng của vai trò này"
                  style={{ minHeight: '100px' }}
                />
              </div>
              <div className="modal-footer" style={{ marginTop: '1rem', borderTop: 'none', padding: 0 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu vai trò</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
