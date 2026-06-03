import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import PartnerAppointments from '../pages/PartnerAppointments';
import PartnerSchedule from '../pages/PartnerSchedule';
import PartnerUserList from '../pages/PartnerUserList';
import AddPartnerUser from '../pages/AddPartnerUser';
import EditPartnerUser from '../pages/EditPartnerUser';
import AddPartnerScheduleBlock from '../pages/AddPartnerScheduleBlock';
import EditPartnerScheduleBlock from '../pages/EditPartnerScheduleBlock';
import Forbidden from "../pages/Forbidden";
import Welcome from "../pages/Welcome";
import Profile from "../pages/Profile";
import PermissionRoute from "../components/PermissionRoute";
import "../styles/forbidden.css";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Login />} />
      <Route path="/403" element={<Forbidden />} />

      {/* Protected - tất cả user đã đăng nhập */}
      <Route path="/welcome" element={
        <PermissionRoute><Welcome /></PermissionRoute>
      } />
      <Route path="/profile" element={
        <PermissionRoute><Profile /></PermissionRoute>
      } />
      <Route path="/appointments" element={
        <PermissionRoute><PartnerAppointments /></PermissionRoute>
      } />
      <Route path="/schedule" element={
        <PermissionRoute><PartnerSchedule /></PermissionRoute>
      } />
      <Route path="/schedule/add" element={
        <PermissionRoute managerOnly={true}><AddPartnerScheduleBlock /></PermissionRoute>
      } />
      <Route path="/schedule/edit/:id" element={
        <PermissionRoute managerOnly={true}><EditPartnerScheduleBlock /></PermissionRoute>
      } />

      {/* Manager only */}
      <Route path="/team" element={
        <PermissionRoute managerOnly={true}><PartnerUserList /></PermissionRoute>
      } />
      <Route path="/team/add" element={
        <PermissionRoute managerOnly={true}><AddPartnerUser /></PermissionRoute>
      } />
      <Route path="/team/edit/:id" element={
        <PermissionRoute managerOnly={true}><EditPartnerUser /></PermissionRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
