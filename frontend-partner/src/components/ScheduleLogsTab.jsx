import { useState, useEffect } from 'react';
import { getScheduleLogs } from '../api/appointmentSchedule.api';
import { getClinics } from '../api/clinic.api';
import { RefreshCw, Search, X } from 'lucide-react';
import { useRef } from 'react';

const ACTION_LABELS = {
  CREATE: 'Thêm mới',
  UPDATE: 'Cập nhật',
  TOGGLE_STATUS: 'Bật/Tắt lịch',
  DELETE: 'Xóa'
};

const ACTION_COLORS = {
  CREATE: '#10b981',
  UPDATE: '#3b82f6',
  TOGGLE_STATUS: '#f59e0b',
  DELETE: '#ef4444'
};

export default function ScheduleLogsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [clinicFilter, setClinicFilter] = useState('');
  const [clinics, setClinics] = useState([]);
  
  // Custom autocomplete state
  const [searchInput, setSearchInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const limit = 20;

  useEffect(() => {
    // Close dropdown on outside click
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    getClinics({ limit: 1000, page: 1 }).then(res => {
      if (res?.data) setClinics(res.data);
    }).catch(err => console.error(err));
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await getScheduleLogs({
        page,
        limit,
        action_type: actionFilter || undefined,
        clinic_id: clinicFilter || undefined
      });
      if (res.success) {
        setLogs(res.data.rows || []);
        setTotal(res.data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, clinicFilter]);

  const totalPages = Math.ceil(total / limit) || 1;

  const formatDate = (unixTimestamp) => {
    if (!unixTimestamp) return '';
    const date = new Date(unixTimestamp * 1000);
    return date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getDayLabel = (dayIndex) => {
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return days[dayIndex] || 'N/A';
  };

  const filteredClinics = clinics.filter(c => 
    c.name.toLowerCase().includes(searchInput.toLowerCase()) || 
    String(c.id).includes(searchInput)
  );

  return (
    <div className="bg-white rounded-lg shadow" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', margin: 0 }}>Lịch sử thao tác</h3>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          
          <div ref={dropdownRef} style={{ position: 'relative', minWidth: '250px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={16} style={{ position: 'absolute', left: 10, color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Tìm tên bác sĩ..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setShowDropdown(true);
                  if (clinicFilter && e.target.value === '') {
                    setClinicFilter('');
                    setPage(1);
                  }
                }}
                onFocus={() => setShowDropdown(true)}
                style={{ padding: '8px 30px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '100%' }}
              />
              {clinicFilter && (
                <X 
                  size={16} 
                  style={{ position: 'absolute', right: 10, color: '#ef4444', cursor: 'pointer' }} 
                  onClick={() => {
                    setClinicFilter('');
                    setSearchInput('');
                    setPage(1);
                  }}
                />
              )}
            </div>
            
            {showDropdown && (
              <div style={{ 
                position: 'absolute', top: '100%', left: 0, right: 0, 
                background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', 
                marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 50,
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}>
                {filteredClinics.length > 0 ? (
                  filteredClinics.map(c => (
                    <div 
                      key={c.id}
                      style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}
                      onClick={() => {
                        setClinicFilter(c.id);
                        setSearchInput(c.name);
                        setShowDropdown(false);
                        setPage(1);
                      }}
                    >
                      <div style={{ fontWeight: 500, color: '#1e293b', fontSize: '14px' }}>{c.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>ID: {c.id}</div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '8px 12px', color: '#94a3b8', fontSize: '14px', textAlign: 'center' }}>Không tìm thấy bác sĩ</div>
                )}
              </div>
            )}
          </div>

          <select 
            className="form-select"
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
          >
            <option value="">Tất cả thao tác</option>
            <option value="CREATE">Thêm mới</option>
            <option value="UPDATE">Cập nhật</option>
            <option value="TOGGLE_STATUS">Bật/Tắt lịch</option>
            <option value="DELETE">Xóa</option>
          </select>
          <button 
            onClick={() => fetchLogs()} 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', 
              padding: '8px 12px', border: '1px solid #cbd5e1', 
              borderRadius: '6px', background: '#f8fafc', cursor: 'pointer' 
            }}
          >
            <RefreshCw size={16} /> Làm mới
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
              <th style={{ padding: '12px', fontWeight: 600 }}>Thời gian</th>
              <th style={{ padding: '12px', fontWeight: 600 }}>Người thực hiện</th>
              <th style={{ padding: '12px', fontWeight: 600 }}>Hành động</th>
              <th style={{ padding: '12px', fontWeight: 600 }}>Khung lịch</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>Đang tải dữ liệu...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>Không có lịch sử nào.</td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', color: '#334155' }}>{formatDate(log.created_at)}</td>
                  <td style={{ padding: '12px', fontWeight: 500 }}>
                    {log.user_email || 'Hệ thống'}
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: 4 }}>
                      {log.user_type === 'admin' ? 'Quản trị viên' : log.user_type === 'partner' ? 'Đối tác' : ''}
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {log.action_type === 'TOGGLE_STATUS' && log.new_data ? (
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600,
                        color: log.new_data.status === 1 ? '#10b981' : '#ef4444',
                        background: (log.new_data.status === 1 ? '#10b981' : '#ef4444') + '15'
                      }}>
                        {log.new_data.status === 1 ? 'Bật lịch' : 'Tắt lịch'}
                      </span>
                    ) : (
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600,
                        color: ACTION_COLORS[log.action_type] || '#64748b',
                        background: (ACTION_COLORS[log.action_type] || '#64748b') + '15'
                      }}>
                        {ACTION_LABELS[log.action_type] || log.action_type}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>ID: #{log.schedule_block_id}</div>
                    {(log.new_data || log.old_data) && (() => {
                      const data = log.new_data || log.old_data;
                      const clinic = clinics.find(c => String(c.id) === String(data.clinic_id));
                      return (
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                          <div>Ngày: {getDayLabel(data.day_of_week)} ({data.start_time?.slice(0,5)} - {data.end_time?.slice(0,5)})</div>
                          <div style={{ marginTop: '2px', color: '#3b82f6' }}>{clinic?.name || `Bác sĩ #${data.clinic_id}`}</div>
                        </div>
                      );
                    })()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', background: page === 1 ? '#f1f5f9' : '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
          >
            Trang trước
          </button>
          <span style={{ padding: '6px 12px' }}>Trang {page} / {totalPages}</span>
          <button 
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', background: page === totalPages ? '#f1f5f9' : '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
          >
            Trang sau
          </button>
        </div>
      )}
    </div>
  );
}
