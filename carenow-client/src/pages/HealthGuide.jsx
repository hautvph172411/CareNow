import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Heart,
  LayoutGrid,
  Sparkles,
  Apple,
  Brain,
  Eye,
  Thermometer,
  Stethoscope,
  Pill,
  Activity,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { getBlogPublicList } from "../api/blogPublic.api";
import { getBlogCategories } from "../api/blogCategory.api";
import { htmlToPlain } from "../utils/htmlToPlain";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

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

const ARTICLE_FALLBACK_GRADIENTS = [
  { bgFrom: "#ffecd2", bgTo: "#fcb69f" },
  { bgFrom: "#a8edea", bgTo: "#fed6e3" },
  { bgFrom: "#d299c2", bgTo: "#fef9d7" },
  { bgFrom: "#c3cfe2", bgTo: "#f5f7fa" },
  { bgFrom: "#a1c4fd", bgTo: "#c2e9fb" },
  { bgFrom: "#c1dfc4", bgTo: "#deecdd" },
];

const ARTICLE_EMOJI_FALLBACK = ["📚", "🏥", "💚", "🩺", "📋", "💊"];

const CATEGORY_ICON_SLOTS = [
  Heart,
  Apple,
  Brain,
  Eye,
  Thermometer,
  Stethoscope,
  Pill,
  Activity,
  Sparkles,
];

function mapRowsToArticles(rows, categoryById) {
  return rows.map((row, i) => {
    const plain = htmlToPlain(row.summary || row.content || "");
    const excerpt = plain.length > 180 ? `${plain.slice(0, 180)}…` : plain;
    const words = plain.split(/\s+/).filter(Boolean).length;
    const readMin = Math.max(1, Math.ceil(words / 200));
    const catIds = parseIds(row.categories);
    const firstCat = catIds.length ? categoryById.get(catIds[0]) : null;
    const grad = ARTICLE_FALLBACK_GRADIENTS[i % ARTICLE_FALLBACK_GRADIENTS.length];
    return {
      id: row.id,
      title: row.title || "Không tiêu đề",
      picture: row.picture || "",
      categoryIds: catIds,
      categoryLabel: firstCat?.name || row.reason_name || row.tag || "Cẩm nang",
      excerpt: excerpt || "Xem nội dung chi tiết bài viết.",
      readTime: `${readMin} phút`,
      dateLabel: formatEpochVN(row.published_time || row.updated_time || row.created_time),
      emoji: ARTICLE_EMOJI_FALLBACK[i % ARTICLE_EMOJI_FALLBACK.length],
      bgFrom: grad.bgFrom,
      bgTo: grad.bgTo,
    };
  });
}

export function HealthGuide() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([
    { id: "all", name: "Tất cả", icon: LayoutGrid },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [blogRes, catRes] = await Promise.all([
          getBlogPublicList({ status: 1, limit: 200, page: 1 }),
          getBlogCategories({ status: 1, limit: 300, page: 1 }),
        ]);
        if (cancelled) return;
        const rows = extractRows(blogRes);
        const catRows = extractRows(catRes);
        const categoryById = new Map(catRows.map((c) => [c.id, c]));
        const chips = [
          { id: "all", name: "Tất cả", icon: LayoutGrid },
          ...catRows.map((c, idx) => ({
            id: String(c.id),
            name: c.name || c.title || `Danh mục ${c.id}`,
            icon: CATEGORY_ICON_SLOTS[idx % CATEGORY_ICON_SLOTS.length],
          })),
        ];
        setCategories(chips);
        setArticles(mapRowsToArticles(rows, categoryById));
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setArticles([]);
          setCategories([{ id: "all", name: "Tất cả", icon: LayoutGrid }]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return articles.filter((a) => {
      const catOk =
        selectedCategory === "all" ||
        a.categoryIds.includes(Number(selectedCategory));
      const searchOk =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.categoryLabel.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q);
      return catOk && searchOk;
    });
  }, [articles, searchQuery, selectedCategory]);

  return (
    <div className="py-12 bg-gray-50 min-h-[50vh]">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4 flex-wrap">
            <Link to="/" className="hover:text-[#3498db] transition-colors">
              Trang chủ
            </Link>
            <span>/</span>
            <span className="text-gray-600 font-medium">Cẩm nang y tế</span>
          </div>

          <h1 className="text-3xl font-bold mb-2 text-gray-800">Cẩm nang Y tế</h1>
          <p className="text-gray-600 mb-2">
            Kiến thức y khoa cập nhật từ hệ thống CareNow — đồng bộ với admin.
          </p>
          <p className="text-sm text-gray-500 mb-8 flex items-center gap-2">
            <BookOpen className="size-4 shrink-0" />
            {loading ? "Đang tải danh sách…" : `${articles.length} bài đang hiển thị`}
          </p>

          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm theo tiêu đề, danh mục, nội dung…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#3498db]/40 focus:border-[#3498db]"
              />
            </div>
          </div>

          <div className="mb-8 overflow-x-auto">
            <div className="flex gap-3 pb-2">
              {categories.map((category) => {
                const Icon = category.icon;
                const active = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-colors border ${
                      active
                        ? "bg-[#3498db] text-white border-[#3498db]"
                        : "bg-white text-gray-700 border-gray-200 hover:border-[#3498db]/50"
                    }`}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span>{category.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((k) => (
                <div
                  key={k}
                  className="bg-white rounded-xl overflow-hidden border border-gray-100 animate-pulse"
                >
                  <div className="h-48 bg-gray-200" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-5 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article) => (
                <Link
                  key={article.id}
                  to={`/cam-nang-y-te/bai/${article.id}`}
                  className="group bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg hover:border-[#3498db]/30 transition-all flex flex-col"
                >
                  {article.picture ? (
                    <div className="h-48 relative overflow-hidden bg-gray-100 shrink-0">
                      <ImageWithFallback
                        src={article.picture}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div
                      className="h-48 flex items-center justify-center text-6xl shrink-0"
                      style={{
                        background: `linear-gradient(135deg,${article.bgFrom},${article.bgTo})`,
                      }}
                    >
                      {article.emoji}
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-2">
                      <span
                        className="font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#2980b9]"
                      >
                        {article.categoryLabel}
                      </span>
                      {article.dateLabel ? (
                        <>
                          <span>•</span>
                          <span>{article.dateLabel}</span>
                        </>
                      ) : null}
                      <span>•</span>
                      <span>{article.readTime} đọc</span>
                    </div>
                    <h3 className="font-semibold text-lg mb-2 text-gray-800 line-clamp-2 group-hover:text-[#3498db] transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-1">{article.excerpt}</p>
                    <span className="text-[#3498db] font-medium text-sm inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                      Đọc tiếp <ArrowRight className="size-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!loading && filteredArticles.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <Search className="size-16 mx-auto mb-4 text-gray-300" />
              <p className="mb-2">Không có bài viết phù hợp.</p>
              <p className="text-sm">Thử bỏ bộ lọc hoặc từ khóa tìm kiếm.</p>
            </div>
          )}

          <div className="mt-12 bg-[#3498db] text-white rounded-2xl p-8 text-center shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Cần tư vấn từ chuyên gia?</h2>
            <p className="mb-6 text-blue-100 max-w-xl mx-auto">
              Đặt lịch khám để được bác sĩ tư vấn trực tiếp về tình trạng sức khỏe của bạn.
            </p>
            <Link
              to="/dat-lich"
              className="inline-block bg-white text-[#3498db] px-8 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
            >
              Đặt lịch ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
