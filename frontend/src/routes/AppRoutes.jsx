import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import ClinicList from "../pages/ClinicList";
import AddClinic from "../pages/AddClinic";
import EditClinic from "../pages/EditClinic";
import ClinicPlaceList from "../pages/ClinicPlaceList";
import AddClinicPlace from "../pages/AddClinicPlace";
import EditClinicPlace from "../pages/EditClinicPlace";
import Specialties from "../pages/Specialties";
import AddSpecialty from "../pages/AddSpecialty";
import EditSpecialty from "../pages/EditSpecialty";
import PartnerList from "../pages/PartnerList";
import AddPartner from "../pages/AddPartner";
import EditPartner from "../pages/EditPartner";
import AdminUserList from "../pages/AdminUserList";
import PartnerUserList from "../pages/PartnerUserList";
import AddAdminUser from "../pages/AddAdminUser";
import AddPartnerUser from "../pages/AddPartnerUser";
import EditUser from "../pages/EditUser";
import RolesManager from "../pages/RolesManager";
import PermissionsAssignment from "../pages/PermissionsAssignment";
import Forbidden from "../pages/Forbidden";
import Welcome from "../pages/Welcome";
import PermissionRoute from "../components/PermissionRoute";
import "../styles/forbidden.css";

/**
 * Mỗi route cần quyền sẽ được bọc bằng <PermissionRoute permission="..." />.
 * Nếu user không có quyền -> tự động redirect /403.
 * Xem danh sách permission trong src/config/features.js
 */
export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Login />} />
      <Route path="/403" element={<Forbidden />} />

      {/* Welcome - landing page cho mọi user đã đăng nhập, không cần permission cụ thể */}
      <Route path="/welcome" element={<Welcome />} />

      {/* Dashboard */}
      <Route path="/dashboard" element={
        <PermissionRoute permission="view_dashboard"><Dashboard /></PermissionRoute>
      } />

      {/* Bác sĩ */}
      <Route path="/clinic/admin" element={
        <PermissionRoute permission="manage_clinic"><ClinicList /></PermissionRoute>
      } />
      <Route path="/clinic/admin/add" element={
        <PermissionRoute permission="manage_clinic"><AddClinic /></PermissionRoute>
      } />
      <Route path="/clinic/admin/edit/:id" element={
        <PermissionRoute permission="manage_clinic"><EditClinic /></PermissionRoute>
      } />

      {/* Phòng khám */}
      <Route path="/clinic-place/admin" element={
        <PermissionRoute permission="manage_clinic_place"><ClinicPlaceList /></PermissionRoute>
      } />
      <Route path="/clinic-place/admin/add" element={
        <PermissionRoute permission="manage_clinic_place"><AddClinicPlace /></PermissionRoute>
      } />
      <Route path="/clinic-place/admin/edit/:id" element={
        <PermissionRoute permission="manage_clinic_place"><EditClinicPlace /></PermissionRoute>
      } />

      {/* Đối tác */}
      <Route path="/partner/admin" element={
        <PermissionRoute permission="manage_partner"><PartnerList /></PermissionRoute>
      } />
      <Route path="/partner/admin/add" element={
        <PermissionRoute permission="manage_partner"><AddPartner /></PermissionRoute>
      } />
      <Route path="/partner/admin/edit/:id" element={
        <PermissionRoute permission="manage_partner"><EditPartner /></PermissionRoute>
      } />

      {/* Phân quyền */}
      <Route path="/auth/roles" element={
        <PermissionRoute permission="manage_role"><RolesManager /></PermissionRoute>
      } />
      <Route path="/auth/permissions" element={
        <PermissionRoute permission="manage_permission"><PermissionsAssignment /></PermissionRoute>
      } />

      {/* Tài khoản Quản trị */}
      <Route path="/users/admin" element={
        <PermissionRoute permission="manage_admin_user"><AdminUserList /></PermissionRoute>
      } />
      <Route path="/users/admin/add" element={
        <PermissionRoute permission="manage_admin_user"><AddAdminUser /></PermissionRoute>
      } />
      <Route path="/users/admin/edit/:id" element={
        <PermissionRoute permission="manage_admin_user"><EditUser /></PermissionRoute>
      } />

      {/* Tài khoản Đối tác */}
      <Route path="/users/partner" element={
        <PermissionRoute permission="manage_partner_user"><PartnerUserList /></PermissionRoute>
      } />
      <Route path="/users/partner/add" element={
        <PermissionRoute permission="manage_partner_user"><AddPartnerUser /></PermissionRoute>
      } />
      <Route path="/users/partner/edit/:id" element={
        <PermissionRoute permission="manage_partner_user"><EditUser /></PermissionRoute>
      } />

      {/* Chuyên khoa */}
      <Route path="/specialties/admin" element={
        <PermissionRoute permission="manage_specialty"><Specialties /></PermissionRoute>
      } />
      <Route path="/specialties/admin/add" element={
        <PermissionRoute permission="manage_specialty"><AddSpecialty /></PermissionRoute>
      } />
      <Route path="/specialties/admin/edit/:id" element={
        <PermissionRoute permission="manage_specialty"><EditSpecialty /></PermissionRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
