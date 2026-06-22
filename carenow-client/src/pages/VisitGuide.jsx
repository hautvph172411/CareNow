import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { getProvinces, getWards } from '../api/catalog.api';

function parseBookingMeta(noteText = "", patientAddress = "") {
  const text = String(noteText || "");
  const provinceMatch = text.match(/Tỉnh\/Thành ID:\s*(\d+)/i);
  const wardMatch = text.match(/Xã\/Phường ID:\s*(\d+)/i);
  const provinceId = provinceMatch ? String(provinceMatch[1]) : "";
  const wardId = wardMatch ? String(wardMatch[1]) : "";

  const lines = text.split("\n").map((x) => x.trim()).filter(Boolean);
  let reason = lines.find(
    (line) =>
      !/^Người đi cùng:/i.test(line) &&
      !/^Tỉnh\/Thành ID:/i.test(line) &&
      !/^Xã\/Phường ID:/i.test(line)
  ) || "";

  if (!reason && text) {
    reason = text
      .replace(/Tỉnh\/Thành ID:\s*\d+/gi, "")
      .replace(/Xã\/Phường ID:\s*\d+/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  const detailAddress = String(patientAddress || "").trim();
  if (detailAddress && reason.endsWith(detailAddress)) {
    reason = reason.slice(0, reason.length - detailAddress.length).trim();
  }

  return { reason, provinceId, wardId, detailAddress };
}

const VisitGuide = () => {
  const { bookingCode } = useParams();
  const [appt, setAppt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [detailProvinceName, setDetailProvinceName] = useState("");
  const [detailWardName, setDetailWardName] = useState("");

  useEffect(() => {
    const fetchGuide = async () => {
      try {
        const res = await api.get(`/appointments/visit-guide/${bookingCode}`);
        setAppt(res.data.data);
      } catch (err) {
        setError('Không tìm thấy thông tin lịch hẹn hoặc có lỗi xảy ra.');
      } finally {
        setLoading(false);
      }
    };
    fetchGuide();
  }, [bookingCode]);

  useEffect(() => {
    let cancelled = false;
    const loadLocationNames = async () => {
      setDetailProvinceName("");
      setDetailWardName("");
      const { provinceId, wardId } = parseBookingMeta(appt?.patient_notes, appt?.patient_address);
      if (!provinceId) return;
      try {
        const provinces = await getProvinces();
        if (cancelled) return;
        const province = (provinces || []).find((p) => String(p.id) === String(provinceId));
        setDetailProvinceName(province?.name || "");
        if (!wardId) return;
        const wards = await getWards(provinceId);
        if (cancelled) return;
        const ward = (wards || []).find((w) => String(w.id) === String(wardId));
        setDetailWardName(ward?.name || "");
      } catch {
        // ignore
      }
    };
    if (appt) loadLocationNames();
    return () => { cancelled = true; };
  }, [appt]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !appt) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Lỗi</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <Link to="/" className="text-blue-600 hover:underline">Về trang chủ</Link>
      </div>
    );
  }

  const doctorName = appt.doctor_name || 'Đang cập nhật';
  const dateStr = new Date(appt.appt_date).toLocaleDateString('vi-VN');
  const timeStr = appt.appt_time ? String(appt.appt_time).slice(0, 5) : '';

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8 text-white text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Hướng Dẫn Đi Khám</h1>
          <p className="opacity-90">Mã đặt lịch: <span className="font-mono bg-white/20 px-2 py-1 rounded ml-1">{bookingCode}</span></p>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          {/* Thông tin bệnh nhân */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center border-b pb-2">
              <span className="bg-blue-100 text-blue-600 p-2 rounded-lg mr-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              Thông tin đăng ký
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 bg-gray-50 p-4 rounded-xl">
              <div><span className="text-gray-500 block text-sm">Họ và tên</span><strong className="text-base">{appt.patient_name}</strong></div>
              <div><span className="text-gray-500 block text-sm">Số điện thoại</span><strong className="text-base">{appt.patient_phone}</strong></div>
              <div><span className="text-gray-500 block text-sm">Ngày giờ khám</span><strong className="text-base text-blue-600">{dateStr} {timeStr && `- ${timeStr}`}</strong></div>
              <div><span className="text-gray-500 block text-sm">Lý do khám</span><strong className="text-base">{parseBookingMeta(appt?.patient_notes, appt?.patient_address).reason || 'Không có'}</strong></div>
              <div className="md:col-span-2">
                <span className="text-gray-500 block text-sm">Địa chỉ cá nhân</span>
                <strong className="text-base">
                  {[
                    parseBookingMeta(appt?.patient_notes, appt?.patient_address).detailAddress,
                    detailWardName,
                    detailProvinceName,
                  ].filter(Boolean).join(", ") || "-"}
                </strong>
              </div>
              <div className="md:col-span-2"><span className="text-gray-500 block text-sm">Cơ sở y tế</span><strong className="text-base">{appt.place_name || '-'}</strong></div>
            </div>
          </section>

          {/* Hướng dẫn bệnh nhân */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center border-b pb-2">
              <span className="bg-green-100 text-green-600 p-2 rounded-lg mr-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </span>
              Hướng dẫn đi khám
            </h2>
            
            {/* Inject dynamic doctor info banner */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg flex items-start shadow-sm">
              <div className="flex-shrink-0 mr-3 mt-1">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-blue-800">Bác sĩ phụ trách khám</h3>
                <p className="text-blue-700 font-medium text-lg mt-1">{doctorName}</p>
                <p className="text-sm text-blue-600 mt-1">Vui lòng báo mã đặt lịch ({bookingCode}) tại quầy tiếp đón.</p>
              </div>
            </div>

            {appt.place_patient_guide ? (
              <div 
                className="prose prose-blue max-w-none text-gray-700 bg-white p-5 rounded-xl border border-gray-100 shadow-sm"
                dangerouslySetInnerHTML={{ __html: appt.place_patient_guide }} 
              />
            ) : (
              <p className="text-gray-500 italic">Cơ sở y tế chưa cập nhật hướng dẫn chi tiết.</p>
            )}
          </section>

          {/* Hướng dẫn đường đi */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center border-b pb-2">
              <span className="bg-orange-100 text-orange-600 p-2 rounded-lg mr-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              Hướng dẫn di chuyển
            </h2>
            <div className="bg-gray-50 p-4 rounded-xl mb-4">
              <span className="text-gray-500 block text-sm mb-1">Địa chỉ</span>
              <strong className="text-base text-gray-800">{appt.place_address || '-'}</strong>
            </div>
            
            {appt.place_address_guide ? (
              <div 
                className="prose prose-orange max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: appt.place_address_guide }} 
              />
            ) : (
              <p className="text-gray-500 italic">Chưa có hướng dẫn đường đi chi tiết.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default VisitGuide;
