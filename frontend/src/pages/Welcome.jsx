import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, Activity, Users, Handshake, Shield, Briefcase,
  Zap, Lock, Building2, ArrowRight, Sparkles, Calendar, LayoutGrid
} from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { useAuth } from '../hooks/useAuth';
import { FEATURES } from '../config/features';
import '../styles/welcome.css';

// Map mỗi permission -> icon + màu để render card
const FEATURE_VISUAL = {
  view_dashboard:       { icon: Home,       color: '#3b82f6', bg: '#dbeafe' },
  manage_specialty:     { icon: Activity,   color: '#10b981', bg: '#d1fae5' },
  manage_clinic:        { icon: Users,      color: '#8b5cf6', bg: '#ede9fe' },
  manage_clinic_place:  { icon: Building2,  color: '#f59e0b', bg: '#fef3c7' },
  manage_partner:       { icon: Handshake,  color: '#ec4899', bg: '#fce7f3' },
  manage_admin_user:    { icon: Shield,     color: '#ef4444', bg: '#fee2e2' },
  manage_partner_user:  { icon: Briefcase,  color: '#14b8a6', bg: '#ccfbf1' },
  manage_role:          { icon: Lock,       color: '#6366f1', bg: '#e0e7ff' },
  manage_permission:    { icon: Zap,        color: '#f97316', bg: '#ffedd5' },
};

const DAYS_OF_WEEK = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

const formatDateVN = (date) => {
  const dayName = DAYS_OF_WEEK[date.getDay()];
  return `${dayName}, ngày ${date.getDate()} tháng ${date.getMonth() + 1} năm ${date.getFullYear()}`;
};

const getGreetingByHour = () => {
  const h = new Date().getHours();
  if (h < 11) return 'Chào buổi sáng';
  if (h < 14) return 'Chào buổi trưa';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
};

export default function Welcome() {
  const navigate = useNavigate();
  const { user, permissions, permissionsLoaded, hasPermission, isAuthenticated } = useAuth();

  const today = useMemo(() => new Date(), []);

  // Các feature user có quyền - nếu chưa đăng nhập (dev bypass) thì hiển thị hết
  const accessibleFeatures = useMemo(() => {
    if (!isAuthenticated) return FEATURES;
    return FEATURES.filter(f => hasPermission(f.name));
  }, [isAuthenticated, permissions, hasPermission]);

  const displayName = user?.display_name || user?.username || 'Bạn';
  const greeting = getGreetingByHour();

  const initial = (displayName || '?').trim().charAt(0).toUpperCase();

  return (
    <AdminLayout pageTitle="Trang chủ">
      <div className="welcome-hero">
        <div className="welcome-hero-left">
          <div className="welcome-avatar">{initial}</div>
          <div>
            <div className="welcome-greeting">
              <Sparkles size={18} />
              <span>{greeting}</span>
            </div>
            <h1 className="welcome-name">{displayName}!</h1>
            <div className="welcome-date">
              <Calendar size={16} />
              <span>{formatDateVN(today)}</span>
            </div>
          </div>
        </div>
        <div className="welcome-hero-right">
          <div className="welcome-stat-card">
            <div className="welcome-stat-label">Chức năng khả dụng</div>
            <div className="welcome-stat-value">
              {accessibleFeatures.length}
              <span>/{FEATURES.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="welcome-section">
        <div className="welcome-section-header">
          <LayoutGrid size={20} />
          <div>
            <h2 className="welcome-section-title">Chức năng của bạn</h2>
            <p className="welcome-section-subtitle">
              Các tính năng bạn đã được phân quyền. Bấm để truy cập.
            </p>
          </div>
        </div>

        {!permissionsLoaded && isAuthenticated ? (
          <div className="welcome-loading">Đang tải danh sách chức năng...</div>
        ) : accessibleFeatures.length === 0 ? (
          <div className="welcome-empty">
            <Shield size={40} />
            <h3>Chưa được phân quyền</h3>
            <p>
              Tài khoản của bạn hiện chưa được cấp quyền truy cập chức năng nào.
              Vui lòng liên hệ quản trị viên để được hỗ trợ.
            </p>
          </div>
        ) : (
          <div className="welcome-grid">
            {accessibleFeatures.map(f => {
              const visual = FEATURE_VISUAL[f.name] || { icon: LayoutGrid, color: '#64748b', bg: '#f1f5f9' };
              const Icon = visual.icon;
              const targetUrl = f.urls?.[0] || '/';

              return (
                <button
                  key={f.name}
                  className="welcome-card"
                  onClick={() => navigate(targetUrl)}
                >
                  <div
                    className="welcome-card-icon"
                    style={{ backgroundColor: visual.bg, color: visual.color }}
                  >
                    <Icon size={26} />
                  </div>
                  <div className="welcome-card-body">
                    <div className="welcome-card-title">{f.label}</div>
                    <div className="welcome-card-desc">{f.description}</div>
                  </div>
                  <div className="welcome-card-arrow">
                    <ArrowRight size={18} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
