import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
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
} from "lucide-react";
import { getBlogPublicById } from "../api/blogPublic.api";
import { getBlogCategories } from "../api/blogCategory.api";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { htmlToPlain } from "../utils/htmlToPlain";
import { buildDoctorPath, buildSpecialtyPath } from "../utils/catalogPath";

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

export function BlogArticleDetail() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState("");

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
          } else if (row.reason_name) {
            setCategoryName("Bài viết");
          } else {
            setCategoryName("");
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
          <Link to="/cam-nang-y-te" className="hover:text-[#3498db] transition-colors">
            {categoryName || "Bài viết"}
          </Link>
          <span>/</span>
          <span className="text-gray-600 font-medium truncate max-w-[200px] md:max-w-md">
            {article.title}
          </span>
        </div>

        <Link
          to="/cam-nang-y-te"
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

            <div className="flex flex-wrap justify-center gap-3 pb-4">
              <Link
                to="/dat-lich"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3 text-white font-semibold bg-[#3498db] hover:opacity-95 transition-opacity"
              >
                <CalendarPlus className="size-5" />
                Đặt lịch khám
              </Link>
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

              <Link
                to="/dat-lich"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-white bg-[#3498db] hover:opacity-95 transition-opacity shadow-sm mt-4"
              >
                <CalendarPlus className="size-5" />
                Đặt lịch ngay
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}
