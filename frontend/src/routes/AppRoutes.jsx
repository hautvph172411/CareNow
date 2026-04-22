import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import ClinicList from "../pages/ClinicList";       // Doctor management
import AddClinic from "../pages/AddClinic";
import EditClinic from "../pages/EditClinic";
import ClinicPlaceList from "../pages/ClinicPlaceList";
import AddClinicPlace from "../pages/AddClinicPlace";
import Specialties from "../pages/Specialties";
import AddSpecialty from "../pages/AddSpecialty";
import EditSpecialty from "../pages/EditSpecialty";

import { useAuth } from "../hooks/useAuth";

import EditClinicPlace from "../pages/EditClinicPlace";
import PartnerList from "../pages/PartnerList";
import AddPartner from "../pages/AddPartner";
import EditPartner from "../pages/EditPartner";

// New User Management Pages
import AdminUserList from "../pages/AdminUserList";
import PartnerUserList from "../pages/PartnerUserList";
import AddAdminUser from "../pages/AddAdminUser";
import AddPartnerUser from "../pages/AddPartnerUser";
import EditUser from "../pages/EditUser";
import RolesManager from "../pages/RolesManager";
import PermissionsAssignment from "../pages/PermissionsAssignment";

function PrivateRoute({ children }) {
  // Temporary: Always allow access without login as per user request
  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route path="/dashboard" element={
        <PrivateRoute><Dashboard /></PrivateRoute>
      } />

      {/* Bác sĩ (Doctor API & UI) */}
      <Route path="/clinic/admin" element={
        <PrivateRoute><ClinicList /></PrivateRoute>
      } />

      <Route path="/clinic/admin/add" element={
        <PrivateRoute><AddClinic /></PrivateRoute>
      } />

      <Route path="/clinic/admin/edit/:id" element={
        <PrivateRoute><EditClinic /></PrivateRoute>
      } />

      {/* Phòng khám (Clinic Place API & UI) */}
      <Route path="/clinic-place/admin" element={
        <PrivateRoute><ClinicPlaceList /></PrivateRoute>
      } />

      <Route path="/clinic-place/admin/add" element={
        <PrivateRoute><AddClinicPlace /></PrivateRoute>
      } />

      <Route path="/clinic-place/admin/edit/:id" element={
        <PrivateRoute><EditClinicPlace /></PrivateRoute>
      } />

      {/* Đối tác */}
      <Route path="/partner/admin" element={
        <PrivateRoute><PartnerList /></PrivateRoute>
      } />
      <Route path="/partner/admin/add" element={
        <PrivateRoute><AddPartner /></PrivateRoute>
      } />
      <Route path="/partner/admin/edit/:id" element={
        <PrivateRoute><EditPartner /></PrivateRoute>
      } />

      {/* Quản lý Phân quyền */}
      <Route path="/auth/roles" element={
        <PrivateRoute><RolesManager /></PrivateRoute>
      } />
      <Route path="/auth/permissions" element={
        <PrivateRoute><PermissionsAssignment /></PrivateRoute>
      } />

      {/* Quản lý Tài khoản Quản trị */}
      <Route path="/users/admin" element={
        <PrivateRoute><AdminUserList /></PrivateRoute>
      } />
      <Route path="/users/admin/add" element={
        <PrivateRoute><AddAdminUser /></PrivateRoute>
      } />
      <Route path="/users/admin/edit/:id" element={
        <PrivateRoute><EditUser /></PrivateRoute>
      } />

      {/* Quản lý Tài khoản Đối tác */}
      <Route path="/users/partner" element={
        <PrivateRoute><PartnerUserList /></PrivateRoute>
      } />
      <Route path="/users/partner/add" element={
        <PrivateRoute><AddPartnerUser /></PrivateRoute>
      } />
      <Route path="/users/partner/edit/:id" element={
        <PrivateRoute><EditUser /></PrivateRoute>
      } />

      {/* Chuyên khoa */}
      <Route path="/specialisies/admin" element={
        <PrivateRoute><Specialties /></PrivateRoute>
      } />
      <Route path="/specialisies/admin/add" element={
        <PrivateRoute><AddSpecialty /></PrivateRoute>
      } />
      <Route path="/specialisies/admin/edit/:id" element={
        <PrivateRoute><EditSpecialty /></PrivateRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
