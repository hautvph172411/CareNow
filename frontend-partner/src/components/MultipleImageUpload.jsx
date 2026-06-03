import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import MediaLibraryModal from './MediaLibraryModal';

/**
 * Component quản lý nhiều ảnh dùng Thư viện ảnh (Media Library).
 * Trả về chuỗi các URL ngăn cách bởi dấu phẩy (CSV).
 */
export default function MultipleImageUpload({ value = '', onChange, label = 'Ảnh mô tả' }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Chuyển chuỗi CSV thành mảng các URL
  const urls = value ? value.split(',').filter(Boolean) : [];

  const handleSelect = (newUrl) => {
    if (!newUrl) return;
    if (urls.includes(newUrl)) {
      alert('Ảnh này đã có trong danh sách!');
      return;
    }
    const updated = [...urls, newUrl];
    onChange?.(updated.join(','));
  };

  const handleRemove = (urlToRemove) => {
    const updated = urls.filter(url => url !== urlToRemove);
    onChange?.(updated.join(','));
  };

  return (
    <div className="multiple-image-upload">
      {label && <label className="image-upload-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.875rem', color: '#334155' }}>{label}</label>}
      
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Render danh sách ảnh hiện có */}
        {urls.map((url, index) => (
          <div 
            key={index} 
            className="image-upload-box" 
            style={{ 
              position: 'relative', 
              width: '80px', 
              height: '80px', 
              borderRadius: '8px', 
              overflow: 'hidden', 
              border: '1px solid #cbd5e1',
              cursor: 'default'
            }}
          >
            <img src={url} alt={`Preview ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button
              type="button"
              className="image-upload-remove"
              onClick={() => handleRemove(url)}
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                background: 'rgba(239, 68, 68, 0.9)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0
              }}
              title="Xóa ảnh"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        {/* Nút thêm ảnh */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '8px',
            border: '2px dashed #cbd5e1',
            background: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 500,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#3b82f6';
            e.currentTarget.style.color = '#3b82f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#cbd5e1';
            e.currentTarget.style.color = '#64748b';
          }}
        >
          <Plus size={20} />
          <span>Thêm ảnh</span>
        </button>
      </div>

      <MediaLibraryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSelect={handleSelect} 
      />
    </div>
  );
}
