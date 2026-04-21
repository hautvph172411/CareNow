import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import ClinicList from "../pages/ClinicList";       // Doctor management
import AddDoctor from "../pages/AddDoctor";
import EditDoctor from "../pages/EditDoctor";
import ClinicPlaceList from "../pages/ClinicPlaceList";
import AddClinicPlace from "../pages/AddClinicPlace";
import UserPage from "../pages/User";
import AddUser from "../pages/AddUser";
import Specialties from "../pages/Specialties";
import AddSpecialty from "../pages/AddSpecialty";
import EditSpecialty from "../pages/EditSpecialty";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/" replace />;
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
        <PrivateRoute><AddDoctor /></PrivateRoute>
      } />

      <Route path="/clinic/admin/edit/:id" element={
        <PrivateRoute><EditDoctor /></PrivateRoute>
      } />

      {/* Phòng khám (Clinic Place API & UI) */}
      <Route path="/clinic-place/admin" element={
        <PrivateRoute><ClinicPlaceList /></PrivateRoute>
      } />

      <Route path="/clinic-place/admin/add" element={
        <PrivateRoute><AddClinicPlace /></PrivateRoute>
      } />

      {/* Người dùng */}
      <Route path="/users" element={
        <PrivateRoute><UserPage /></PrivateRoute>
      } />

      <Route path="/users/add" element={
        <PrivateRoute><AddUser /></PrivateRoute>
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
