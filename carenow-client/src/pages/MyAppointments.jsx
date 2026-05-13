import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar, User, MapPin, FileText, X,
  Clock, Building2, Stethoscope, AlertCircle,
  Loader2, RefreshCw, Phone, Plus, ChevronRight,
  CheckCircle, Info,
} from "lucide-react";
import { getMyAppointments, cancelAppointment } from "../api/appointment.api";
import { useAuth } from "../contexts/AuthContext";

/* ── Helpers ────────────────────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  1: { label: "Chờ xác nhận",    badge: "bg-yellow-100 text-yellow-800", dot: "bg-yellow-400" },
  2: { label: "Đã xác nhận",     badge: "bg-green-100  text-green-800",  dot: "bg-green-500"  },
  3: { label: "Đã khám xong",    badge: "bg-blue-100   text-blue-800",   dot: "bg-blue-500"   },
  4: { label: "Đã hủy",          badge: "bg-red-100    text-red-700",    dot: "bg-red-400"    },
  5: { label: "Phòng khám hủy",  badge: "bg-red-100    text-red-700",    dot: "bg-red-400"    },
  6: { label: "Không đến",       badge: "bg-orange-100 text-orange-700", dot: "bg-orange-400" },
};

function isUpcoming(status) { return [1, 2].includes(status); }

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    weekday: "short", year: "numeric", month: "short", day: "numeric",
  });
}

/* Đọc/ghi localStorage bookings */
function getLocalBookings() {
  try { return JSON.parse(localStorage.getItem("carenow_bookings") || "[]"); }
  catch { return []; }
}
function saveLocalBookings(list) {
  try { localStorage.setItem("carenow_bookings", JSON.stringify(list)); }
  catch { /* ignore */ }
}

