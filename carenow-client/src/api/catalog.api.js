import axios from "./axios";

/** Public catalog — thứ tự do BE sort (rank DESC, created_* ASC). */
export async function getServices(params = {}) {
  const { data } = await axios.get("/services", { params });
  return data;
}

export async function getSpecialties(params = {}) {
  const { data } = await axios.get("/specialties", { params });
  return data;
}

export async function getClinics(params = {}) {
  const { data } = await axios.get("/clinic", { params });
  return data;
}

export async function getClinicPlaces(params = {}) {
  const { data } = await axios.get("/clinic_place", { params });
  return data;
}

export async function getSpecialtyById(id) {
  const { data } = await axios.get(`/specialties/${id}`);
  return data?.data ?? null;
}

export async function getClinicById(id) {
  const { data } = await axios.get(`/clinic/${id}`);
  return data?.data ?? null;
}

export async function getClinicPlaceById(id) {
  const { data } = await axios.get(`/clinic_place/${id}`);
  return data?.data ?? null;
}

/* ── Schedule blocks ───────────────────────────────────────────────────── */
export async function getScheduleBlocks(params = {}) {
  const { data } = await axios.get("/appointment-schedule/blocks", { params });
  return data?.data ?? [];
}

/* ── Location ──────────────────────────────────────────────────────────── */
export async function getProvinces() {
  const { data } = await axios.get("/location/provinces");
  return data?.data ?? [];
}

export async function getWards(provinceId) {
  const { data } = await axios.get("/location/wards", { params: { province_id: provinceId } });
  return data?.data ?? [];
}

/* ── Patient profile (cần client_token) ────────────────────────────────── */
export async function getMyPatientProfile() {
  const { data } = await axios.get("/patient/me");
  return data?.data ?? null;
}
