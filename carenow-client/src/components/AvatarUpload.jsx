import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { uploadImage } from "../api/upload.api";

/**
 * Avatar có thể click để upload ảnh mới lên Cloudinary.
 *
 * Props:
 *  - value: string  URL ảnh hiện tại (avatar_url)
 *  - fallbackText: string  Ký tự hiển thị nếu chưa có ảnh (thường là chữ cái đầu)
 *  - onChange: (url: string) => void   gọi khi upload xong
 *  - size: number  (px)  mặc định 96
 *  - disabled: boolean
 */
export default function AvatarUpload({
  value = "",
  fallbackText = "U",
  onChange,
  size = 96,
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const openPicker = () => {
    if (disabled || loading) return;
    inputRef.current?.click();
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file ảnh");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh tối đa 5MB");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await uploadImage(file);
      onChange?.(data.url);
    } catch (err) {
      setError(err?.response?.data?.message || "Upload thất bại");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={openPicker}
        disabled={disabled || loading}
        className="relative group rounded-full ring-4 ring-blue-50 overflow-hidden disabled:cursor-not-allowed"
        style={{ width: size, height: size }}
        title="Đổi avatar"
      >
        {value ? (
          <img
            src={value}
            alt="Avatar"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: "#3498db", fontSize: size * 0.35 }}
          >
            {fallbackText}
          </div>
        )}

        {/* Overlay khi hover */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {loading ? (
            <Loader2 className="size-6 text-white animate-spin" />
          ) : (
            <Camera className="size-6 text-white" />
          )}
        </div>

        {/* Loader khi đang upload (always visible) */}
        {loading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 className="size-6 text-white animate-spin" />
          </div>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFile}
      />

      {error && (
        <p className="text-xs text-red-600 mt-1 max-w-[180px] text-center">{error}</p>
      )}
    </div>
  );
}
