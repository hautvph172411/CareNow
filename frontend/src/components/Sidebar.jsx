import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { 
  Home, Users, BarChart3, Settings, LogOut, 
  Activity, Handshake, Shield, Briefcase, 
  Lock, ChevronDown, ChevronRight, Key, Zap
} from 'lucide-react';
import { useAuth } from "../hooks/useAuth";

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(location.pathname.startsWith('/auth'));

  const menuItems = [
    { icon: Home, label: 'Bảng điều khiển', to: '/dashboard' },
    { icon: Activity, label: 'Chuyên khoa', to: '/specialisies/admin' },
    { icon: Users, label: 'Bác sĩ', to: '/clinic/admin' },
    { icon: Handshake, label: 'Đối tác', to: '/partner/admin' },
  ];

  const userMenuItems = [
    { icon: Shield, label: 'TK Quản trị', to: '/users/admin' },
    { icon: Briefcase, label: 'TK Đối tác', to: '/users/partner' },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose}></div>
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">BC</div>
          <h1 className="sidebar-brand">CareNow</h1>
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link key={idx} to={item.to} className={`sidebar-menu-item ${isActive ? 'active' : ''}`}>
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Collapsible Phân quyền */}
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
                <Link to="/auth/roles" className={`sidebar-sub-item ${location.pathname === '/auth/roles' ? 'active' : ''}`}>
                  <Shield size={16} />
                  <span>Vai trò</span>
                  <span className="badge">5</span>
                </Link>
                <Link to="/auth/permissions" className={`sidebar-sub-item ${location.pathname === '/auth/permissions' ? 'active' : ''}`}>
                  <Zap size={16} />
                  <span>Phân quyền</span>
                  <span className="badge primary">12</span>
                </Link>
              </div>
            )}
          </div>

          <div className="sidebar-divider">QUẢN LÝ USER</div>
          
          {userMenuItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link key={idx} to={item.to} className={`sidebar-menu-item ${isActive ? 'active' : ''}`}>
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
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
