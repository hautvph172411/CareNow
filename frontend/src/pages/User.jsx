import { useState, useEffect } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import UserTable from '../components/User';   // component UserTable
import { fetchUsers, createUser, updateUser, deleteUser, toggleUserStatus } from '../api/user.api';

const EMPTY_FORM = {
  username: '',
  password: '',
  role: 0,      // 0 = user, 1 = admin
  status: 1,
};

export default function UserPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // ─── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => { loadUsers(); }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFiltered(
      users.filter((u) => u.username?.toLowerCase().includes(term))
    );
  }, [searchTerm, users]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetchUsers();
      setUsers(res.data || []);
    } catch (err) {
      console.error('Lỗi tải users:', err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Actions ───────────────────────────────────────────────────────────────
  const openAdd = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (user) => {
    setFormData({
      username: user.username,
      password: '',       // không điền lại password
      role: user.role,
      status: user.status,
    });
    setEditingId(user.id);
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username.trim()) {
      setError('Tên đăng nhập là bắt buộc');
      return;
    }
    if (!editingId && !formData.password.trim()) {
      setError('Mật khẩu là bắt buộc khi tạo mới');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      if (editingId) {
        const payload = { role: formData.role, status: formData.status };
        if (formData.password) payload.password = formData.password;
        await updateUser(editingId, payload);
        setUsers((prev) =>
          prev.map((u) => u.id === editingId ? { ...u, ...payload } : u)
        );
      } else {
        await createUser({
          username: formData.username,
          password: formData.password,
          role: formData.role,
        });
        await loadUsers(); // reload để lấy id mới từ server
      }
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn xoá người dùng này?')) return;
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Xoá thất bại');
    }
  };

  const handleToggleStatus = async (id, newStatus) => {
    try {
      await toggleUserStatus(id, newStatus);
      setUsers((prev) =>
        prev.map((u) => u.id === id ? { ...u, status: newStatus } : u)
      );
    } catch (err) {
      alert('Cập nhật trạng thái thất bại');
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <AdminLayout pageTitle="Quản lý người dùng">

      {/* Toolbar */}
      <div className="management-header">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Tìm theo tên đăng nhập..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/users/add')}>
          <Plus size={18} />
          Thêm người dùng
        </button>
      </div>

      {/* Stats */}
      <div className="doctor-stats-row">
        <div className="doctor-stat-chip">
          Tổng: <strong style={{ marginLeft: 4 }}>{users.length}</strong>
        </div>
        <div className="doctor-stat-chip active">
          Hoạt động: <strong style={{ marginLeft: 4 }}>{users.filter(u => u.status === 1).length}</strong>
        </div>
        <div className="doctor-stat-chip inactive">
          Khoá: <strong style={{ marginLeft: 4 }}>{users.filter(u => u.status !== 1).length}</strong>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="empty-state">
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : (
        <UserTable
          users={filtered}
          onEdit={openEdit}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
        />
      )}

      <div className="table-footer">
        <span>Hiển thị {filtered.length} / {users.length} người dùng</span>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingId ? '✏️ Chỉnh sửa người dùng' : '➕ Thêm người dùng mới'}</h2>
              <button className="modal-close" onClick={closeModal}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              {error && <div className="error-text">{error}</div>}

              <div className="form-row">

                {/* Username */}
                <div className="form-group">
                  <label>Tên đăng nhập <span style={{color: 'red'}}>*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="VD: nguyenvana"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    disabled={!!editingId}  // không đổi username khi edit
                    required
                  />
                </div>

                {/* Password */}
                <div className="form-group">
                  <label>
                    Mật khẩu {editingId && <span style={{ fontWeight: 400, color: '#9ca3af' }}>(để trống nếu không đổi)</span>}
                    {!editingId && <span style={{color: 'red'}}> *</span>}
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>

                {/* Role */}
                <div className="form-group">
                  <label>Vai trò</label>
                  <select
                    className="form-input"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: Number(e.target.value) })}
                  >
                    <option value={0}>User</option>
                    <option value={1}>Admin</option>
                  </select>
                </div>

                {/* Status */}
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select
                    className="form-input"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) })}
                  >
                    <option value={1}>Hoạt động</option>
                    <option value={0}>Khoá</option>
                  </select>
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang xử lý...' : editingId ? 'Cập nhật' : 'Thêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
