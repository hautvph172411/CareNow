import { Edit2, Trash2, Lock, Unlock } from 'lucide-react';

// DB schema: { id, username, status (0/1), created_at (unix timestamp) }
export default function UserTable({ users, onEdit, onDelete, onToggleStatus }) {
  const formatDate = (unix) => {
    if (!unix) return '—';
    return new Date(unix * 1000).toLocaleDateString('vi-VN');
  };

  const roleLabel = (role) => {
    // eslint-disable-next-line eqeqeq
    if (role == 1) return { text: 'Admin', cls: 'role-admin' };
    return { text: 'User', cls: 'role-user' };
  };

  return (
    <div className="table-wrapper">
      <table className="management-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Tên đăng nhập</th>
            <th>Vai trò</th>
            <th>Trạng thái</th>
            <th>Ngày tạo</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                Không có dữ liệu
              </td>
            </tr>
          ) : (
            users.map((user, idx) => {
              const role = roleLabel(user.role);
              return (
                <tr key={user.id}>
                  <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{idx + 1}</td>
                  <td className="user-name">{user.username}</td>
                  <td>
                    <span className={`role-badge ${role.cls}`}>{role.text}</span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.status === 1 ? 'status-active' : 'status-inactive'}`}>
                      {user.status === 1 ? 'Hoạt động' : 'Khoá'}
                    </span>
                  </td>
                  <td>{formatDate(user.created_at)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => onEdit(user)}
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        className={`action-btn toggle-btn ${user.status === 1 ? 'lock' : 'unlock'}`}
                        onClick={() => onToggleStatus(user.id, user.status === 1 ? 0 : 1)}
                        title={user.status === 1 ? 'Khoá tài khoản' : 'Mở khoá'}
                      >
                        {user.status === 1 ? <Lock size={15} /> : <Unlock size={15} />}
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => onDelete(user.id)}
                        title="Xoá"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
