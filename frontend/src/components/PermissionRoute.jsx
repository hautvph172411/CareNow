import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Route guard kiểm tra permission.
 *
 * Props:
 *   - permission: string (permission name) - required
 *   - children: ReactNode
 *
 * Hành vi:
 *   - Chưa đăng nhập: TẠM THỜI cho phép (mode dev bypass).
 *     Khi bật lại đăng nhập thật, đổi thành <Navigate to="/" />
 *   - Đã đăng nhập nhưng chưa có quyền: redirect /403
 *   - Đang tải permissions: hiển thị loading
 */
export default function PermissionRoute({ permission, children }) {
  const { isAuthenticated, permissionsLoaded, hasPermission } = useAuth();

  // DEV BYPASS: nếu chưa đăng nhập thì vẫn cho xem (hệ thống đang bypass auth ở middleware)
  // Khi bật auth thật: thay đoạn dưới bằng:
  //   if (!isAuthenticated) return <Navigate to="/" replace />;
  if (!isAuthenticated) {
    return children;
  }

  if (!permissionsLoaded) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
        Đang kiểm tra quyền truy cập...
      </div>
    );
  }

  if (!hasPermission(permission)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}
