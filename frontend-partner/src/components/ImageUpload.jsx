import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import MediaLibraryModal from './MediaLibraryModal';

/**
 * Component upload ảnh sử dụng Thư viện ảnh (Media Library).
 *
 * Props:
 *  - value: string (URL ảnh hiện tại)
 *  - onChange: (url: string) => void - gọi sau khi chọn xong (hoặc khi bị xóa -> '')
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
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRemove = (e) => {
    e.stopPropagation();
    onChange?.('');
  };

  const openModal = () => setIsModalOpen(true);

  if (variant === 'avatar') {
    return (
      <div className="image-upload avatar-variant">
        <button
          type="button"
          className="avatar-preview-btn"
          onClick={openModal}
          style={{ width: size, height: size }}
          title="Chọn ảnh từ Thư viện"
        >
          {value ? (
            <img src={value} alt="avatar" />
          ) : (
            <Upload size={22} />
          )}
        </button>
        {value && (
          <button type="button" className="avatar-remove" onClick={handleRemove} title="Xóa ảnh">
            <X size={14} />
          </button>
        )}
        <MediaLibraryModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSelect={onChange} 
        />
      </div>
    );
  }

  return (
    <div className="image-upload card-variant">
      {label && <label className="image-upload-label">{label}</label>}
      <div className="image-upload-box" onClick={openModal}>
        {value ? (
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
            <span>Chọn ảnh từ Thư viện</span>
          </div>
        )}
      </div>
      <MediaLibraryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSelect={onChange} 
      />
    </div>
  );
}
