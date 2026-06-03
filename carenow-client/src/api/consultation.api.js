import axios from './axios';

/**
 * Gửi yêu cầu tư vấn thêm
 * @param {object} data
 * @param {string} data.patient_name
 * @param {string} data.patient_phone
 * @param {string} [data.patient_email]
 * @param {string} data.symptoms
 */
export async function submitConsultation(data) {
  const { data: res } = await axios.post('/consultations', data);
  return res;
}
