import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  Home, Users, LogOut,
  Activity, Handshake, Shield, Briefcase,
  Lock, ChevronDown, ChevronRight, Zap, Sparkles, Building2
} from 'lucide-react';
import { useAuth } from "../hooks/useAuth";

/**
 * Mỗi item gắn với 1 permission name (đồng bộ với src/config/features.js).
 * Sidebar tự lọc các item user không có quyền.
 * Item có permission=null thì luôn hiển thị.
 */
const MAIN_MENU = [
  { icon: Sparkles,   label: 'Trang chủ',       to: '/welcome',              permission: null },
  { icon: Home,       label: 'Bảng điều khiển', to: '/dashboard',            permission: 'view_dashboard' },
  { icon: Activity,   label: 'Chuyên khoa',     to: '/specialties/admin',   permission: 'manage_specialty' },
  { icon: Users,      label: 'Bác sĩ',          to: '/clinic/admin',         permission: 'manage_clinic' },
  { icon: Building2,  label: 'Nơi khám',        to: '/clinic-place/admin',   permission: 'manage_clinic_place' },
  { icon: Handshake,  label: 'Đối tác',         to: '/partner/admin',        permission: 'manage_partner' },
];

const AUTH_SUB_MENU = [
  { icon: Shield, label: 'Vai trò',    to: '/auth/roles',       permission: 'manage_role' },
  { icon: Zap,    label: 'Phân quyền', to: '/auth/permissions', permission: 'manage_permission' },
];

const USER_MENU = [
  { icon: Shield,    label: 'TK Quản trị', to: '/users/admin',   permission: 'manage_admin_user' },
  { icon: Briefcase, label: 'TK Đối tác',  to: '/users/partner', permission: 'manage_partner_user' },
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { logout, hasPermission, isAuthenticated } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(location.pathname.startsWith('/auth'));

  // Helper: hiển thị item nếu không yêu cầu quyền, HOẶC user có quyền, HOẶC đang dev bypass.
  const canShow = (permission) => !permission || !isAuthenticated || hasPermission(permission);

  const visibleMain = MAIN_MENU.filter(i => canShow(i.permission));
  const visibleAuth = AUTH_SUB_MENU.filter(i => canShow(i.permission));
  const visibleUser = USER_MENU.filter(i => canShow(i.permission));

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">BC</div>
          <h1 className="sidebar-brand">CareNow</h1>
        </div>

        <nav className="sidebar-menu">
          {visibleMain.map((item, idx) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link key={idx} to={item.to} className={`sidebar-menu-item ${isActive ? 'active' : ''}`}>
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {visibleAuth.length > 0 && (
            <div className="sidebar-group">
              <button
                className={`sidebar-menu-item group-header ${isAuthOpen ? 'open' : ''}`}
                onClick={() => setIsAuthOpen(!isAuthOpen)}
              >
                <div className="header-left">
                  <Lock size={20} />
                  <span>Phân quyền</span>
                </div>
                {isAuthOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {isAuthOpen && (
                <div className="sidebar-sub-menu">
                  {visibleAuth.map((item, idx) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.to;
                    return (
                      <Link
                        key={idx}
                        to={item.to}
                        className={`sidebar-sub-item ${isActive ? 'active' : ''}`}
                      >
                        <Icon size={16} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {visibleUser.length > 0 && (
            <>
              <div className="sidebar-divider">QUẢN LÝ USER</div>
              {visibleUser.map((item, idx) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <Link key={idx} to={item.to} className={`sidebar-menu-item ${isActive ? 'active' : ''}`}>
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
}
