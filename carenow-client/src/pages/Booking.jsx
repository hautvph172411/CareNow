import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  ChevronRight, CheckCircle, Calendar, Clock,
  User, Phone, Mail, MapPin, FileText,
  AlertCircle, Loader2, Users,
} from "lucide-react";
import { createAppointment } from "../api/appointment.api";
import {
  getProvinces,
  getWards,
  getMyPatientProfile,
  getClinicById,
  getSpecialtyById,
  getClinicPlaceById,
} from "../api/catalog.api";
import { SchedulePicker } from "../components/SchedulePicker";
import BookingLocationSelects from "../components/BookingLocationSelects";

/* Fallback slots khi không có clinicId */
const FALLBACK_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "13:30", "14:00", "14:30", "15:00", "15:30", "16:00",
];

const STEPS = ["Chọn dịch vụ", "Chọn bác sĩ", "Chọn giờ", "Thông tin"];

const EMPTY_FORM = {
  serviceType: "", specialty: "", doctor: "",
  date: "", time: "",
  fullName: "", phone: "", email: "",
  provinceId: "", wardId: "", address: "",
  notes: "",
};

/* ── Màn xác nhận đặt thành công ─────────────────────────────────────────── */
function SuccessScreen({ bookingCode, appt, onViewAppointments }) {
  return (
    <div className="py-12 bg-gray-50 min-h-screen" role="status" aria-live="polite">
      <div className="container mx-auto px-4 max-w-lg">
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
          <div className="size-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="size-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Bạn đã đặt lịch thành công!</h2>
          <p className="text-gray-500 mb-6">
            Chúng tôi đã nhận yêu cầu khám. Phòng khám sẽ liên hệ xác nhận sớm nhất.
          </p>

          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-500 mb-1">Mã lịch hẹn</p>
            <p className="text-2xl font-bold tracking-widest" style={{ color: "#3498db" }}>
              {bookingCode || "Đang cập nhật"}
            </p>
            <p className="text-xs text-gray-400 mt-1">Lưu mã này để tra cứu hoặc liên hệ hỗ trợ</p>
          </div>

          <div className="text-left space-y-3 mb-8 text-sm text-gray-600">
            {appt?.appt_date && (
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-blue-400 shrink-0" />
                <span>
                  {new Date(appt.appt_date).toLocaleDateString("vi-VN", {
                    weekday: "long", year: "numeric", month: "long", day: "numeric",
                  })}
                  {appt.appt_time && ` — ${String(appt.appt_time).slice(0, 5)}`}
                </span>
              </div>
            )}
            {appt?.patient_name && (
              <div className="flex items-center gap-2">
                <User className="size-4 text-blue-400 shrink-0" />
                <span>{appt.patient_name}</span>
              </div>
            )}
            {appt?.patient_phone && (
              <div className="flex items-center gap-2">
                <Phone className="size-4 text-blue-400 shrink-0" />
                <span>{appt.patient_phone}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={onViewAppointments}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Xem lịch của tôi
            </button>
            <Link
              to="/"
              className="w-full py-3 rounded-xl font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors text-center"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Input có icon ────────────────────────────────────────────────────────── */
function InputField({ label, icon: Icon, required, ...props }) {
  return (
    <div>
      <label className="block mb-1.5 text-sm font-medium text-gray-700">
        {Icon && <Icon className="size-4 inline mr-1 text-blue-500" />}
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
        {...props}
      />
    </div>
  );
}

export function Booking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clinicIdParam    = searchParams.get("clinicId");
  const specialtyIdParam = searchParams.get("specialtyId");
  const serviceIdParam   = searchParams.get("serviceId");
  const placeIdParam     = searchParams.get("placeId");
  const dateParam        = searchParams.get("date");   // pre-fill từ detail page
  const timeParam        = searchParams.get("time");   // pre-fill từ detail page
  const provinceIdParam  = searchParams.get("provinceId");
  const wardIdParam      = searchParams.get("wardId");
  const addressParam     = searchParams.get("address");
  const notesParam       = searchParams.get("notes");

  const isLoggedIn = Boolean(localStorage.getItem("client_token"));

  /* ── State ──────────────────────────────────────────────────────────────── */
  const [currentStep,  setCurrentStep]  = useState(1);
  const [formData,     setFormData]     = useState(() => ({
    ...EMPTY_FORM,
    serviceType: specialtyIdParam ? "Khám Chuyên khoa" : "",
    specialty: specialtyIdParam || "",
    doctor: clinicIdParam || "",
    date: dateParam || "",
    time: timeParam || "",
    provinceId: provinceIdParam || "",
    wardId: wardIdParam || "",
    address: addressParam || "",
    notes: notesParam || "",
  }));
  const [forRelative,  setForRelative]  = useState(false);  // đặt cho người thân
  const [profile,      setProfile]      = useState(null);   // tbl_patient data
  const [provinces,    setProvinces]    = useState([]);
  const [wards,        setWards]        = useState([]);
  const [wardsLoading, setWardsLoading] = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [submitError,  setSubmitError]  = useState("");
  const [successData,  setSuccessData]  = useState(null);
  const [bookingContext, setBookingContext] = useState({
    clinic: null,
    specialty: null,
    place: null,
  });

  const doctors = useMemo(() => {
    if (bookingContext.clinic) {
      return [{
        id: String(bookingContext.clinic.id),
        name: [bookingContext.clinic.title, bookingContext.clinic.name].filter(Boolean).join(" "),
        specialty: bookingContext.specialty?.name || "Bác sĩ / phòng khám đã chọn",
        experience: bookingContext.clinic.experience || "",
      }];
    }
    return [
      { id: "1", name: "BS. Nguyễn Văn A", specialty: "Tim mạch", experience: "15 năm" },
      { id: "2", name: "BS. Trần Thị B",   specialty: "Tim mạch", experience: "12 năm" },
      { id: "3", name: "BS. Lê Văn C",     specialty: "Nội tiết", experience: "10 năm" },
    ];
  }, [bookingContext.clinic, bookingContext.specialty]);

  const contextHint = useMemo(() => {
    const parts = [];
    if (bookingContext.clinic) {
      const clinicName = [bookingContext.clinic.title, bookingContext.clinic.name].filter(Boolean).join(" ");
      parts.push(`bác sĩ ${clinicName}`);
    } else if (clinicIdParam) {
      parts.push(`bác sĩ #${clinicIdParam}`);
    }
    if (bookingContext.specialty) parts.push(`chuyên khoa ${bookingContext.specialty.name}`);
    else if (specialtyIdParam) parts.push(`chuyên khoa #${specialtyIdParam}`);
    if (bookingContext.place) parts.push(`cơ sở ${bookingContext.place.display_name || bookingContext.place.name}`);
    else if (placeIdParam) parts.push(`cơ sở #${placeIdParam}`);
    return parts.length ? `Đặt lịch từ: ${parts.join(", ")}.` : "";
  }, [bookingContext, clinicIdParam, specialtyIdParam, placeIdParam]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [clinic, specialty, place] = await Promise.all([
        clinicIdParam ? getClinicById(clinicIdParam).catch(() => null) : Promise.resolve(null),
        specialtyIdParam ? getSpecialtyById(specialtyIdParam).catch(() => null) : Promise.resolve(null),
        placeIdParam ? getClinicPlaceById(placeIdParam).catch(() => null) : Promise.resolve(null),
      ]);
      if (!cancelled) setBookingContext({ clinic, specialty, place });
    })();
    return () => { cancelled = true; };
  }, [clinicIdParam, specialtyIdParam, placeIdParam]);

  /* ── Load provinces + patient profile (parallel) ────────────────────────── */
  useEffect(() => {
    getProvinces().then(setProvinces).catch(() => {});
    if (isLoggedIn) {
      getMyPatientProfile()
        .then((p) => {
          if (!p) return;
          setProfile(p);
          // Pre-fill form
          setFormData((prev) => ({
            ...prev,
            fullName:   p.full_name  || "",
            phone:      p.phone      || "",
            email:      p.email      || p.google_email || "",
            address:    addressParam || p.address || "",
            provinceId: provinceIdParam || (p.province_id ? String(p.province_id) : ""),
            wardId:     wardIdParam || (p.ward_id ? String(p.ward_id) : ""),
          }));
          // Load wards of pre-filled province
          const selectedProvinceId = provinceIdParam || p.province_id;
          if (selectedProvinceId) {
            getWards(selectedProvinceId).then(setWards).catch(() => {});
          }
        })
        .catch(() => {}); // không làm gián đoạn nếu token hết hạn
    }
  }, [addressParam, isLoggedIn, provinceIdParam, wardIdParam]);

  /* ── Load wards khi đổi province ────────────────────────────────────────── */
  const handleProvinceChange = useCallback(async (provinceId) => {
    const pid = provinceId || "";
    setFormData((f) => ({ ...f, provinceId: pid, wardId: "" }));
    if (!pid) { setWards([]); return; }
    setWardsLoading(true);
    try {
      const w = await getWards(pid);
      setWards(w);
    } catch { setWards([]); }
    finally { setWardsLoading(false); }
  }, []);

  /* ── Toggle đặt cho người thân: clear thông tin bệnh nhân ───────────────── */
  const handleToggleRelative = (val) => {
    setForRelative(val);
    if (val) {
      // Xóa thông tin để điền mới
      setFormData((f) => ({ ...f, fullName: "", phone: "", email: "", address: "", provinceId: "", wardId: "", notes: "" }));
      setWards([]);
    } else if (profile) {
      // Khôi phục từ profile
      setFormData((f) => ({
        ...f,
        fullName:   profile.full_name  || "",
        phone:      profile.phone      || "",
        email:      profile.email      || profile.google_email || "",
        address:    profile.address    || "",
        provinceId: profile.province_id ? String(profile.province_id) : "",
        wardId:     profile.ward_id    ? String(profile.ward_id)    : "",
      }));
      if (profile.province_id) {
        getWards(profile.province_id).then(setWards).catch(() => {});
      }
    }
  };

  /* ── Submit ─────────────────────────────────────────────────────────────── */
  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const provinceName = provinces.find((p) => String(p.id) === formData.provinceId)?.name;
      const wardName     = wards.find((w) => String(w.id) === formData.wardId)?.name;
      const addressParts = [formData.address, wardName, provinceName].filter(Boolean);

      const payload = {
        patient_name:  formData.fullName,
        patient_phone: formData.phone,
        patient_email: formData.email     || undefined,
        patient_notes: formData.notes     || undefined,
        appt_date:     formData.date,
        appt_time:     formData.time,
        // Address gộp lại thành chuỗi (lưu vào patient_notes phần địa chỉ nếu cần)
        ...(addressParts.length ? { patient_address: addressParts.join(", ") } : {}),
        // Context từ URL
        clinic_id:       clinicIdParam    ? Number(clinicIdParam)    : undefined,
        specialist_id:   specialtyIdParam ? Number(specialtyIdParam) : undefined,
        service_id:      serviceIdParam
          ? Number(serviceIdParam)
          : (bookingContext.specialty?.service_id ? Number(bookingContext.specialty.service_id) : undefined),
        clinic_place_id: placeIdParam     ? Number(placeIdParam)     : undefined,
      };

      const res = await createAppointment(payload);
      const appt = res.data;

      // Lưu vào localStorage để "Lịch của tôi" hiển thị ngay cả khi guest
      try {
        const saved = JSON.parse(localStorage.getItem("carenow_bookings") || "[]");
        saved.unshift({
          id:            appt.id,
          booking_code:  appt.booking_code,
          appt_date:     appt.appt_date,
          appt_time:     appt.appt_time,
          patient_name:  appt.patient_name,
          patient_phone: appt.patient_phone,
          status:        appt.status || 1,
          clinic_name:   appt.clinic_name || bookingContext.clinic?.name || null,
          specialist_name: appt.specialist_name || bookingContext.specialty?.name || null,
          service_name:  appt.service_name || null,
          place_name:    appt.place_name || bookingContext.place?.name || null,
          created_at:    appt.created_at    || new Date().toISOString(),
        });
        localStorage.setItem("carenow_bookings", JSON.stringify(saved.slice(0, 20)));
      } catch { /* ignore */ }

      setSuccessData({ bookingCode: appt.booking_code, appt });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setSubmitError(
        err?.response?.data?.message || "Đặt lịch thất bại, vui lòng thử lại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Màn thành công ─────────────────────────────────────────────────────── */
  if (successData) {
    return (
      <SuccessScreen
        bookingCode={successData.bookingCode}
        appt={successData.appt}
        onViewAppointments={() => navigate("/lich-cua-toi")}
      />
    );
  }

  const set = (key) => (e) => setFormData((f) => ({ ...f, [key]: e.target.value }));

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-gray-800">Đặt lịch khám</h1>

          {contextHint && (
            <div className="mb-6 p-4 rounded-xl text-sm border border-blue-100 bg-blue-50 text-blue-800">
              {contextHint}
            </div>
          )}

          {/* Step indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {STEPS.map((label, i) => {
                const step = i + 1;
                return (
                  <div key={step} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`size-10 rounded-full flex items-center justify-center font-semibold ${
                          currentStep >= step ? "bg-primary text-white" : "bg-gray-300 text-gray-600"
                        }`}
                      >
                        {currentStep > step ? <CheckCircle className="size-6" /> : step}
                      </div>
                      <span className="text-sm mt-2 text-gray-600">{label}</span>
                    </div>
                    {step < 4 && <ChevronRight className="size-5 text-gray-400 -mt-6" />}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-8">

            {/* ── Bước 1: Chọn dịch vụ ─────────────────────────────────── */}
            {currentStep === 1 && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Chọn loại dịch vụ</h2>
                <div className="space-y-4">
                  {["Khám Chuyên khoa", "Khám Tổng quát", "Khám Nha khoa"].map((service) => (
                    <label
                      key={service}
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        formData.serviceType === service
                          ? "border-primary bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="serviceType"
                        value={service}
                        checked={formData.serviceType === service}
                        onChange={set("serviceType")}
                        className="mr-3"
                      />
                      <span className="font-medium">{service}</span>
                    </label>
                  ))}
                </div>

                {formData.serviceType === "Khám Chuyên khoa" && (
                  <div className="mt-6">
                    <label className="block mb-2 font-medium">Chọn chuyên khoa</label>
                    <select
                      value={formData.specialty}
                      onChange={set("specialty")}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    >
                      <option value="">-- Chọn chuyên khoa --</option>
                      <option value="tim-mach">Tim mạch</option>
                      <option value="noi-tiet">Nội tiết</option>
                      <option value="tieu-hoa">Tiêu hóa</option>
                      <option value="da-lieu">Da liễu</option>
                    </select>
                  </div>
                )}

                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={!formData.serviceType}
                  className="mt-6 w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Tiếp theo
                </button>
              </div>
            )}

            {/* ── Bước 2: Chọn bác sĩ ──────────────────────────────────── */}
            {currentStep === 2 && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Chọn bác sĩ</h2>
                <div className="space-y-4">
                  {doctors.map((doctor) => (
                    <label
                      key={doctor.id}
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        formData.doctor === doctor.id
                          ? "border-primary bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="doctor"
                        value={doctor.id}
                        checked={formData.doctor === doctor.id}
                        onChange={set("doctor")}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-semibold">{doctor.name}</div>
                        <div className="text-sm text-gray-600">
                          {doctor.specialty} · {doctor.experience}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex gap-4 mt-6">
                  <button onClick={() => setCurrentStep(1)} className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors">Quay lại</button>
                  <button onClick={() => setCurrentStep(3)} disabled={!formData.doctor} className="flex-1 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Tiếp theo</button>
                </div>
              </div>
            )}

            {/* ── Bước 3: Chọn ngày giờ ────────────────────────────────── */}
            {currentStep === 3 && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Chọn ngày và giờ khám</h2>

                {clinicIdParam ? (
                  /* Có clinicId → dùng lịch thật từ DB */
                  <div className="mb-4">
                    <SchedulePicker
                      clinicId={Number(clinicIdParam)}
                      selectedDate={formData.date}
                      selectedTime={formData.time}
                      onSelect={(date, time) =>
                        setFormData((f) => ({ ...f, date, time }))
                      }
                    />
                  </div>
                ) : (
                  /* Không có clinicId → fallback date picker + static slots */
                  <>
                    <div className="mb-6">
                      <label className="block mb-2 font-medium text-sm text-gray-700">
                        <Calendar className="size-4 inline mr-1 text-blue-500" /> Ngày khám
                      </label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={set("date")}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                    </div>
                    {formData.date && (
                      <div>
                        <label className="block mb-2 font-medium text-sm text-gray-700">
                          <Clock className="size-4 inline mr-1 text-blue-500" /> Giờ khám
                        </label>
                        <div className="grid grid-cols-4 gap-3">
                          {FALLBACK_SLOTS.map((time) => (
                            <button
                              key={time}
                              onClick={() => setFormData((f) => ({ ...f, time }))}
                              className={`p-3 border-2 rounded-lg font-medium transition-colors ${
                                formData.time === time
                                  ? "border-primary bg-blue-50 text-primary"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Tóm tắt đã chọn */}
                {formData.date && formData.time && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-2">
                    <CheckCircle className="size-4 shrink-0" />
                    Đã chọn:{" "}
                    <strong>
                      {new Date(formData.date + "T00:00:00").toLocaleDateString("vi-VN", {
                        weekday: "short", day: "numeric", month: "short",
                      })} — {formData.time}
                    </strong>
                  </div>
                )}

                <div className="flex gap-4 mt-6">
                  <button onClick={() => setCurrentStep(2)} className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors">Quay lại</button>
                  <button onClick={() => setCurrentStep(4)} disabled={!formData.date || !formData.time} className="flex-1 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Tiếp theo</button>
                </div>
              </div>
            )}

            {/* ── Bước 4: Thông tin bệnh nhân ──────────────────────────── */}
            {currentStep === 4 && (
              <div>
                <h2 className="text-xl font-semibold mb-2">Thông tin người khám</h2>

                {/* Toggle đặt cho mình / cho người thân */}
                {isLoggedIn && profile && (
                  <div className="mb-6 flex gap-3">
                    <button
                      onClick={() => handleToggleRelative(false)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                        !forRelative
                          ? "border-primary bg-blue-50 text-primary"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <User className="size-4" /> Đặt cho tôi
                    </button>
                    <button
                      onClick={() => handleToggleRelative(true)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                        forRelative
                          ? "border-primary bg-blue-50 text-primary"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <Users className="size-4" /> Đặt cho người thân
                    </button>
                  </div>
                )}

                {/* Banner thông tin đã fill */}
                {isLoggedIn && profile && !forRelative && (
                  <div className="mb-5 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-2">
                    <CheckCircle className="size-4 shrink-0" />
                    Thông tin đã được điền từ hồ sơ của bạn. Chỉnh sửa nếu cần.
                  </div>
                )}

                {forRelative && (
                  <div className="mb-5 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-700 flex items-center gap-2">
                    <Users className="size-4 shrink-0" />
                    Nhập thông tin người thân sẽ đi khám.
                  </div>
                )}

                <div className="space-y-4">
                  <InputField label="Họ và tên" icon={User} required type="text" value={formData.fullName} onChange={set("fullName")} placeholder="Nguyễn Văn A" />
                  <InputField label="Số điện thoại" icon={Phone} required type="tel" value={formData.phone} onChange={set("phone")} placeholder="0912345678" />
                  <InputField label="Email" icon={Mail} type="email" value={formData.email} onChange={set("email")} placeholder="email@example.com" />

                  <div>
                    <div className="flex items-center gap-1.5 mb-2 text-sm font-medium text-gray-700">
                      <MapPin className="size-4 text-blue-500" />
                      Khu vực khám
                    </div>
                    <BookingLocationSelects
                      required
                      provinceId={formData.provinceId}
                      wardId={formData.wardId}
                      onProvinceChange={handleProvinceChange}
                      onWardChange={(value) => setFormData((f) => ({ ...f, wardId: value }))}
                    />
                    {wardsLoading && (
                      <p className="text-xs text-gray-400 mt-1">Đang tải xã/phường...</p>
                    )}
                  </div>

                  {/* Địa chỉ cụ thể */}
                  <InputField label="Địa chỉ chi tiết (số nhà, đường)" icon={MapPin} type="text" value={formData.address} onChange={set("address")} placeholder="Số 1, Đường Nguyễn Huệ" />

                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">
                      <FileText className="size-4 inline mr-1 text-blue-500" /> Ghi chú
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={set("notes")}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                      rows={3}
                      placeholder="Triệu chứng, yêu cầu đặc biệt…"
                    />
                  </div>
                </div>

                {/* Tóm tắt lịch */}
                <div className="mt-6 p-4 bg-blue-50 rounded-xl text-sm text-gray-700 space-y-1.5 border border-blue-100">
                  <p className="font-semibold text-gray-800 mb-2">Tóm tắt lịch hẹn</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-blue-400" />
                    <span>
                      {new Date(formData.date).toLocaleDateString("vi-VN", {
                        weekday: "long", year: "numeric", month: "long", day: "numeric",
                      })} — {formData.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="size-4 text-blue-400" />
                    <span>{doctors.find((d) => d.id === formData.doctor)?.name || "—"}</span>
                  </div>
                </div>

                {submitError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-700">
                    <AlertCircle className="size-4 mt-0.5 shrink-0" />
                    {submitError}
                  </div>
                )}

                <div className="flex gap-4 mt-6">
                  <button onClick={() => setCurrentStep(3)} disabled={submitting} className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50">
                    Quay lại
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!formData.fullName || !formData.phone || submitting}
                    className="flex-1 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <><Loader2 className="size-4 animate-spin" /> Đang xử lý…</>
                    ) : (
                      "Xác nhận đặt lịch"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
