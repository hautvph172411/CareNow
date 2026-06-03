import { useState, useEffect, useRef } from 'react';
import { Folder, Image as ImageIcon, Plus, Upload, X, Search, ChevronRight, Home, Loader2, Trash2 } from 'lucide-react';
import { getMediaFiles, createFolder, uploadImage, deleteImage, deleteFolder } from '../api/upload.api';
import '../styles/MediaLibrary.css';

export default function MediaLibraryModal({ isOpen, onClose, onSelect }) {
  const [currentFolder, setCurrentFolder] = useState('');
  const [folders, setFolders] = useState([]);
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  
  // Trạng thái tạo thư mục mới
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Trạng thái upload ảnh
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadMedia(currentFolder);
    }
  }, [isOpen, currentFolder]);

  const loadMedia = async (folderPath) => {
    setIsLoading(true);
    setSelectedImage(null);
    try {
      const res = await getMediaFiles(folderPath);
      if (res.success && res.data) {
        setFolders(res.data.folders || []);
        setImages(res.data.images || []);
      }
    } catch (err) {
      console.error('Lỗi khi tải media:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFolderClick = (path) => {
    setCurrentFolder(path);
  };

  const handleBreadcrumbClick = (index) => {
    if (index === -1) {
      setCurrentFolder('');
    } else {
      const parts = currentFolder.split('/').filter(Boolean);
      const newPath = parts.slice(0, index + 1).join('/');
      setCurrentFolder(newPath);
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    
    setIsCreatingFolder(true);
    try {
      const folderPath = currentFolder ? `${currentFolder}/${newFolderName.trim()}` : newFolderName.trim();
      const res = await createFolder(folderPath);
      if (res.success) {
        setNewFolderName('');
        setShowCreateFolder(false);
        // Cập nhật state local ngay lập tức để người dùng thấy thư mục mới không bị trễ
        const newFolderObj = {
          name: newFolderName.trim(),
          path: folderPath
        };
        setFolders(prev => [...prev, newFolderObj]);
        alert('Tạo thư mục thành công!');
      } else {
        alert(res.message || 'Tạo thư mục thất bại');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi tạo thư mục');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const data = await uploadImage(file, currentFolder);
      if (data && data.url) {
        // Cập nhật state local ngay lập tức để người dùng thấy ảnh mới mà không bị trễ do Cloudinary Search Index
        const newImg = {
          public_id: data.public_id,
          url: data.url,
          format: data.format || 'jpg',
          created_at: new Date().toISOString(),
          width: data.width,
          height: data.height
        };
        setImages(prev => [newImg, ...prev]);
        alert('Tải ảnh lên thành công!');
      } else {
        alert('Upload ảnh thất bại!');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Upload ảnh thất bại!');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSelectImage = (img) => {
    setSelectedImage(img);
  };

  const handleImageDoubleClick = (img) => {
    onSelect(img.url);
    onClose();
  };

  const handleConfirm = () => {
    if (selectedImage) {
      onSelect(selectedImage.url);
      onClose();
    }
  };

  const handleDeleteImageClick = async (e, img) => {
    e.stopPropagation(); // Ngăn sự kiện click chọn ảnh
    const filename = img.public_id.split('/').pop();
    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa ảnh "${filename}" khỏi thư viện?`);
    if (!confirmDelete) return;

    try {
      const res = await deleteImage(img.public_id);
      if (res.success) {
        setImages(prev => prev.filter(i => i.public_id !== img.public_id));
        if (selectedImage?.public_id === img.public_id) {
          setSelectedImage(null);
        }
        alert('Xóa ảnh thành công!');
      } else {
        alert(res.message || 'Xóa ảnh thất bại!');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi xóa ảnh!');
    }
  };

  const handleDeleteFolderClick = async (e, folder) => {
    e.stopPropagation(); // Ngăn sự kiện click mở thư mục
    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa thư mục "${folder.name}" và toàn bộ nội dung bên trong?`);
    if (!confirmDelete) return;

    try {
      const res = await deleteFolder(folder.path);
      if (res.success) {
        setFolders(prev => prev.filter(f => f.path !== folder.path));
        alert('Xóa thư mục thành công!');
      } else {
        alert(res.message || 'Xóa thư mục thất bại!');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi xóa thư mục!');
    }
  };

  if (!isOpen) return null;

  // Lọc thư mục và ảnh theo ô tìm kiếm
  const filteredFolders = folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredImages = images.filter(img => {
    const filename = img.public_id.split('/').pop() || '';
    return filename.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const breadcrumbs = currentFolder.split('/').filter(Boolean);

  return (
    <div className="media-library-overlay">
      <div className="media-library-modal">
        {/* Header */}
        <div className="media-library-header">
          <h2>Thư viện ảnh</h2>
          <button type="button" className="media-library-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="media-library-toolbar">
          <div className="media-library-nav">
            <button type="button" className="media-library-btn-icon" onClick={() => handleBreadcrumbClick(-1)} title="Thư mục gốc">
              <Home size={18} />
            </button>
            <button 
              type="button" 
              className="media-library-btn-icon" 
              onClick={() => {
                const parts = currentFolder.split('/').filter(Boolean);
                if (parts.length > 0) {
                  const newPath = parts.slice(0, -1).join('/');
                  setCurrentFolder(newPath);
                }
              }} 
              disabled={!currentFolder}
              title="Quay lại"
            >
              Quay lại
            </button>
          </div>

          <div className="media-library-actions">
            <div className="media-library-search">
              <Search className="media-library-search-icon" size={16} />
              <input 
                type="text" 
                placeholder="Tìm kiếm..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <button type="button" className="media-library-btn media-library-btn-upload" onClick={handleUploadClick} disabled={isUploading}>
              {isUploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
              Tải lên
            </button>

            <button type="button" className="media-library-btn media-library-btn-folder" onClick={() => setShowCreateFolder(true)}>
              <Plus size={16} />
              Thư mục mới
            </button>
          </div>
        </div>

        {/* Breadcrumbs */}
        <div className="media-library-content">
          <div className="media-library-breadcrumbs">
            <span className="media-library-breadcrumb-item" onClick={() => handleBreadcrumbClick(-1)}>Home</span>
            {breadcrumbs.map((crumb, idx) => (
              <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <ChevronRight size={14} />
                <span 
                  className={idx === breadcrumbs.length - 1 ? 'media-library-breadcrumb-active' : 'media-library-breadcrumb-item'}
                  onClick={() => handleBreadcrumbClick(idx)}
                >
                  {crumb}
                </span>
              </span>
            ))}
          </div>

          {/* Grid hiển thị thư mục & ảnh */}
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: '#64748b' }}>
              <Loader2 className="animate-spin" size={32} />
            </div>
          ) : (
            <div className="media-library-grid">
              {/* Folders */}
              {filteredFolders.map(folder => (
                <div 
                  key={folder.path} 
                  className="media-library-folder-card"
                  onClick={() => handleFolderClick(folder.path)}
                >
                  <Folder className="media-library-folder-icon" size={48} fill="#f59e0b" />
                  <span className="media-library-folder-name">{folder.name}</span>
                  <button
                    type="button"
                    className="media-library-folder-delete-btn"
                    onClick={(e) => handleDeleteFolderClick(e, folder)}
                    title="Xóa thư mục"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}

              {/* Images */}
              {filteredImages.map(img => {
                const filename = img.public_id.split('/').pop() || 'Ảnh';
                const isSelected = selectedImage?.public_id === img.public_id;
                return (
                  <div 
                    key={img.public_id} 
                    className={`media-library-image-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectImage(img)}
                    onDoubleClick={() => handleImageDoubleClick(img)}
                  >
                    <img src={img.url} alt={filename} />
                    <span className="media-library-image-name">{filename}</span>
                    <button
                      type="button"
                      className="media-library-image-delete-btn"
                      onClick={(e) => handleDeleteImageClick(e, img)}
                      title="Xóa ảnh"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}

              {filteredFolders.length === 0 && filteredImages.length === 0 && (
                <div className="media-library-empty">
                  <ImageIcon size={48} style={{ strokeWidth: 1 }} />
                  <p>Thư mục này trống</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="media-library-footer">
          <button type="button" className="media-library-btn media-library-btn-cancel" onClick={onClose}>
            Hủy
          </button>
          <button 
            type="button" 
            className="media-library-btn media-library-btn-confirm" 
            onClick={handleConfirm}
            disabled={!selectedImage}
          >
            Chọn ảnh
          </button>
        </div>
      </div>

      {/* Input file ẩn để click Tải lên */}
      <input 
        type="file" 
        ref={fileInputRef} 
        hidden 
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* Dialog tạo thư mục */}
      {showCreateFolder && (
        <div className="folder-create-dialog-overlay">
          <div className="folder-create-dialog">
            <h3>Tạo thư mục mới</h3>
            <input 
              type="text" 
              placeholder="Tên thư mục..." 
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreateFolder(e);
                }
              }}
              autoFocus
              required
            />
            <div className="folder-create-actions">
              <button 
                type="button" 
                className="media-library-btn media-library-btn-cancel"
                onClick={() => {
                  setShowCreateFolder(false);
                  setNewFolderName('');
                }}
              >
                Hủy
              </button>
              <button 
                type="button" 
                className="media-library-btn media-library-btn-confirm"
                onClick={handleCreateFolder}
                disabled={isCreatingFolder || !newFolderName.trim()}
              >
                {isCreatingFolder ? 'Đang tạo...' : 'Tạo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
