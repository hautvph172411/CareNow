import { useState, useEffect } from 'react';
import { getAuthItems } from '../api/auth_item.api';
import { Shield } from 'lucide-react';

export default function PermissionSelector({ selectedItems, onChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAuthItems();
        if (res.success) {
          // Chỉ lấy các Vai trò (type = 1)
          setItems(res.data.filter(i => i.type === 1));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleItem = (name) => {
    if (selectedItems.includes(name)) {
      onChange(selectedItems.filter(i => i !== name));
    } else {
      onChange([...selectedItems, name]);
    }
  };

  if (loading) return <div>Đang tải vai trò...</div>;

  return (
    <div className="permission-selector">
      <div style={{ marginBottom: '1rem' }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '1rem', color: '#64748b' }}>
          Chọn Vai trò cho tài khoản này:
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          {items.map(role => (
            <label 
              key={role.name} 
              className={`permission-item ${selectedItems.includes(role.name) ? 'active' : ''}`} 
              style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '4px', 
                padding: '12px 16px', 
                border: '2px solid', 
                borderRadius: '12px', 
                cursor: 'pointer', 
                transition: 'all 0.2s', 
                backgroundColor: selectedItems.includes(role.name) ? '#f0f7ff' : 'white', 
                borderColor: selectedItems.includes(role.name) ? '#3b82f6' : '#f1f5f9' 
              }}
            >
              <input 
                type="checkbox" 
                checked={selectedItems.includes(role.name)} 
                onChange={() => toggleItem(role.name)} 
                hidden 
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} color={selectedItems.includes(role.name) ? '#3b82f6' : '#94a3b8'} />
                <span style={{ fontSize: '15px', fontWeight: '700', color: selectedItems.includes(role.name) ? '#1e40af' : '#475569' }}>
                  {role.name}
                </span>
                {selectedItems.includes(role.name) && <div style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></div>}
              </div>
              <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                {role.description || 'Không có mô tả'}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
