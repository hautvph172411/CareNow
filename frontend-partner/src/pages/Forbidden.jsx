import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Forbidden() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="forbidden-page">
      <div className="forbidden-card">
        <div className="forbidden-icon">
          <ShieldAlert size={56} />
        </div>
        <h1 className="forbidden-code">403</h1>
        <h2 className="forbidden-title">Không có quyền truy cập</h2>
        <p className="forbidden-desc">
          Tài khoản <strong>{user?.display_name || user?.username || 'của bạn'}</strong> không
          được phân quyền để truy cập trang này. Vui lòng liên hệ quản trị viên để được cấp quyền.
        </p>
        <div className="forbidden-actions">
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Quay lại
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/welcome')}>
            <Home size={16} /> Về trang chính
          </button>
        </div>
      </div>
    </div>
  );
}
