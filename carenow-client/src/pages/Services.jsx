import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Calendar, ChevronRight,
  Users, CheckCircle, Phone,
} from "lucide-react";
import {
  IconStethoscope, IconTelemedicine, IconGeneralCheckup,
  IconLabTest, IconMentalHealth, IconDental, IconSurgery,
} from "../components/MedicalServiceIcons";
import { getServices } from "../api/catalog.api";

function stripHtml(s) {
  if (!s) return "";
  return String(s).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/* Map tên service -> icon/màu (giống Home) */
const SERVICE_STYLE_MAP = [
  { test: /chuy[eê]n khoa/i,          Icon: IconStethoscope,   color: "#3498db", bg: "#e8f4fd", gradFrom: "#1a6fa3", gradTo: "#3498db" },
  { test: /t[ừu] xa|online|tele/i,    Icon: IconTelemedicine,  color: "#8b5cf6", bg: "#f3f0ff", gradFrom: "#5b21b6", gradTo: "#8b5cf6" },
  { test: /t[oô]ng qu[aá]t/i,         Icon: IconGeneralCheckup,color: "#059669", bg: "#d1fae5", gradFrom: "#065f46", gradTo: "#059669" },
  { test: /x[eé]t nghi[eê]m/i,        Icon: IconLabTest,       color: "#d97706", bg: "#fef3c7", gradFrom: "#92400e", gradTo: "#d97706" },
  { test: /tinh th[aầ]n|t[aâ]m/i,     Icon: IconMentalHealth,  color: "#e11d48", bg: "#ffe4e6", gradFrom: "#9f1239", gradTo: "#e11d48" },
  { test: /nha khoa|r[aă]ng/i,         Icon: IconDental,        color: "#0d9488", bg: "#ccfbf1", gradFrom: "#134e4a", gradTo: "#0d9488" },
  { test: /ph[aẫ]u thu[aậ]t/i,         Icon: IconSurgery,       color: "#475569", bg: "#f1f5f9", gradFrom: "#1e293b", gradTo: "#475569" },
];

function resolveStyle(name = "") {
  const match = SERVICE_STYLE_MAP.find((m) => m.test.test(name));
  return match || SERVICE_STYLE_MAP[0];
}

/* static fallback khi API chưa load */
const FALLBACK_SERVICES = [
  { id: null, name: "Khám Chuyên khoa",   url: "kham-chuyen-khoa",   description: "Khám và điều trị chuyên sâu theo từng chuyên khoa" },
  { id: null, name: "Khám từ xa",          url: "kham-tu-xa",          description: "Tư vấn / khám online qua video với bác sĩ chuyên khoa" },
  { id: null, name: "Khám tổng quát",      url: "kham-tong-quat",      description: "Gói khám sức khỏe tổng quát định kỳ" },
  { id: null, name: "Xét nghiệm y học",    url: "xet-nghiem-y-hoc",    description: "Xét nghiệm máu, nước tiểu, sinh hóa và chuyên sâu" },
  { id: null, name: "Sức khỏe tinh thần",  url: "suc-khoe-tinh-than",  description: "Tư vấn và điều trị các vấn đề tâm lý, tâm thần" },
  { id: null, name: "Khám nha khoa",       url: "kham-nha-khoa",       description: "Khám và điều trị các vấn đề răng miệng" },
  { id: null, name: "Gói Phẫu thuật",      url: "goi-phau-thuat",      description: "Các gói phẫu thuật trọn gói theo chuyên khoa" },
];

const WHY_ITEMS = [
  { emoji: "🕐", title: "Đặt lịch 2 phút",     desc: "Chọn dịch vụ, chuyên khoa, giờ khám trong vài click" },
  { emoji: "👨‍⚕️", title: "200+ bác sĩ uy tín",  desc: "Đội ngũ được xét duyệt chặt chẽ, hồ sơ minh bạch" },
  { emoji: "🔔", title: "Nhắc lịch tự động",    desc: "SMS / Email nhắc trước giờ khám, không bao giờ quên" },
  { emoji: "🔒", title: "Bảo mật y tế",          desc: "Hồ sơ mã hoá, bảo mật theo chuẩn quốc tế" },
];

export function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getServices({ status: 1, limit: 20 });
        const list = res?.data ?? (Array.isArray(res) ? res : []);
        if (!cancelled) setServices(list);
      } catch {
        if (!cancelled) setServices([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const displayList = services.length > 0 ? services : FALLBACK_SERVICES;

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden text-white"
        style={{ background: "linear-gradient(135deg,#1a6fa3 0%,#3498db 55%,#5dade2 100%)", minHeight: "240px" }}
      >
        <div className="absolute -top-16 -right-16 size-64 rounded-full opacity-10 bg-white" />
        <div className="absolute -bottom-10 -left-10 size-48 rounded-full opacity-10 bg-white" />
        <div className="container mx-auto px-4 py-16 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Dịch Vụ Y Tế CareNow</h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            Chọn dịch vụ bên dưới để xem các chuyên khoa và đặt lịch khám ngay hôm nay.
          </p>
          <div className="flex items-center justify-center gap-4 mt-6 text-sm">
            <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full">
              <CheckCircle className="size-4 text-green-300" /> Miễn phí đặt lịch
            </span>
            <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full">
              <Users className="size-4" /> 200+ bác sĩ
            </span>
          </div>
        </div>
      </section>

      {/* ── Breadcrumbs ────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-2.5 flex items-center gap-1.5 text-xs text-gray-400">
          <Link to="/" className="hover:text-blue-500 transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-gray-600 font-medium">Dịch vụ</span>
        </div>
      </div>

      {/* ── Service cards ────────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 py-12">
        <div className="mb-10 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            Chọn dịch vụ phù hợp
          </h2>
          <p className="text-gray-500">
            Nhấn vào dịch vụ để xem danh sách chuyên khoa và đặt lịch
          </p>
        </div>

        {loading ? (
          /* Loading skeleton */
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
                <div className="size-14 rounded-xl bg-gray-100 mb-4" />
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-full mb-1" />
                <div className="h-3 bg-gray-100 rounded w-5/6" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayList.map((svc, i) => {
              const { Icon, color, bg, gradFrom, gradTo } = resolveStyle(svc.name);
              const desc = stripHtml(svc.description);
              const isHot = /từ xa|online|tele/i.test(svc.name || "");
              const slug = svc.url || String(svc.id);

              const card = (
                <div className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-transparent hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col h-full">
                  {/* Gradient top bar */}
                  <div
                    className="h-1.5 w-full"
                    style={{ background: `linear-gradient(to right,${gradFrom},${gradTo})` }}
                  />

                  {isHot && (
                    <span
                      className="absolute top-4 right-4 text-white text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: "#e11d48" }}
                    >
                      HOT
                    </span>
                  )}

                  <div className="p-6 flex flex-col gap-4 flex-1">
                    {/* Icon */}
                    <div
                      className="size-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                      style={{ backgroundColor: bg }}
                    >
                      <Icon size={32} style={{ color }} />
                    </div>

                    {/* Name & desc */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-1.5 leading-snug">
                        {svc.name}
                      </h3>
                      {desc && (
                        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{desc}</p>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                      <span
                        className="text-sm font-semibold flex items-center gap-1 group-hover:gap-1.5 transition-all"
                        style={{ color }}
                      >
                        Xem chuyên khoa <ChevronRight className="size-4" />
                      </span>
                      {svc.id && (
                        <Link
                          to={`/dat-lich`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs font-semibold text-white px-3 py-1.5 rounded-xl hover:opacity-90 transition-all flex items-center gap-1"
                          style={{ backgroundColor: color }}
                        >
                          <Calendar className="size-3" /> Đặt lịch
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );

              return svc.id ? (
                <Link key={svc.id ?? i} to={`/dich-vu/${slug}`} className="block h-full">
                  {card}
                </Link>
              ) : (
                <div key={i} className="h-full opacity-60 cursor-default">
                  {card}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Why CareNow ─────────────────────────────────────────────────── */}
        <div
          className="mt-16 rounded-2xl p-8"
          style={{ background: "linear-gradient(135deg,#e8f4fd 0%,#f0f7ff 100%)" }}
        >
          <h3 className="text-2xl font-bold text-gray-800 text-center mb-8">
            Tại sao chọn CareNow?
          </h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {WHY_ITEMS.map((w, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 text-center shadow-sm">
                <div className="text-3xl mb-3">{w.emoji}</div>
                <h4 className="font-bold text-gray-800 mb-1.5">{w.title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom CTA ──────────────────────────────────────────────────── */}
        <div className="mt-10 text-center">
          <p className="text-gray-600 mb-4">Chưa biết chọn dịch vụ nào?</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/dat-lich"
              className="inline-flex items-center justify-center gap-2 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg hover:opacity-90 transition-all"
              style={{ backgroundColor: "#3498db" }}
            >
              <Calendar className="size-5" /> Đặt lịch tư vấn miễn phí
            </Link>
            <a
              href="tel:19002345"
              className="inline-flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 px-8 py-3.5 rounded-2xl font-semibold hover:bg-gray-50"
            >
              <Phone className="size-4" /> Gọi 1900-2345
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
