import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, Check, X } from "lucide-react";

/**
 * Combobox có ô tìm kiếm — dùng cho province/ward, specialty, ...
 *
 * Props:
 *  - options: Array<{ value: any, label: string }>
 *  - value: any  (giá trị đang chọn)
 *  - onChange: (value: any) => void
 *  - placeholder?: string
 *  - disabled?: boolean
 *  - allowClear?: boolean  (mặc định true)
 *  - emptyText?: string
 *  - className?: string  (extra class cho trigger)
 */
export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = "Chọn...",
  disabled = false,
  allowClear = true,
  emptyText = "Không tìm thấy kết quả",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const selected = useMemo(
    () => options.find((o) => String(o.value) === String(value)) || null,
    [options, value]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => (o.label || "").toLowerCase().includes(q));
  }, [options, search]);

  // Close on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Focus search khi mở
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.("");
  };

  const triggerBase =
    "w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg bg-white transition-all";
  const triggerEnabled =
    "cursor-pointer hover:border-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
  const triggerDisabled = "cursor-not-allowed bg-gray-50 text-gray-400";

  return (
    <div ref={wrapRef} className="relative w-full">
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={`${triggerBase} ${disabled ? triggerDisabled : triggerEnabled} ${className}`}
      >
        <span className={`truncate text-left flex-1 ${selected ? "text-gray-800" : "text-gray-400"}`}>
          {selected ? selected.label : placeholder}
        </span>

        <span className="flex items-center gap-1 shrink-0">
          {allowClear && selected && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              onClick={handleClear}
              className="p-0.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
              title="Bỏ chọn"
            >
              <X className="size-3.5" />
            </span>
          )}
          <ChevronDown
            className={`size-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {open && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {/* Search box */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
            <Search className="size-4 text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-full text-sm outline-none border-0 bg-transparent placeholder:text-gray-400"
            />
          </div>

          {/* Options */}
          <ul className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-sm text-center text-gray-400">{emptyText}</li>
            ) : (
              filtered.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange?.(opt.value);
                        setOpen(false);
                        setSearch("");
                      }}
                      className={`w-full flex items-center justify-between gap-2 text-left px-3 py-2 text-sm transition-colors ${
                        isSelected
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && <Check className="size-4 shrink-0" />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
