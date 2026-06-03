const pool = require('../../config/database');

exports.getStats = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().slice(0, 10);

    const partnerId = req.user?.partner_id;
    let wherePartner = '';
    const params = [todayStr];
    
    if (partnerId) {
      wherePartner = ` AND cp.partner_id = $2 `;
      params.push(partnerId);
    }

    const [todayR, pendingR, recentR] = await Promise.all([
      pool.query(`
        SELECT COUNT(a.id) 
        FROM tbl_appointment a
        JOIN tbl_clinic_place cp ON cp.id = a.clinic_place_id
        WHERE a.appt_date = $1 ${wherePartner}
      `, params),
      
      pool.query(`
        SELECT COUNT(a.id) 
        FROM tbl_appointment a
        JOIN tbl_clinic_place cp ON cp.id = a.clinic_place_id
        WHERE a.status = 1 ${partnerId ? 'AND cp.partner_id = $1' : ''}
      `, partnerId ? [partnerId] : []),
      
      pool.query(`
        SELECT
          a.id, a.booking_code, a.appt_date, a.appt_time, a.status,
          a.patient_name, a.patient_phone,
          c.name AS clinic_name,
          cp.name AS place_name
        FROM tbl_appointment a
        LEFT JOIN tbl_clinic c ON c.id = a.clinic_id
        LEFT JOIN tbl_clinic_place cp ON cp.id = a.clinic_place_id
        WHERE 1=1 ${partnerId ? 'AND cp.partner_id = $1' : ''}
        ORDER BY a.created_at DESC NULLS LAST, a.id DESC
        LIMIT 5
      `, partnerId ? [partnerId] : []),
    ]);

    return res.json({
      success: true,
      data: {
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
