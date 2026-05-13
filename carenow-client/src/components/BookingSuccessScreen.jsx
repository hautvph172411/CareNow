import { Link } from "react-router-dom";
import { Calendar, CheckCircle, Phone, User } from "lucide-react";

export default function BookingSuccessScreen({ bookingCode, appointment, onViewAppointments }) {
  return (
    <div className="py-12 bg-gray-50 min-h-screen" role="status" aria-live="polite">
      <div className="container mx-auto px-4 max-w-lg">
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
          <div className="size-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="size-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Bạn đã đặt lịch thành công!</h2>
          <p className="text-gray-500 mb-6">
            Chúng tôi đã nhận yêu cầu khám. Phòng khám sẽ liên hệ xác nhận sớm nhất.
          </p>

          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-500 mb-1">Mã lịch hẹn</p>
            <p className="text-2xl font-bold tracking-widest" style={{ color: "#3498db" }}>
              {bookingCode || "Đang cập nhật"}
            </p>
            <p className="text-xs text-gray-400 mt-1">Lưu mã này để tra cứu hoặc liên hệ hỗ trợ</p>
          </div>

          <div className="text-left space-y-3 mb-8 text-sm text-gray-600">
            {appointment?.appt_date && (
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-blue-400 shrink-0" />
                <span>
                  {new Date(appointment.appt_date).toLocaleDateString("vi-VN", {
                    weekday: "long", year: "numeric", month: "long", day: "numeric",
                  })}
                  {appointment.appt_time && ` - ${String(appointment.appt_time).slice(0, 5)}`}
                </span>
              </div>
            )}
            {appointment?.patient_name && (
              <div className="flex items-center gap-2">
                <User className="size-4 text-blue-400 shrink-0" />
                <span>{appointment.patient_name}</span>
              </div>
            )}
            {appointment?.patient_phone && (
              <div className="flex items-center gap-2">
                <Phone className="size-4 text-blue-400 shrink-0" />
                <span>{appointment.patient_phone}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={onViewAppointments}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Xem lịch của tôi
            </button>
            <Link
              to="/"
              className="w-full py-3 rounded-xl font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors text-center"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
