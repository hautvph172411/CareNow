import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

export default function MultiSearchableSelect({ options, value = [], onChange, placeholder = "Chọn...", disabled = false }) {
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

  const toggleOption = (val) => {
    if (value.includes(val)) {
      onChange(value.filter(v => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const removeOption = (e, val) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== val));
  };

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
          minHeight: '42px', padding: '0.4rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px',
          backgroundColor: disabled ? '#f8fafc' : '#fff', cursor: disabled ? 'not-allowed' : 'pointer',
          color: value && value.length > 0 ? '#0f172a' : '#94a3b8', fontSize: '14px',
          flexWrap: 'wrap', gap: '4px'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', flex: 1 }}>
          {!value || value.length === 0 ? (
            <span style={{ padding: '4px 4px' }}>{placeholder}</span>
          ) : (
            value.map(val => {
              const opt = options.find(o => o.value === val);
              return (
                <span
                  key={val}
                  style={{
                    backgroundColor: '#e0e7ff', color: '#3730a3',
                    padding: '2px 8px', borderRadius: '12px', fontSize: '13px',
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  {opt ? opt.label : val}
                  <span
                    onClick={(e) => removeOption(e, val)}
                    style={{ cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    &times;
                  </span>
                </span>
              );
            })
          )}
        </div>
        <ChevronDown size={16} color="#64748b" style={{ flexShrink: 0, marginLeft: '8px' }} />
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
            {filteredOptions.length > 0 ? filteredOptions.map((opt) => {
              const isSelected = value.includes(opt.value);
              return (
                <li
                  key={opt.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOption(opt.value);
                  }}
                  style={{
                    padding: '8px 12px', fontSize: '14px', cursor: 'pointer',
                    backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                    color: isSelected ? '#2563eb' : '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onMouseEnter={e => e.target.style.backgroundColor = isSelected ? '#eff6ff' : '#f8fafc'}
                  onMouseLeave={e => e.target.style.backgroundColor = isSelected ? '#eff6ff' : 'transparent'}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check size={16} color="#2563eb" />}
                </li>
              );
            }) : (
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
