import { useState } from "react";
import { Send, CheckCircle, TrendingUp, Users, ShieldCheck, HeartPulse } from "lucide-react";
import { submitPartnerContact } from "../api/partnerContact.api";

export function PartnerContact() {
  const [formData, setFormData] = useState({
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    clinic_name: "",
    clinic_address: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await submitPartnerContact(formData);
      setSuccess(true);
      setFormData({
        contact_name: "",
        contact_phone: "",
        contact_email: "",
        clinic_name: "",
        clinic_address: "",
        notes: "",
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Đã có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Hero Section */}
      <div className="relative bg-white pt-16 pb-20 lg:pt-24 lg:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-[#f8fbff]" />
        <div className="relative container mx-auto px-4 max-w-6xl flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Hợp tác cùng <span style={{ color: "#3498db" }}>CareNow</span>
              <br />Phát triển bền vững
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0">
              Mở rộng tập khách hàng, tối ưu vận hành và nâng cao uy tín thương hiệu phòng khám của bạn thông qua nền tảng kết nối y tế thông minh hàng đầu.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a href="#register-form" className="px-8 py-3.5 rounded-xl text-white font-semibold text-lg transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2" style={{ backgroundColor: "#3498db" }}>
                Đăng ký ngay <Send className="size-5" />
              </a>
            </div>
          </div>
          <div className="flex-1">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-blue-500 to-blue-700 aspect-[4/3] flex items-center justify-center p-8">
              <div className="absolute inset-0 bg-white/10" style={{ backdropFilter: 'blur(8px)' }}></div>
              <div className="relative z-10 text-center text-white">
                <div className="bg-white/20 p-6 rounded-full inline-block mb-6 shadow-xl border border-white/30 backdrop-blur-md">
                  <Users className="size-20 text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-4">Kết Nối Y Tế</h3>
                <p className="text-blue-100 text-lg">Cùng nhau xây dựng hệ sinh thái chăm sóc sức khỏe toàn diện và hiện đại.</p>
              </div>
              
              {/* Floating elements */}
              <div className="absolute top-10 left-10 bg-white/20 p-3 rounded-2xl border border-white/20 shadow-lg animate-pulse">
                <HeartPulse className="size-8 text-white" />
              </div>
              <div className="absolute bottom-12 right-12 bg-white/20 p-4 rounded-full border border-white/20 shadow-lg animate-bounce" style={{ animationDuration: '3s' }}>
                <ShieldCheck className="size-10 text-white" />
              </div>
              <div className="absolute top-24 right-16 bg-white/20 p-2 rounded-xl border border-white/20 shadow-lg">
                <TrendingUp className="size-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="container mx-auto px-4 max-w-6xl py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Tại sao chọn CareNow?</h2>
          <p className="text-gray-600">Chúng tôi mang lại giải pháp toàn diện cho cơ sở y tế của bạn.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { title: "Tăng trưởng bệnh nhân", icon: TrendingUp, desc: "Tiếp cận hàng triệu người dùng có nhu cầu khám chữa bệnh thực tế mỗi ngày." },
            { title: "Tối ưu vận hành", icon: Users, desc: "Hệ thống quản lý lịch hẹn thông minh, giảm thiểu rủi ro bệnh nhân hủy hẹn." },
            { title: "Nâng cao uy tín", icon: ShieldCheck, desc: "Được xác thực và hiển thị chuyên nghiệp trên hệ sinh thái y tế số uy tín." },
            { title: "Hỗ trợ 24/7", icon: HeartPulse, desc: "Đội ngũ chăm sóc khách hàng chuyên nghiệp đồng hành cùng cơ sở y tế." },
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
              <div className="size-14 mx-auto bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-5">
                <item.icon className="size-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form Section */}
      <div id="register-form" className="container mx-auto px-4 max-w-3xl mt-8">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8 md:p-12">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Gửi thông tin liên hệ</h2>
              <p className="text-gray-600">Vui lòng để lại thông tin, đội ngũ CareNow sẽ liên hệ hỗ trợ bạn sớm nhất.</p>
            </div>

            {success ? (
              <div className="bg-green-50 text-green-700 p-8 rounded-2xl border border-green-100 text-center">
                <CheckCircle className="size-16 mx-auto mb-4 text-green-500" />
                <h3 className="text-xl font-bold mb-2">Gửi thành công!</h3>
                <p>Cảm ơn bạn đã quan tâm. Chúng tôi sẽ liên hệ lại trong vòng 24 giờ làm việc.</p>
                <button
                  onClick={() => setSuccess(false)}
                  className="mt-6 px-6 py-2 bg-white text-green-600 font-semibold rounded-xl shadow-sm hover:shadow"
                >
                  Gửi yêu cầu khác
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                    {error}
                  </div>
                )}
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Họ và tên người liên hệ <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="contact_name"
                      required
                      value={formData.contact_name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="VD: Nguyễn Văn A"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Số điện thoại <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="contact_phone"
                      required
                      value={formData.contact_phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="VD: 0912345678"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tên cơ sở y tế <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="clinic_name"
                      required
                      value={formData.clinic_name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="Tên phòng khám / Bệnh viện"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email liên hệ</label>
                    <input
                      type="email"
                      name="contact_email"
                      value={formData.contact_email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="example@domain.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Địa chỉ cơ sở y tế</label>
                  <input
                    type="text"
                    name="clinic_address"
                    value={formData.clinic_address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Số nhà, đường, phường/xã, quận/huyện..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nội dung ghi chú</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="4"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                    placeholder="Yêu cầu khác hoặc thông tin bổ sung..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 text-white font-bold rounded-xl text-lg flex justify-center items-center gap-2 hover:opacity-90 disabled:opacity-70 transition-all shadow-md"
                  style={{ backgroundColor: "#3498db" }}
                >
                  {loading ? (
                    <span className="size-6 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>Gửi Yêu Cầu Hợp Tác <Send className="size-5" /></>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
