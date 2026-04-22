import { useState, useEffect } from 'react';
import { Shield, Zap, Save, CheckCircle, ChevronRight } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { getAuthItems, createAuthItem } from '../api/auth_item.api';
import axios from '../api/axios'; // Dùng axios trực tiếp cho logic parent-child phức tạp nếu cần

export default function PermissionsAssignment() {
  const [items, setItems] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [rolePermissions, setRolePermissions] = useState([]); // List of child names
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getAuthItems();
      if (res.success) {
        setItems(res.data);
        setRoles(res.data.filter(i => i.type === 1));
        setPermissions(res.data.filter(i => i.type === 2));
        
        if (res.data.filter(i => i.type === 1).length > 0) {
          handleSelectRole(res.data.filter(i => i.type === 1)[0].name);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRole = async (roleName) => {
    setSelectedRole(roleName);
    try {
      const res = await axios.get(`/auth/items/${roleName}/children`);
      if (res.data.success) {
        setRolePermissions(res.data.data.map(p => p.name));
      }
    } catch (err) {
      console.error(err);
      setRolePermissions([]);
    }
  };

  const togglePermission = (name) => {
    setRolePermissions(prev => 
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    );
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
       // Logic: Post list of children to parent
       await axios.post(`/auth/items/${selectedRole}/children`, { children: rolePermissions });
       alert('Lưu phân quyền thành công!');
    } catch (err) {
      alert('Có lỗi xảy ra khi lưu');
    } finally {
      setSaving(false);
    }
  };

  // Grouping permissions by prefix or explicit groups
  const groups = [
    { label: 'Chuyên khoa', prefix: 'specialty_' },
    { label: 'Bác sĩ', prefix: 'doctor_' },
    { label: 'Cơ sở y tế', prefix: 'clinic_place_' },
    { label: 'Người dùng', prefix: 'user_' },
    { label: 'Đối tác', prefix: 'partner_' },
    { label: 'Bảng điều khiển', prefix: 'dashboard_' },
  ];

  const getGroupPerms = (prefix) => permissions.filter(p => p.name.startsWith(prefix));

  return (
    <AdminLayout pageTitle="Quản lý Phân quyền">
      <div className="content-header">
        <div>
          <h1 className="content-title">Quản lý Phân quyền</h1>
          <p className="content-subtitle">Thiết lập các quyền hạn cụ thể cho từng vai trò</p>
        </div>
      </div>

      <div className="auth-assignment-container">
        {/* Left Column: Role Selection */}
        <div className="role-selection-card">
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1e293b' }}>Chọn Vai Trò</h3>
          <div className="role-selection-list">
            {roles.map(role => (
              <div 
                key={role.name} 
                className={`role-selection-item ${selectedRole === role.name ? 'active' : ''}`}
                onClick={() => handleSelectRole(role.name)}
              >
                {role.name}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Permission Grid */}
        <div className="permission-grid-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
              Phân quyền cho: <span style={{ color: '#3498db' }}>{selectedRole}</span>
            </h3>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              <Save size={18} /> {saving ? 'Đang lưu...' : 'Lưu Phân quyền'}
            </button>
          </div>

          <div className="permission-groups">
            {groups.map(group => {
              const perms = getGroupPerms(group.prefix);
              if (perms.length === 0) return null;
              
              return (
                <div key={group.label} className="permission-group-section">
                  <div className="permission-group-title">{group.label}</div>
                  <div className="permission-items-row">
                    {perms.map(p => (
                      <label key={p.name} className="checkbox-item">
                        <input 
                          type="checkbox" 
                          checked={rolePermissions.includes(p.name)}
                          onChange={() => togglePermission(p.name)}
                        />
                        <span>{p.description || p.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
            
            {/* Other permissions not in groups */}
            <div className="permission-group-section">
              <div className="permission-group-title">Khác</div>
              <div className="permission-items-row">
                {permissions.filter(p => !groups.some(g => p.name.startsWith(g.prefix))).map(p => (
                  <label key={p.name} className="checkbox-item">
                    <input 
                      type="checkbox" 
                      checked={rolePermissions.includes(p.name)}
                      onChange={() => togglePermission(p.name)}
                    />
                    <span>{p.description || p.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
