import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useLocation, useParams } from "react-router-dom";
import {
  MapPin, Clock, Star, Phone, Navigation, Building2, ChevronLeft,
  Calendar, Users, CheckCircle, Heart, Shield,
  Wifi, Car, Coffee, X,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { getClinicPlaceById, getClinics } from "../api/catalog.api";
import { createAppointment } from "../api/appointment.api";
import { htmlToPlain } from "../utils/htmlToPlain";
import { buildPlacePath, buildDoctorPath, parseCatalogSlugRef } from "../utils/catalogPath";
import { SchedulePicker } from "../components/SchedulePicker";
import BookingLocationSelects from "../components/BookingLocationSelects";
import BookingSuccessScreen from "../components/BookingSuccessScreen";

function stripHtml(s) {
  if (!s) return "";
  return String(s).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function parseImages(raw) {
  if (raw == null || raw === "") return [];
  if (Array.isArray(raw)) return raw.filter(Boolean).map(String);
  try {
    const j = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(j)) return j.filter(Boolean).map(String);
  } catch {
    if (typeof raw === "string") return [raw];
  }
  return [];
}

const FACILITIES = [
  { icon: Wifi,     label: "Wifi miễn phí" },
  { icon: Car,      label: "Bãi đỗ xe" },
  { icon: Coffee,   label: "Phòng chờ thoải mái" },
  { icon: Shield,   label: "Bảo mật thông tin" },
];

/** Card bác sĩ với SchedulePicker riêng */
function DoctorScheduleCard({ doctor, onBook, viewPath }) {
  const [selDate, setSelDate] = useState("");
  const [selTime, setSelTime] = useState("");

  return (
    <>
      <div className="mb-4">
        <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Calendar className="size-4 text-blue-600" /> Chọn lịch khám
        </h4>
        <SchedulePicker
          clinicId={doctor?.id}
          selectedDate={selDate}
          selectedTime={selTime}
          onSelect={(date, time) => { setSelDate(date); setSelTime(time); }}
          compact
        />
      </div>

      {selDate && selTime && (
        <div className="mb-4 bg-green-50 rounded-xl p-3 border border-green-200">
          <div className="text-xs text-gray-600 mb-1">Lịch đã chọn</div>
          <div className="font-semibold text-green-700 text-sm">
            {new Date(selDate + "T00:00:00").toLocaleDateString("vi-VN", {
              weekday: "short", day: "numeric", month: "short",
            })} — {selTime}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => onBook(doctor, selDate, selTime)}
          className="flex-1 flex items-center justify-center gap-2 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-all text-sm"
          style={{ backgroundColor: "#3498db" }}
        >
          <Calendar className="size-4" /> Đặt lịch ngay
        </button>
        <Link
          to={viewPath}
          className="flex-1 flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm"
        >
          Xem hồ sơ
        </Link>
      </div>
    </>
  );
}

export function PlaceDetail() {
  const { slugRef } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const parsed = useMemo(() => parseCatalogSlugRef(slugRef), [slugRef]);

  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState(null);
  const [doctors, setDoctors] = useState([]);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [successData, setSuccessData] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "", birthDate: "", phone: "",
    provinceId: "", wardId: "", address: "", reason: "", companion: "",
  });

  useEffect(() => {
    if (!parsed?.id) { setLoading(false); setRow(null); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const d = await getClinicPlaceById(parsed.id);
        if (cancelled) return;
        setRow(d || null);

        // try to fetch related clinics by place_id
        try {
          const res = await getClinics({ place_id: parsed.id, limit: 10 });
          const list = res?.data ?? (Array.isArray(res) ? res : []);
          if (!cancelled) setDoctors(list.slice(0, 10));
        } catch {
          if (!cancelled) setDoctors([]);
        }
      } catch {
        if (!cancelled) setRow(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [parsed?.id, slugRef]);

  useEffect(() => {
    if (!row) return;
    const canonical = buildPlacePath(row);
    if (location.pathname !== canonical) navigate(canonical, { replace: true });
  }, [row, location.pathname, navigate]);

  const images = useMemo(() => (row ? parseImages(row.images) : []), [row]);
  const detailPlain = useMemo(() => (row?.description_detail ? htmlToPlain(row.description_detail) : ""), [row]);
  const guidePlain  = useMemo(() => (row?.patient_guide ? htmlToPlain(row.patient_guide) : ""), [row]);
  const descPlain   = useMemo(() => (row?.description ? htmlToPlain(row.description) : ""), [row]);

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
        <p className="text-gray-600 mb-4">Không tìm thấy cơ sở khám.</p>
        <Link to="/" className="font-medium" style={{ color: "#3498db" }}>Về trang chủ</Link>
      </div>
    );
  }

  const displayName = row.display_name || row.name;
  const phone = row.phone || "";

  const handleBooking = (doctor, date, time) => {
    if (!date || !time) { alert("Vui lòng chọn ngày và giờ khám!"); return; }
    setSelectedDoctor(doctor);
    setSelectedDate(date);
    setSelectedTime(time);
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
        clinic_id: selectedDoctor?.id,
        clinic_place_id: row.id,
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
      {/* Back */}
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
        <span className="hover:text-blue-500 cursor-pointer">Nơi khám</span>
        <span>/</span>
        <span className="text-gray-600 font-medium truncate max-w-xs">{displayName}</span>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* ── Left column (2/3) ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Header card with image */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-md">
              <div className="h-72 relative bg-gray-100">
                {images[0] ? (
                  <ImageWithFallback src={images[0]} alt={displayName} className="w-full h-full object-cover" />
                ) : row.logo ? (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                    <ImageWithFallback src={row.logo} alt={displayName} className="max-h-40 max-w-xs object-contain" />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #e8f4fd, #bfdbfe)" }}>
                    <Building2 className="size-20 text-blue-300" />
                  </div>
                )}
                <div className="absolute bottom-4 right-4 bg-white rounded-xl px-4 py-2 flex items-center gap-2 shadow-lg">
                  <Star className="size-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-lg font-bold text-gray-800">4.8</span>
                  <span className="text-sm text-gray-500">/ 5.0</span>
                </div>
              </div>

              <div className="p-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{displayName}</h1>
                {row.type_name && <p className="font-medium mb-4" style={{ color: "#3498db" }}>{row.type_name}</p>}
                {descPlain && <p className="text-gray-600 leading-relaxed mb-6">{descPlain}</p>}

                {/* Details */}
                <div className="space-y-4 mb-6">
                  {row.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="size-6 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Địa chỉ</div>
                        <div className="font-semibold text-gray-800">{row.address}</div>
                        <div className="flex items-center gap-1 text-sm mt-1" style={{ color: "#3498db" }}>
                          <Navigation className="size-4" />
                          <span>Xem trên bản đồ</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {(row.open_time || row.working_hours) && (
                    <div className="flex items-start gap-3">
                      <Clock className="size-6 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Giờ làm việc</div>
                        <div className="font-semibold text-gray-800">{row.open_time || row.working_hours}</div>
                      </div>
                    </div>
                  )}
                  {phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="size-6 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Hotline</div>
                        <a href={`tel:${phone.replace(/\s/g, "")}`} className="font-semibold hover:underline" style={{ color: "#3498db" }}>{phone}</a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Facilities */}
                <div className="grid sm:grid-cols-2 gap-3">
                  {FACILITIES.map((f, i) => {
                    const Icon = f.icon;
                    return (
                      <div key={i} className="flex items-center gap-2 text-gray-700 bg-gray-50 rounded-xl p-3">
                        <Icon className="size-5 text-blue-600" />
                        <span className="text-sm">{f.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Image gallery (additional images) */}
            {images.length > 1 && (
              <div className="bg-white rounded-2xl p-8 shadow-md">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Hình ảnh cơ sở</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {images.slice(1, 7).map((src, i) => (
                    <div key={i} className="aspect-video rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                      <ImageWithFallback src={src} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detail description */}
            {detailPlain && (
              <div className="bg-white rounded-2xl p-8 shadow-md">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Giới thiệu chi tiết</h2>
                <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">{detailPlain}</p>
              </div>
            )}

            {/* Patient guide */}
            {guidePlain && (
              <div className="bg-white rounded-2xl p-8 shadow-md border border-blue-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Hướng dẫn bệnh nhân</h2>
                <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">{guidePlain}</p>
              </div>
            )}

            {/* Doctors at this location */}
            {doctors.length > 0 && (
              <div className="bg-white rounded-2xl p-8 shadow-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Users className="size-7 text-blue-600" />
                  Bác sĩ tại {displayName}
                </h2>
                <div className="space-y-6">
                  {doctors.map((doctor) => {
                    const docName = [doctor.title, doctor.name].filter(Boolean).join(" ").trim() || doctor.name;
                    return (
                      <div key={doctor.id} className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all">
                        <div className="md:flex">
                          <div className="md:w-56 h-56 md:h-auto relative bg-gray-100 shrink-0">
                            <ImageWithFallback
                              src={doctor.picture || "https://images.unsplash.com/photo-1622902046580-2b47f47f5471?w=400&q=80"}
                              alt={docName}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-3 right-3 bg-white rounded-xl px-2.5 py-1 flex items-center gap-1 shadow-lg">
                              <Star className="size-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs font-bold text-gray-800">4.8</span>
                            </div>
                          </div>
                          <div className="flex-1 p-6">
                            <div className="mb-4">
                              <h3 className="text-xl font-bold text-gray-800 mb-2">{docName}</h3>
                              {doctor.address && (
                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                  <MapPin className="size-4 text-gray-400" /> {doctor.address}
                                </div>
                              )}
                            </div>

                            <DoctorScheduleCard
                              doctor={doctor}
                              onBook={handleBooking}
                              viewPath={buildDoctorPath(doctor)}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Right sticky panel (1/3) ── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-md sticky top-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Đặt lịch khám tại đây</h3>
              <div className="space-y-3">
                <Link
                  to={`/dat-lich?placeId=${encodeURIComponent(row.id)}`}
                  className="w-full flex items-center justify-center gap-2 text-white py-3.5 rounded-xl font-semibold hover:opacity-90 transition-all"
                  style={{ backgroundColor: "#3498db" }}
                >
                  <Calendar className="size-5" /> Đặt lịch ngay
                </Link>
                {phone && (
                  <a
                    href={`tel:${phone.replace(/\s/g, "")}`}
                    className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    <Phone className="size-5" /> Gọi {phone}
                  </a>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-2"><CheckCircle className="size-4 text-green-600" /><span>Miễn phí đặt lịch</span></div>
                <div className="flex items-center gap-2"><CheckCircle className="size-4 text-green-600" /><span>Xác nhận ngay lập tức</span></div>
                <div className="flex items-center gap-2"><Heart className="size-4 text-green-600" /><span>Đội ngũ y bác sĩ chuyên nghiệp</span></div>
                <div className="flex items-center gap-2"><Shield className="size-4 text-green-600" /><span>Bảo mật thông tin 100%</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking modal */}
      {showBookingModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Đặt lịch khám</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {[selectedDoctor.title, selectedDoctor.name].filter(Boolean).join(" ")} – {selectedDate} lúc {selectedTime}
                </p>
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
                  <p><strong>Bác sĩ:</strong> {[selectedDoctor.title, selectedDoctor.name].filter(Boolean).join(" ")}</p>
                  <p><strong>Nơi khám:</strong> {displayName}</p>
                  <p><strong>Ngày khám:</strong> {selectedDate}</p>
                  <p><strong>Giờ khám:</strong> {selectedTime}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowBookingModal(false)}
                  className="flex-1 px-6 py-3.5 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors">Hủy</button>
                <button type="submit"
                  disabled={bookingSubmitting}
                  className="flex-1 px-6 py-3.5 text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
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
