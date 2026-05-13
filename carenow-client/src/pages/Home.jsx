import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Users,
  Clock,
  Shield,
  Star,
  ChevronRight,
  Activity,
  Heart,
  Bone,
  Search,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Phone,
  MapPin,
  Zap,
  TrendingUp,
  Brain,
  Eye,
  Stethoscope,
  Baby,
  Microscope,
  Wind,
  Building2,
  Navigation,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import {
  IconStethoscope,
  IconTelemedicine,
  IconGeneralCheckup,
  IconLabTest,
  IconMentalHealth,
  IconDental,
  IconSurgery,
} from "../components/MedicalServiceIcons";
import { Pagination } from "../components/Pagination";
import { getClinics, getClinicPlaces, getServices, getSpecialties } from "../api/catalog.api";
import {
  buildDoctorPath,
  buildPlacePath,
  buildSpecialtyPath,
} from "../utils/catalogPath";

const PER_PAGE = 6;

const PLACEHOLDER_DOCTOR =
  "https://images.unsplash.com/photo-1622902046580-2b47f47f5471?w=400&q=80";

const SERVICE_STYLE_SLOTS = [
  { Icon: IconStethoscope, color: "#3498db", bg: "#e8f4fd" },
  { Icon: IconTelemedicine, color: "#8b5cf6", bg: "#f3f0ff" },
  { Icon: IconGeneralCheckup, color: "#059669", bg: "#d1fae5" },
  { Icon: IconLabTest, color: "#d97706", bg: "#fef3c7" },
  { Icon: IconMentalHealth, color: "#e11d48", bg: "#ffe4e6" },
  { Icon: IconDental, color: "#0d9488", bg: "#ccfbf1" },
  { Icon: IconSurgery, color: "#475569", bg: "#f1f5f9" },
];

const SPEC_ICONS = [
  Heart,
  Baby,
  Activity,
  Brain,
  Bone,
  Eye,
  Stethoscope,
  Microscope,
  Wind,
  IconDental,
  IconTelemedicine,
  IconLabTest,
];

const SPEC_PALETTE = [
  { color: "#fee2e2", iconColor: "#dc2626" },
  { color: "#fef3c7", iconColor: "#d97706" },
  { color: "#fce7f3", iconColor: "#db2777" },
  { color: "#ede9fe", iconColor: "#7c3aed" },
  { color: "#dbeafe", iconColor: "#2563eb" },
  { color: "#ecfdf5", iconColor: "#059669" },
  { color: "#fff7ed", iconColor: "#ea580c" },
  { color: "#d1fae5", iconColor: "#059669" },
  { color: "#f5f3ff", iconColor: "#6d28d9" },
  { color: "#eff6ff", iconColor: "#1d4ed8" },
];

const DOCTOR_TAG_ROTATION = [
  { tag: "Nổi bật", tagColor: "#e74c3c" },
  { tag: "Đặt nhiều nhất", tagColor: "#27ae60" },
  { tag: "Chuyên gia", tagColor: "#8e44ad" },
  { tag: "Được yêu thích", tagColor: "#e67e22" },
];

const LOC_BADGE_ROTATION = [
  { badge: "Nổi bật", badgeColor: "#e74c3c" },
  { badge: "Chuyên sâu", badgeColor: "#8e44ad" },
  { badge: "Gần bạn", badgeColor: "#27ae60" },
  { badge: "Hệ thống", badgeColor: "#3498db" },
];

