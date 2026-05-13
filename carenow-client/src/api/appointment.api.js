import axios from "./axios";

/**
 * Tạo lịch hẹn khám mới.
 * Guest (chưa đăng nhập) cũng được, patient_id sẽ = null.
 *
 * @param {object} data
 * @param {string}  data.patient_name     - Họ và tên bệnh nhân (bắt buộc)
 * @param {string}  data.patient_phone    - Số điện thoại (bắt buộc)
 * @param {string}  data.appt_date        - Ngày khám YYYY-MM-DD (bắt buộc)
 * @param {string}  data.appt_time        - Giờ khám HH:mm (bắt buộc)
 * @param {string}  [data.patient_email]
 * @param {string}  [data.patient_notes]
 * @param {number}  [data.clinic_id]
 * @param {number}  [data.clinic_place_id]
 * @param {number}  [data.specialist_id]
 * @param {number}  [data.service_id]
 * @param {number}  [data.session_type]   - 1=sáng 2=chiều 3=tối
 */
export async function createAppointment(data) {
  const { data: res } = await axios.post("/appointments", data);
  return res; // { message, data: appointment }
}

/**
 * Lấy danh sách lịch hẹn của bệnh nhân đang đăng nhập.
 * Yêu cầu `client_token` trong localStorage.
 *
 * @param {object} [params]
 * @param {number}  [params.page]
 * @param {number}  [params.limit]
 */
export async function getMyAppointments(params = {}) {
  const { data: res } = await axios.get("/appointments/my", { params });
  return res; // { message, data: appointment[] }
}

/**
 * Hủy một lịch hẹn (bệnh nhân — chỉ được hủy lịch của chính mình).
 *
 * @param {number|string} id
 */
export async function cancelAppointment(id) {
  const { data: res } = await axios.patch(`/appointments/${id}/cancel`);
  return res; // { message, data: appointment }
}

/**
 * Lấy chi tiết một lịch hẹn.
 *
 * @param {number|string} id
 */
export async function getAppointmentById(id) {
  const { data: res } = await axios.get(`/appointments/${id}`);
  return res; // { message, data: appointment }
}
