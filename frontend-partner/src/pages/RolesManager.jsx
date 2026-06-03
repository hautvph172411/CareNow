import { useState, useEffect } from 'react';
import { Shield, Plus, Edit2, Trash2, Search, X, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import {
  getAuthItems,
  createAuthItem,
  updateAuthItem,
  deleteAuthItem,
  getItemChildren,
} from '../api/auth_item.api';

export default function RolesManager() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [permCounts, setPermCounts] = useState({}); // { roleName: số quyền }
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null); // null = thêm mới, object = edit
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const res = await getAuthItems();
      if (res.success) {
        const list = res.data.filter(i => i.type === 1);
        setRoles(list);

        // Fetch số permission của mỗi role song song
        const counts = {};
        await Promise.all(
          list.map(async (r) => {
            try {
              const cRes = await getItemChildren(r.name);
              counts[r.name] = cRes.success ? cRes.data.length : 0;
            } catch {
              counts[r.name] = 0;
            }
          })
        );
        setPermCounts(counts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingRole(null);
    setFormData({ name: '', description: '' });
    setShowModal(true);
  };

  const openEditModal = (role) => {
    setEditingRole(role);
    setFormData({ name: role.name, description: role.description || '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRole(null);
    setFormData({ name: '', description: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Tên vai trò không được để trống');
      return;
    }
    try {
      if (editingRole) {
        await updateAuthItem(editingRole.name, { description: formData.description });
      } else {
        await createAuthItem({
          name: formData.name.trim(),
          type: 1,
          description: formData.description,
        });
      }
      closeModal();
      loadRoles();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (name) => {
    if (!window.confirm(`Xóa vai trò "${name}"? Mọi phân quyền và gán user sẽ bị gỡ.`)) return;
    try {
      await deleteAuthItem(name);
      setRoles(prev => prev.filter(r => r.name !== name));
      setPermCounts(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Xóa thất bại');
    }
  };

  const goToAssignPermissions = (roleName) => {
    navigate(`/auth/permissions?role=${encodeURIComponent(roleName)}`);
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
          <p className="content-subtitle">
            Tạo và quản lý vai trò. Mỗi vai trò có thể được gắn nhiều quyền truy cập.
          </p>
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
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={20} /> Thêm vai trò
        </button>
      </div>

      <div className="management-section">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
            Chưa có vai trò nào. Bấm "Thêm vai trò" để bắt đầu.
          </div>
        ) : (
          <table className="management-table">
            <thead>
              <tr>
                <th style={{ width: '20%' }}>TÊN VAI TRÒ</th>
                <th>MÔ TẢ</th>
                <th style={{ width: '15%', textAlign: 'center' }}>SỐ QUYỀN</th>
                <th style={{ width: '25%', textAlign: 'right' }}>HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(role => (
                <tr key={role.name}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Shield size={16} color="#3b82f6" />
                      <span style={{ fontWeight: '700' }}>{role.name}</span>
                    </div>
                  </td>
                  <td style={{ color: '#64748b' }}>{role.description || 'Chưa có mô tả'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        backgroundColor: (permCounts[role.name] ?? 0) > 0 ? '#dbeafe' : '#f1f5f9',
                        color: (permCounts[role.name] ?? 0) > 0 ? '#1e40af' : '#94a3b8',
                      }}
                    >
                      {permCounts[role.name] ?? 0} quyền
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="action-buttons" style={{ justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => goToAssignPermissions(role.name)}
                        title="Gán quyền cho vai trò này"
                        style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}
                      >
                        <Key size={14} /> Gán quyền
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => openEditModal(role)}
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn-icon delete"
                        onClick={() => handleDelete(role.name)}
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
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>{editingRole ? `Chỉnh sửa vai trò: ${editingRole.name}` : 'Thêm vai trò mới'}</h3>
              <button onClick={closeModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Tên vai trò * <span style={{ color: '#94a3b8', fontWeight: '400', fontSize: '0.75rem' }}>(chỉ dùng chữ không dấu, không khoảng trắng)</span></label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: admin, staff, receptionist..."
                  required
                  disabled={!!editingRole}
                />
                {editingRole && (
                  <small style={{ color: '#94a3b8' }}>Tên vai trò không thể thay đổi sau khi tạo.</small>
                )}
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Mô tả</label>
                <textarea
                  className="form-input textarea"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả chức năng của vai trò này"
                  style={{ minHeight: '100px' }}
                />
              </div>
              <div className="modal-footer" style={{ marginTop: '1rem', borderTop: 'none', padding: 0 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Hủy</button>
                <button type="submit" className="btn btn-primary">
                  {editingRole ? 'Lưu thay đổi' : 'Tạo vai trò'}
                </button>
              </div>
            </form>
            {editingRole && (
              <div style={{ padding: '0 1.5rem 1.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onClick={() => {
                    closeModal();
                    goToAssignPermissions(editingRole.name);
                  }}
                >
                  <Key size={16} /> Mở trang gán quyền cho "{editingRole.name}"
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
