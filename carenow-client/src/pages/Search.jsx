import { useEffect, useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, MapPin, Clock, Star, Users, Building2, Activity, Calendar, Zap, Heart, Baby, Brain, Bone, Eye, Stethoscope, Microscope, Wind } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import DoctorPriceInsuranceInfo from "../components/DoctorPriceInsuranceInfo";
import { getClinics, getClinicPlaces, getSpecialties, getServices } from "../api/catalog.api";
import { buildDoctorPath, buildPlacePath, buildSpecialtyPath } from "../utils/catalogPath";

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

function buildDoctors(clinics, specById) {
  return clinics.map((c, i) => {
    const ids = parseIds(c.specialist_ids);
    const sp = ids.length ? specById.get(ids[0]) : null;
    const tag = c.sponsor === 1 
      ? { tag: "Nổi bật", tagColor: "#e11d48" } 
      : DOCTOR_TAG_ROTATION[i % DOCTOR_TAG_ROTATION.length];
    const summary = stripHtml(c.summary);
    const exp = summary.length > 90 ? `${summary.slice(0, 90)}…` : summary || "Bác sĩ CareNow";
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
      image: c.picture || "https://images.unsplash.com/photo-1622902046580-2b47f47f5471?w=400&q=80",
      tag: tag.tag,
      tagColor: tag.tagColor,
      isWork: c.is_work !== 0,
      priceMin: c.price_min ? `${Number(c.price_min).toLocaleString('vi-VN')}đ` : null,
      legacyPriceMin: c.price_min,
      priceSummary: c.price_summary,
      insuranceSummary: c.insurance_summary,
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
      badge: b.badge,
      badgeColor: b.badgeColor,
    };
  });
}

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  
  const [filterType, setFilterType] = useState("all"); // 'all', 'doctor', 'place', 'specialty'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [doctors, setDoctors] = useState([]);
  const [places, setPlaces] = useState([]);
  const [specialties, setSpecialties] = useState([]);

  useEffect(() => {
    if (!q) {
      setDoctors([]);
      setPlaces([]);
      setSpecialties([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    
    (async () => {
      try {
        const [clinRes, placeRes, specRes, allSpecsRes] = await Promise.all([
          getClinics({ status: 1, limit: 100, page: 1, show_in_root_place: 1, keyword: q }),
          getClinicPlaces({ status: 1, limit: 100, page: 1, keyword: q }),
          getSpecialties({ status: 1, limit: 100, page: 1, keyword: q }),
          getSpecialties({ status: 1, limit: 500, page: 1 }) // For mapping doc specialties
        ]);
        
        if (cancelled) return;
        
        const allSpecs = extractRows(allSpecsRes);
        const specById = new Map(allSpecs.map(s => [s.id, s]));

        setDoctors(buildDoctors(extractRows(clinRes), specById));
        setPlaces(buildLocations(extractRows(placeRes)));
        setSpecialties(extractRows(specRes));
        
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Lỗi tải kết quả tìm kiếm");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [q]);

  const [inputVal, setInputVal] = useState(q);

  const handleSearch = (e) => {
    e.preventDefault();
    if (inputVal.trim()) {
      setSearchParams({ q: inputVal.trim() });
    }
  };

  const resultsStats = {
    all: doctors.length + places.length + specialties.length,
    doctor: doctors.length,
    place: places.length,
    specialty: specialties.length
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-8">
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto flex gap-3">
            <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <Search className="size-5 text-gray-400 shrink-0" />
              <input
                type="text"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                placeholder="Tìm bác sĩ, chuyên khoa, dịch vụ..."
                className="w-full text-gray-700 outline-none bg-transparent"
              />
            </div>
            <button
              type="submit"
              className="text-white px-8 py-3 rounded-xl font-semibold transition-all hover:opacity-90 whitespace-nowrap shadow-sm"
              style={{ backgroundColor: "#3498db" }}
            >
              Tìm kiếm
            </button>
          </form>
          
          {q && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {[
                { id: "all", label: "Tất cả", icon: Search },
                { id: "doctor", label: "Bác sĩ", icon: Users },
                { id: "place", label: "Cơ sở y tế", icon: Building2 },
                { id: "specialty", label: "Dịch vụ/Chuyên khoa", icon: Activity },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = filterType === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFilterType(tab.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                      isActive 
                        ? "bg-blue-600 text-white shadow-md" 
                        : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="size-4" />
                    {tab.label}
                    <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-blue-500' : 'bg-gray-100 text-gray-500'}`}>
                      {resultsStats[tab.id]}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {!q ? (
          <div className="text-center py-20">
            <Search className="size-16 text-gray-200 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600">Nhập từ khóa để tìm kiếm</h2>
            <p className="text-gray-400 mt-2">Bạn có thể tìm theo tên bác sĩ, cơ sở y tế hoặc triệu chứng</p>
          </div>
        ) : loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tìm kiếm kết quả cho "{q}"...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center">
            {error}
          </div>
        ) : resultsStats.all === 0 ? (
          <div className="text-center py-20">
            <Search className="size-16 text-gray-200 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800">Không tìm thấy kết quả nào</h2>
            <p className="text-gray-500 mt-2">Không có dữ liệu khớp với từ khóa "{q}". Vui lòng thử từ khóa khác.</p>
          </div>
        ) : (
          <div className="space-y-10">
            
            {/* DOCTORS */}
            {(filterType === 'all' || filterType === 'doctor') && doctors.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                  <Users className="size-5 text-blue-600" />
                  Bác sĩ ({doctors.length})
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {doctors.map(doctor => (
                    <div key={doctor.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all group hover:-translate-y-1">
                      <Link to={buildDoctorPath({ id: doctor.id, name: doctor.name, title: doctor.title, url: doctor.url })} className="block relative h-52 overflow-hidden bg-gray-100">
                        <ImageWithFallback src={doctor.image} alt={doctor.name} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute top-3 left-3 text-white text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: doctor.tagColor }}>{doctor.tag}</div>
                        <div className="absolute bottom-3 right-3 bg-white rounded-xl px-2.5 py-1 flex items-center gap-1 shadow-lg">
                          <Star className="size-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-bold text-gray-800">{doctor.rating}</span>
                        </div>
                      </Link>
                      <div className="p-5">
                        <Link to={buildDoctorPath({ id: doctor.id, name: doctor.name, title: doctor.title, url: doctor.url })} className="font-bold text-gray-800 mb-1 leading-snug text-sm block hover:text-blue-600 transition-colors">{doctor.name}</Link>
                        <span className="inline-block text-xs font-medium px-2.5 py-0.5 rounded-full mb-3" style={{ backgroundColor: "#e8f4fd", color: "#2980b9" }}>{doctor.specialty}</span>
                        <div className="space-y-1.5 mb-4">
                          <p className="text-xs text-gray-500 flex items-center gap-1.5 truncate"><MapPin className="size-3 text-gray-400 shrink-0" /> {doctor.hospital}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1.5 truncate"><Clock className="size-3 text-gray-400 shrink-0" /> {doctor.exp}</p>
                          <DoctorPriceInsuranceInfo
                            priceSummary={doctor.priceSummary}
                            insuranceSummary={doctor.insuranceSummary}
                            legacyPriceMin={doctor.legacyPriceMin}
                            compact
                          />
                        </div>
                        {doctor.isWork ? (
                          <Link to={`/dat-lich?clinicId=${doctor.id}`} className="w-full flex items-center justify-center gap-2 text-white py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 bg-blue-500">
                            <Calendar className="size-4" /> Đặt lịch khám
                          </Link>
                        ) : (
                          <div className="w-full flex items-center justify-center gap-2 text-gray-500 py-2.5 rounded-xl text-sm font-semibold bg-gray-100">
                            Tạm ngưng
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PLACES */}
            {(filterType === 'all' || filterType === 'place') && places.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                  <Building2 className="size-5 text-red-500" />
                  Cơ sở y tế ({places.length})
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {places.map(loc => (
                    <div key={loc.id} className="group bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all p-5">
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <Link to={buildPlacePath({ id: loc.id, name: loc.rawName, url: loc.url })} className="size-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                            <Building2 className="size-6 text-gray-400" />
                          </Link>
                          <div className="min-w-0">
                            <Link to={buildPlacePath({ id: loc.id, name: loc.rawName, url: loc.url })} className="block font-bold text-gray-800 text-sm hover:text-blue-600 truncate">{loc.name}</Link>
                            <span className="text-xs text-gray-500 inline-block mt-0.5 px-2 py-0.5 rounded bg-gray-100">{loc.type}</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 mb-4 text-xs text-gray-500">
                        <p className="flex items-start gap-2"><MapPin className="size-3.5 mt-0.5 shrink-0" /> <span className="line-clamp-2">{loc.address}</span></p>
                      </div>
                      <Link to={buildPlacePath({ id: loc.id, name: loc.rawName, url: loc.url })} className="block w-full text-center py-2 rounded-xl border border-blue-100 text-blue-600 font-medium text-sm hover:bg-blue-50 transition-colors">
                        Xem chi tiết
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SPECIALTIES */}
            {(filterType === 'all' || filterType === 'specialty') && specialties.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                  <Activity className="size-5 text-green-500" />
                  Dịch vụ / Chuyên khoa ({specialties.length})
                </h3>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {specialties.map((spec, i) => {
                    const pal = ['#fee2e2','#fef3c7','#fce7f3','#ede9fe','#dbeafe'][i % 5];
                    const iconCol = ['#dc2626','#d97706','#db2777','#7c3aed','#2563eb'][i % 5];
                    return (
                      <Link key={spec.id} to={buildSpecialtyPath({ id: spec.id, name: spec.name, url: spec.url })} className="group flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all">
                        <div className="size-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform" style={{ backgroundColor: pal }}>
                          <Activity size={24} style={{ color: iconCol }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-800 text-sm">{spec.name}</div>
                          <div className="text-xs text-gray-400 mt-0.5">Đặt lịch ngay</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