const ALL_ARTICLES = [
  {
    id: "1",
    title: "10 dấu hiệu cảnh báo bệnh tim mạch không nên bỏ qua",
    category: "Tim mạch",
    catColor: "#fee2e2",
    catText: "#dc2626",
    readTime: "5 phút",
    date: "28/04/2026",
    emoji: "❤️",
    bgFrom: "#ffecd2",
    bgTo: "#fcb69f",
  },
  {
    id: "2",
    title: "Chế độ dinh dưỡng cân bằng cho người trưởng thành 30–50 tuổi",
    category: "Dinh dưỡng",
    catColor: "#d1fae5",
    catText: "#059669",
    readTime: "7 phút",
    date: "25/04/2026",
    emoji: "🥗",
    bgFrom: "#a8edea",
    bgTo: "#fed6e3",
  },
  {
    id: "3",
    title: "Cách quản lý stress hiệu quả trong cuộc sống hiện đại",
    category: "Tâm lý",
    catColor: "#ede9fe",
    catText: "#7c3aed",
    readTime: "6 phút",
    date: "22/04/2026",
    emoji: "🧘",
    bgFrom: "#d299c2",
    bgTo: "#fef9d7",
  },
  {
    id: "4",
    title: "Tầm soát ung thư: Ai nên làm và làm khi nào?",
    category: "Ung bướu",
    catColor: "#f5f3ff",
    catText: "#6d28d9",
    readTime: "8 phút",
    date: "20/04/2026",
    emoji: "🔬",
    bgFrom: "#c3cfe2",
    bgTo: "#f5f7fa",
  },
  {
    id: "5",
    title: "Vaccine cần tiêm cho người lớn – Danh sách đầy đủ 2026",
    category: "Phòng bệnh",
    catColor: "#d1fae5",
    catText: "#059669",
    readTime: "6 phút",
    date: "18/04/2026",
    emoji: "💉",
    bgFrom: "#b8f0e6",
    bgTo: "#c2f0e8",
  },
  {
    id: "6",
    title: "Huyết áp cao: Thay đổi lối sống để kiểm soát hiệu quả",
    category: "Tim mạch",
    catColor: "#fee2e2",
    catText: "#dc2626",
    readTime: "5 phút",
    date: "16/04/2026",
    emoji: "📊",
    bgFrom: "#ffecd2",
    bgTo: "#fcb69f",
  },
  {
    id: "7",
    title: "Bí quyết ngủ đủ giấc và cải thiện chất lượng giấc ngủ",
    category: "Sức khỏe",
    catColor: "#eff6ff",
    catText: "#1d4ed8",
    readTime: "4 phút",
    date: "14/04/2026",
    emoji: "😴",
    bgFrom: "#a1c4fd",
    bgTo: "#c2e9fb",
  },
  {
    id: "8",
    title: "Tiểu đường type 2: Phát hiện sớm và phòng ngừa biến chứng",
    category: "Nội tiết",
    catColor: "#fef3c7",
    catText: "#d97706",
    readTime: "9 phút",
    date: "12/04/2026",
    emoji: "🩸",
    bgFrom: "#ffecd2",
    bgTo: "#a18cd1",
  },
  {
    id: "9",
    title: "5 bài tập yoga tốt cho xương khớp người trung niên",
    category: "Vận động",
    catColor: "#dbeafe",
    catText: "#2563eb",
    readTime: "5 phút",
    date: "10/04/2026",
    emoji: "🏃",
    bgFrom: "#c2e9fb",
    bgTo: "#a1c4fd",
  },
  {
    id: "10",
    title: "Chăm sóc mắt đúng cách khi làm việc màn hình cả ngày",
    category: "Mắt",
    catColor: "#ecfdf5",
    catText: "#059669",
    readTime: "4 phút",
    date: "08/04/2026",
    emoji: "👁️",
    bgFrom: "#c1dfc4",
    bgTo: "#deecdd",
  },
  {
    id: "11",
    title: "Phụ nữ mang thai cần lưu ý gì trong 3 tháng đầu?",
    category: "Phụ sản",
    catColor: "#fdf2f8",
    catText: "#be185d",
    readTime: "7 phút",
    date: "06/04/2026",
    emoji: "🤰",
    bgFrom: "#fbc2eb",
    bgTo: "#a6c1ee",
  },
  {
    id: "12",
    title: "Loãng xương ở người trung niên – Nhận biết và điều trị",
    category: "Xương khớp",
    catColor: "#dbeafe",
    catText: "#2563eb",
    readTime: "6 phút",
    date: "04/04/2026",
    emoji: "🦴",
    bgFrom: "#c1dfc4",
    bgTo: "#e0f7fa",
  },
  {
    id: "13",
    title: "Sức khỏe răng miệng ảnh hưởng đến tim mạch như thế nào?",
    category: "Nha khoa",
    catColor: "#ccfbf1",
    catText: "#0d9488",
    readTime: "5 phút",
    date: "02/04/2026",
    emoji: "🦷",
    bgFrom: "#b2fefa",
    bgTo: "#0ed2f7",
  },
  {
    id: "14",
    title: "Dấu hiệu suy giảm chức năng gan – Khi nào cần đi khám?",
    category: "Tiêu hóa",
    catColor: "#ecfdf5",
    catText: "#16a34a",
    readTime: "6 phút",
    date: "30/03/2026",
    emoji: "🫁",
    bgFrom: "#d4fc79",
    bgTo: "#96e6a1",
  },
  {
    id: "15",
    title: "Khám sức khỏe định kỳ: Tại sao không nên bỏ qua?",
    category: "Tổng quát",
    catColor: "#d1fae5",
    catText: "#059669",
    readTime: "4 phút",
    date: "28/03/2026",
    emoji: "🏥",
    bgFrom: "#e0f7fa",
    bgTo: "#b2fefa",
  },
  {
    id: "16",
    title: "Ung thư cổ tử cung: HPV vaccine và xét nghiệm PAP smear",
    category: "Phụ sản",
    catColor: "#fdf2f8",
    catText: "#be185d",
    readTime: "8 phút",
    date: "26/03/2026",
    emoji: "🎗️",
    bgFrom: "#fbc2eb",
    bgTo: "#f5f7fa",
  },
  {
    id: "17",
    title: "Đau đầu mãn tính – Nguyên nhân và giải pháp điều trị",
    category: "Thần kinh",
    catColor: "#ede9fe",
    catText: "#7c3aed",
    readTime: "5 phút",
    date: "24/03/2026",
    emoji: "🧠",
    bgFrom: "#d299c2",
    bgTo: "#fef9d7",
  },
  {
    id: "18",
    title: "Chế độ tập luyện an toàn cho người bệnh tim",
    category: "Tim mạch",
    catColor: "#fee2e2",
    catText: "#dc2626",
    readTime: "6 phút",
    date: "22/03/2026",
    emoji: "💪",
    bgFrom: "#ffecd2",
    bgTo: "#fcb69f",
  },
  {
    id: "19",
    title: "Hội chứng ruột kích thích – Ăn uống và điều trị",
    category: "Tiêu hóa",
    catColor: "#ecfdf5",
    catText: "#16a34a",
    readTime: "7 phút",
    date: "20/03/2026",
    emoji: "🥦",
    bgFrom: "#a8edea",
    bgTo: "#fed6e3",
  },
  {
    id: "20",
    title: "Trầm cảm sau sinh và cách hỗ trợ người thân",
    category: "Tâm lý",
    catColor: "#ede9fe",
    catText: "#7c3aed",
    readTime: "6 phút",
    date: "18/03/2026",
    emoji: "💛",
    bgFrom: "#ffeaa7",
    bgTo: "#dfe6e9",
  },
];

