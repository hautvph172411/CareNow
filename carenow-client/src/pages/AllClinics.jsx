import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Home, MapPin, ChevronRight } from 'lucide-react';
import { getClinicPlaces, getProvinces } from '../api/catalog.api';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { buildPlacePath } from '../utils/catalogPath';

const removeAccents = (str) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
};

export function AllClinics() {
  const navigate = useNavigate();
  const [places, setPlaces] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');

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
    const fetchData = async () => {
      try {
        const placesRes = await getClinicPlaces({ status: 1, limit: 1000, page: 1 });
        if (placesRes && placesRes.data) {
          setPlaces(placesRes.data);
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách Nơi khám:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const ALPHABET = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','#'];

  const filteredPlaces = useMemo(() => {
    let list = places;
    if (search.trim()) {
      const kw = removeAccents(search.toLowerCase());
      list = list.filter(p => {
        const name = removeAccents((p.name || '').toLowerCase());
        const short = removeAccents((p.short_name || '').toLowerCase());
        return name.includes(kw) || short.includes(kw);
      });
    }
    return list;
  }, [places, search]);

  const groupedPlaces = useMemo(() => {
    const groups = {};
    ALPHABET.forEach(char => groups[char] = []);
    
    filteredPlaces.forEach(p => {
      let firstChar = '';
      if (p.short_name) {
        firstChar = removeAccents(p.short_name.charAt(0)).toUpperCase();
      } else if (p.name) {
        firstChar = removeAccents(p.name.charAt(0)).toUpperCase();
      }
      
      if (!ALPHABET.includes(firstChar)) {
        firstChar = '#';
      }
      groups[firstChar].push(p);
    });
    
    return groups;
  }, [filteredPlaces]);

  const handleScrollTo = (char) => {
    const el = document.getElementById(`group-${char}`);
    if (el) {
      // Add offset for fixed header if necessary
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
    <div className="bg-gray-50 min-h-screen pb-16">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-blue-500 flex items-center gap-1"><Home className="size-4"/> Trang chủ</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">Tất cả cơ sở y tế</span>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Cơ sở y tế</h1>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm..." 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white transition-colors"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 justify-center md:justify-start">
            {ALPHABET.map(char => {
              const hasItems = groupedPlaces[char].length > 0;
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

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredPlaces.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="size-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Không có thông tin</h3>
            <p className="text-gray-500">Vui lòng thử lại với từ khóa hoặc bộ lọc khác.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {ALPHABET.map(char => {
              const items = groupedPlaces[char];
              if (items.length === 0) return null;
              return (
                <div key={char} id={`group-${char}`} className="scroll-mt-24">
                  <div className="bg-[#4fbaf0] text-white w-12 h-12 flex items-center justify-center text-xl font-bold mb-6 rounded-sm shadow-sm">
                    {char}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {items.map(place => (
                      <Link 
                        key={place.id}
                        to={buildPlacePath({
                          id: place.id,
                          url: place.url,
                          name: place.name,
                          display_name: place.display_name,
                          short_name: place.short_name,
                        })}
                        className="bg-white border border-gray-100 hover:border-blue-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group"
                      >
                        <div className="p-4 border-b border-gray-50 h-36 flex items-center justify-center bg-white relative">
                          <ImageWithFallback 
                            src={place.logo || (place.images ? place.images.split(',')[0] : '')} 
                            alt={place.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <div className="p-4 text-center">
                          <h3 className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                            {place.name}
                          </h3>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
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
    </div>
  );
}
