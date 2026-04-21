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
    // Nếu <= 3 trang thì hiển thị bình thường 1 2 3
    if (safeTotalPages <= 3) {
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

    // Nếu > 3 trang thì hiển thị: 1 2 [Trang hiện tại] ... N
    const buttons = [];
    
    buttons.push(
      <button key={1} className={`btn ${currentPage === 1 ? 'btn-primary' : 'btn-secondary'}`}
        onClick={() => onPageChange(1)} style={currentPage === 1 ? { backgroundColor: '#3b82f6', color: '#fff' } : {}}>
        1
      </button>
    );

    buttons.push(
      <button key={2} className={`btn ${currentPage === 2 ? 'btn-primary' : 'btn-secondary'}`}
        onClick={() => onPageChange(2)} style={currentPage === 2 ? { backgroundColor: '#3b82f6', color: '#fff' } : {}}>
        2
      </button>
    );

    const isMiddlePage = currentPage > 2 && currentPage < safeTotalPages;

    if (isMiddlePage && !showInput) {
       buttons.push(
          <button key={currentPage} className="btn btn-primary" style={{ backgroundColor: '#3b82f6', color: '#fff' }}>
            {currentPage}
          </button>
       );
    }

    buttons.push(
      showInput ? (
        <input
          key="dots"
          type="number"
          autoFocus
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleInputKeyDown}
          onBlur={() => setShowInput(false)}
          style={{ width: '60px', padding: '0.4rem', textAlign: 'center', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
          placeholder="Trang"
        />
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

    buttons.push(
      <button key={'last'} className={`btn ${currentPage === safeTotalPages ? 'btn-primary' : 'btn-secondary'}`}
        onClick={() => onPageChange(safeTotalPages)} style={currentPage === safeTotalPages ? { backgroundColor: '#3b82f6', color: '#fff' } : {}}>
        {safeTotalPages}
      </button>
    );

    return buttons;
  };

  return (
    <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
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
