import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  BookOpen,
  ArrowRight,
  Home
} from "lucide-react";
import { getBlogPublicList } from "../api/blogPublic.api";
import { getBlogCategories } from "../api/blogCategory.api";
import { htmlToPlain } from "../utils/htmlToPlain";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

function extractRows(res) {
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

const removeAccents = (str) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
};

export function HealthGuide() {
  const navigate = useNavigate();
  const [allArticles, setAllArticles] = useState([]);
  const [latestArticles, setLatestArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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
          getBlogPublicList({ status: 1, limit: 200, page: 1 }), // Fetch 200 for searching
          getBlogCategories({ status: 1, limit: 300, page: 1 }),
        ]);
        if (cancelled) return;
        const rows = extractRows(blogRes);
        const catRows = extractRows(catRes);
        
        setAllArticles(rows);
        setLatestArticles(rows.slice(0, 12));
        setCategories(catRows);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const ALPHABET = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','#'];

  const groupedCategories = useMemo(() => {
    const groups = {};
    ALPHABET.forEach(char => groups[char] = []);
    
    categories.forEach(c => {
      const name = c.name || c.title || '';
      let firstChar = '#';
      if (name) {
        firstChar = removeAccents(name.charAt(0)).toUpperCase();
      }
      
      if (!ALPHABET.includes(firstChar)) {
        firstChar = '#';
      }
      groups[firstChar].push(c);
    });
    
    return groups;
  }, [categories]);

  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return allArticles.filter((a) => {
      const searchOk =
        a.title?.toLowerCase().includes(q) ||
        a.summary?.toLowerCase().includes(q) ||
        a.content?.toLowerCase().includes(q);
      return searchOk;
    });
  }, [allArticles, searchQuery]);

  const handleScrollTo = (char) => {
    const el = document.getElementById(`group-${char}`);
    if (el) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="bg-white min-h-screen pb-16">
      {/* Breadcrumb */}
      <div className="bg-gray-50/50 border-b border-gray-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-blue-500 flex items-center gap-1"><Home className="size-4"/> Trang chủ</Link>
            <span>/</span>
            <span className="text-gray-800 font-medium">Cẩm nang</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8">
        {/* SEARCH BOX */}
        <div className="mb-10 max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm bài viết, triệu chứng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-full bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 transition-all text-gray-700"
            />
          </div>
        </div>

        {searchQuery.trim() ? (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Kết quả tìm kiếm cho "{searchQuery}"</h2>
            {filteredArticles.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="size-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Không tìm thấy bài viết</h3>
                <p className="text-gray-500">Thử lại với từ khóa khác.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map((article) => {
                  const plain = htmlToPlain(article.summary || article.content || "");
                  const excerpt = plain.length > 120 ? `${plain.slice(0, 120)}…` : plain;
                  return (
                    <Link
                      key={article.id}
                      to={`/cam-nang-y-te/bai/${article.id}`}
                      className="group bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all flex flex-col"
                    >
                      <div className="h-44 relative overflow-hidden bg-gray-50 shrink-0">
                        <ImageWithFallback
                          src={article.picture || ''}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="font-bold text-gray-800 text-lg leading-snug line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                          {article.title || "Không tiêu đề"}
                        </h3>
                        <p className="text-gray-500 text-sm line-clamp-3 mb-4 flex-1">
                          {excerpt}
                        </p>
                        <span className="text-[#3498db] font-medium text-sm inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                          Đọc tiếp <ArrowRight className="size-4" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* LATEST ARTICLES */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Bài viết mới nhất</h2>
              </div>

              {loading ? (
                 <div className="flex justify-center items-center py-20">
                   <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                 </div>
              ) : (
                <div className="flex overflow-x-auto gap-5 pb-6 pt-2 px-2 -mx-2 snap-x scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {latestArticles.map((article) => {
                    const plain = htmlToPlain(article.summary || article.content || "");
                    const excerpt = plain.length > 100 ? `${plain.slice(0, 100)}…` : plain;
                    return (
                      <Link
                        key={article.id}
                        to={`/cam-nang-y-te/bai/${article.id}`}
                        className="snap-start shrink-0 w-72 sm:w-80 bg-white rounded-xl overflow-hidden border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-lg hover:border-blue-200 transition-all flex flex-col group"
                      >
                        <div className="h-44 relative overflow-hidden bg-gray-50">
                          <ImageWithFallback
                            src={article.picture || ''}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <div className="p-5 flex flex-col flex-1">
                          <h3 className="font-bold text-gray-800 text-base leading-snug line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                            {article.title || "Không tiêu đề"}
                          </h3>
                          <p className="text-gray-500 text-sm line-clamp-2 mb-0">
                            {excerpt}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <hr className="border-gray-100 mb-10" />

            {/* CATEGORIES ALPHABET LIST */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Danh mục bài viết</h2>
          
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-8 border border-gray-100">
            <div className="flex flex-wrap gap-1.5 justify-center md:justify-start">
              {ALPHABET.map(char => {
                const hasItems = groupedCategories[char] && groupedCategories[char].length > 0;
                return (
                  <button
                    key={char}
                    onClick={() => hasItems && handleScrollTo(char)}
                    disabled={!hasItems}
                    className={`w-9 h-9 rounded text-sm font-semibold flex items-center justify-center transition-colors border ${hasItems ? 'bg-white text-gray-700 border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 cursor-pointer' : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'}`}
                  >
                    {char}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-10">
            {ALPHABET.map(char => {
              const items = groupedCategories[char];
              if (!items || items.length === 0) return null;
              return (
                <div key={char} id={`group-${char}`} className="scroll-mt-24">
                  <div className="bg-[#4fbaf0] text-white w-12 h-12 flex items-center justify-center text-xl font-bold mb-6 rounded-sm shadow-sm">
                    {char}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
                    {items.map(cat => (
                      <div key={cat.id} className="border-b border-gray-100 pb-3 last:border-0 sm:last:border-b lg:last:border-0 lg:border-b">
                        <Link 
                          to={`/cam-nang-y-te/danh-muc/${cat.id}`}
                          className="text-gray-800 font-medium hover:text-blue-600 transition-colors block truncate"
                        >
                          {cat.name || cat.title || `Danh mục ${cat.id}`}
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
          </>
        )}
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
      
      {/* Hide scrollbar styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </div>
  );
}
