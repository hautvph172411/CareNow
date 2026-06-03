import { useState, useEffect } from "react";
import { User, Phone, Mail, Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { submitConsultation } from "../api/consultation.api";
import { getMyPatientProfile } from "../api/catalog.api";

export function ConsultationForm() {
  const [formData, setFormData] = useState({
    patient_name: "",
    patient_phone: "",
    patient_email: "",
    symptoms: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const isLoggedIn = Boolean(localStorage.getItem("client_token"));

  useEffect(() => {
    if (isLoggedIn) {
      getMyPatientProfile()
        .then((p) => {
          if (p) {
            setFormData((prev) => ({
              ...prev,
              patient_name: p.full_name || "",
              patient_phone: p.phone || "",
              patient_email: p.email || p.google_email || "",
            }));
          }
        })
        .catch(() => {});
    }
  }, [isLoggedIn]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await submitConsultation(formData);
      setSuccess(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Đã có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-2xl mx-auto mt-8">
        <div className="size-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="size-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Đã gửi yêu cầu tư vấn!</h2>
        <p className="text-gray-500 mb-6">
          Chúng tôi đã nhận được thông tin của bạn. Đội ngũ y tế sẽ liên hệ lại trong thời gian sớm nhất để hỗ trợ bạn đặt lịch khám phù hợp.
        </p>
        <button
          onClick={() => {
            setSuccess(false);
            setFormData({ patient_name: "", patient_phone: "", patient_email: "", symptoms: "" });
          }}
          className="px-6 py-2.5 bg-blue-50 text-blue-600 font-semibold rounded-xl hover:bg-blue-100 transition-colors"
        >
          Gửi yêu cầu khác
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-8 max-w-3xl mx-auto mt-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Bạn chưa biết khám ở đâu?</h2>
        <p className="text-gray-600">
          Vui lòng điền thông tin và mô tả tình trạng bệnh. Chúng tôi sẽ tư vấn bác sĩ và cơ sở y tế phù hợp nhất cho bạn.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-start gap-2">
            <AlertCircle className="size-5 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <User className="size-4 inline mr-1 text-blue-500" /> Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="patient_name"
              required
              value={formData.patient_name}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Phone className="size-4 inline mr-1 text-blue-500" /> Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="patient_phone"
              required
              value={formData.patient_phone}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="0912345678"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Mail className="size-4 inline mr-1 text-blue-500" /> Email (Không bắt buộc)
          </label>
          <input
            type="email"
            name="patient_email"
            value={formData.patient_email}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="example@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Tình trạng bệnh hiện tại <span className="text-red-500">*</span>
          </label>
          <textarea
            name="symptoms"
            required
            value={formData.symptoms}
            onChange={handleChange}
            rows="4"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
            placeholder="Mô tả các triệu chứng, thời gian mắc bệnh, hoặc các yêu cầu đặc biệt..."
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={loading || !formData.patient_name || !formData.patient_phone || !formData.symptoms}
          className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-xl text-lg flex justify-center items-center gap-2 hover:bg-blue-700 disabled:opacity-70 transition-colors shadow-sm"
        >
          {loading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <>Nhận Tư Vấn Miễn Phí <Send className="size-5" /></>
          )}
        </button>
      </form>
    </div>
  );
}
