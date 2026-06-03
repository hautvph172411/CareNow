import axios from './axios';

/**
 * Gửi yêu cầu liên hệ hợp tác
 * @param {object} data
 * @param {string} data.contact_name
 * @param {string} data.contact_phone
 * @param {string} [data.contact_email]
 * @param {string} data.clinic_name
 * @param {string} [data.clinic_address]
 * @param {string} [data.notes]
 */
export async function submitPartnerContact(data) {
  const { data: res } = await axios.post('/partner-contacts', data);
  return res;
}
