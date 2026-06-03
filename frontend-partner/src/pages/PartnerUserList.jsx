import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Edit2, Trash2, Shield, User as UserIcon, Search } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { getUsers, deleteUser } from '../api/user.api';
import Pagination from '../components/Pagination';
import { useAuth } from '../hooks/useAuth';

export default function PartnerUserList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [keyword, setKeyword] = useState('');
  const limit = 20;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers({ page, limit, keyword });
      if (res) {
        let rowsData = [];
        if (Array.isArray(res.data)) {
          rowsData = res.data;
        } else if (res.data && Array.isArray(res.data.data)) {
          rowsData = res.data.data;
        } else if (Array.isArray(res)) {
          rowsData = res;
        }
        setRows(rowsData);
        setTotalPages(res.pagination?.totalPages || res.data?.pagination?.totalPages || 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [page, keyword]);

  const handleDelete = async (id) => {
    if (id === user.id) { alert('Bạn không thể xóa chính mình!'); return; }
    if (!window.confirm('Bạn có chắc muốn xóa tài khoản này?')) return;
    try {
      await deleteUser(id);
      fetchUsers();
    } catch (e) {
      alert(e.response?.data?.message || 'Lỗi xóa tài khoản');
    }
  };

  const totalManagers = rows.filter(r => r.partner_role === 'manager').length;
  const totalStaff = rows.filter(r => r.partner_role !== 'manager').length;

  return (
    <AdminLayout pageTitle="">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--gray-900)', margin: 0, letterSpacing: '-0.4px' }}>
            Quản lý tài khoản
          </h1>
          <p style={{ color: 'var(--gray-400)', fontSize: 14, margin: '4px 0 0' }}>
            {totalManagers} quản lý · {totalStaff} nhân viên trong nhóm
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/team/add')}
          style={{ borderRadius: 'var(--radius-full)', gap: 6 }}>
          <Plus size={16} /> Thêm nhân viên
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'white', border: '1.5px solid var(--gray-200)', borderRadius: 'var(--radius-full)', padding: '8px 16px', maxWidth: 380, transition: 'var(--transition)' }}>
          <Search size={15} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Tìm theo username, tên..."
            value={keyword}
            onChange={e => { setKeyword(e.target.value); setPage(1); }}
            style={{ border: 'none', background: 'none', outline: 'none', fontSize: 14, flex: 1, color: 'var(--gray-800)' }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-200)', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
        {loading ? (
          <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--gray-400)' }}>
            <Users size={36} style={{ opacity: 0.2, margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontSize: 14 }}>Đang tải...</p>
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--gray-400)' }}>
            <Users size={40} style={{ opacity: 0.2, margin: '0 auto 16px', display: 'block' }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--gray-500)' }}>Chưa có tài khoản nào</p>
            <p style={{ fontSize: 13, marginTop: 6 }}>Nhấn "Thêm nhân viên" để tạo tài khoản đầu tiên</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                  {['Tài khoản', 'Liên hệ', 'Phân quyền', 'Thao tác'].map((h, i) => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: i === 3 ? 'center' : 'left', fontSize: 10, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr
                    key={r.id}
                    style={{ borderBottom: '1px solid var(--gray-50)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-50)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: r.partner_role === 'manager'
                            ? 'linear-gradient(135deg, #7c3aed, #2563eb)'
                            : 'var(--gray-100)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: r.partner_role === 'manager' ? 'white' : 'var(--gray-500)',
                          fontSize: 12, fontWeight: 800, flexShrink: 0,
                        }}>
                          {String(r.display_name || r.username || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: 5 }}>
                            {r.display_name || r.username}
                            {r.id === user?.id && (
                              <span style={{ fontSize: 10, background: 'var(--primary-100)', color: 'var(--primary)', padding: '1px 6px', borderRadius: 99, fontWeight: 700 }}>
                                Bạn
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 1 }}>{r.username}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ color: 'var(--gray-700)', fontSize: 13 }}>{r.phone || '—'}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>{r.email || '—'}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {r.partner_role === 'manager' ? (
                        <span className="role-badge role-manager">
                          <Shield size={11} /> Quản lý
                        </span>
                      ) : (
                        <span className="role-badge role-staff">
                          <UserIcon size={11} /> Nhân viên
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button
                          title="Chỉnh sửa"
                          onClick={() => navigate(`/team/edit/${r.id}`)}
                          className="btn-icon edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          title={r.id === user?.id ? 'Không thể xóa chính mình' : 'Xóa tài khoản'}
                          onClick={() => handleDelete(r.id)}
                          disabled={r.id === user?.id}
                          className="btn-icon delete"
                          style={{ opacity: r.id === user?.id ? 0.35 : 1, cursor: r.id === user?.id ? 'not-allowed' : 'pointer' }}
                        >
                          <Trash2 size={13} />
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

      {totalPages > 1 && (
        <div style={{ marginTop: 16 }}>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </AdminLayout>
  );
}
