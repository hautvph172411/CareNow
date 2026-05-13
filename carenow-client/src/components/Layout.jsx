import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Calendar, Heart, BookOpen, ClipboardList, Stethoscope,
  Menu, X, Phone, Mail, MapPin, Facebook, Youtube,
  User, LogOut, LogIn,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate("/");
  };

  const navLinks = [
    { to: "/", label: "Trang chủ", icon: Heart },
    { to: "/dich-vu", label: "Dịch vụ", icon: ClipboardList },
    { to: "/dat-lich", label: "Đặt lịch", icon: Calendar },
    { to: "/lich-cua-toi", label: "Lịch của tôi", icon: ClipboardList },
    { to: "/cam-nang-y-te", label: "Cẩm nang Y tế", icon: BookOpen },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top bar */}
      <div style={{ backgroundColor: "#1a6fa3" }} className="text-white py-2 text-sm hidden md:block">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <Phone className="size-3.5" />
              Hotline: <strong>1900-2345</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="size-3.5" />
              support@carenow.vn
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              123 Nguyễn Huệ, Q.1, TP.HCM
            </span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <Link to="/" className="flex items-center gap-3">
              <div
                className="flex items-center justify-center size-10 rounded-xl text-white"
                style={{ backgroundColor: "#3498db" }}
              >
                <Stethoscope className="size-6" />
              </div>
              <div>
                <h1 className="text-xl font-semibold" style={{ color: "#3498db" }}>CareNow</h1>
                <p className="text-xs text-gray-500">Đặt lịch khám nhanh chóng</p>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                    isActive(link.to)
                      ? "text-white"
                      : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                  style={isActive(link.to) ? { backgroundColor: "#3498db" } : {}}
                >
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>

            {/* Desktop CTA + auth */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen((s) => !s)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name || "Avatar"}
                        className="size-8 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div
                        className="size-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                        style={{ backgroundColor: "#3498db" }}
                      >
                        {(user?.full_name || user?.email || "U").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
                      {user?.full_name || user?.email}
                    </span>
                  </button>
                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <div className="text-sm font-semibold text-gray-800 truncate">
                            {user?.full_name || "Người dùng"}
                          </div>
                          <div className="text-xs text-gray-500 truncate">{user?.email}</div>
                        </div>
                        <Link
                          to="/lich-cua-toi"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Calendar className="size-4" /> Lịch của tôi
                        </Link>
                        <Link
                          to="/ho-so"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <User className="size-4" /> Hồ sơ
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100"
                        >
                          <LogOut className="size-4" /> Đăng xuất
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-colors text-sm font-medium"
                >
                  <LogIn className="size-4" />
                  Đăng nhập
                </Link>
              )}

              <Link
                to="/dat-lich"
                className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg"
                style={{ backgroundColor: "#3498db" }}
              >
                <Calendar className="size-4" />
                <span className="text-sm font-medium">Đặt lịch ngay</span>
              </Link>
            </div>

            {/* Mobile menu btn */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white pb-4">
            <div className="container mx-auto px-4 pt-3 flex flex-col gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      isActive(link.to)
                        ? "text-white"
                        : "text-gray-700 hover:bg-blue-50"
                    }`}
                    style={isActive(link.to) ? { backgroundColor: "#3498db" } : {}}
                  >
                    <Icon className="size-5" />
                    <span className="font-medium">{link.label}</span>
                  </Link>
                );
              })}
              {!isAuthenticated && (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 border border-gray-200"
                >
                  <LogIn className="size-5" />
                  <span className="font-medium">Đăng nhập</span>
                </Link>
              )}
              {isAuthenticated && (
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 border border-red-100"
                >
                  <LogOut className="size-5" />
                  <span className="font-medium">Đăng xuất ({user?.full_name || user?.email})</span>
                </button>
              )}
              <Link
                to="/dat-lich"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 flex items-center justify-center gap-2 text-white py-3 rounded-xl"
                style={{ backgroundColor: "#3498db" }}
              >
                <Calendar className="size-5" />
                <span className="font-medium">Đặt lịch ngay</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="text-white pt-12 pb-6" style={{ backgroundColor: "#1a3a5c" }}>
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center size-10 rounded-xl bg-white/10">
                  <Stethoscope className="size-6 text-white" />
                </div>
                <div>
                  <div className="text-lg font-semibold">CareNow</div>
                  <div className="text-xs opacity-70">Chăm sóc sức khỏe</div>
                </div>
              </div>
              <p className="text-sm opacity-75 leading-relaxed">
                Hệ thống đặt lịch khám bệnh trực tuyến hàng đầu, kết nối bệnh nhân với đội ngũ bác sĩ chuyên nghiệp.
              </p>
              <div className="flex gap-3 mt-4">
                <a href="#" className="size-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                  <Facebook className="size-4" />
                </a>
                <a href="#" className="size-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                  <Youtube className="size-4" />
                </a>
              </div>
            </div>

            {/* Dịch vụ */}
            <div>
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider opacity-50">Dịch vụ</h3>
              <ul className="space-y-2 text-sm opacity-75">
                <li><Link to="/dich-vu" className="hover:opacity-100 transition-opacity hover:text-blue-300">Khám Chuyên khoa</Link></li>
                <li><Link to="/dich-vu" className="hover:opacity-100 transition-opacity hover:text-blue-300">Khám Tổng quát</Link></li>
                <li><Link to="/dich-vu" className="hover:opacity-100 transition-opacity hover:text-blue-300">Khám Nha khoa</Link></li>
                <li><Link to="/dat-lich" className="hover:opacity-100 transition-opacity hover:text-blue-300">Đặt lịch khám</Link></li>
              </ul>
            </div>

            {/* Liên hệ */}
            <div>
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider opacity-50">Liên hệ</h3>
              <ul className="space-y-3 text-sm opacity-75">
                <li className="flex items-start gap-2">
                  <Phone className="size-4 mt-0.5 shrink-0" />
                  <span>Hotline: <strong className="text-white">1900-2345</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <Mail className="size-4 mt-0.5 shrink-0" />
                  <span>support@carenow.vn</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="size-4 mt-0.5 shrink-0" />
                  <span>123 Nguyễn Huệ, Q.1, TP.HCM</span>
                </li>
              </ul>
            </div>

            {/* Giờ làm việc */}
            <div>
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider opacity-50">Giờ làm việc</h3>
              <ul className="space-y-2 text-sm opacity-75">
                <li className="flex justify-between"><span>Thứ 2 – Thứ 6</span><strong className="text-white">7:00 – 20:00</strong></li>
                <li className="flex justify-between"><span>Thứ 7</span><strong className="text-white">7:00 – 17:00</strong></li>
                <li className="flex justify-between"><span>Chủ nhật</span><strong className="text-white">8:00 – 12:00</strong></li>
              </ul>
              <div className="mt-4 flex items-center gap-2">
                <span className="inline-block size-2 rounded-full bg-green-400 animate-pulse"></span>
                <span className="text-sm text-green-400">Đang mở cửa</span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs opacity-50">
            <span>© 2026 CareNow. Bản quyền thuộc về CareNow.</span>
            <div className="flex gap-4">
              <a href="#" className="hover:opacity-100">Chính sách bảo mật</a>
              <a href="#" className="hover:opacity-100">Điều khoản sử dụng</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
