
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Home, Calendar, Users, BarChart3, Settings, LogOut, Activity } from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: Home, label: 'Bảng điều khiển', to: '/dashboard' },
    { icon: Activity, label: 'Chuyên khoa', to: '/specialisies/admin' },
    { icon: Users, label: 'Bác sĩ', to: '/clinic/admin' },
    { icon: BarChart3, label: 'Phòng khám', to: '/clinic-place/admin' },
    { icon: Calendar, label: 'Người dùng', to: '/users' },
    { icon: Settings, label: 'Cài đặt', to: '/settings' },
  ];

  const handleLogout = () => {
    navigate('/login');
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
