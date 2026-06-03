import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LogOut, ChevronLeft, ChevronRight, LayoutDashboard,
  CalendarClock, CalendarCheck, Users, Stethoscope,
} from 'lucide-react';
import { useAuth } from "../hooks/useAuth";
import { getAllSettings } from "../api/settings.api";

const MAIN_MENU = [
  { icon: LayoutDashboard, label: 'Trang chủ', to: '/welcome' },
];

const PARTNER_MENU = [
  { icon: CalendarCheck,  label: 'Lịch hẹn',       to: '/appointments', managerOnly: false },
  { icon: CalendarClock,  label: 'Lịch làm việc',   to: '/schedule',     managerOnly: false },
  { icon: Users,          label: 'Tài khoản nhóm',  to: '/team',         managerOnly: true  },
];

export default function Sidebar({ isOpen, isCollapsed = false, onClose, onToggleCollapse }) {
  const location = useLocation();
  const { logout, isManager, user } = useAuth();
  const [siteLogo, setSiteLogo] = useState('');

  useEffect(() => {
    getAllSettings()
      .then(res => { if (res?.data?.site_logo) setSiteLogo(res.data.site_logo); })
      .catch(() => {});
  }, []);

  const visiblePartner = PARTNER_MENU.filter(item => !item.managerOnly || isManager);
  const initials = (user?.display_name || user?.username || 'U')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Collapse toggle */}
        <button
          type="button"
          className="sidebar-collapse-toggle"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Header */}
        <div className="sidebar-header">
          {siteLogo ? (
            <img src={siteLogo} alt="Logo" style={{ height: 36, maxWidth: 36, objectFit: 'contain', borderRadius: 8 }} />
          ) : (
            <div className="sidebar-logo">
              <Stethoscope size={18} />
            </div>
          )}
          <div style={{ overflow: 'hidden' }}>
            <div className="sidebar-brand">CareNow</div>
            <span className="sidebar-brand-sub">Cổng Đối tác</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-menu">
          {/* Main */}
          {MAIN_MENU.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to || location.pathname === '/';
            return (
              <Link key={item.to} to={item.to}
                className={`sidebar-menu-item ${isActive ? 'active' : ''}`}
                title={isCollapsed ? item.label : undefined}>
                <span className="sidebar-icon-wrap"><Icon size={18} /></span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Partner section */}
          {visiblePartner.length > 0 && (
            <>
              <div className="sidebar-section-label">Quản lý</div>
              {visiblePartner.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.to);
                return (
                  <Link key={item.to} to={item.to}
                    className={`sidebar-menu-item ${isActive ? 'active' : ''}`}
                    title={isCollapsed ? item.label : undefined}>
                    <span className="sidebar-icon-wrap"><Icon size={18} /></span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User info + logout */}
        <div className="sidebar-footer">
          {!isCollapsed && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              background: 'var(--gray-50)', borderRadius: 'var(--radius)', marginBottom: 8
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--gradient-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 12, fontWeight: 700, flexShrink: 0
              }}>
                {initials}
              </div>
              <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-800)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.display_name || user?.username}
                </div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                  {isManager ? '👑 Quản lý' : '👤 Nhân viên'}
                </div>
              </div>
            </div>
          )}
          <button className="sidebar-logout" onClick={() => logout()}
            title={isCollapsed ? 'Đăng xuất' : undefined}>
            <span className="sidebar-icon-wrap"><LogOut size={18} /></span>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
}
