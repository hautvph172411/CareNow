import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { Stethoscope, AlertCircle, ArrowLeft, ShieldCheck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { googleLogin } from "../api/auth.api";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/";
  const hasGoogleClientId = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setLoading(true);
    try {
      const idToken = credentialResponse.credential;
      if (!idToken) {
        throw new Error("Không nhận được Google ID token");
      }

      const res = await googleLogin(idToken);
      const { token, patient } = res.data.data;
      login(token, patient);
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Đăng nhập Google thất bại. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Đăng nhập Google bị huỷ hoặc lỗi. Vui lòng thử lại.");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "linear-gradient(135deg, #1a6fa3 0%, #3498db 50%, #5dade2 100%)" }}
    >
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-white/90 hover:text-white text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="size-4" /> Về trang chủ
        </Link>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="flex items-center justify-center size-12 rounded-xl text-white"
              style={{ backgroundColor: "#3498db" }}
            >
              <Stethoscope className="size-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">CareNow</h1>
              <p className="text-xs text-gray-500">Chăm sóc sức khỏe của bạn</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-1">Chào mừng bạn</h2>
          <p className="text-sm text-gray-500 mb-6">
            Đăng nhập bằng Google để đặt lịch khám và theo dõi sức khỏe của bạn
          </p>

          {error && (
            <div className="flex items-start gap-2 p-3 mb-4 bg-red-50 text-red-600 rounded-lg text-sm">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!hasGoogleClientId && (
            <div className="flex items-start gap-2 p-3 mb-4 bg-amber-50 text-amber-700 rounded-lg text-xs">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>
                Chưa cấu hình <code className="font-mono">VITE_GOOGLE_CLIENT_ID</code> trong{" "}
                <code className="font-mono">.env</code>. Đăng nhập sẽ không hoạt động cho đến khi
                được thiết lập.
              </span>
            </div>
          )}

          {/* Google Sign-In Button */}
          <div className={`flex justify-center my-6 ${loading ? "opacity-50 pointer-events-none" : ""}`}>
            {hasGoogleClientId ? (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme="filled_blue"
                size="large"
                shape="rectangular"
                text="signin_with"
                locale="vi"
                width="320"
              />
            ) : (
              <button
                disabled
                className="w-full py-3 rounded-lg border border-gray-300 text-gray-400 text-sm font-medium cursor-not-allowed"
              >
                Đăng nhập với Google (chưa cấu hình)
              </button>
            )}
          </div>

          {loading && (
            <p className="text-center text-sm text-gray-500">Đang xử lý đăng nhập...</p>
          )}

          {/* Trust info */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-start gap-2 text-xs text-gray-500">
              <ShieldCheck className="size-4 shrink-0 mt-0.5 text-green-600" />
              <p>
                CareNow sử dụng Google Sign-In để đảm bảo bảo mật. Chúng tôi chỉ lưu thông tin cơ
                bản (tên, email, ảnh đại diện) để tạo tài khoản cho bạn.
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-500 mt-6">
            Bằng việc đăng nhập, bạn đồng ý với{" "}
            <a href="#" className="text-primary hover:underline">Điều khoản sử dụng</a> và{" "}
            <a href="#" className="text-primary hover:underline">Chính sách bảo mật</a> của CareNow.
          </p>
        </div>
      </div>
    </div>
  );
}
