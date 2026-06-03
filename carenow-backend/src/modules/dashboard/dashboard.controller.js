const pool = require('../../config/database');

exports.getStats = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().slice(0, 10);

    const [clinicR, specialtyR, todayR, pendingR, recentR] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM tbl_clinic'),
      pool.query('SELECT COUNT(*) FROM tbl_clinic_specialist WHERE status = 1'),
      pool.query("SELECT COUNT(*) FROM tbl_appointment WHERE appt_date = $1", [todayStr]),
      pool.query("SELECT COUNT(*) FROM tbl_appointment WHERE status = 1"),
      pool.query(`
        SELECT
          a.id, a.booking_code, a.appt_date, a.appt_time, a.status,
          a.patient_name, a.patient_phone,
          c.name AS clinic_name,
          cp.name AS place_name
        FROM tbl_appointment a
        LEFT JOIN tbl_clinic c ON c.id = a.clinic_id
        LEFT JOIN tbl_clinic_place cp ON cp.id = a.clinic_place_id
        ORDER BY a.created_at DESC NULLS LAST, a.id DESC
        LIMIT 5
      `),
    ]);

    return res.json({
      success: true,
      data: {
        total_clinics: parseInt(clinicR.rows[0].count, 10),
        total_specialties: parseInt(specialtyR.rows[0].count, 10),
        appt_today: parseInt(todayR.rows[0].count, 10),
        appt_pending: parseInt(pendingR.rows[0].count, 10),
        recent_appointments: recentR.rows,
      },
    });
  } catch (err) {
    console.error('[dashboard]', err);
    return res.status(500).json({ success: false, message: 'Lỗi tải thống kê' });
  }
};
