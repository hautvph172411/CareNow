import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CalendarClock, Plus, X, Loader, RefreshCw } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { getScheduleBlocks, updateScheduleBlock } from '../api/appointmentSchedule.api';
import { getClinics } from '../api/clinic.api';
import { getPartners } from '../api/partner.api';
import { getSpecialties } from '../api/specialty.api';
import ScheduleWeekGrid from '../components/ScheduleWeekGrid';
import DoctorPanel from '../components/DoctorPanel';
import ScheduleLogsTab from '../components/ScheduleLogsTab';
import Pagination from '../components/Pagination';
import { useAuth } from '../hooks/useAuth';

export default function AppointmentScheduleV2() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const [activeTab, setActiveTab] = useState('schedule');

  // Search state
  const [searchInput, setSearchInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownDoctors, setDropdownDoctors] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Filters — applied immediately on change
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [filterPartner, setFilterPartner] = useState('');

  // Reference data
  const [specialties, setSpecialties] = useState([]);
  const [partners, setPartners] = useState([]);

  // Grid data
  const [clinicsOnPage, setClinicsOnPage] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(true);
  
  // Pagination for grid
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10; // Load 10 doctors per page

  // Selected doctor for right panel
  const [selectedClinic, setSelectedClinic] = useState(null);

  // ── Load reference data (Specialties, Partners) ──────────
  useEffect(() => {
    (async () => {
      try {
        const [specRes, partRes] = await Promise.all([
          getSpecialties({ limit: 1000, page: 1 }),
          getPartners({ limit: 1000, page: 1 }),
        ]);
        if (specRes?.data) setSpecialties(specRes.data);
        if (partRes?.data) setPartners(partRes.data);
      } catch (e) { console.error(e); }
    })();
  }, []);

  // ── Load Grid Data (Paginated by Doctor) ────────────────
  const loadGridData = useCallback(async () => {
    setLoadingBlocks(true);
    try {
      let targetClinics = [];
      
      if (selectedClinic) {
        // If a specific doctor is selected, grid only shows them
        targetClinics = [selectedClinic];
        setTotalPages(1);
      } else {
        // Fetch a paginated list of doctors based on filters
        const params = { limit, page: currentPage };
        if (filterSpecialty) params.specialist_id = filterSpecialty;
        if (filterPartner) params.partner_id = filterPartner;
        
        const r = await getClinics(params);
        if (r?.data) {
          targetClinics = r.data;
          setTotalPages(r.pagination?.totalPages || 1);
        }
      }
      
      setClinicsOnPage(targetClinics);
      
      // Fetch schedule blocks ONLY for these doctors
      if (targetClinics.length > 0) {
        const blockPromises = targetClinics.map(c => 
          getScheduleBlocks({ clinic_id: c.id, limit: 100, page: 1 })
            .catch(() => ({ data: [] }))
        );
        const results = await Promise.all(blockPromises);
        // Flatten blocks
        const allBlocks = results.flatMap(res => res.data || []);
        setBlocks(allBlocks);
      } else {
        setBlocks([]);
      }
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoadingBlocks(false); 
    }
  }, [currentPage, filterSpecialty, filterPartner, selectedClinic]);

  useEffect(() => { loadGridData(); }, [loadGridData]);

  // ── Autocomplete Search Logic ────────────────────────────
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    setShowDropdown(true);
    
    if (!val.trim()) {
      setDropdownDoctors([]);
      setIsSearching(false);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      return;
    }

    setIsSearching(true);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const r = await getClinics({ keyword: val, limit: 10, page: 1 });
        if (r?.data) {
          setDropdownDoctors(r.data);
        } else {
          setDropdownDoctors([]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        searchRef.current && !searchRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Select doctor ────────────────────────────────────────
  const handleSelectDoctor = useCallback((clinicId) => {
    const doctor =
      clinicsOnPage.find(d => String(d.id) === String(clinicId)) ||
      { id: clinicId, name: `Bác sĩ #${clinicId}` };
    setSelectedClinic(doctor);
  }, [clinicsOnPage]);

  const handleSelectFromDropdown = (doctor) => {
    setSearchInput(doctor.name);
    setShowDropdown(false);
    setSelectedClinic(doctor);
    // Clear filters so user sees this doctor without constraints
    setFilterSpecialty('');
    setFilterPartner('');
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setShowDropdown(false);
    setSelectedClinic(null);
    setCurrentPage(1);
  };

  const handleAddBlock = (clinicId) => { handleSelectDoctor(clinicId); };
  const handleEditBlock = (block) => { handleSelectDoctor(block.clinic_id); };

  const handleToggleBlockStatus = async (block) => {
    try {
      const newStatus = block.status === 1 ? 0 : 1;
      await updateScheduleBlock(block.id, { ...block, status: newStatus });
      loadGridData();
    } catch (e) {
      alert(e.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  const handleToggleDayStatus = async (clinicId, dayOfWeek, currentBlocks) => {
    if (!currentBlocks || currentBlocks.length === 0) return;
    const allOff = currentBlocks.every(b => b.status === 0);
    const targetStatus = allOff ? 1 : 0;
    
    if (!window.confirm(`Bạn muốn ${targetStatus === 1 ? 'bật' : 'tắt'} toàn bộ ${currentBlocks.length} ca khám của ngày này?`)) return;

    try {
      await Promise.all(currentBlocks.map(b => {
        if (b.status !== targetStatus) {
          return updateScheduleBlock(b.id, { ...b, status: targetStatus });
        }
        return Promise.resolve();
      }));
      loadGridData();
    } catch (e) {
      alert('Có lỗi xảy ra khi cập nhật trạng thái cả ngày');
    }
  };

  const handleToggleAllDoctorsDayStatus = async (dayOfWeek, currentBlocks) => {
    if (!currentBlocks || currentBlocks.length === 0) return;
    const allOff = currentBlocks.every(b => b.status === 0);
    const targetStatus = allOff ? 1 : 0;
    
    if (!window.confirm(`Bạn muốn ${targetStatus === 1 ? 'bật' : 'tắt'} toàn bộ ${currentBlocks.length} ca khám của TẤT CẢ bác sĩ trong ngày này?`)) return;

    try {
      await Promise.all(currentBlocks.map(b => {
        if (b.status !== targetStatus) {
          return updateScheduleBlock(b.id, { ...b, status: targetStatus });
        }
        return Promise.resolve();
      }));
      loadGridData();
    } catch (e) {
      alert('Có lỗi xảy ra khi cập nhật trạng thái cả ngày');
    }
  };

  const handleRefreshData = async () => {
    setSelectedClinic(null);
    setSearchInput('');
    setShowDropdown(false);
    await loadGridData();
  };

  return (
    <AdminLayout pageTitle="Lịch & Bảng giá" defaultSidebarCollapsed={true}>
      <div className="schedule-v2-wrapper">
        
        {/* TAB SWITCHER */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '0 24px' }}>
          <button
            onClick={() => setActiveTab('schedule')}
            style={{
              padding: '16px 20px', border: 'none', background: 'transparent',
              fontSize: '15px', fontWeight: activeTab === 'schedule' ? 600 : 500,
              color: activeTab === 'schedule' ? '#2563eb' : '#64748b',
              borderBottom: activeTab === 'schedule' ? '2px solid #2563eb' : '2px solid transparent',
              cursor: 'pointer'
            }}
          >
            Quản lý lịch khám
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            style={{
              padding: '16px 20px', border: 'none', background: 'transparent',
              fontSize: '15px', fontWeight: activeTab === 'logs' ? 600 : 500,
              color: activeTab === 'logs' ? '#2563eb' : '#64748b',
              borderBottom: activeTab === 'logs' ? '2px solid #2563eb' : '2px solid transparent',
              cursor: 'pointer'
            }}
          >
            Lịch sử thao tác
          </button>
        </div>

        {activeTab === 'logs' ? (
          <ScheduleLogsTab />
        ) : (
          <>
            {/* ── Toolbar: Search & Filter ── */}
            <div className="schedule-v2-toolbar">

          {/* Search with autocomplete */}
          <div className="schedule-v2-search" ref={searchRef} style={{ position: 'relative', flex: '1 1 250px' }}>
            <Search size={16} className="search-icon" />
            <input
              placeholder="Tìm bác sĩ theo tên..."
              value={searchInput}
              onChange={handleSearchChange}
              onClick={() => setShowDropdown(true)}
              onFocus={() => setShowDropdown(true)}
              style={{ paddingRight: searchInput ? '2rem' : undefined }}
            />
            {searchInput && (
              <button
                onClick={handleClearSearch}
                style={{
                  position: 'absolute', right: '0.5rem', top: '50%',
                  transform: 'translateY(-50%)', border: 'none',
                  background: 'none', cursor: 'pointer', color: '#94a3b8',
                  display: 'flex', alignItems: 'center', padding: '2px'
                }}
              >
                <X size={14} />
              </button>
            )}

            {/* Autocomplete dropdown */}
            {showDropdown && searchInput && (
              <div
                ref={dropdownRef}
                style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                  background: 'white', border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                  zIndex: 200, overflow: 'hidden',
                  animation: 'modal-pop 0.15s ease',
                }}
              >
                {isSearching ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
                    <Loader size={16} className="spin" style={{ display: 'inline', marginRight: 8 }} />
                    Đang tìm kiếm...
                  </div>
                ) : dropdownDoctors.length > 0 ? (
                  dropdownDoctors.map(doctor => (
                    <div
                      key={doctor.id}
                      onMouseDown={() => handleSelectFromDropdown(doctor)}
                      style={{
                        padding: '0.625rem 1rem', cursor: 'pointer', fontSize: '0.875rem',
                        borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.75rem',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}
                    >
                      <div style={{
                        width: '2rem', height: '2rem', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        color: 'white', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                      }}>
                        {doctor.name.split(' ').slice(-1)[0]?.[0] || '?'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{doctor.title ? `${doctor.title} ` : ''}{doctor.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          ID: {doctor.id}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
                    Không tìm thấy bác sĩ nào phù hợp.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Specialty filter */}
          <div style={{ minWidth: 220 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>
              Chuyên khoa
            </label>
            <select
              className="form-input"
              style={{ width: '100%', fontSize: '0.875rem', borderRadius: 10 }}
              value={filterSpecialty}
              onChange={e => {
                setFilterSpecialty(e.target.value);
                setSearchInput('');
                setSelectedClinic(null);
                setCurrentPage(1);
              }}
            >
              <option value="">Tất cả chuyên khoa</option>
              {specialties.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Partner filter */}
          <div style={{ minWidth: 240 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>
              Cơ sở y tế
            </label>
            <select
              className="form-input"
              style={{ width: '100%', fontSize: '0.875rem', borderRadius: 10 }}
              value={filterPartner}
              onChange={e => {
                setFilterPartner(e.target.value);
                setSearchInput('');
                setSelectedClinic(null);
                setCurrentPage(1);
              }}
            >
              <option value="">Tất cả cơ sở y tế</option>
              {partners.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Active filter badges */}
          {(filterSpecialty || filterPartner) && (
            <button
              style={{
                border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444',
                borderRadius: '0.375rem', padding: '0.4rem 0.75rem', fontSize: '0.8125rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap',
              }}
              onClick={() => { setFilterSpecialty(''); setFilterPartner(''); setSelectedClinic(null); setCurrentPage(1); }}
            >
              <X size={13} /> Xóa bộ lọc
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}
            onClick={handleRefreshData}
          >
            <RefreshCw size={16} /> Làm mới
          </button>

          <button
            className="btn btn-primary"
            style={{ fontSize: '0.875rem', whiteSpace: 'nowrap', marginLeft: 'auto' }}
            onClick={() => navigate('/appointment-schedule/blocks/add')}
          >
            <Plus size={16} /> Thêm lịch đầy đủ
          </button>
        </div>

        {/* Filter result count */}
        <div style={{
          padding: '0.5rem 1.5rem', background: '#eff6ff', borderBottom: '1px solid #bfdbfe', fontSize: '0.8125rem', color: '#2563eb',
        }}>
          {selectedClinic
            ? `Đang xem lịch: ${selectedClinic.title ? `${selectedClinic.title} ` : ''}${selectedClinic.name}`
            : `Danh sách bác sĩ (Trang ${currentPage}/${totalPages})`
          }
        </div>

        {/* ── Body: split layout ── */}
        <div className="schedule-v2-body">
          {/* LEFT: Grid */}
          <div className="schedule-v2-left">
            {loadingBlocks ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                <Loader size={30} className="spin" style={{ margin: '0 auto 1rem', display: 'block' }} />
                Đang tải dữ liệu...
              </div>
            ) : clinicsOnPage.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                <Search size={36} strokeWidth={1.5} style={{ margin: '0 auto 1rem', display: 'block' }} />
                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Không tìm thấy bác sĩ</div>
                <div style={{ fontSize: '0.875rem' }}>Thử thay đổi từ khóa hoặc bộ lọc.</div>
              </div>
            ) : (
              <>
                <ScheduleWeekGrid
                  blocks={blocks}
                  clinics={clinicsOnPage}
                  selectedClinicId={selectedClinic?.id}
                  onAddBlock={handleAddBlock}
                  onEditBlock={handleEditBlock}
                  onSelectDoctor={handleSelectDoctor}
                  onToggleBlockStatus={handleToggleBlockStatus}
                  onToggleDayStatus={handleToggleDayStatus}
                  onToggleAllDoctorsDayStatus={
                    hasPermission('toggle_all_doctors_schedule')
                      ? handleToggleAllDoctorsDayStatus 
                      : undefined
                  }
                />
                
                {/* Pagination */}
                {!selectedClinic && totalPages > 1 && (
                  <div style={{ marginTop: '1rem' }}>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* RIGHT: Doctor Panel */}
          <div className="schedule-v2-right">
            {selectedClinic ? (
              <DoctorPanel
                doctor={selectedClinic}
                partners={partners}
                onRefresh={loadGridData}
              />
            ) : (
              <div className="schedule-v2-empty-panel">
                <CalendarClock size={40} strokeWidth={1.5} />
                <div>
                  <div style={{ fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>
                    Chọn bác sĩ để quản lý
                  </div>
                  <div style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                    • Gõ tên vào ô tìm kiếm và chọn bác sĩ từ gợi ý<br />
                    • Hoặc click vào tên bác sĩ ở lưới bên trái<br />
                    • Lọc theo chuyên khoa / cơ sở y tế để thu hẹp danh sách
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </>
        )}
      </div>
    </AdminLayout>
  );
}
