import { useState, useEffect, useMemo } from 'react';
import { Save, RefreshCw, CheckSquare, Square, ChevronRight } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import {
  getAuthItems,
  getItemChildren,
  setItemChildren,
  syncFeatures,
} from '../api/auth_item.api';
import { useAuth } from '../hooks/useAuth';
import { FEATURES, FEATURE_GROUPS, getFeaturesSyncPayload } from '../config/features';

export default function PermissionsAssignment() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshPermissions, user } = useAuth();

  const [roles, setRoles] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(searchParams.get('role') || null);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Gộp features theo group để render
  const grouped = useMemo(() => {
    return FEATURE_GROUPS.map(g => ({
      ...g,
      features: FEATURES.filter(f => f.group === g.key),
    }));
  }, []);

  /**
   * Đồng bộ feature catalog lên DB (upsert permission type=2),
   * rồi load lại danh sách items để render.
   */
  const syncAndLoad = async () => {
    setLoading(true);
    try {
      // 1. Đồng bộ features từ frontend catalog lên DB
      await syncFeatures(getFeaturesSyncPayload());

      // 2. Load danh sách items (role + permission)
      const res = await getAuthItems();
      if (res.success) {
        const rolesList = res.data.filter(i => i.type === 1);
        const permsList = res.data.filter(i => i.type === 2);
        setRoles(rolesList);
        setAvailablePermissions(permsList);

        // Auto chọn role nếu chưa có
        const queryRole = searchParams.get('role');
        const initialRole = queryRole || rolesList[0]?.name || null;
        if (initialRole && initialRole !== selectedRole) {
          setSelectedRole(initialRole);
        }
      }
    } catch (err) {
      console.error('Sync/load failed:', err);
      alert('Đồng bộ quyền thất bại. Kiểm tra lại kết nối backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load permissions đã được gán cho role
  useEffect(() => {
    if (!selectedRole) {
      setRolePermissions([]);
      return;
    }
    (async () => {
      try {
        const res = await getItemChildren(selectedRole);
        if (res.success) {
          setRolePermissions(res.data.map(p => p.name));
        }
      } catch (err) {
        console.error(err);
        setRolePermissions([]);
      }
    })();
  }, [selectedRole]);

  const handleSelectRole = (name) => {
    setSelectedRole(name);
    setSearchParams({ role: name });
  };

  const togglePermission = (name) => {
    setRolePermissions(prev =>
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    );
  };

  const toggleGroup = (groupKey) => {
    const groupFeatures = FEATURES.filter(f => f.group === groupKey);
    const groupPermNames = groupFeatures.map(f => f.name);
    const allSelected = groupPermNames.every(n => rolePermissions.includes(n));

    if (allSelected) {
      setRolePermissions(prev => prev.filter(p => !groupPermNames.includes(p)));
    } else {
      setRolePermissions(prev => Array.from(new Set([...prev, ...groupPermNames])));
    }
  };

  const toggleAll = () => {
    const allNames = FEATURES.map(f => f.name);
    const allSelected = allNames.every(n => rolePermissions.includes(n));
    setRolePermissions(allSelected ? [] : allNames);
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      await setItemChildren(selectedRole, rolePermissions);
      alert(`Đã lưu phân quyền cho vai trò "${selectedRole}"`);
      // Nếu user hiện tại đang được gán role này, refresh lại quyền
      refreshPermissions();
    } catch (err) {
      alert(err.response?.data?.message || 'Lưu phân quyền thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleResync = async () => {
    setSyncing(true);
    await syncAndLoad();
    setSyncing(false);
  };

  // Tìm metadata hiển thị (label) cho 1 permission name
  const getPermissionLabel = (name) => {
    const feature = FEATURES.find(f => f.name === name);
    if (feature) return feature.label;
    const perm = availablePermissions.find(p => p.name === name);
    return perm?.description || name;
  };

  return (
    <AdminLayout pageTitle="Quản lý Phân quyền">
      <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="content-title">Quản lý Phân quyền</h1>
          <p className="content-subtitle">
            Gán các tính năng (permission) cho từng vai trò. Danh sách tính năng được
            đồng bộ tự động từ hệ thống.
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={handleResync}
          disabled={syncing}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={16} className={syncing ? 'spin' : ''} />
          Đồng bộ lại
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          Đang đồng bộ danh sách tính năng...
        </div>
      ) : (
        <div className="auth-assignment-container">
          {/* Cột trái: danh sách role */}
          <div className="role-selection-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                Chọn Vai Trò
              </h3>
              <button
                className="btn-link"
                onClick={() => navigate('/auth/roles')}
                style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                + Quản lý vai trò
              </button>
            </div>
            <div className="role-selection-list">
              {roles.length === 0 && (
                <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                  Chưa có vai trò nào. Hãy tạo vai trò trước.
                </div>
              )}
              {roles.map(role => (
                <div
                  key={role.name}
                  className={`role-selection-item ${selectedRole === role.name ? 'active' : ''}`}
                  onClick={() => handleSelectRole(role.name)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '600' }}>{role.name}</div>
                      {role.description && (
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                          {role.description}
                        </div>
                      )}
                    </div>
                    <ChevronRight size={16} color="#94a3b8" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cột phải: danh sách permission */}
          <div className="permission-grid-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>
                  Phân quyền cho: <span style={{ color: '#3498db' }}>{selectedRole || '—'}</span>
                </h3>
                <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
                  Đã chọn <strong>{rolePermissions.length}</strong> / {FEATURES.length} tính năng
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-secondary"
                  onClick={toggleAll}
                  disabled={!selectedRole}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {FEATURES.every(f => rolePermissions.includes(f.name))
                    ? <><Square size={16} /> Bỏ chọn tất cả</>
                    : <><CheckSquare size={16} /> Chọn tất cả</>}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={saving || !selectedRole}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Save size={18} /> {saving ? 'Đang lưu...' : 'Lưu phân quyền'}
                </button>
              </div>
            </div>

            {!selectedRole ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                Vui lòng chọn một vai trò ở cột bên trái để bắt đầu phân quyền.
              </div>
            ) : (
              <div className="permission-groups">
                {grouped.map(group => {
                  if (group.features.length === 0) return null;
                  const allSelected = group.features.every(f => rolePermissions.includes(f.name));
                  const someSelected = group.features.some(f => rolePermissions.includes(f.name));

                  return (
                    <div key={group.key} className="permission-group-section">
                      <div
                        className="permission-group-title"
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                        onClick={() => toggleGroup(group.key)}
                      >
                        <span>{group.label}</span>
                        <span style={{ fontSize: '0.75rem', color: allSelected ? '#10b981' : someSelected ? '#f59e0b' : '#94a3b8', fontWeight: '600' }}>
                          {group.features.filter(f => rolePermissions.includes(f.name)).length}/{group.features.length}
                        </span>
                      </div>
                      <div className="permission-items-row">
                        {group.features.map(f => {
                          const checked = rolePermissions.includes(f.name);
                          return (
                            <label
                              key={f.name}
                              className="checkbox-item"
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '8px',
                                padding: '10px 12px',
                                border: '1.5px solid',
                                borderColor: checked ? '#3b82f6' : '#e2e8f0',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                backgroundColor: checked ? '#eff6ff' : '#ffffff',
                                transition: 'all 0.15s',
                                minWidth: '220px',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => togglePermission(f.name)}
                                style={{ marginTop: '3px' }}
                              />
                              <div>
                                <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#1e293b' }}>
                                  {f.label}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                                  {f.description}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
