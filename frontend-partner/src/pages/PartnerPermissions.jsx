import { useState, useEffect } from 'react';
import { Save, Loader, Shield, User } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { getUsers } from '../api/user.api';
import { assignToUser, getUserAssignments, syncFeatures } from '../api/auth_item.api';
import { useAuth } from '../hooks/useAuth';
import '../styles/management.css';

// Define the available permissions for partner staff
const PERMISSIONS = [
  { id: 'partner.appointments.view', label: 'Lịch hẹn (Xem)' },
  { id: 'partner.schedule.view', label: 'Lịch làm việc (Xem)' },
  { id: 'partner.schedule.manage', label: 'Lịch làm việc (Tạo/Sửa/Xóa)' },
  { id: 'partner.clinic_place.view', label: 'Nơi khám (Xem)' },
  { id: 'partner.clinic_place.manage', label: 'Nơi khám (Sửa)' },
  { id: 'partner.doctor.view', label: 'Bác sĩ (Xem)' },
  { id: 'partner.doctor.manage', label: 'Bác sĩ (Tạo/Sửa/Xóa)' },
];

export default function PartnerPermissions() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [userPermissions, setUserPermissions] = useState({}); // { userId: ['perm1', 'perm2'] }
  const [originalPermissions, setOriginalPermissions] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Sync permissions first to ensure they exist in DB
        await syncFeatures(PERMISSIONS.map(p => ({ name: p.id, description: p.label })));
        
        // Fetch all staff users for this partner
        const usersRes = await getUsers({ limit: 100 });
        if (cancelled) return;
        
        // Filter only staff (not manager) if we want to protect manager permissions
        // Or show all. Let's show all but disable manager
        const fetchedUsers = usersRes.data || [];
        setUsers(fetchedUsers);

        // Fetch assignments for each user
        const permsMap = {};
        await Promise.all(fetchedUsers.map(async (u) => {
          try {
            const assignRes = await getUserAssignments(u.id);
            if (assignRes.success) {
              permsMap[u.id] = assignRes.data.map(a => typeof a === "string" ? a : a.item_name);
            }
          } catch (e) {
            permsMap[u.id] = [];
          }
        }));
        
        if (!cancelled) {
          setUserPermissions(permsMap);
          setOriginalPermissions(JSON.parse(JSON.stringify(permsMap)));
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleToggle = (userId, permId) => {
    setUserPermissions(prev => {
      const current = prev[userId] || [];
      const updated = current.includes(permId)
        ? current.filter(p => p !== permId)
        : [...current, permId];
      return { ...prev, [userId]: updated };
    });
  };

  const handleToggleAll = (userId, isSelectAll) => {
    setUserPermissions(prev => ({
      ...prev,
      [userId]: isSelectAll ? PERMISSIONS.map(p => p.id) : []
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Find which users have changed
      const changedUsers = [];
      for (const u of users) {
        // Skip managers as they should implicitly have all rights or we don't change them
        if (u.partner_role === 'manager') continue;

        const original = originalPermissions[u.id] || [];
        const current = userPermissions[u.id] || [];
        
        // Simple comparison
        const added = current.filter(x => !original.includes(x));
        const removed = original.filter(x => !current.includes(x));
        
        if (added.length > 0 || removed.length > 0) {
          changedUsers.push({ userId: u.id, items: current });
        }
      }

      if (changedUsers.length === 0) {
        alert("Không có thay đổi nào để lưu!");
        setIsSaving(false);
        return;
      }

      // Update backend
      await Promise.all(changedUsers.map(ch => assignToUser(ch.userId, ch.items)));
      
      setOriginalPermissions(JSON.parse(JSON.stringify(userPermissions)));
      alert(`Đã cập nhật phân quyền cho ${changedUsers.length} nhân viên thành công!`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Lưu thất bại!');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = JSON.stringify(userPermissions) !== JSON.stringify(originalPermissions);

  return (
    <AdminLayout pageTitle="Phân quyền">
      <div className="management-page">
        <div className="management-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.25rem' }}>Phân quyền nhân viên</h1>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Quản lý quyền truy cập tính năng cho nhân viên phòng khám</p>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={handleSave} 
            disabled={!hasChanges || isSaving}
            style={{ minWidth: 140 }}
          >
            {isSaving ? (
              <><Loader size={16} className="spin" /> Đang lưu...</>
            ) : (
              <><Save size={16} /> Lưu thay đổi</>
            )}
          </button>
        </div>

        <div className="management-section" style={{ padding: 0, overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>Đang tải danh sách nhân viên...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="specialties-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: '25%', borderRight: '1px solid #f1f5f9', background: '#f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={16} color="#64748b" /> Nhân viên
                      </div>
                    </th>
                    {PERMISSIONS.map(p => (
                      <th key={p.id} style={{ textAlign: 'center', padding: '1rem 0.5rem', minWidth: 100 }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', lineHeight: 1.4 }}>
                          {p.label.split(' (').map((part, i) => (
                            <div key={i}>{i === 1 ? `(${part}` : part}</div>
                          ))}
                        </div>
                      </th>
                    ))}
                    <th style={{ width: '10%', textAlign: 'center', background: '#f8fafc' }}>Tất cả</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const isManager = u.partner_role === 'manager';
                    const perms = userPermissions[u.id] || [];
                    const allSelected = PERMISSIONS.every(p => perms.includes(p.id));
                    
                    return (
                      <tr key={u.id} className="specialty-row" style={{ background: isManager ? '#f8fafc' : 'white' }}>
                        <td style={{ borderRight: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%',
                              background: isManager ? '#fcd34d' : '#e2e8f0',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: isManager ? '#92400e' : '#475569', fontWeight: 700, fontSize: 12,
                            }}>
                              {(u.display_name || u.username)[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: '#1e293b' }}>{u.display_name || u.username}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                                {isManager ? <Shield size={12} color="#f59e0b" /> : null}
                                {isManager ? 'Quản lý' : 'Nhân viên'}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        {PERMISSIONS.map(p => (
                          <td key={p.id} style={{ textAlign: 'center' }}>
                            <label className="checkbox-container" style={{ display: 'inline-flex', margin: 0 }}>
                              <input 
                                type="checkbox" 
                                checked={isManager ? true : perms.includes(p.id)}
                                disabled={isManager}
                                onChange={() => handleToggle(u.id, p.id)}
                                style={{ width: 18, height: 18, cursor: isManager ? 'not-allowed' : 'pointer' }}
                              />
                            </label>
                          </td>
                        ))}
                        
                        <td style={{ textAlign: 'center', background: '#f8fafc' }}>
                          <label className="checkbox-container" style={{ display: 'inline-flex', margin: 0 }}>
                            <input 
                              type="checkbox" 
                              checked={isManager ? true : allSelected}
                              disabled={isManager}
                              onChange={(e) => handleToggleAll(u.id, e.target.checked)}
                              style={{ width: 18, height: 18, cursor: isManager ? 'not-allowed' : 'pointer' }}
                            />
                          </label>
                        </td>
                      </tr>
                    );
                  })}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={PERMISSIONS.length + 2} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                        Chưa có nhân viên nào trong danh sách.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
