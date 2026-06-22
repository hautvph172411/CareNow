import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import parse from "html-react-parser";
import DOMPurify from "dompurify";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  User,
  Tag,
  Eye,
  Stethoscope,
  Sparkles,
  CalendarPlus,
  Star,
  MapPin,
  Users,
} from "lucide-react";
import { getBlogPublicById } from "../api/blogPublic.api";
import { getBlogCategories } from "../api/blogCategory.api";
import { getClinics } from "../api/catalog.api";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { htmlToPlain } from "../utils/htmlToPlain";
import { buildDoctorPath, buildSpecialtyPath } from "../utils/catalogPath";
import { SchedulePicker } from "../components/SchedulePicker";
import DoctorPriceInsuranceInfo, {
  getDefaultInsurancePackageId,
  getDefaultPricePackageId,
} from "../components/DoctorPriceInsuranceInfo";

function formatEpochVN(sec) {
  if (sec == null || sec === "") return "";
  const n = Number(sec);
  if (Number.isNaN(n)) return "";
  return new Date(n * 1000).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function sanitizeCmsHtml(html) {
  return DOMPurify.sanitize(html || "", {
    ALLOWED_TAGS: [
      "p", "br", "strong", "b", "em", "i", "u", "s", "span", "div",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li", "blockquote", "pre", "code",
      "a", "img", "table", "thead", "tbody", "tr", "th", "td",
      "figure", "figcaption",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "class", "style", "target", "rel", "colspan", "rowspan", "id"],
    ALLOW_DATA_ATTR: false,
  });
}

function useHeadings(html) {
  return useMemo(() => {
    if (!html) return { headings: [], htmlWithIds: html };
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const headingElements = doc.querySelectorAll("h2, h3, h4, h5");
    const headings = [];
    headingElements.forEach((el, index) => {
      const id = el.id || `heading-${index}`;
      el.id = id;
      headings.push({
        id,
        text: el.textContent || el.innerText,
        level: Number(el.tagName.substring(1)),
      });
    });
    return { headings, htmlWithIds: doc.body.innerHTML };
  }, [html]);
}

function ArticleBody({ html }) {
  if (!html || !html.trim()) {
    return (
      <p className="text-gray-500 text-sm italic">
        Bài viết chưa có nội dung chi tiết. Vui lòng quay lại sau.
      </p>
    );
  }
  return <div className="blog-client-article-body">{parse(html)}</div>;
}

function splitTags(raw) {
  if (!raw || !String(raw).trim()) return [];
  return String(raw)
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function getDoctorDescription(doctor) {
  const raw = doctor.summary || doctor.description || doctor.content || "";
  const text = htmlToPlain(raw).replace(/\s+/g, " ").trim();
  if (!text) return "Bác sĩ thuộc hệ thống CareNow, hỗ trợ tư vấn và đặt lịch khám theo khung giờ còn trống tại cơ sở.";
  return text.length > 150 ? `${text.slice(0, 150).trim()}...` : text;
}

function DoctorScheduleCard({ doctor, onBook, viewPath }) {
  const [selDate, setSelDate] = useState("");
  const [selTime, setSelTime] = useState("");
  const [selectedPricePackageId, setSelectedPricePackageId] = useState("");
  const [selectedInsurancePackageId, setSelectedInsurancePackageId] = useState("");
  const hasFinance =
    doctor.price_min ||
    doctor.price_summary?.min ||
    (Array.isArray(doctor.insurance_summary?.items) && doctor.insurance_summary.items.length > 0);

  useEffect(() => {
    setSelectedPricePackageId(getDefaultPricePackageId(doctor.price_summary));
    setSelectedInsurancePackageId(getDefaultInsurancePackageId(doctor.insurance_summary));
  }, [doctor.id, doctor.price_summary, doctor.insurance_summary]);

  return (
    <>
      {hasFinance && (
        <div className="mb-3 border-y border-gray-200 py-2 text-sm">
          <DoctorPriceInsuranceInfo
            priceSummary={doctor.price_summary}
            insuranceSummary={doctor.insurance_summary}
            legacyPriceMin={doctor.price_min}
            defaultExpanded={false}
            selectable
            selectedPricePackageId={selectedPricePackageId}
            selectedInsurancePackageId={selectedInsurancePackageId}
            onSelectPricePackage={setSelectedPricePackageId}
            onSelectInsurancePackage={setSelectedInsurancePackageId}
            radioGroupName={`blog-doctor-${doctor.id}`}
          />
        </div>
      )}

      <div className="mb-3">
        <h4 className="text-[13px] font-bold text-gray-800 mb-2.5 flex items-center gap-2">
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

      <div className="flex flex-col sm:flex-row gap-2.5">
        <button
          onClick={() => onBook(doctor, selDate, selTime, {
            pricePackageId: selectedPricePackageId,
            insurancePackageId: selectedInsurancePackageId,
          })}
          className="flex-1 flex items-center justify-center gap-2 text-white py-2.5 rounded-xl font-semibold hover:opacity-90 transition-all text-[13px]"
          style={{ backgroundColor: "#3498db" }}
        >
          <Calendar className="size-4" /> Đặt lịch ngay
        </button>
        <Link
          to={viewPath}
          className="flex-1 flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-[13px]"
        >
          Xem hồ sơ
        </Link>
      </div>
    </>
  );
}

export function BlogArticleDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState("");
  const [categoryId, setCategoryId] = useState(null);
  const [relatedDoctors, setRelatedDoctors] = useState([]);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (article?.reason_clinic_ids) {
      const doctorIds = String(article.reason_clinic_ids).split(',').map(id => id.trim());
      getClinics({ limit: 500, status: 1 }).then(res => {
        const clinics = res?.data || [];
        const related = clinics.filter(c => doctorIds.includes(String(c.id)));
        setRelatedDoctors(related);
      }).catch(console.error);
    } else {
      setRelatedDoctors([]);
    }
  }, [article?.reason_clinic_ids]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) {
        setLoading(false);
        setError("Thiếu mã bài viết");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [res, catRes] = await Promise.all([
          getBlogPublicById(id),
          getBlogCategories({ status: 1, limit: 300, page: 1 }).catch(() => null)
        ]);
        const row = res?.data;
        if (cancelled) return;
        if (!row) {
          setError("Không tìm thấy bài viết");
          setArticle(null);
        } else if (Number(row.status) !== 1) {
          setError("Bài viết không khả dụng");
          setArticle(null);
        } else {
          setArticle(row);

          // Resolve category name
          const catRows = Array.isArray(catRes?.data) ? catRes.data : [];
          const categoryById = new Map(catRows.map((c) => [c.id, c]));
          const catIds = String(row.categories || "")
            .split(/[,;]/)
            .map((x) => parseInt(x.trim(), 10))
            .filter((n) => !Number.isNaN(n));
          const firstCat = catIds.length ? categoryById.get(catIds[0]) : null;
          if (firstCat) {
            setCategoryName(firstCat.name);
            setCategoryId(firstCat.id);
          } else if (row.reason_name) {
            setCategoryName("Bài viết");
            setCategoryId(null);
          } else {
            setCategoryName("");
            setCategoryId(null);
          }
        }
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          setError(e?.response?.data?.message || "Không tải được bài viết");
          setArticle(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const tags = useMemo(() => (article ? splitTags(article.tag) : []), [article]);

  const referencesPlain = useMemo(
    () => (article?.references ? htmlToPlain(article.references) : ""),
    [article]
  );

  const doctorPath = useMemo(() => {
    if (!article?.suggest_doctor) return null;
    return buildDoctorPath({
      id: article.suggest_doctor,
      name: article.suggest_doctor_name || "Bác sĩ",
      title: "",
      url: undefined,
    });
  }, [article]);

  const specialtyPath = useMemo(() => {
    if (!article?.suggest_specialist) return null;
    return buildSpecialtyPath({
      id: article.suggest_specialist,
      name: article.suggest_specialist_name || "Chuyên khoa",
      url: undefined,
    });
  }, [article]);

  const safeHtml = useMemo(() => sanitizeCmsHtml(article?.content || ""), [article?.content]);
  const { headings, htmlWithIds } = useHeadings(safeHtml);

  if (loading) {
    return (
      <div className="py-16 text-center text-gray-500">
        <div className="inline-block size-8 border-2 border-[#3498db] border-t-transparent rounded-full animate-spin mb-3" />
        <p>Đang tải bài viết…</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="py-16 px-4">
        <div className="max-w-lg mx-auto text-center">
          <p className="text-gray-600 mb-6">{error || "Không có dữ liệu"}</p>
          <Link
            to="/cam-nang-y-te"
            className="inline-flex items-center gap-2 text-[#3498db] font-semibold hover:underline"
          >
            <ArrowLeft className="size-4" /> Về cẩm nang
          </Link>
        </div>
      </div>
    );
  }

  const published = formatEpochVN(article.published_time || article.updated_time || article.created_time);
  const summaryPlain = htmlToPlain(article.summary || "");
  const views = Number(article.views);
  const customHref = article.custom_button_link ? String(article.custom_button_link).trim() : "";
  const customIsExternal = /^https?:\/\//i.test(customHref);

  return (
    <article className="py-8 md:py-10 bg-gray-50 min-h-[60vh]">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4 flex-wrap">
          <Link to="/" className="hover:text-[#3498db] transition-colors">
            Trang chủ
          </Link>
          <span>/</span>
          <Link to={categoryId ? `/cam-nang-y-te/danh-muc/${categoryId}` : "/cam-nang-y-te"} className="hover:text-[#3498db] transition-colors">
            {categoryName || "Bài viết"}
          </Link>
          <span>/</span>
          <span className="text-gray-600 font-medium truncate max-w-[200px] md:max-w-md">
            {article.title}
          </span>
        </div>

        <Link
          to={categoryId ? `/cam-nang-y-te/danh-muc/${categoryId}` : "/cam-nang-y-te"}
          className="inline-flex items-center gap-2 text-sm text-[#3498db] font-medium mb-6 hover:underline"
        >
          <ArrowLeft className="size-4" /> Danh sách cẩm nang
        </Link>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            <header className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 mb-4">
                {published ? (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="size-4 shrink-0" />
                    {published}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1">
                  <BookOpen className="size-4 shrink-0" />
                  CareNow
                </span>
                {!Number.isNaN(views) && views > 0 ? (
                  <span className="inline-flex items-center gap-1">
                    <Eye className="size-4 shrink-0" />
                    {views.toLocaleString("vi-VN")} lượt xem
                  </span>
                ) : null}
              </div>

              {article.reason_name ? (
                <p className="text-xs font-semibold text-[#2980b9] mb-2 uppercase tracking-wide">
                  Liên quan: {article.reason_name}
                </p>
              ) : null}

              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                {article.title}
              </h1>

              <div className="flex flex-wrap gap-3 mt-4 text-sm text-gray-600">
                {article.author ? (
                  <span className="inline-flex items-center gap-1.5">
                    <User className="size-4 text-gray-400" />
                    {article.author}
                  </span>
                ) : null}
                {[article.advisor, article.censor].filter(Boolean).length ? (
                  <span className="text-gray-500">
                    {[article.advisor ? `Cố vấn: ${article.advisor}` : "", article.censor ? `Kiểm duyệt: ${article.censor}` : ""]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                ) : null}
              </div>

              {tags.length ? (
                <div className="flex flex-wrap gap-2 mt-4">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-[#2980b9]"
                    >
                      <Tag className="size-3" />
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}

              {summaryPlain ? (
                <p className="mt-5 text-gray-600 leading-relaxed border-t border-gray-100 pt-5">
                  {summaryPlain}
                </p>
              ) : null}

              {article.suggest_content ? (
                <p className="mt-4 text-sm italic text-gray-500 border-l-4 border-[#3498db] pl-4">
                  {article.suggest_content}
                </p>
              ) : null}
            </header>

            {article.picture ? (
              <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm">
                <ImageWithFallback
                  src={article.picture}
                  alt={article.picture_alt || article.title}
                  className="w-full max-h-[460px] object-cover"
                />
              </div>
            ) : null}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
              <ArticleBody html={htmlWithIds} />
            </div>

            {referencesPlain ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Tài liệu tham khảo</h2>
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{referencesPlain}</p>
              </div>
            ) : null}

            {(customHref && article.custom_button_text) ? (
              <div className="flex justify-center">
                {customIsExternal ? (
                  <a
                    href={customHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-xl px-8 py-3 text-white font-semibold bg-[#3498db] hover:opacity-95 transition-opacity"
                  >
                    {article.custom_button_text}
                  </a>
                ) : (
                  <Link
                    to={customHref.startsWith("/") ? customHref : `/${customHref}`}
                    className="inline-flex items-center justify-center rounded-xl px-8 py-3 text-white font-semibold bg-[#3498db] hover:opacity-95 transition-opacity"
                  >
                    {article.custom_button_text}
                  </Link>
                )}
              </div>
            ) : null}

            {relatedDoctors.length > 0 && (
              <div id="related-doctors-section" className="mt-8 border-t border-gray-100 pt-6 scroll-mt-24">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Users className="size-7 text-[#3498db]" /> Bác sĩ liên quan
                </h3>
                <div className="space-y-6">
                  {relatedDoctors.map(doctor => {
                    const docName = [doctor.title, doctor.name].filter(Boolean).join(" ").trim() || doctor.name;
                    const doctorDescription = getDoctorDescription(doctor);
                    return (
                      <div key={doctor.id} className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all bg-white">
                        <div className="md:flex items-center gap-5 p-5 md:p-6">
                          <Link
                            to={buildDoctorPath(doctor)}
                            className="block w-24 h-24 md:w-28 md:h-28 rounded-full border-2 border-gray-100 relative bg-gray-50 shrink-0 overflow-hidden mx-auto md:mx-0 shadow-sm group"
                          >
                            <ImageWithFallback
                              src={doctor.picture || "https://images.unsplash.com/photo-1622902046580-2b47f47f5471?w=400&q=80"}
                              alt={docName}
                              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                            />
                          </Link>

                          <div className="flex-1 min-w-0 mt-4 md:mt-0 text-center md:text-left">
                            <h3 className="text-lg font-bold text-gray-800 mb-1.5">
                              <Link to={buildDoctorPath(doctor)} className="hover:text-[#3498db] transition-colors">
                                {docName}
                              </Link>
                            </h3>

                            <p className="text-sm leading-relaxed text-gray-600 mb-3 line-clamp-2">
                              {doctorDescription}
                            </p>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 text-xs text-gray-600">
                              {doctor.sponsor === 1 && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Nổi bật</span>
                              )}
                              <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-full">
                                <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs font-bold text-gray-800">4.8</span>
                              </div>
                              {doctor.address && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="size-3.5 text-gray-400" /> <span className="line-clamp-1">{doctor.address}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-gray-100 px-5 pb-5 md:px-6 md:pb-6">
                          <DoctorScheduleCard
                            doctor={doctor}
                            onBook={(doc, date, time) => {
                              if (!date || !time) { alert("Vui lòng chọn ngày và giờ khám!"); return; }
                              navigate(`/dat-lich?clinicId=${doc.id}&date=${date}&time=${time}`);
                            }}
                            viewPath={buildDoctorPath(doctor)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-3 pb-4 mt-8">
              <button
                onClick={() => {
                  if (relatedDoctors.length > 0) {
                    const el = document.getElementById('related-doctors-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  } else {
                    navigate('/dat-lich');
                  }
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3 text-white font-semibold bg-[#3498db] hover:opacity-95 transition-opacity"
              >
                <CalendarPlus className="size-5" />
                Đặt lịch khám
              </button>
              <Link
                to="/cam-nang-y-te"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Xem thêm bài viết
              </Link>
            </div>
          </div>

          {/* Sidebar — TOC & CTA (pattern tương tự place-detail sticky) */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6 lg:sticky lg:top-6 space-y-5 max-h-[calc(100vh-2rem)] overflow-y-auto">
              <div className="border-b-4 border-yellow-400 inline-block pb-1 mb-2">
                <h3 className="text-2xl font-bold text-gray-900">Nội dung chính</h3>
              </div>

              {headings.length > 0 ? (
                <ul className="space-y-4 text-gray-800 text-sm mb-6 mt-4">
                  {headings.map((h) => {
                    const isTopLevel = h.level === 2;
                    return (
                      <li 
                        key={h.id} 
                        className={`cursor-pointer hover:text-[#3498db] transition-colors leading-relaxed ${isTopLevel ? 'font-semibold text-base' : 'ml-6 text-gray-600 list-disc list-inside'}`}
                        onClick={() => {
                          const el = document.getElementById(h.id);
                          if (el) {
                            const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
                            window.scrollTo({ top: y, behavior: 'smooth' });
                          }
                        }}
                      >
                        {h.text}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic mb-6 mt-4">Không có nội dung chính</p>
              )}

              {doctorPath ? (
                <div className="rounded-xl border border-gray-100 p-4 bg-gray-50/80">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
                    <Stethoscope className="size-5 text-[#3498db]" />
                    Bác sĩ gợi ý
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {article.suggest_doctor_name || "Xem hồ sơ bác sĩ liên quan bài viết."}
                  </p>
                  <Link
                    to={doctorPath}
                    className="block text-center w-full py-2.5 rounded-xl text-sm font-semibold text-[#3498db] border-2 border-[#3498db]/40 hover:bg-blue-50 transition-colors"
                  >
                    Xem bác sĩ
                  </Link>
                  <Link
                    to={`/dat-lich?clinicId=${encodeURIComponent(article.suggest_doctor)}`}
                    className="block text-center w-full mt-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#3498db] hover:opacity-95 transition-opacity"
                  >
                    Đặt lịch với BS
                  </Link>
                </div>
              ) : null}

              {specialtyPath ? (
                <div className="rounded-xl border border-gray-100 p-4 bg-gray-50/80">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
                    <Sparkles className="size-5 text-[#3498db]" />
                    Chuyên khoa gợi ý
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {article.suggest_specialist_name || "Khám theo chuyên khoa phù hợp."}
                  </p>
                  <Link
                    to={specialtyPath}
                    className="block text-center w-full py-2.5 rounded-xl text-sm font-semibold text-[#3498db] border-2 border-[#3498db]/40 hover:bg-blue-50 transition-colors"
                  >
                    Xem chuyên khoa
                  </Link>
                </div>
              ) : null}

              {!doctorPath && !specialtyPath ? (
                <p className="text-sm text-gray-500">
                  Khám định kỳ giúp phát hiện sớm nhiều bệnh lý. Đặt lịch trực tuyến — không phí giữ chỗ.
                </p>
              ) : null}

              <button
                onClick={() => {
                  if (relatedDoctors.length > 0) {
                    const el = document.getElementById('related-doctors-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  } else {
                    navigate('/dat-lich');
                  }
                }}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-white bg-[#3498db] hover:opacity-95 transition-opacity shadow-sm mt-4"
              >
                <CalendarPlus className="size-5" />
                Đặt lịch ngay
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-blue-500 hover:bg-blue-600 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all hover:-translate-y-1 z-50 focus:outline-none"
          title="Lên đầu trang"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}
    </article>
  );
}
