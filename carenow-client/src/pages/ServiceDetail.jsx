import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Calendar, Phone,
  Heart, Brain, Eye, Baby, Bone, Stethoscope,
  Activity, Microscope, Wind, Users, CheckCircle, ArrowRight,
} from "lucide-react";
import {
  IconStethoscope, IconTelemedicine, IconGeneralCheckup,
  IconLabTest, IconMentalHealth, IconDental, IconSurgery,
} from "../components/MedicalServiceIcons";
import { getServices, getSpecialties } from "../api/catalog.api";
import { buildSpecialtyPath } from "../utils/catalogPath";

/* ─── Icon palette cho chuyên khoa ────────────────────────────────────────── */
const SPEC_ICONS = [
  Heart, Baby, Activity, Brain, Bone, Eye, Stethoscope,
  Microscope, Wind, IconDental, IconTelemedicine, IconLabTest,
  IconMentalHealth, IconSurgery, IconGeneralCheckup, IconStethoscope,
];

const SPEC_PALETTE = [
  { bg: "#fee2e2", color: "#dc2626" },
  { bg: "#fef3c7", color: "#d97706" },
  { bg: "#fce7f3", color: "#db2777" },
  { bg: "#ede9fe", color: "#7c3aed" },
  { bg: "#dbeafe", color: "#2563eb" },
  { bg: "#d1fae5", color: "#059669" },
  { bg: "#fff7ed", color: "#ea580c" },
  { bg: "#f5f3ff", color: "#6d28d9" },
  { bg: "#eff6ff", color: "#1d4ed8" },
  { bg: "#ecfdf5", color: "#16a34a" },
  { bg: "#ccfbf1", color: "#0d9488" },
  { bg: "#fdf2f8", color: "#be185d" },
];

/* ─── Icon đại diện cho từng service (match theo tên) ─────────────────────── */
const SERVICE_ICON_MAP = [
  { test: /chuy[eê]n khoa/i,   Icon: IconStethoscope,   color: "#3498db", bg: "#e8f4fd" },
  { test: /t[ừu] xa|online|tele/i, Icon: IconTelemedicine, color: "#8b5cf6", bg: "#f3f0ff" },
  { test: /t[oô]ng qu[aá]t/i,  Icon: IconGeneralCheckup, color: "#059669", bg: "#d1fae5" },
  { test: /x[eé]t nghi[eê]m/i, Icon: IconLabTest,       color: "#d97706", bg: "#fef3c7" },
  { test: /tinh th[aầ]n|t[aâ]m/i, Icon: IconMentalHealth, color: "#e11d48", bg: "#ffe4e6" },
  { test: /nha khoa|r[aă]ng/i,  Icon: IconDental,        color: "#0d9488", bg: "#ccfbf1" },
  { test: /ph[aẫ]u thu[aậ]t/i,  Icon: IconSurgery,       color: "#475569", bg: "#f1f5f9" },
];

function getServiceIcon(name = "") {
  const match = SERVICE_ICON_MAP.find((m) => m.test.test(name));
  return match || { Icon: IconStethoscope, color: "#3498db", bg: "#e8f4fd" };
}

