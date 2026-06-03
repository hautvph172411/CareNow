import { useState, useEffect } from 'react';
import { Power } from 'lucide-react';
import { formatTimeInput } from '../utils/scheduleLabels';

export default function ScheduleWeekGrid({ 
  blocks, clinics, onAddBlock, onEditBlock, 
  selectedClinicId, onSelectDoctor,
  onToggleBlockStatus, onToggleDayStatus, onToggleAllDoctorsDayStatus 
}) {
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, 1 = next week
  const [weekDates, setWeekDates] = useState({});

  useEffect(() => {
    // Calculate dates for selected week
    const now = new Date();
    const currentDay = now.getDay();
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    
    const monday = new Date(now);
    // Add offset days (weekOffset * 7)
    monday.setDate(now.getDate() + diffToMonday + (weekOffset * 7));
    
    const dates = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dow = d.getDay();
      
      // Store full date info for comparison
      dates[dow] = {
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        fullDate: d
      };
    }
    setWeekDates(dates);
  }, [weekOffset]);

  const isBlockPast = (dayOfWeek, startTimeStr) => {
    if (weekOffset > 0) return false; // Next week is never in the past
    const dateObj = weekDates[dayOfWeek]?.fullDate;
    if (!dateObj || !startTimeStr) return false;

    const [hours, minutes] = startTimeStr.split(':');
    const blockTime = new Date(dateObj);
    blockTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    return blockTime < new Date();
  };

  // Group blocks by clinic_id
  const clinicMap = new Map();
  
  // Initialize with all clinics that have blocks, or all clinics if we want to show empty rows
  blocks.forEach(b => {
    const cid = String(b.clinic_id);
    if (!clinicMap.has(cid)) {
      clinicMap.set(cid, {
        clinicId: b.clinic_id,
        clinicName: b.clinic_name || `Bác sĩ #${b.clinic_id}`,
        days: { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 0: [] } // T2(1) -> CN(0)
      });
    }
    const day = String(b.day_of_week);
    if (clinicMap.get(cid).days[day]) {
      clinicMap.get(cid).days[day].push(b);
    }
  });

  // Sort clinics alphabetically
  const rows = Array.from(clinicMap.values()).sort((a, b) => a.clinicName.localeCompare(b.clinicName, 'vi'));

  // Sort blocks inside each day by start_time
  rows.forEach(r => {
    Object.values(r.days).forEach(dayBlocks => {
      dayBlocks.sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));
    });
  });

  // Monday = 1, Sunday = 0
  const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0];
  const DOW_LABELS = {
    1: 'Thứ 2', 2: 'Thứ 3', 3: 'Thứ 4', 4: 'Thứ 5', 5: 'Thứ 6', 6: 'Thứ 7', 0: 'Chủ nhật'
  };

  const getSessionClass = (sessionType) => {
    return `session-${sessionType}`;
  };

  const getSessionLabel = (sessionType) => {
    switch (String(sessionType)) {
      case '1': return 'Sáng';
      case '2': return 'Chiều';
      case '3': return 'Tối';
      case '4': return 'Đêm';
      default: return '';
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            type="button" 
            onClick={() => setWeekOffset(0)} 
            style={{
              padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0',
              background: weekOffset === 0 ? '#3b82f6' : 'white',
              color: weekOffset === 0 ? 'white' : '#475569',
              cursor: 'pointer', fontWeight: 600, fontSize: 13
            }}
          >
            Tuần này
          </button>
          <button 
            type="button" 
            onClick={() => setWeekOffset(1)} 
            style={{
              padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0',
              background: weekOffset === 1 ? '#3b82f6' : 'white',
              color: weekOffset === 1 ? 'white' : '#475569',
              cursor: 'pointer', fontWeight: 600, fontSize: 13
            }}
          >
            Tuần sau
          </button>
        </div>
      </div>
      <div className="schedule-week-grid">
        <div className="schedule-grid-header">
        <div className="schedule-cell">Bác sĩ</div>
        {DOW_ORDER.map(d => {
          const allDayBlocks = rows.flatMap(r => r.days[d] || []);
          return (
            <div key={d} className="schedule-cell" style={{ position: 'relative' }}>
              {DOW_LABELS[d]}
              {weekDates[d] && <span style={{display: 'block', fontSize: '0.75rem', fontWeight: 'normal', color: '#64748b'}}>{weekDates[d].label}</span>}
              {onToggleAllDoctorsDayStatus && allDayBlocks.length > 0 && (
                <button
                  type="button"
                  title="Bật/Tắt tất cả bác sĩ trong ngày này"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleAllDoctorsDayStatus(d, allDayBlocks);
                  }}
                  style={{
                    position: 'absolute', top: 4, right: 4,
                    border: 'none', background: 'transparent', cursor: 'pointer',
                    color: allDayBlocks.every(b => b.status === 0) ? '#ef4444' : '#3b82f6',
                    padding: 4, display: 'flex', alignItems: 'center'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                    <line x1="12" y1="2" x2="12" y2="12"></line>
                  </svg>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          Chưa có ca làm việc nào. Bấm "+ Thêm khung lịch" để bắt đầu.
        </div>
      ) : (
        rows.map(row => (
          <div key={row.clinicId} className={`schedule-grid-row ${String(row.clinicId) === String(selectedClinicId) ? 'selected' : ''}`}>
            <div className="schedule-cell doctor-col" onClick={() => onSelectDoctor && onSelectDoctor(row.clinicId)}>
              <div>{row.clinicName}</div>
              <div className="doc-subtitle">ID: {row.clinicId}</div>
            </div>
            
            {DOW_ORDER.map(d => {
              const dayBlocks = row.days[d];
              const isEmpty = dayBlocks.length === 0;

              return (
                <div 
                  key={d} 
                  className={`schedule-cell day-col ${isEmpty ? 'empty' : ''}`}
                  style={{ position: 'relative' }}
                  onClick={(e) => {
                    // Only trigger add if clicking empty space, not a chip
                    if (e.target === e.currentTarget || e.target.classList.contains('empty') || e.target.classList.contains('day-col')) {
                      onAddBlock(row.clinicId, d);
                    }
                  }}
                >
                  {/* Day Toggle Button */}
                  {!isEmpty && onToggleDayStatus && (() => {
                    const hasPastBlock = dayBlocks.some(b => isBlockPast(d, b.start_time));
                    return (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!hasPastBlock) onToggleDayStatus(row.clinicId, d, dayBlocks);
                        }}
                        className="day-toggle-btn"
                        style={{
                          position: 'absolute', top: 4, right: 4, 
                          background: 'transparent', border: 'none', cursor: hasPastBlock ? 'not-allowed' : 'pointer',
                          color: hasPastBlock ? 'var(--gray-300)' : 'var(--gray-400)', zIndex: 2, padding: 4, borderRadius: 4,
                          opacity: hasPastBlock ? 0.5 : 1
                        }}
                        title={hasPastBlock ? "Không thể thao tác vì có ca đã qua thời gian" : "Bật/Tắt tất cả các ca trong ngày"}
                      >
                        <Power size={14} />
                      </button>
                    );
                  })()}
                  {dayBlocks.map(block => {
                    const past = isBlockPast(d, block.start_time);
                    return (
                      <div 
                        key={block.id} 
                        className={`schedule-chip ${getSessionClass(block.session_type)} ${past ? 'past-block' : ''}`}
                        style={{ 
                          opacity: past ? 0.4 : (block.status === 1 ? 1 : 0.6),
                          position: 'relative',
                          paddingRight: onToggleBlockStatus ? 28 : undefined,
                          border: block.status === 0 ? '1px dashed var(--gray-400)' : undefined,
                          cursor: past ? 'not-allowed' : 'pointer'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!past) onEditBlock(block);
                        }}
                        title={past ? "Ca làm việc đã qua, không thể sửa" : `${getSessionLabel(block.session_type)}: ${formatTimeInput(block.start_time)} - ${formatTimeInput(block.end_time)}${block.status === 0 ? ' (Đang tắt)' : ''}`}
                      >
                        <span className="chip-time">{formatTimeInput(block.start_time)} - {formatTimeInput(block.end_time)}</span>
                        <span className="chip-session">{getSessionLabel(block.session_type)}</span>
                        
                        {/* Block Toggle Button */}
                        {onToggleBlockStatus && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!past) onToggleBlockStatus(block);
                            }}
                            className="block-toggle-btn"
                            style={{
                              position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
                              background: block.status === 1 ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.1)', 
                              border: 'none', borderRadius: '50%',
                              width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: past ? 'not-allowed' : 'pointer', color: block.status === 1 ? 'inherit' : 'var(--error)'
                            }}
                            title={past ? "Ca đã qua" : (block.status === 1 ? "Tắt ca này" : "Bật lại ca này")}
                          >
                            <Power size={12} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))
      )}
      </div>
    </div>
  );
}
