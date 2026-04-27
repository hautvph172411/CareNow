/**
 * Feature Catalog - nguồn duy nhất định nghĩa toàn bộ tính năng admin.
 *
 * Mỗi feature ứng với 1 permission trong tbl_auth_item (type=2).
 * Dùng cho:
 *   - Sidebar: lọc menu theo quyền
 *   - Route guard: chặn truy cập URL
 *   - Trang PermissionsAssignment: đồng bộ lên DB + render checkbox
 *
 * Khi thêm tính năng mới, chỉ cần bổ sung ở đây rồi mở trang
 * "Phân quyền" -> hệ thống tự upsert permission vào DB.
 */

export const FEATURE_GROUPS = [
  { key: 'dashboard', label: 'Tổng quan' },
  { key: 'catalog',   label: 'Danh mục hệ thống' },
  { key: 'users',     label: 'Quản lý người dùng' },
  { key: 'auth',      label: 'Phân quyền' },
];

export const FEATURES = [
  // ===== Tổng quan =====
  {
    name: 'view_dashboard',
    label: 'Bảng điều khiển',
    description: 'Xem bảng điều khiển',
    group: 'dashboard',
    urls: ['/dashboard'],
  },

  // ===== Danh mục =====
  {
    name: 'manage_specialty',
    label: 'Chuyên khoa',
    description: 'Quản lý chuyên khoa (xem, thêm, sửa, xóa)',
    group: 'catalog',
    urls: ['/specialties/admin', '/specialties/admin/add', '/specialties/admin/edit/:id'],
  },
  {
    name: 'manage_clinic',
    label: 'Bác sĩ',
    description: 'Quản lý bác sĩ',
    group: 'catalog',
    urls: ['/clinic/admin', '/clinic/admin/add', '/clinic/admin/edit/:id'],
  },
  {
    name: 'manage_clinic_place',
    label: 'Cơ sở y tế',
    description: 'Quản lý phòng khám / cơ sở y tế',
    group: 'catalog',
    urls: ['/clinic-place/admin', '/clinic-place/admin/add', '/clinic-place/admin/edit/:id'],
  },
  {
    name: 'manage_partner',
    label: 'Đối tác',
    description: 'Quản lý đối tác',
    group: 'catalog',
    urls: ['/partner/admin', '/partner/admin/add', '/partner/admin/edit/:id'],
  },

  // ===== Người dùng =====
  {
    name: 'manage_admin_user',
    label: 'Tài khoản quản trị',
    description: 'Quản lý tài khoản quản trị',
    group: 'users',
    urls: ['/users/admin', '/users/admin/add', '/users/admin/edit/:id'],
  },
  {
    name: 'manage_partner_user',
    label: 'Tài khoản đối tác',
    description: 'Quản lý tài khoản đối tác',
    group: 'users',
    urls: ['/users/partner', '/users/partner/add', '/users/partner/edit/:id'],
  },

  // ===== Phân quyền =====
  {
    name: 'manage_role',
    label: 'Vai trò',
    description: 'Quản lý vai trò (RolesManager)',
    group: 'auth',
    urls: ['/auth/roles'],
  },
  {
    name: 'manage_permission',
    label: 'Phân quyền',
    description: 'Gán quyền cho vai trò (PermissionsAssignment)',
    group: 'auth',
    urls: ['/auth/permissions'],
  },
];

/**
 * So khớp URL hiện tại với URL pattern trong catalog.
 * Hỗ trợ :id / :param động.
 */
const matchPattern = (pattern, path) => {
  const p = pattern.split('/').filter(Boolean);
  const a = path.split('/').filter(Boolean);
  if (p.length !== a.length) return false;
  return p.every((seg, i) => seg.startsWith(':') || seg === a[i]);
};

/**
 * Tìm permission name ứng với 1 URL bất kỳ.
 * Trả về null nếu URL không thuộc feature nào (không cần phân quyền).
 */
export const getRequiredPermission = (pathname) => {
  for (const feature of FEATURES) {
    for (const url of feature.urls) {
      if (matchPattern(url, pathname)) return feature.name;
    }
  }
  return null;
};

/**
 * Payload dùng để đồng bộ lên backend.
 */
export const getFeaturesSyncPayload = () =>
  FEATURES.map(f => ({ name: f.name, description: f.description }));