/* ── Skeleton ───────────────────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="border border-gray-100 rounded-2xl p-5 animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="flex gap-3">
          <div className="size-14 rounded-2xl bg-gray-200" />
          <div className="space-y-2 pt-1">
            <div className="h-4 w-36 bg-gray-200 rounded" />
            <div className="h-3 w-20 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="h-6 w-28 bg-gray-200 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="h-4 bg-gray-100 rounded w-4/5" />
        <div className="h-4 bg-gray-100 rounded w-3/4" />
      </div>
      <div className="flex gap-2 pt-3 border-t">
        <div className="h-9 flex-1 bg-gray-100 rounded-xl" />
        <div className="h-9 w-24 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}

/* ── Card lịch hẹn ──────────────────────────────────────────────────────────── */
function AppointmentCard({ appt, onCancel, cancelling, isLocal }) {
  const navigate = useNavigate();
  const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG[1];

  return (
    <div
      className={`border rounded-2xl p-5 transition-shadow hover:shadow-md ${
        isLocal ? "border-blue-100 bg-blue-50/30" : "border-gray-100 bg-white"
      }`}
    >
      {/* Dòng trên: ngày + badge */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div
            className="size-14 rounded-2xl text-white flex flex-col items-center justify-center shrink-0"
            style={{ backgroundColor: "#3498db" }}
          >
            <span className="text-xl font-bold leading-none">
              {String(new Date(appt.appt_date).getDate()).padStart(2, "0")}
            </span>
            <span className="text-[10px] opacity-80">
              Tháng {new Date(appt.appt_date).getMonth() + 1}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">{formatDate(appt.appt_date)}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <Clock className="size-3" />
              {appt.appt_time ? String(appt.appt_time).slice(0, 5) : "—"}
            </p>
            {isLocal && (
              <span className="text-[10px] text-blue-500 font-medium">Lưu cục bộ</span>
            )}
          </div>
        </div>

        <div className="text-right">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badge}`}>
            <span className={`size-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
          {appt.booking_code && (
            <p className="text-[11px] text-gray-400 mt-1">#{appt.booking_code}</p>
          )}
        </div>
      </div>

      {/* Thông tin */}
      <div className="grid sm:grid-cols-2 gap-2 mb-4 text-sm text-gray-600">
        {appt.patient_name && (
          <div className="flex items-center gap-1.5">
            <User className="size-4 shrink-0" style={{ color: "#3498db" }} />
            <span className="truncate">{appt.patient_name}</span>
          </div>
        )}
        {appt.specialist_name && (
          <div className="flex items-center gap-1.5">
            <Stethoscope className="size-4 shrink-0" style={{ color: "#3498db" }} />
            <span className="truncate">{appt.specialist_name}</span>
          </div>
        )}
        {appt.clinic_name && (
          <div className="flex items-center gap-1.5">
            <Building2 className="size-4 shrink-0" style={{ color: "#3498db" }} />
            <span className="truncate">{appt.clinic_name}</span>
          </div>
        )}
        {appt.service_name && (
          <div className="flex items-center gap-1.5">
            <FileText className="size-4 shrink-0" style={{ color: "#3498db" }} />
            <span className="truncate">{appt.service_name}</span>
          </div>
        )}
        {appt.patient_phone && (
          <div className="flex items-center gap-1.5">
            <Phone className="size-4 shrink-0" style={{ color: "#3498db" }} />
            <span>{appt.patient_phone}</span>
          </div>
        )}
        {appt.place_name && (
          <div className="flex items-center gap-1.5">
            <MapPin className="size-4 shrink-0" style={{ color: "#3498db" }} />
            <span className="truncate">{appt.place_name}</span>
          </div>
        )}
      </div>

      {/* Ghi chú */}
      {appt.patient_notes && (
        <div className="flex items-start gap-2 text-xs text-gray-600 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100 mb-3">
          <Info className="size-3.5 shrink-0 mt-0.5" style={{ color: "#3498db" }} />
          {appt.patient_notes}
        </div>
      )}

      {/* Nút hành động */}
      {isUpcoming(appt.status) && (
        <div className="flex gap-2 pt-3 border-t border-gray-50">
          <button
            onClick={() => navigate(`/dat-lich?booking=${appt.booking_code}`)}
            className="flex-1 text-white py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-1"
            style={{ backgroundColor: "#3498db" }}
          >
            Xem chi tiết <ChevronRight className="size-4" />
          </button>
          {!isLocal && onCancel && (
            <button
              onClick={() => onCancel(appt.id)}
              disabled={cancelling === appt.id}
              className="px-4 py-2 border border-red-300 text-red-500 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-1.5 text-sm disabled:opacity-50"
            >
              {cancelling === appt.id ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
              Hủy
            </button>
          )}
        </div>
      )}

      {appt.status === 3 && (
        <div className="pt-3 border-t border-gray-50">
          <button className="w-full bg-gray-100 text-gray-700 py-2 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">
            Xem kết quả khám
          </button>
        </div>
      )}

      {(appt.status === 4 || appt.status === 5) && appt.cancelled_at && (
        <p className="mt-2 text-[11px] text-gray-400 flex items-center gap-1">
          <Clock className="size-3" />
          Đã hủy: {new Date(appt.cancelled_at).toLocaleString("vi-VN")}
        </p>
      )}
    </div>
  );
}

/* ── Empty state ────────────────────────────────────────────────────────────── */
function EmptyState({ tab }) {
  return (
    <div className="text-center py-16">
      <Calendar className="size-16 text-gray-200 mx-auto mb-4" />
      <p className="text-lg font-semibold text-gray-700 mb-1">
        {tab === "upcoming" ? "Chưa có lịch khám sắp tới" : "Chưa có lịch sử khám"}
      </p>
      <p className="text-sm text-gray-400 mb-6">
        {tab === "upcoming"
          ? "Đặt lịch ngay để quản lý sức khỏe của bạn"
          : "Các lịch đã hoàn thành hoặc hủy sẽ hiển thị ở đây"}
      </p>
      {tab === "upcoming" && (
        <Link
          to="/dat-lich"
          className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all"
          style={{ backgroundColor: "#3498db" }}
        >
          <Plus className="size-4" /> Đặt lịch ngay
        </Link>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   Component chính
══════════════════════════════════════════════════════════════════════════════ */
export function MyAppointments() {
  const { isAuthenticated } = useAuth();
  const [apiAppts,   setApiAppts]   = useState([]);   // từ server (logged-in)
  const [localAppts, setLocalAppts] = useState([]);   // từ localStorage (guest/backup)
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [activeTab,  setActiveTab]  = useState("upcoming");
  const [cancelling, setCancelling] = useState(null);

  /* ── Load localStorage ngay khi mount ──────────────────────────────────── */
  useEffect(() => {
    setLocalAppts(getLocalBookings());
  }, []);

  /* ── Fetch API nếu đăng nhập ────────────────────────────────────────────── */
  const fetchFromApi = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError("");
    try {
      const res = await getMyAppointments({ limit: 50 });
      const list = res.data || [];
      setApiAppts(list);

      // Đồng bộ: cập nhật trạng thái các lịch trong localStorage
      const localList = getLocalBookings();
      const updated = localList.map((l) => {
        const found = list.find((a) => a.booking_code === l.booking_code);
        return found ? { ...l, status: found.status } : l;
      });
      saveLocalBookings(updated);
      setLocalAppts(updated);
    } catch (err) {
      if (err?.response?.status === 401) {
        setError("Phiên đăng nhập hết hạn.");
      } else {
        setError("Không thể tải lịch hẹn. Thử lại sau.");
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { fetchFromApi(); }, [fetchFromApi]);

  /* ── Hủy lịch ───────────────────────────────────────────────────────────── */
  const handleCancel = async (id) => {
    if (!window.confirm("Bạn có chắc muốn hủy lịch này?")) return;
    setCancelling(id);
    try {
      await cancelAppointment(id);
      setApiAppts((prev) =>
        prev.map((a) => a.id === id
          ? { ...a, status: 4, cancelled_at: new Date().toISOString() }
          : a
        )
      );
      // Cập nhật localStorage
      const updated = getLocalBookings().map((l) =>
        l.id === id ? { ...l, status: 4 } : l
      );
      saveLocalBookings(updated);
      setLocalAppts(updated);
    } catch (err) {
      alert(err?.response?.data?.message || "Hủy thất bại, thử lại.");
    } finally {
      setCancelling(null);
    }
  };

  /* ── Xóa khỏi localStorage ──────────────────────────────────────────────── */
  const removeLocal = (bookingCode) => {
    if (!window.confirm("Xóa lịch này khỏi danh sách lưu cục bộ?")) return;
    const updated = getLocalBookings().filter((l) => l.booking_code !== bookingCode);
    saveLocalBookings(updated);
    setLocalAppts(updated);
  };

  /* ── Merge & filter ─────────────────────────────────────────────────────── */
  // Nếu logged in: dùng API list (đầy đủ) + hiển thị local chỉ những cái chưa có trong API
  const apiCodes = new Set(apiAppts.map((a) => a.booking_code));
  const extraLocal = localAppts.filter((l) => !apiCodes.has(l.booking_code));

  // Khi chưa login: chỉ dùng local
  const allAppts = isAuthenticated
    ? [...apiAppts, ...extraLocal.map((l) => ({ ...l, _isLocal: true }))]
    : localAppts.map((l) => ({ ...l, _isLocal: true }));

  const upcoming = allAppts.filter((a) => isUpcoming(a.status));
  const history  = allAppts.filter((a) => !isUpcoming(a.status));
  const shown    = activeTab === "upcoming" ? upcoming : history;

  return (
    <div className="py-10 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 max-w-4xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Lịch khám của tôi</h1>
            <p className="text-sm text-gray-500 mt-1">
              {isAuthenticated
                ? "Quản lý tất cả các cuộc hẹn của bạn"
                : "Các lịch đặt gần đây trên thiết bị này"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && !loading && (
              <button
                onClick={fetchFromApi}
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500"
                title="Làm mới"
              >
                <RefreshCw className="size-4" />
              </button>
            )}
            <Link
              to="/dat-lich"
              className="flex items-center gap-1.5 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
              style={{ backgroundColor: "#3498db" }}
            >
              <Plus className="size-4" /> Đặt lịch mới
            </Link>
          </div>
        </div>

        {/* Banner chưa đăng nhập */}
        {!isAuthenticated && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 text-sm">
            <Info className="size-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-800">Bạn chưa đăng nhập</p>
              <p className="text-blue-700 mt-0.5">
                Đang hiển thị lịch đặt trên thiết bị này.{" "}
                <Link to="/login" className="font-semibold underline">Đăng nhập</Link>{" "}
                để đồng bộ và quản lý lịch trên mọi thiết bị.
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Tabs + danh sách */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {[
              { key: "upcoming", label: "Sắp tới", count: upcoming.length },
              { key: "history",  label: "Lịch sử", count: history.length  },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-4 font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  activeTab === tab.key
                    ? "border-b-2 border-blue-500 text-blue-600 bg-blue-50/50"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {tab.label}
                {!loading && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      activeTab === tab.key
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} />)}
              </div>
            ) : shown.length === 0 ? (
              <EmptyState tab={activeTab} />
            ) : (
              <div className="space-y-4">
                {shown.map((appt) => (
                  <div key={appt.booking_code || appt.id} className="relative">
                    <AppointmentCard
                      appt={appt}
                      onCancel={handleCancel}
                      cancelling={cancelling}
                      isLocal={!!appt._isLocal}
                    />
                    {/* Nút xóa local */}
                    {appt._isLocal && (
                      <button
                        onClick={() => removeLocal(appt.booking_code)}
                        className="absolute top-3 right-3 p-1 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all"
                        title="Xóa khỏi danh sách"
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Summary stats */}
        {allAppts.length > 0 && (
          <div className="mt-6 grid grid-cols-3 gap-4">
            {[
              { label: "Chờ xác nhận", count: allAppts.filter((a) => a.status === 1).length, color: "text-yellow-600", bg: "bg-yellow-50" },
              { label: "Đã xác nhận",  count: allAppts.filter((a) => a.status === 2).length, color: "text-green-600",  bg: "bg-green-50"  },
              { label: "Đã khám",      count: allAppts.filter((a) => a.status === 3).length, color: "text-blue-600",   bg: "bg-blue-50"   },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