function stripHtml(s) {
  if (!s) return "";
  return String(s).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function ServiceDetail() {
  const { serviceSlug } = useParams();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!serviceSlug) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        // 1) Tìm service theo slug
        const res = await getServices({ status: 1, limit: 20 });
        const list = res?.data ?? (Array.isArray(res) ? res : []);
        const found = list.find(
          (s) => s.url === serviceSlug || String(s.id) === serviceSlug
        );

        if (cancelled) return;
        if (!found) { setLoading(false); return; }
        setService(found);

        // 2) Lấy chuyên khoa thuộc service
        const specRes = await getSpecialties({ service_id: found.id, status: 1, limit: 100 });
        const specs = specRes?.data ?? (Array.isArray(specRes) ? specRes : []);
        if (!cancelled) setSpecialties(specs);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [serviceSlug]);

  const { Icon: SvcIcon, color: svcColor, bg: svcBg } = useMemo(
    () => getServiceIcon(service?.name ?? ""),
    [service]
  );

  /* Loading skeleton */
  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-20 text-center text-gray-500">
          Đang tải…
        </div>
      </div>
    );
  }

  /* Not found */
  if (!service) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-gray-600 mb-4">Không tìm thấy dịch vụ.</p>
          <Link to="/dich-vu" className="font-medium" style={{ color: "#3498db" }}>
            Quay về danh sách dịch vụ
          </Link>
        </div>
      </div>
    );
  }

  const desc = stripHtml(service.description);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* ── Hero Banner ─────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden text-white"
        style={{ background: `linear-gradient(135deg,#1a6fa3 0%,${svcColor} 60%,${svcColor}cc 100%)` }}
      >
        <div className="absolute -top-16 -right-16 size-64 rounded-full opacity-10 bg-white" />
        <div className="absolute -bottom-10 -left-10 size-48 rounded-full opacity-10 bg-white" />

        <div className="container mx-auto px-4 py-14 relative z-10">
          {/* Back + breadcrumb */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/80 hover:text-white text-sm mb-6 transition-colors"
          >
            <ChevronLeft className="size-4" /> Quay lại
          </button>
          <div className="flex items-start gap-5">
            <div
              className="size-20 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
              style={{ backgroundColor: svcBg }}
            >
              <SvcIcon size={40} style={{ color: svcColor }} />
            </div>
            <div>
              <p className="text-white/70 text-sm mb-1">Dịch vụ CareNow</p>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{service.name}</h1>
              {desc && (
                <p className="text-white/85 max-w-2xl leading-relaxed">{desc}</p>
              )}
              <div className="flex items-center gap-3 mt-4">
                <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-sm">
                  <Users className="size-4" />
                  <span>{specialties.length} chuyên khoa</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-sm">
                  <CheckCircle className="size-4 text-green-300" />
                  <span>Đặt lịch miễn phí</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Breadcrumbs ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-2.5 flex items-center gap-1.5 text-xs text-gray-400 flex-wrap">
          <Link to="/" className="hover:text-blue-500 transition-colors">Trang chủ</Link>
          <span>/</span>
          <Link to="/dich-vu" className="hover:text-blue-500 transition-colors">Dịch vụ</Link>
          <span>/</span>
          <span className="text-gray-600 font-medium">{service.name}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {specialties.length === 0 ? (
          /* Empty state */
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
            <Users className="size-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Chưa có chuyên khoa nào
            </h3>
            <p className="text-gray-500 mb-6">
              Hệ thống đang cập nhật dữ liệu cho dịch vụ này.
            </p>
            <a
              href="tel:19002345"
              className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90"
              style={{ backgroundColor: "#3498db" }}
            >
              <Phone className="size-4" /> Gọi tư vấn 1900-2345
            </a>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Chọn chuyên khoa để đặt lịch
              </h2>
              <span className="text-sm text-gray-400 hidden md:block">
                {specialties.length} chuyên khoa
              </span>
            </div>

            {/* ── Specialty grid ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {specialties.map((spec, i) => {
                const Icon = SPEC_ICONS[i % SPEC_ICONS.length];
                const pal  = SPEC_PALETTE[i % SPEC_PALETTE.length];
                const desc = stripHtml(spec.description);
                const path = buildSpecialtyPath(spec);

                return (
                  <Link
                    key={spec.id}
                    to={path}
                    className="group bg-white rounded-2xl p-5 border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all hover:-translate-y-0.5 flex flex-col gap-3"
                  >
                    {/* Icon */}
                    <div className="flex items-center gap-3">
                      <div
                        className="size-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300"
                        style={{ backgroundColor: pal.bg }}
                      >
                        <Icon size={24} style={{ color: pal.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-800 text-sm leading-snug">
                          {spec.name}
                        </h3>
                      </div>
                      <ChevronRight className="size-4 text-gray-300 group-hover:text-blue-400 shrink-0 transition-colors" />
                    </div>

                    {/* Description */}
                    {desc && (
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                        {desc}
                      </p>
                    )}

                    {/* CTA row */}
                    <div className="mt-auto pt-2 border-t border-gray-50 flex items-center justify-between">
                      <span
                        className="text-xs font-semibold flex items-center gap-1 group-hover:gap-1.5 transition-all"
                        style={{ color: svcColor }}
                      >
                        Xem chi tiết <ArrowRight className="size-3" />
                      </span>
                      <Link
                        to={`/dat-lich?specialtyId=${encodeURIComponent(spec.id)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs font-semibold text-white px-2.5 py-1 rounded-lg hover:opacity-90 transition-all"
                        style={{ backgroundColor: svcColor }}
                      >
                        <Calendar className="size-3 inline mr-0.5" /> Đặt lịch
                      </Link>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* ── Bottom CTA ───────────────────────────────────────────── */}
            <div
              className="mt-10 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
              style={{ backgroundColor: `${svcBg}` }}
            >
              <div>
                <p className="font-bold text-gray-800 mb-0.5">
                  Không tìm thấy chuyên khoa phù hợp?
                </p>
                <p className="text-sm text-gray-600">
                  Tư vấn miễn phí để chọn đúng bác sĩ ngay.
                </p>
              </div>
              <div className="flex gap-3 shrink-0">
                <Link
                  to="/dat-lich"
                  className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
                  style={{ backgroundColor: svcColor }}
                >
                  <Calendar className="size-4" /> Đặt lịch ngay
                </Link>
                <a
                  href="tel:19002345"
                  className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50"
                >
                  <Phone className="size-4" /> Gọi tư vấn
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
