import axios from './axios';

export async function getPartnerContacts(params = {}) {
  const { data } = await axios.get('/partner-contacts', { params });
  return data;
}

export async function updatePartnerContactStatus(id, status) {
  const { data } = await axios.patch(`/partner-contacts/${id}/status`, { status });
  return data;
}

export async function deletePartnerContact(id) {
  const { data } = await axios.delete(`/partner-contacts/${id}`);
  return data;
}
