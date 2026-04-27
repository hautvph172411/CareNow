import { useState, useRef } from 'react';
import { Upload, Loader2, X } from 'lucide-react';
import { uploadImage } from '../api/upload.api';

/**
 * Component upload ảnh lên Cloudinary.
 *
 * Props:
 *  - value: string (URL ảnh hiện tại)
 *  - onChange: (url: string) => void - gọi sau khi upload xong (hoặc khi bị xóa -> '')
 *  - variant: 'card' | 'avatar' (layout preview)
 *  - label: string (label hiển thị phía trên)
 *  - size: number (size avatar, px) — chỉ dùng với variant='avatar'
 */
export default function ImageUpload({
  value = '',
  onChange,
  variant = 'card',
  label = 'Ảnh',
  size = 96,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ảnh tối đa 5MB');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await uploadImage(file);
      onChange?.(data.url);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Upload thất bại');
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onChange?.('');
  };

  const openPicker = () => inputRef.current?.click();

  if (variant === 'avatar') {
    return (
      <div className="image-upload avatar-variant">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleFile}
        />
        <button
          type="button"
          className="avatar-preview-btn"
          onClick={openPicker}
          style={{ width: size, height: size }}
          title="Chọn ảnh"
        >
          {loading ? (
            <Loader2 className="spin" size={22} />
          ) : value ? (
            <img src={value} alt="avatar" />
          ) : (
            <Upload size={22} />
          )}
        </button>
        {value && !loading && (
          <button type="button" className="avatar-remove" onClick={handleRemove} title="Xóa ảnh">
            <X size={14} />
          </button>
        )}
        {error && <p className="image-upload-error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="image-upload card-variant">
      {label && <label className="image-upload-label">{label}</label>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFile}
      />
      <div className="image-upload-box" onClick={openPicker}>
        {loading ? (
          <div className="image-upload-placeholder">
            <Loader2 className="spin" size={24} />
            <span>Đang upload...</span>
          </div>
        ) : value ? (
          <>
            <img src={value} alt="preview" />
            <button
              type="button"
              className="image-upload-remove"
              onClick={handleRemove}
              title="Xóa ảnh"
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <div className="image-upload-placeholder">
            <Upload size={24} />
            <span>Chọn ảnh (tối đa 5MB)</span>
          </div>
        )}
      </div>
      {error && <p className="image-upload-error">{error}</p>}
    </div>
  );
}
