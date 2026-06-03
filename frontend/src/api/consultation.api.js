import axios from './axios';

export async function getConsultations(params = {}) {
  const { data } = await axios.get('/consultations', { params });
  return data;
}

export async function getUnreadConsultationsCount() {
  const { data } = await axios.get('/consultations/unread-count');
  return data;
}

export async function updateConsultationStatus(id, status) {
  const { data } = await axios.patch(`/consultations/${id}/status`, { status });
  return data;
}

export async function deleteConsultation(id) {
  const { data } = await axios.delete(`/consultations/${id}`);
  return data;
}