const PROCESS_STEPS = [
  {
    step: 1,
    icon: Search,
    title: "Chọn dịch vụ & Bác sĩ",
    desc: "Chọn chuyên khoa và bác sĩ phù hợp",
  },
  {
    step: 2,
    icon: Calendar,
    title: "Chọn ngày & giờ khám",
    desc: "Chọn khung giờ thuận tiện có sẵn",
  },
  {
    step: 3,
    icon: MapPin,
    title: "Điền thông tin",
    desc: "Nhập thông tin cá nhân và triệu chứng",
  },
  {
    step: 4,
    icon: CheckCircle,
    title: "Xác nhận lịch hẹn",
    desc: "Nhận SMS/Email xác nhận và nhắc tự động",
  },
];

function extractRows(res) {
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

function parseIds(raw) {
  return String(raw || "")
    .split(/[,;]/)
    .map((x) => parseInt(x.trim(), 10))
    .filter((n) => !Number.isNaN(n));
}

function stripHtml(s) {
  if (!s) return "";
  return String(s)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildServiceCards(apiServices) {
  const list = apiServices.slice(0, 7);
  return list.map((s, i) => {
    const style = SERVICE_STYLE_SLOTS[i % SERVICE_STYLE_SLOTS.length];
    const hot = /từ xa|online|tele|video/i.test(s.name || "");
    return {
      id: s.id,
      name: s.name,
      url: s.url || String(s.id),
      Icon: style.Icon,
      color: style.color,
      bg: style.bg,
      hot,
    };
  });
}

function buildSpecialtyRows(apiSpecs) {
  return apiSpecs.map((row, i) => {
    const Icon = SPEC_ICONS[i % SPEC_ICONS.length];
    const pal = SPEC_PALETTE[i % SPEC_PALETTE.length];
    return {
      id: row.id,
      name: row.name,
      url: row.url,
      Icon,
      color: pal.color,
      iconColor: pal.iconColor,
      count: "Đặt lịch ngay",
    };
  });
}

function buildDoctors(clinics, specById) {
  return clinics.map((c, i) => {
    const ids = parseIds(c.specialist_ids);
    const sp = ids.length ? specById.get(ids[0]) : null;
    const tag = DOCTOR_TAG_ROTATION[i % DOCTOR_TAG_ROTATION.length];
    const summary = stripHtml(c.summary);
    const exp =
      summary.length > 90 ? `${summary.slice(0, 90)}…` : summary || "Bác sĩ CareNow";
    const reviews = Number(c.appointment_total) || 0;
    return {
      id: c.id,
      name: c.name,
      title: c.title,
      url: c.url,
      specialty: sp?.name || "Đa khoa",
      hospital: c.address || "—",
      rating: 4.8,
      reviews,
      exp,
      image: c.picture || PLACEHOLDER_DOCTOR,
      tag: tag.tag,
      tagColor: tag.tagColor,
      next: "Đặt lịch",
    };
  });
}

function buildLocations(places) {
  return places.map((p, i) => {
    const b = LOC_BADGE_ROTATION[i % LOC_BADGE_ROTATION.length];
    return {
      id: p.id,
      name: p.display_name || p.name,
      url: p.url,
      short_name: p.short_name,
      display_name: p.display_name,
      rawName: p.name,
      address: p.address || "—",
      type: p.short_name || p.title || "Cơ sở y tế",
      rating: 4.8,
      distance: "—",
      open: "—",
      badge: b.badge,
      badgeColor: b.badgeColor,
    };
  });
}

export function Home() {
  const [docPage, setDocPage] = useState(1);
  const [specPage, setSpecPage] = useState(1);
  const [artPage, setArtPage] = useState(1);
  const [locPage, setLocPage] = useState(1);

  const [serviceCards, setServiceCards] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [doctorCards, setDoctorCards] = useState([]);
  const [locationCards, setLocationCards] = useState([]);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [svcRes, specRes, clinRes, placeRes] = await Promise.all([
          getServices({ status: 1, limit: 50, page: 1 }),
          getSpecialties({ status: 1, limit: 500, page: 1 }),
          getClinics({ status: 1, limit: 500, page: 1 }),
          getClinicPlaces({ status: 1, limit: 500, page: 1 }),
        ]);
        if (cancelled) return;

        const apiServices = extractRows(svcRes);
        const apiSpecs = extractRows(specRes);
        const clinics = extractRows(clinRes);
        const places = extractRows(placeRes);

        const specById = new Map(apiSpecs.map((s) => [s.id, s]));

        setServiceCards(buildServiceCards(apiServices));
        setSpecialties(buildSpecialtyRows(apiSpecs));
        setDoctorCards(buildDoctors(clinics, specById));
        setLocationCards(buildLocations(places));
        setLoadError(null);
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          setLoadError(e?.message || "Không tải được danh mục");
          setServiceCards([]);
          setSpecialties([]);
          setDoctorCards([]);
          setLocationCards([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const paginate = (arr, page) => arr.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = (arr) => Math.max(1, Math.ceil(arr.length / PER_PAGE));

  const specSlice = paginate(specialties, specPage);
  const doctorSlice = paginate(doctorCards, docPage);
  const artSlice = paginate(ALL_ARTICLES, artPage);
  const locSlice = paginate(locationCards, locPage);

  const stats = useMemo(() => {
    const nDoc = doctorCards.length;
    const nSpec = specialties.length;
    const nPlace = locationCards.length;
    return [
      {
        value: nDoc ? `${nDoc}+` : "—",
        label: "Bác sĩ / phòng khám",
        icon: Users,
        color: "#3498db",
      },
      {
        value: nPlace ? `${nPlace}+` : "—",
        label: "Cơ sở khám",
        icon: Building2,
        color: "#e74c3c",
      },
      {
        value: nSpec ? `${nSpec}+` : "—",
        label: "Chuyên khoa",
        icon: Activity,
        color: "#27ae60",
      },
      { value: "4.9★", label: "Đánh giá trung bình", icon: Star, color: "#f39c12" },
    ];
  }, [doctorCards.length, specialties.length, locationCards.length]);

  return (
    <div className="pb-24 md:pb-0">
      {loadError && (
        <div
          className="bg-amber-50 text-amber-900 text-sm text-center py-2 px-4 border-b border-amber-200"
          role="status"
        >
          {loadError} — hiển thị phần tĩnh có thể thiếu dữ liệu.
        </div>
      )}

      <section
        className="relative overflow-hidden text-white"
        style={{
          background: "linear-gradient(135deg,#1a6fa3 0%,#3498db 55%,#5dade2 100%)",
          minHeight: "560px",
        }}
      >
        <div className="absolute -top-24 -right-24 size-96 rounded-full opacity-10 bg-white" />
        <div className="absolute -bottom-16 -left-16 size-64 rounded-full opacity-10 bg-white" />

        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm mb-6">
                <span className="size-2 rounded-full bg-green-400 animate-pulse" />
                Hệ thống đặt lịch khám trực tuyến #1 Việt Nam
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight">
                Đặt lịch khám
                <br />
                <span className="text-yellow-300">nhanh</span> –{" "}
                <span className="text-yellow-300">dễ</span> –{" "}
                <span className="text-yellow-300">an tâm</span>
              </h1>
              <p className="text-lg text-blue-100 mb-8 leading-relaxed">
                Kết nối với{" "}
                <strong className="text-white">
                  {doctorCards.length ? `${doctorCards.length}+ bác sĩ` : "đội ngũ bác sĩ"}
                </strong>{" "}
                chuyên khoa. Đặt lịch trong vài phút, không xếp hàng chờ đợi.
              </p>
              <div className="bg-white rounded-2xl p-2 flex gap-2 shadow-2xl mb-5">
                <div className="flex-1 flex items-center gap-3 px-4">
                  <Search className="size-5 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Tìm bác sĩ, chuyên khoa, dịch vụ..."
                    className="w-full text-gray-700 outline-none text-sm bg-transparent"
                  />
                </div>
                <Link
                  to="/dat-lich"
                  className="text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 whitespace-nowrap"
                  style={{ backgroundColor: "#3498db" }}
                >
                  Tìm & Đặt lịch
                </Link>
              </div>
              <div className="flex flex-wrap gap-2 mb-5">
                <span className="text-sm text-blue-200 mr-1">Tìm nhanh:</span>
                {["Tim mạch", "Nhi khoa", "Da liễu", "Nha khoa", "Khám từ xa"].map((s) => (
                  <Link
                    key={s}
                    to="/dat-lich"
                    className="bg-white/15 hover:bg-white/30 text-white text-sm px-3 py-1 rounded-full transition-colors border border-white/20"
                  >
                    {s}
                  </Link>
                ))}
              </div>
              <div className="flex flex-wrap gap-5 text-sm text-blue-100">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="size-4 text-green-400" /> Miễn phí đặt lịch
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="size-4 text-green-400" /> Xác nhận ngay
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="size-4 text-green-400" /> Nhắc lịch tự động
                </span>
              </div>
            </div>

            <div className="hidden md:flex justify-end items-center">
              <div className="relative">
                <div className="size-80 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/30">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1777269749032-d8d458ae594d?w=600&q-80"
                    alt="CareNow Clinic"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-4 -left-8 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3">
                  <div
                    className="size-10 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: "#27ae60" }}
                  >
                    <CheckCircle className="size-5" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Hôm nay đã có</div>
                    <div className="text-sm font-semibold text-gray-800">128 lịch hẹn</div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-6 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3">
                  <div
                    className="size-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "#fef9e7" }}
                  >
                    <Star className="size-5 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Đánh giá TB</div>
                    <div className="text-sm font-semibold text-gray-800">4.9 / 5.0 ⭐</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="flex items-center gap-4 py-5 px-6">
                  <div
                    className="size-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${stat.color}15` }}
                  >
                    <Icon className="size-6" style={{ color: stat.color }} />
                  </div>
                  <div>
                    <div className="text-xl font-bold" style={{ color: stat.color }}>
                      {stat.value}
                    </div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: "#3498db" }}>
                ── Bạn cần dịch vụ gì?
              </p>
              <h2 className="text-3xl font-bold text-gray-800">Dịch Vụ Y Tế CareNow</h2>
            </div>
            <Link
              to="/dich-vu"
              className="hidden md:flex items-center gap-1 text-sm font-medium hover:opacity-80"
              style={{ color: "#3498db" }}
            >
              Chi tiết <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
            {serviceCards.length === 0
              ? SERVICE_STYLE_SLOTS.map((slot, idx) => {
                  const Icon = slot.Icon;
                  return (
                    <div
                      key={idx}
                      className="relative flex flex-col items-center gap-2.5 py-5 px-2 rounded-2xl border border-dashed border-gray-200 bg-white/60 opacity-70"
                    >
                      <div
                        className="size-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: slot.bg }}
                      >
                        <Icon size={26} style={{ color: slot.color }} />
                      </div>
                      <span className="text-xs text-center text-gray-400">Đang tải…</span>
                    </div>
                  );
                })
              : serviceCards.map((svc) => {
                  const Icon = svc.Icon;
                  return (
                    <Link
                      key={svc.id}
                      to={`/dich-vu/${svc.url}`}
                      className="group relative flex flex-col items-center gap-2.5 py-5 px-2 rounded-2xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-lg transition-all hover:-translate-y-0.5"
                    >
                      {svc.hot && (
                        <span
                          className="absolute top-2 right-2 flex items-center gap-0.5 text-white text-xs font-bold px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: "#e11d48", fontSize: "10px" }}
                        >
                          <Zap className="size-2.5" />
                          Hot
                        </span>
                      )}
                      <div
                        className="size-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                        style={{ backgroundColor: svc.bg }}
                      >
                        <Icon size={26} style={{ color: svc.color }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 text-center leading-tight">
                        {svc.name}
                      </span>
                    </Link>
                  );
                })}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: "#3498db" }}>
                ── Chuyên khoa
              </p>
              <h2 className="text-3xl font-bold text-gray-800">Chuyên Khoa Nổi Bật</h2>
              <p className="text-gray-500 mt-1">
                Bấm để đặt lịch với bác sĩ chuyên khoa ngay hôm nay
              </p>
            </div>
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              <Users className="size-3.5" /> {specialties.length} chuyên khoa
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {specSlice.map((spec) => {
              const Icon = spec.Icon;
              return (
                <Link
                  key={spec.id}
                  to={buildSpecialtyPath({ id: spec.id, name: spec.name, url: spec.url })}
                  className="group flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all"
                >
                  <div
                    className="size-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: spec.color }}
                  >
                    <Icon size={24} style={{ color: spec.iconColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 text-sm">{spec.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{spec.count}</div>
                  </div>
                  <ChevronRight className="size-4 text-gray-300 shrink-0 group-hover:text-blue-400 transition-colors" />
                </Link>
              );
            })}
          </div>

          <Pagination
            currentPage={specPage}
            totalPages={totalPages(specialties)}
            onPageChange={setSpecPage}
            totalItems={specialties.length}
            itemsPerPage={PER_PAGE}
          />

          <div
            className="mt-6 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ backgroundColor: "#e8f4fd" }}
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="size-5 shrink-0" style={{ color: "#3498db" }} />
              <p className="text-sm text-gray-700">
                <strong>Không tìm thấy chuyên khoa phù hợp?</strong> Tư vấn chọn bác sĩ miễn phí với
                CareNow.
              </p>
            </div>
            <Link
              to="/dat-lich"
              className="shrink-0 flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: "#3498db" }}
            >
              <Phone className="size-4" /> Tư vấn ngay
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16" style={{ backgroundColor: "#f8fbff" }}>
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: "#3498db" }}>
                ── Đội ngũ bác sĩ
              </p>
              <h2 className="text-3xl font-bold text-gray-800">Bác Sĩ Nổi Bật</h2>
              <p className="text-gray-500 mt-1">Được bệnh nhân tin tưởng và đánh giá cao nhất</p>
            </div>
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-gray-400 bg-white px-3 py-1.5 rounded-full border border-gray-100">
              <Users className="size-3.5" /> {doctorCards.length} bác sĩ
            </span>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {doctorSlice.map((doctor) => (
              <div
                key={doctor.id}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all group hover:-translate-y-1"
              >
                <Link
                  to={buildDoctorPath({
                    id: doctor.id,
                    name: doctor.name,
                    title: doctor.title,
                    url: doctor.url,
                  })}
                  className="block relative h-52 overflow-hidden bg-gray-100"
                >
                  <ImageWithFallback
                    src={doctor.image}
                    alt={doctor.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div
                    className="absolute top-3 left-3 text-white text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: doctor.tagColor }}
                  >
                    {doctor.tag}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-white rounded-xl px-2.5 py-1 flex items-center gap-1 shadow-lg">
                    <Star className="size-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-bold text-gray-800">{doctor.rating}</span>
                    <span className="text-xs text-gray-400">
                      ({doctor.reviews > 0 ? doctor.reviews : "—"})
                    </span>
                  </div>
                </Link>
                <div className="p-5">
                  <Link
                    to={buildDoctorPath({
                      id: doctor.id,
                      name: doctor.name,
                      title: doctor.title,
                      url: doctor.url,
                    })}
                    className="font-bold text-gray-800 mb-1 leading-snug text-sm block hover:text-blue-600 transition-colors"
                  >
                    {doctor.name}
                  </Link>
                  <span
                    className="inline-block text-xs font-medium px-2.5 py-0.5 rounded-full mb-3"
                    style={{ backgroundColor: "#e8f4fd", color: "#2980b9" }}
                  >
                    {doctor.specialty}
                  </span>
                  <div className="space-y-1.5 mb-4">
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      <MapPin className="size-3 text-gray-400 shrink-0" />
                      {doctor.hospital}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Clock className="size-3 text-gray-400 shrink-0" />
                      {doctor.exp}
                    </p>
                    <p className="text-xs flex items-center gap-1.5 font-medium" style={{ color: "#27ae60" }}>
                      <span className="size-2 rounded-full bg-green-400 animate-pulse" />
                      Đặt lịch: {doctor.next}
                    </p>
                  </div>
                  <Link
                    to={`/dat-lich?clinicId=${encodeURIComponent(doctor.id)}`}
                    className="w-full flex items-center justify-center gap-2 text-white py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                    style={{ backgroundColor: "#3498db" }}
                  >
                    <Calendar className="size-4" /> Đặt lịch khám
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={docPage}
            totalPages={totalPages(doctorCards)}
            onPageChange={setDocPage}
            totalItems={doctorCards.length}
            itemsPerPage={PER_PAGE}
          />
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: "#3498db" }}>
                ── Hệ thống cơ sở
              </p>
              <h2 className="text-3xl font-bold text-gray-800">Nơi Khám Gần Bạn</h2>
              <p className="text-gray-500 mt-1">
                Các cơ sở y tế CareNow trên hệ thống đặt lịch
              </p>
            </div>
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              <Building2 className="size-3.5" /> {locationCards.length} cơ sở
            </span>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {locSlice.map((loc) => (
              <div
                key={loc.id}
                className="group bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all p-5"
              >
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className="size-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: "#e8f4fd" }}
                    >
                      <Building2 className="size-5" style={{ color: "#3498db" }} />
                    </div>
                    <div className="min-w-0">
                      <Link
                        to={buildPlacePath({
                          id: loc.id,
                          url: loc.url,
                          name: loc.rawName,
                          display_name: loc.display_name,
                          short_name: loc.short_name,
                        })}
                        className="font-bold text-gray-800 text-sm leading-snug block hover:text-blue-600 transition-colors"
                      >
                        {loc.name}
                      </Link>
                      <span
                        className="inline-block text-xs px-2 py-0.5 rounded-full mt-1"
                        style={{ backgroundColor: "#f0f7ff", color: "#3498db" }}
                      >
                        {loc.type}
                      </span>
                    </div>
                  </div>
                  <span
                    className="shrink-0 text-white text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                    style={{ backgroundColor: loc.badgeColor }}
                  >
                    {loc.badge}
                  </span>
                </div>

                <div className="space-y-1.5 mb-4">
                  <p className="text-xs text-gray-500 flex items-start gap-1.5">
                    <MapPin className="size-3.5 text-gray-400 shrink-0 mt-0.5" />
                    {loc.address}
                  </p>
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Navigation className="size-3 text-gray-400" />
                      {loc.distance}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Clock className="size-3 text-gray-400" />
                      {loc.open}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="size-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-semibold text-gray-700">{loc.rating}</span>
                    <span className="text-xs text-gray-400">/ 5.0</span>
                  </div>
                </div>

                <Link
                  to={`/dat-lich?placeId=${encodeURIComponent(loc.id)}`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: "#3498db" }}
                >
                  <Calendar className="size-4" /> Đặt lịch tại đây
                </Link>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={locPage}
            totalPages={totalPages(locationCards)}
            onPageChange={setLocPage}
            totalItems={locationCards.length}
            itemsPerPage={PER_PAGE}
          />
        </div>
      </section>

      <section className="py-16" style={{ backgroundColor: "#f0f7ff" }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm font-medium mb-2" style={{ color: "#3498db" }}>
              ── Đơn giản & nhanh chóng
            </p>
            <h2 className="text-3xl font-bold text-gray-800">Đặt Lịch Chỉ 4 Bước</h2>
            <p className="text-gray-500 mt-1">Hoàn tất trong vòng 2 phút, xác nhận ngay tức thì</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 relative">
            <div
              className="hidden md:block absolute h-0.5 top-12 z-0"
              style={{
                left: "14%",
                right: "14%",
                background:
                  "repeating-linear-gradient(to right,#bfdbfe 0,#bfdbfe 10px,transparent 10px,transparent 20px)",
              }}
            />
            {PROCESS_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="relative z-10 flex flex-col items-center text-center">
                  <div
                    className="size-14 rounded-full flex items-center justify-center text-white mb-5 shadow-lg relative"
                    style={{ backgroundColor: "#3498db" }}
                  >
                    <Icon className="size-6" />
                    <span
                      className="absolute -top-1.5 -right-1.5 size-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: "#1a6fa3" }}
                    >
                      {step.step}
                    </span>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-blue-100 w-full hover:shadow-md transition-shadow">
                    <h3 className="font-bold text-gray-800 mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/dat-lich"
              className="inline-flex items-center gap-3 text-white px-10 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
              style={{ backgroundColor: "#3498db" }}
            >
              <Calendar className="size-5" /> Bắt đầu đặt lịch ngay{" "}
              <ArrowRight className="size-5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: "#3498db" }}>
                ── Kiến thức y khoa
              </p>
              <h2 className="text-3xl font-bold text-gray-800">Cẩm Nang Y Tế</h2>
              <p className="text-gray-500 mt-1">Thông tin sức khỏe tin cậy từ chuyên gia CareNow</p>
            </div>
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-gray-400 bg-white px-3 py-1.5 rounded-full border border-gray-100">
              <BookOpen className="size-3.5" /> {ALL_ARTICLES.length} bài viết
            </span>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {artSlice.map((article) => (
              <Link
                key={article.id}
                to="/cam-nang-y-te"
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div
                  className="h-36 flex items-center justify-center text-5xl"
                  style={{
                    background: `linear-gradient(135deg,${article.bgFrom},${article.bgTo})`,
                  }}
                >
                  {article.emoji}
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-xs font-semibold px-3 py-1 rounded-full"
                      style={{ backgroundColor: article.catColor, color: article.catText }}
                    >
                      {article.category}
                    </span>
                    <span className="text-xs text-gray-400">{article.date}</span>
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
                    {article.title}
                  </h3>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <BookOpen className="size-3.5" />
                      {article.readTime} đọc
                    </div>
                    <span
                      className="text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all"
                      style={{ color: "#3498db" }}
                    >
                      Đọc thêm <ArrowRight className="size-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <Pagination
            currentPage={artPage}
            totalPages={totalPages(ALL_ARTICLES)}
            onPageChange={setArtPage}
            totalItems={ALL_ARTICLES.length}
            itemsPerPage={PER_PAGE}
          />
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-sm font-medium mb-2" style={{ color: "#3498db" }}>
              ── Cam kết chất lượng
            </p>
            <h2 className="text-3xl font-bold text-gray-800">Tại Sao Chọn CareNow?</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-5">
            {[
              {
                icon: Calendar,
                title: "Đặt lịch 2 phút",
                desc: "Giao diện đơn giản, chọn bác sĩ và giờ khám nhanh 24/7",
                color: "#3498db",
              },
              {
                icon: Users,
                title: "200+ Bác sĩ uy tín",
                desc: "Xét duyệt chặt chẽ, hồ sơ chuyên môn minh bạch",
                color: "#27ae60",
              },
              {
                icon: Clock,
                title: "Không xếp hàng",
                desc: "Nhận số thứ tự online, đến đúng giờ, nhắc lịch tự động",
                color: "#e67e22",
              },
              {
                icon: Shield,
                title: "Bảo mật y tế",
                desc: "Hồ sơ bệnh án mã hoá, bảo mật theo chuẩn quốc tế",
                color: "#8e44ad",
              },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow bg-white"
                >
                  <div
                    className="size-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${f.color}15` }}
                  >
                    <Icon className="size-6" style={{ color: f.color }} />
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section
        className="py-20 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#1a6fa3 0%,#3498db 100%)" }}
      >
        <div className="absolute -top-20 -right-20 size-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-10 size-60 rounded-full bg-white/5" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm mb-6">
            <span className="size-2 rounded-full bg-green-400 animate-pulse" />
            Còn lịch khám trống hôm nay
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Đừng để bệnh chờ – Đặt lịch ngay!</h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Hơn <strong className="text-white">50.000 bệnh nhân</strong> đã tin tưởng CareNow. Đặt lịch
            miễn phí, xác nhận tức thì.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/dat-lich"
              className="inline-flex items-center justify-center gap-3 bg-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-50 transition-colors shadow-xl"
              style={{ color: "#3498db" }}
            >
              <Calendar className="size-5" /> Đặt lịch khám ngay – Miễn phí
            </Link>
            <a
              href="tel:19002345"
              className="inline-flex items-center justify-center gap-3 bg-white/15 hover:bg-white/25 border border-white/30 text-white px-8 py-4 rounded-2xl font-semibold transition-colors"
            >
              <Phone className="size-5" /> Gọi tư vấn 1900-2345
            </a>
          </div>
        </div>
      </section>

      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-3"
        style={{
          backgroundColor: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(8px)",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <Link
          to="/dat-lich"
          className="flex items-center justify-center gap-2 w-full text-white py-3.5 rounded-xl font-bold shadow-lg"
          style={{ backgroundColor: "#3498db" }}
        >
          <Calendar className="size-5" /> Đặt lịch khám ngay
        </Link>
      </div>
    </div>
  );
}
