import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Search, Home, ArrowRight } from "lucide-react";
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

function mapRowsToArticles(rows, categoryName) {
  return rows.map((row, i) => {
    const plain = htmlToPlain(row.summary || row.content || "");
    const excerpt = plain.length > 180 ? `${plain.slice(0, 180)}…` : plain;
    const words = plain.split(/\s+/).filter(Boolean).length;
    const readMin = Math.max(1, Math.ceil(words / 200));
    const grad = ARTICLE_FALLBACK_GRADIENTS[i % ARTICLE_FALLBACK_GRADIENTS.length];
    return {
      id: row.id,
      title: row.title || "Không tiêu đề",
      picture: row.picture || "",
      categoryIds: parseIds(row.categories),
      categoryLabel: categoryName || row.reason_name || row.tag || "Cẩm nang",
      excerpt: excerpt || "Xem nội dung chi tiết bài viết.",
      readTime: `${readMin} phút`,
      dateLabel: formatEpochVN(row.published_time || row.updated_time || row.created_time),
      emoji: ARTICLE_EMOJI_FALLBACK[i % ARTICLE_EMOJI_FALLBACK.length],
      bgFrom: grad.bgFrom,
      bgTo: grad.bgTo,
    };
  });
}

export function BlogCategoryDetail() {
  const { id } = useParams(); // Category ID
  const [searchQuery, setSearchQuery] = useState("");
  const [articles, setArticles] = useState([]);
  const [categoryName, setCategoryName] = useState("Danh mục");
  const [loading, setLoading] = useState(true);

  // Scroll to top state
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
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [blogRes, catRes] = await Promise.all([
          getBlogPublicList({ status: 1, limit: 1000, page: 1, category_id: id }),
          getBlogCategories({ status: 1, limit: 300, page: 1 }),
        ]);
        if (cancelled) return;
        
        // Find Category Name
        const catRows = extractRows(catRes);
        const currentCat = catRows.find(c => String(c.id) === String(id));
        const cName = currentCat ? (currentCat.name || currentCat.title) : `Danh mục ${id}`;
        setCategoryName(cName);
        
        const rows = extractRows(blogRes);
        // Filter locally just in case the API doesn't support category_id filter properly
        const filteredRows = rows.filter(r => parseIds(r.categories).includes(Number(id)));
        
        setArticles(mapRowsToArticles(filteredRows.length > 0 ? filteredRows : rows, cName));
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return articles.filter((a) => {
      const searchOk =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q);
      // We already filtered by category when mapping
      return searchOk;
    });
  }, [articles, searchQuery]);

  return (
    <div className="bg-gray-50 min-h-[70vh] pb-16">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 mb-8">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-blue-500 flex items-center gap-1"><Home className="size-4"/> Trang chủ</Link>
            <span>/</span>
            <Link to="/cam-nang-y-te" className="hover:text-blue-500">Cẩm nang</Link>
            <span>/</span>
            <span className="text-gray-800 font-medium">{categoryName}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2 text-gray-800">{categoryName}</h1>
          <p className="text-gray-600 mb-8">
            Tuyển tập các bài viết, kiến thức y khoa chuyên sâu thuộc danh mục {categoryName}.
          </p>

          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <input
                type="text"
                placeholder={`Tìm kiếm bài viết trong ${categoryName}…`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3498db]/40 focus:border-[#3498db] transition-all"
              />
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
          ) : filteredArticles.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="size-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Không tìm thấy bài viết</h3>
              <p className="text-gray-500">Thử lại với từ khóa khác.</p>
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
    </div>
  );
}
