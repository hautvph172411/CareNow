import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}) {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const from = totalItems && itemsPerPage ? (currentPage - 1) * itemsPerPage + 1 : null;
  const to =
    totalItems && itemsPerPage ? Math.min(currentPage * itemsPerPage, totalItems) : null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-8 pt-6 border-t border-gray-100">
      {from && to && totalItems ? (
        <p className="text-sm text-gray-400">
          Hiển thị{" "}
          <span className="font-semibold text-gray-600">
            {from}–{to}
          </span>{" "}
          trong tổng <span className="font-semibold text-gray-600">{totalItems}</span> kết quả
        </p>
      ) : (
        <span />
      )}

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="size-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="size-4" />
        </button>

        {getPages().map((page, idx) =>
          page === "..." ? (
            <span
              key={`dot-${idx}`}
              className="size-9 flex items-center justify-center text-gray-400 text-sm"
            >
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className="size-9 flex items-center justify-center rounded-xl text-sm font-medium transition-all border"
              style={
                page === currentPage
                  ? { backgroundColor: "#3498db", color: "#fff", borderColor: "#3498db" }
                  : { backgroundColor: "#fff", color: "#374151", borderColor: "#e5e7eb" }
              }
              onMouseEnter={(e) => {
                if (page !== currentPage) {
                  e.currentTarget.style.borderColor = "#93c5fd";
                  e.currentTarget.style.color = "#3498db";
                }
              }}
              onMouseLeave={(e) => {
                if (page !== currentPage) {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.color = "#374151";
                }
              }}
            >
              {page}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="size-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
