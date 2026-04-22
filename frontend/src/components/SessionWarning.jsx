import { useAuth } from "../hooks/useAuth";

export default function SessionWarning() {
  const { showWarning, extendSession, logout } = useAuth();

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Phiên sắp hết hạn
        </h3>
        <p className="text-gray-600 mb-4">
          Bạn đã không hoạt động trong một thời gian. Phiên làm việc sẽ tự động
          đăng xuất sau <strong>5 phút</strong> nữa.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => logout()}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Đăng xuất
          </button>
          <button
            onClick={extendSession}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tiếp tục làm việc
          </button>
        </div>
      </div>
    </div>
  );
}
