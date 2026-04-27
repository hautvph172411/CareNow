import { loginAdmin } from "../api/auth.api";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from 'react';
import { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'
import '../styles/login.css'

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [expiredMessage, setExpiredMessage] = useState('')

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  // Check for expired session
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const expired = params.get('expired');
    const reason = params.get('reason');

    if (expired) {
      if (reason === 'inactive') {
        setExpiredMessage('Phiên làm việc đã hết hạn do không hoạt động. Vui lòng đăng nhập lại.');
      } else {
        setExpiredMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
      // Clear the query params
      navigate('/', { replace: true });
    }
  }, [location, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setExpiredMessage(''); // Clear any expired message

    try {
      const res = await loginAdmin(form);
      // Backend trả { success, data: { token, user } } -> phải bóc lớp data
      const payload = res.data?.data || res.data;
      const { token, user } = payload;
      if (!token || !user) {
        throw new Error('Phản hồi đăng nhập không hợp lệ');
      }

      // role = 1 là admin trong DB
      // eslint-disable-next-line eqeqeq
      /* Tạm thời bỏ check role để test cho nhân viên mới
      if (user.role != 1) {
        alert("Tài khoản này không có quyền truy cập trang quản trị!");
        return;
      }
      */

      // Use AuthContext login
      login(token, user);

      // Mọi user đều vào /welcome trước - từ đó sẽ thấy các chức năng được cấp quyền.
      // User có quyền view_dashboard có thể bấm thẻ "Bảng điều khiển" hoặc dùng sidebar.
      navigate("/welcome");

    } catch (error) {
      console.error("Login error:", error);
      // Hiển thị thông báo lỗi chi tiết từ server gửi về
      const message = error.response?.data?.message || "Sai tài khoản hoặc mật khẩu";
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="login-container">
      <div className="login-bg">
        <div className="login-bg-accent top-accent"></div>
        <div className="login-bg-accent bottom-accent"></div>
      </div>

      <div className="login-content">
        <div className="login-grid">
          {/* Left Side - Info Section */}
          <div className="login-left">
            <div className="login-branding">
              <div className="login-logo">BC</div>
              <h1 className="login-brand-name">CareNow</h1>
            </div>
            <h2 className="login-title">Quản lý khám chữa bệnh</h2>
            <p className="login-description">
              Nền tảng quản trị toàn diện cho bác sĩ và cơ sở y tế. Quản lý lịch hẹn, bệnh nhân, dữ liệu y tế một cách dễ dàng.
            </p>

            <div className="login-features">
              {[
                { title: 'Quản lý lịch hẹn', desc: 'Xem và quản lý tất cả lịch khám' },
                { title: 'Bảo mật cao', desc: 'Bảo vệ dữ liệu bệnh nhân theo chuẩn y tế' },
                { title: 'Hỗ trợ 24/7', desc: 'Đội hỗ trợ kỹ thuật luôn sẵn sàng' }
              ].map((feature, idx) => (
                <div key={idx} className="login-feature">
                  <div className="login-feature-icon">
                    <CheckCircle size={16} />
                  </div>
                  <div>
                    <p className="login-feature-title">{feature.title}</p>
                    <p className="login-feature-desc">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="login-testimonial">
              <p className="login-testimonial-text">
                "CareNow giúp tôi quản lý bệnh nhân dễ dàng hơn. Giao diện thân thiện và hiệu quả."
              </p>
              <div className="login-testimonial-author">
                <div className="login-testimonial-avatar">NV</div>
                <div>
                  <p className="login-testimonial-name">Dr. Nguyễn Văn A</p>
                  <p className="login-testimonial-role">Bác sĩ Tim Mạch</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="login-right">
            <div className="login-form-card">
              <div className="login-form-header">
                <h2 className="login-form-title">Đăng nhập</h2>
                <p className="login-form-subtitle">Nhập thông tin tài khoản quản trị</p>
              </div>

              {/* Session Expired Alert */}
              {expiredMessage && (
                <div className="session-expired-alert">
                  <AlertCircle size={18} />
                  <span>{expiredMessage}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="login-form">
                {/* Email Field */}
                <div className="login-field">
                  <label htmlFor="email" className="login-label">Email</label>
                  <div className="login-input-wrapper">
                    <Mail size={20} className="login-input-icon" />
                    <input
                      id="email"
                      type="text"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      placeholder="admin@carenow.vn"
                      className="login-input"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="login-field">
                  <label htmlFor="password" className="login-label">Mật khẩu</label>
                  <div className="login-input-wrapper">
                    <Lock size={20} className="login-input-icon" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="••••••••"
                      className="login-input"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="login-password-toggle"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Remember & Forgot */}
                <div className="login-options">
                  <label className="login-checkbox">
                    <input type="checkbox" />
                    <span>Ghi nhớ tôi</span>
                  </label>
                  <a href="#" className="login-forgot">Quên mật khẩu?</a>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="submit-button"
                >
                  {isLoading ? (
                    <>
                      <div className="spinner"></div>
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <>
                      <span>Đăng Nhập</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              {/* Demo Info */}
              <div className="login-demo">
                <p className="login-demo-title">Tài khoản demo:</p>
                <p className="login-demo-text">Email: admin@carenow.vn</p>
                <p className="login-demo-text">Mật khẩu: demo123456</p>
              </div>

              {/* Footer Links */}
              <div className="login-footer">
                <a href="#" onClick={(e) => e.preventDefault()}>Chính sách bảo mật</a>
                <a href="#" onClick={(e) => e.preventDefault()}>Điều khoản</a>
                <a href="#" onClick={(e) => e.preventDefault()}>Hỗ trợ</a>
              </div>
            </div>

            {/* Mobile Brand */}
            <div className="login-mobile-brand">
              <div className="login-mobile-logo">BC</div>
              <div className="login-mobile-name">CareNow</div>
              <p className="login-mobile-desc">Quản lý khám chữa bệnh</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
