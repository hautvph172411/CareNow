import { useState } from "react";
import { Search, Heart, Apple, Brain, Eye, Thermometer } from "lucide-react";

export function HealthGuide() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", name: "Tất cả", icon: Heart },
    { id: "cardio", name: "Tim mạch", icon: Heart },
    { id: "nutrition", name: "Dinh dưỡng", icon: Apple },
    { id: "mental", name: "Sức khỏe tinh thần", icon: Brain },
    { id: "eye-care", name: "Chăm sóc mắt", icon: Eye },
    { id: "prevention", name: "Phòng bệnh", icon: Thermometer },
  ];

  const articles = [
    {
      id: "1",
      title: "10 dấu hiệu cảnh báo bệnh tim mạch không nên bỏ qua",
      category: "cardio",
      excerpt: "Nhận biết sớm các dấu hiệu bất thường giúp phòng ngừa các bệnh lý nguy hiểm về tim mạch.",
      image: "💓",
      readTime: "5 phút",
      date: "2026-04-28",
    },
    {
      id: "2",
      title: "Chế độ dinh dưỡng cân bằng cho người trưởng thành",
      category: "nutrition",
      excerpt: "Hướng dẫn xây dựng thực đơn khoa học, đầy đủ dưỡng chất cho cơ thể khỏe mạnh.",
      image: "🥗",
      readTime: "7 phút",
      date: "2026-04-25",
    },
    {
      id: "3",
      title: "Cách quản lý stress hiệu quả trong công việc",
      category: "mental",
      excerpt: "Những phương pháp đơn giản giúp giảm căng thẳng và cải thiện sức khỏe tinh thần.",
      image: "🧘",
      readTime: "6 phút",
      date: "2026-04-22",
    },
    {
      id: "4",
      title: "Bảo vệ đôi mắt khi làm việc với máy tính",
      category: "eye-care",
      excerpt: "Các bài tập và thói quen giúp giảm mỏi mắt khi sử dụng thiết bị điện tử.",
      image: "👁️",
      readTime: "4 phút",
      date: "2026-04-20",
    },
    {
      id: "5",
      title: "Vai trò của vắc-xin trong phòng ngừa bệnh tật",
      category: "prevention",
      excerpt: "Tìm hiểu về các loại vắc-xin quan trọng và lịch tiêm chủng khuyến nghị.",
      image: "💉",
      readTime: "8 phút",
      date: "2026-04-18",
    },
    {
      id: "6",
      title: "Tập thể dục đúng cách để tăng cường sức khỏe tim mạch",
      category: "cardio",
      excerpt: "Các bài tập cardio phù hợp với từng lứa tuổi và tình trạng sức khỏe.",
      image: "🏃",
      readTime: "6 phút",
      date: "2026-04-15",
    },
  ];

  const filteredArticles = articles.filter((article) => {
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", { year: "numeric", month: "long", day: "numeric" });
  };

  return (
    <div className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-4 text-gray-800">Cẩm nang Y tế</h1>
          <p className="text-gray-600 mb-8">Kiến thức y khoa hữu ích, cập nhật từ các chuyên gia</p>

          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm bài viết, bệnh lý..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="mb-8 overflow-x-auto">
            <div className="flex gap-3 pb-2">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                      selectedCategory === category.id
                        ? "bg-primary text-white"
                        : "bg-white text-gray-700 border border-gray-200 hover:border-primary"
                    }`}
                  >
                    <Icon className="size-4" />
                    <span>{category.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <div
                key={article.id}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-7xl">
                  {article.image}
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <span>{formatDate(article.date)}</span>
                    <span>•</span>
                    <span>{article.readTime} đọc</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-gray-800 line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-3 mb-4">{article.excerpt}</p>
                  <button className="text-primary font-medium hover:underline">
                    Đọc thêm →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredArticles.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Search className="size-16 mx-auto mb-4 text-gray-300" />
              <p>Không tìm thấy bài viết nào</p>
            </div>
          )}

          <div className="mt-12 bg-primary text-white rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Cần tư vấn từ chuyên gia?</h2>
            <p className="mb-6 text-blue-100">
              Đặt lịch khám để được bác sĩ tư vấn trực tiếp về tình trạng sức khỏe của bạn
            </p>
            <a
              href="/dat-lich"
              className="inline-block bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Đặt lịch ngay
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
