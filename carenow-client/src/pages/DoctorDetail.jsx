import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useLocation, useParams } from "react-router-dom";
import {
  Star, MapPin, Clock, Calendar, Award, GraduationCap,
  Phone, Video, ChevronLeft, CheckCircle, Users,
  Shield, Heart, X,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { getClinicById, getSpecialtyById } from "../api/catalog.api";
import { createAppointment } from "../api/appointment.api";
import { htmlToPlain } from "../utils/htmlToPlain";
import {
  buildDoctorPath,
  buildSpecialtyPath,
  parseCatalogSlugRef,
} from "../utils/catalogPath";
import { SchedulePicker } from "../components/SchedulePicker";
import BookingLocationSelects from "../components/BookingLocationSelects";
import BookingSuccessScreen from "../components/BookingSuccessScreen";

function stripHtml(s) {
  if (!s) return "";
  return String(s).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function parseIds(raw) {
  return String(raw || "")
    .split(/[,;]/)
    .map((x) => parseInt(x.trim(), 10))
    .filter((n) => !Number.isNaN(n));
}

const STATIC_REVIEWS = [
  { name: "Nguyễn Văn A", rating: 5, date: "28/04/2026", comment: "Bác sĩ tận tâm, khám rất kỹ. Giải thích dễ hiểu." },
  { name: "Trần Thị B",   rating: 5, date: "25/04/2026", comment: "Rất hài lòng với dịch vụ. Đặt lịch nhanh, không phải chờ lâu." },
  { name: "Lê Văn C",     rating: 4, date: "22/04/2026", comment: "Bác sĩ chuyên nghiệp, phòng khám sạch sẽ." },
];


export function DoctorDetail() {
  const { slugRef } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const parsed = useMemo(() => parseCatalogSlugRef(slugRef), [slugRef]);

  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState(null);
  const [specialtyForCrumb, setSpecialtyForCrumb] = useState(null);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [successData, setSuccessData] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "", birthDate: "", phone: "",
    provinceId: "", wardId: "", address: "", reason: "", companion: "",
  });

  useEffect(() => {
    if (!parsed?.id) { setLoading(false); setRow(null); setSpecialtyForCrumb(null); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setSpecialtyForCrumb(null);
      try {
        const d = await getClinicById(parsed.id);
        if (cancelled) return;
        setRow(d || null);
        if (d) {
          const ids = parseIds(d.specialist_ids);
          if (ids[0]) {
            try {
              const sp = await getSpecialtyById(ids[0]);
              if (!cancelled) setSpecialtyForCrumb(sp || null);
            } catch { /* ignore */ }
          }
        }
      } catch {
        if (!cancelled) { setRow(null); setSpecialtyForCrumb(null); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [parsed?.id, slugRef]);

  useEffect(() => {
    if (!row) return;
    const canonical = buildDoctorPath(row);
    if (location.pathname !== canonical) navigate(canonical, { replace: true });
  }, [row, location.pathname, navigate]);

  const contentPlain = useMemo(() => (row?.content ? htmlToPlain(row.content) : ""), [row]);

  if (!parsed?.id) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-gray-600 mb-4">Đường dẫn không hợp lệ.</p>
        <Link to="/" className="font-medium" style={{ color: "#3498db" }}>Về trang chủ</Link>
      </div>
    );
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-20 text-center text-gray-600">Đang tải…</div>;
  }

  if (!row) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-gray-600 mb-4">Không tìm thấy hồ sơ bác sĩ / phòng khám.</p>
        <Link to="/" className="font-medium" style={{ color: "#3498db" }}>Về trang chủ</Link>
      </div>
    );
  }

  const summary = stripHtml(row.summary);
  const appt = Number(row.appointment_total) || 0;
  const fullName = [row.title, row.name].filter(Boolean).join(" ").trim() || row.name;
  const degree = row.title || "";
  const specialty = specialtyForCrumb?.name || "";

  const handleBooking = () => {
    if (!selectedDate || !selectedTime) { alert("Vui lòng chọn ngày và giờ khám!"); return; }
    setShowBookingModal(true);
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    setBookingSubmitting(true);
    setBookingError("");
    try {
      const res = await createAppointment({
        patient_name: formData.fullName,
        patient_phone: formData.phone,
        patient_address: formData.address || undefined,
        patient_notes: [
          formData.reason,
          formData.companion ? `Người đi cùng: ${formData.companion}` : "",
          formData.provinceId ? `Tỉnh/Thành ID: ${formData.provinceId}` : "",
          formData.wardId ? `Xã/Phường ID: ${formData.wardId}` : "",
        ].filter(Boolean).join("\n") || undefined,
        appt_date: selectedDate,
        appt_time: selectedTime,
        clinic_id: row.id,
        specialist_id: specialtyForCrumb?.id,
      });
      const appt = res.data;
      setShowBookingModal(false);
      setSuccessData({ bookingCode: appt.booking_code, appt });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setBookingError(err?.response?.data?.message || "Đặt lịch thất bại, vui lòng thử lại.");
    } finally {
      setBookingSubmitting(false);
    }
  };

  if (successData) {
    return (
      <BookingSuccessScreen
        bookingCode={successData.bookingCode}
        appointment={successData.appt}
        onViewAppointments={() => navigate("/lich-cua-toi")}
      />
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="container mx-auto px-4 pt-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ChevronLeft className="size-5" />
        <span className="text-sm font-medium">Quay lại</span>
      </button>

      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 pt-2 pb-1 flex items-center gap-1.5 text-xs text-gray-400 flex-wrap">
        <Link to="/" className="hover:text-blue-500 transition-colors">Trang chủ</Link>
        <span>/</span>
        {specialtyForCrumb ? (
          <Link to={buildSpecialtyPath(specialtyForCrumb)} className="hover:text-blue-500 transition-colors">{specialtyForCrumb.name}</Link>
        ) : (
          <Link to="/dich-vu" className="hover:text-blue-500 transition-colors">Chuyên khoa</Link>
        )}
        <span>/</span>
        <span className="text-gray-600 font-medium truncate max-w-xs">{fullName}</span>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* ── Left column (2/3) ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Profile header card */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-md">
              <div className="md:flex">
                <div className="md:w-80 h-80 relative bg-gray-100 shrink-0">
                  <ImageWithFallback
                    src={row.picture || "https://images.unsplash.com/photo-1622902046580-2b47f47f5471?w=400&q=80"}
                    alt={fullName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 right-3 bg-white rounded-xl px-2.5 py-1 flex items-center gap-1 shadow-lg">
                    <Star className="size-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-bold text-gray-800">4.8</span>
                    {appt > 0 && <span className="text-xs text-gray-400">({appt})</span>}
                  </div>
                </div>
                <div className="flex-1 p-8">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">{fullName}</h1>
                  {degree && <p className="text-gray-500 mb-4 text-sm">{degree}</p>}

                  <div className="space-y-3">
                    {specialty && (
                      <div className="flex items-start gap-3">
                        <Users className="size-5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs text-gray-500">Chuyên khoa</div>
                          <div className="font-semibold text-gray-800">{specialty}</div>
                        </div>
                      </div>
                    )}
                    {row.address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="size-5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs text-gray-500">Nơi làm việc</div>
                          <div className="font-semibold text-gray-800">{row.address}</div>
                        </div>
                      </div>
                    )}
                    {row.license && (
                      <div className="flex items-start gap-3">
                        <Award className="size-5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs text-gray-500">Chứng chỉ</div>
                          <div className="font-semibold text-gray-800">{row.license}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            {summary && (
              <div className="bg-white rounded-2xl p-8 shadow-md">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Users className="size-6 text-blue-600" />
                  Giới thiệu
                </h2>
                <p className="text-gray-600 leading-relaxed">{summary}</p>
              </div>
            )}

            {/* Detailed content */}
            {contentPlain && (
              <div className="bg-white rounded-2xl p-8 shadow-md">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <GraduationCap className="size-6 text-blue-600" />
                  Chi tiết chuyên môn
                </h2>
                <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">{contentPlain}</p>
              </div>
            )}

            {/* Reviews (static) */}
            <div className="bg-white rounded-2xl p-8 shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Star className="size-6 text-yellow-400" />
                  Đánh giá từ bệnh nhân
                </h2>
                {appt > 0 && <span className="text-sm text-gray-500">{appt} lượt đặt</span>}
              </div>
              <div className="space-y-4">
                {STATIC_REVIEWS.map((review, i) => (
                  <div key={i} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-gray-800">{review.name}</div>
                      <div className="flex items-center gap-1">
                        {[...Array(review.rating)].map((_, j) => (
                          <Star key={j} className="size-3.5 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{review.comment}</p>
                    <span className="text-xs text-gray-400">{review.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right sticky panel (1/3) ── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-md sticky top-6">
              <div className="text-center mb-6 pb-6 border-b border-gray-100">
                <div className="text-sm text-gray-500 mb-1">Phí khám</div>
                <div className="text-2xl font-bold" style={{ color: "#3498db" }}>Liên hệ</div>
              </div>

              {/* Schedule — thật từ DB */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Calendar className="size-4 text-blue-600" />
                  Chọn lịch khám
                </h3>
                <SchedulePicker
                  clinicId={row?.id}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  onSelect={(date, time) => {
                    setSelectedDate(date);
                    setSelectedTime(time);
                  }}
                  compact
                />
              </div>

              {selectedDate && selectedTime && (
                <div className="mb-4 bg-green-50 rounded-xl p-3 border border-green-200">
                  <div className="text-xs text-gray-600 mb-1">Lịch đã chọn</div>
                  <div className="font-semibold text-green-700">
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString("vi-VN", {
                      weekday: "short", day: "numeric", month: "short",
                    })} — {selectedTime}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleBooking}
                  className="w-full flex items-center justify-center gap-2 text-white py-3.5 rounded-xl font-semibold transition-all hover:opacity-90"
                  style={{ backgroundColor: "#3498db" }}
                >
                  <Calendar className="size-5" /> Đặt lịch khám ngay
                </button>
                <Link
                  to={`/dat-lich?clinicId=${encodeURIComponent(row.id)}`}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3.5 rounded-xl font-semibold hover:bg-green-700 transition-colors"
                >
                  <Video className="size-5" /> Khám từ xa (Online)
                </Link>
                <a
                  href="tel:19002345"
                  className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  <Phone className="size-5" /> Gọi 1900-2345
                </a>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-2"><Shield className="size-4 text-green-600" /><span>Miễn phí đặt lịch</span></div>
                <div className="flex items-center gap-2"><CheckCircle className="size-4 text-green-600" /><span>Xác nhận ngay lập tức</span></div>
                <div className="flex items-center gap-2"><Heart className="size-4 text-green-600" /><span>Bảo mật thông tin 100%</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Đặt lịch khám</h2>
                <p className="text-sm text-gray-600 mt-1">{fullName} – {selectedDate} lúc {selectedTime}</p>
              </div>
              <button onClick={() => setShowBookingModal(false)} className="size-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                <X className="size-6 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmitBooking} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Họ và tên <span className="text-red-500">*</span></label>
                <input type="text" required value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập họ và tên" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ngày sinh <span className="text-red-500">*</span></label>
                  <input type="date" required value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Số điện thoại <span className="text-red-500">*</span></label>
                  <input type="tel" required value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0912345678" />
                </div>
              </div>

              <BookingLocationSelects
                required
                provinceId={formData.provinceId}
                wardId={formData.wardId}
                onProvinceChange={(value) => setFormData({ ...formData, provinceId: value, wardId: "" })}
                onWardChange={(value) => setFormData({ ...formData, wardId: value })}
              />

              {bookingError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {bookingError}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Địa chỉ chi tiết <span className="text-red-500">*</span></label>
                <input type="text" required value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Số nhà, tên đường..." />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lý do khám <span className="text-red-500">*</span></label>
                <textarea required value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-24"
                  placeholder="Mô tả triệu chứng hoặc lý do khám..." />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Người đi cùng (nếu có)</label>
                <input type="text" value={formData.companion}
                  onChange={(e) => setFormData({ ...formData, companion: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tên người đi cùng (tùy chọn)" />
              </div>

              <div className="rounded-xl p-4 border border-blue-200" style={{ backgroundColor: "#eff6ff" }}>
                <h4 className="font-semibold text-gray-800 mb-2 text-sm">Thông tin lịch khám</h4>
                <div className="space-y-1 text-sm text-gray-700">
                  <p><strong>Bác sĩ:</strong> {fullName}</p>
                  {specialty && <p><strong>Chuyên khoa:</strong> {specialty}</p>}
                  <p><strong>Ngày khám:</strong> {selectedDate}</p>
                  <p><strong>Giờ khám:</strong> {selectedTime}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowBookingModal(false)}
                  className="flex-1 px-6 py-3.5 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
                  Hủy
                </button>
                <button type="submit"
                  disabled={bookingSubmitting}
                  className="flex-1 px-6 py-3.5 text-white rounded-xl font-semibold transition-colors hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#3498db" }}>
                  {bookingSubmitting ? "Đang xử lý..." : "Xác nhận đặt lịch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
