import React, { useState } from 'react';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      let page = parseInt(inputValue, 10);
      if (!isNaN(page)) {
        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        onPageChange(page);
      }
      setShowInput(false);
      setInputValue('');
    }
  };

  const safeTotalPages = totalPages || 1;

  const renderPages = () => {
    // Nếu <= 4 trang thì hiển thị hết 1 2 3 4
    if (safeTotalPages <= 4) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1).map(page => (
        <button
          key={page}
          className={`btn ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => onPageChange(page)}
          style={currentPage === page ? { backgroundColor: '#3b82f6', color: '#fff' } : {}}
        >
          {page}
        </button>
      ));
    }

    // Nếu > 4 trang thì hiển thị: 1 2 3 ... N
    const buttons = [];
    
    // Luôn hiển thị 1 2 3
    for (let i = 1; i <= 3; i++) {
      buttons.push(
        <button key={i} className={`btn ${currentPage === i ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => onPageChange(i)} style={currentPage === i ? { backgroundColor: '#3b82f6', color: '#fff' } : {}}>
          {i}
        </button>
      );
    }

    // Nút "..." hoặc Input nhảy trang
    buttons.push(
      showInput ? (
        <div key="dots-input" style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="number"
            autoFocus
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            onBlur={() => setShowInput(false)}
            style={{ width: '60px', height: '38px', padding: '0.4rem', textAlign: 'center', borderRadius: '6px', border: '2px solid #3b82f6', outline: 'none' }}
            placeholder="Go"
          />
        </div>
      ) : (
        <button 
          key="dots" 
          className="btn btn-secondary" 
          onClick={() => setShowInput(true)} 
          style={{ padding: '0 0.75rem', fontWeight: 'bold' }}
          title="Nhập số trang để chuyển đến"
        >
          ...
        </button>
      )
    );

    // Trang cuối cùng
    buttons.push(
      <button key={'last'} className={`btn ${currentPage === safeTotalPages ? 'btn-primary' : 'btn-secondary'}`}
        onClick={() => onPageChange(safeTotalPages)} style={currentPage === safeTotalPages ? { backgroundColor: '#3b82f6', color: '#fff' } : {}}>
        {safeTotalPages}
      </button>
    );

    return buttons;
  };

  return (
    <div className="pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '2rem' }}>
      <button
        className="btn btn-secondary"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        Trang trước
      </button>

      {renderPages()}

      <button
        className="btn btn-secondary"
        onClick={() => onPageChange(Math.min(safeTotalPages, currentPage + 1))}
        disabled={currentPage === safeTotalPages}
      >
        Trang sau
      </button>
    </div>
  );
}
