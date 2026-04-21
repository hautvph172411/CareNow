import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export default function SearchableSelect({ options, value, onChange, placeholder = "Chọn...", disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const filteredOptions = options.filter(opt =>
    (opt.label || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value) || null;

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', fontFamily: 'inherit' }}>
      <div
        onClick={() => {
          if (disabled) {
            alert(placeholder || "Vui lòng chọn tùy chọn trước đó!");
            return;
          }
          setIsOpen(!isOpen);
        }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.6rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px',
          backgroundColor: disabled ? '#f8fafc' : '#fff', cursor: disabled ? 'not-allowed' : 'pointer',
          color: selectedOption ? '#0f172a' : '#94a3b8', fontSize: '14px'
        }}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown size={16} color="#64748b" />
      </div>

      {isOpen && !disabled && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
          backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 1000, overflow: 'hidden'
        }}>
          <div style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={14} color="#94a3b8" />
            <input
              type="text"
              autoFocus
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px' }}
            />
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: '200px', overflowY: 'auto' }}>
            {filteredOptions.length > 0 ? filteredOptions.map((opt) => (
              <li
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                style={{
                  padding: '8px 12px', fontSize: '14px', cursor: 'pointer',
                  backgroundColor: opt.value === value ? '#eff6ff' : 'transparent',
                  color: opt.value === value ? '#2563eb' : '#334155'
                }}
                onMouseEnter={e => e.target.style.backgroundColor = '#f8fafc'}
                onMouseLeave={e => e.target.style.backgroundColor = opt.value === value ? '#eff6ff' : 'transparent'}
              >
                {opt.label}
              </li>
            )) : (
              <li style={{ padding: '8px 12px', fontSize: '13px', color: '#94a3b8', textAlign: 'center' }}>
                Không tìm thấy kết quả
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
