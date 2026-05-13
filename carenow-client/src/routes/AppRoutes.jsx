import { Routes, Route } from "react-router-dom";
import { Layout } from "../components/Layout";
import { Home } from "../pages/Home";
import { Services } from "../pages/Services";
import { Booking } from "../pages/Booking";
import { MyAppointments } from "../pages/MyAppointments";
import { HealthGuide } from "../pages/HealthGuide";
import { Profile } from "../pages/Profile";
import { NotFound } from "../pages/NotFound";
import Login from "../pages/Login";
import PrivateRoute from "../components/PrivateRoute";
import { SpecialtyDetail } from "../pages/SpecialtyDetail";
import { DoctorDetail } from "../pages/DoctorDetail";
import { PlaceDetail } from "../pages/PlaceDetail";
import { ServiceDetail } from "../pages/ServiceDetail";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Auth pages — không dùng Layout, có UI riêng */}
      <Route path="/login" element={<Login />} />

      {/* App pages — bọc trong Layout (Header + Footer) */}
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="dich-vu" element={<Services />} />
        <Route path="dich-vu/:serviceSlug" element={<ServiceDetail />} />
        <Route path="chuyen-khoa/:slugRef" element={<SpecialtyDetail />} />
        <Route path="bac-si/:slugRef" element={<DoctorDetail />} />
        <Route path="noi-kham/:slugRef" element={<PlaceDetail />} />
        <Route path="dat-lich" element={<Booking />} />
        <Route
          path="lich-cua-toi"
          element={
            <PrivateRoute>
              <MyAppointments />
            </PrivateRoute>
          }
        />
        <Route
          path="ho-so"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route path="cam-nang-y-te" element={<HealthGuide />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
