import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Route guard cho Partner Portal.
 * - Chưa đăng nhập → redirect về trang login
 * - managerOnly=true + user là staff → redirect /403
 */
export default function PermissionRoute({ children, managerOnly = false }) {
  const { isAuthenticated, isManager, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Đang kiểm tra phiên đăng nhập...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (managerOnly && !isManager) {
    return <Navigate to="/403" replace />;
  }

  return children;
}
