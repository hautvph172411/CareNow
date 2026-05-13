import { useEffect, useMemo, useState } from "react";
import {
  User, Mail, Phone, Calendar, MapPin, Heart, FileText,
  ShieldAlert, Save, CheckCircle, AlertCircle, Loader2, BadgeCheck,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getMe, updateMe } from "../api/auth.api";
import { getProvinces, getWardsByProvince } from "../api/location.api";
import AvatarUpload from "../components/AvatarUpload";
import SearchableSelect from "../components/SearchableSelect";

const GENDER_OPTIONS = [
  { value: "", label: "-- Chọn --" },
  { value: "male", label: "Nam" },
  { value: "female", label: "Nữ" },
  { value: "other", label: "Khác" },
];

const BLOOD_TYPES = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const EMPTY_FORM = {
  full_name: "",
  phone: "",
  date_of_birth: "",
  gender: "",
  avatar_url: "",
  address: "",
  province_id: "",
  ward_id: "",
  blood_type: "",
  allergies: "",
  medical_history: "",
  insurance_code: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
};

/** Convert ISO date / Date object → 'YYYY-MM-DD' cho <input type="date"> */
function toDateInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

export function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [readonly, setReadonly] = useState({ email: "", is_verified: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Location state
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingWards, setLoadingWards] = useState(false);

  // Load profile + provinces parallel
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [profileRes, provinceList] = await Promise.all([
          getMe(),
          getProvinces().catch(() => []),
        ]);
        if (cancelled) return;

        const p = profileRes.data.data;
        setForm({
          full_name: p.full_name || "",
          phone: p.phone || "",
          date_of_birth: toDateInput(p.date_of_birth),
          gender: p.gender || "",
          avatar_url: p.avatar_url || "",
          address: p.address || "",
          province_id: p.province_id ? String(p.province_id) : "",
          ward_id: p.ward_id ? String(p.ward_id) : "",
          blood_type: p.blood_type || "",
          allergies: p.allergies || "",
          medical_history: p.medical_history || "",
          insurance_code: p.insurance_code || "",
          emergency_contact_name: p.emergency_contact_name || "",
          emergency_contact_phone: p.emergency_contact_phone || "",
        });
        setReadonly({
          email: p.email || p.google_email || "",
          is_verified: !!p.is_verified,
        });
        setProvinces(provinceList);
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.message || "Không tải được hồ sơ");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Khi province_id thay đổi → reload wards
  useEffect(() => {
    if (!form.province_id) {
      setWards([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoadingWards(true);
        const list = await getWardsByProvince(form.province_id);
        if (!cancelled) setWards(list);
      } catch {
        if (!cancelled) setWards([]);
      } finally {
        if (!cancelled) setLoadingWards(false);
      }
    })();
    return () => { cancelled = true; };
  }, [form.province_id]);

  const fallbackInitial = useMemo(() => {
    return (form.full_name || user?.full_name || readonly.email || "U")
      .charAt(0)
      .toUpperCase();
  }, [form.full_name, user?.full_name, readonly.email]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
    setSuccess("");
    setError("");
  };

  const handleProvinceChange = (val) => {
    // Đổi tỉnh → reset ward
    setForm((s) => ({ ...s, province_id: val ? String(val) : "", ward_id: "" }));
    setSuccess("");
    setError("");
  };

  const handleWardChange = (val) => {
    setForm((s) => ({ ...s, ward_id: val ? String(val) : "" }));
    setSuccess("");
    setError("");
  };

  // Build options cho SearchableSelect
  const provinceOptions = useMemo(
    () => provinces.map((p) => ({ value: p.id, label: p.name })),
    [provinces]
  );
  const wardOptions = useMemo(
    () => wards.map((w) => ({ value: w.id, label: w.name })),
    [wards]
  );

  const handleAvatarChange = (newUrl) => {
    setForm((s) => ({ ...s, avatar_url: newUrl }));
    setSuccess("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const payload = {};
      for (const [k, v] of Object.entries(form)) {
        payload[k] = v === "" ? null : v;
      }

      const res = await updateMe(payload);
      const updated = res.data.data;

      updateUser({
        full_name: updated.full_name,
        avatar_url: updated.avatar_url,
        email: updated.email,
      });

      setSuccess("Cập nhật hồ sơ thành công");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err?.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="size-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2 text-gray-800">Hồ sơ cá nhân</h1>
          <p className="text-gray-500 mb-8">
            Cập nhật thông tin cá nhân và y tế để bác sĩ tư vấn chính xác hơn
          </p>

          {/* Card đầu — avatar có thể đổi */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 flex items-center gap-5">
            <AvatarUpload
              value={form.avatar_url}
              fallbackText={fallbackInitial}
              onChange={handleAvatarChange}
              size={88}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-semibold text-gray-800 truncate">
                  {form.full_name || readonly.email}
                </h2>
                {readonly.is_verified && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: "#d1fae5", color: "#059669" }}
                    title="Đã xác minh qua Google"
                  >
                    <BadgeCheck className="size-3.5" /> Đã xác minh
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Mail className="size-4" /> {readonly.email}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Click vào avatar để đổi ảnh đại diện (tối đa 5MB)
              </p>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="flex items-start gap-2 p-4 mb-6 bg-red-50 text-red-700 rounded-xl border border-red-100">
              <AlertCircle className="size-5 shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 p-4 mb-6 bg-green-50 text-green-700 rounded-xl border border-green-100">
              <CheckCircle className="size-5 shrink-0 mt-0.5" />
              <span className="text-sm">{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* === SECTION 1: Cá nhân === */}
            <Section icon={User} title="Thông tin cá nhân" desc="Thông tin cơ bản về bạn">
              <Grid>
                <Field label="Họ và tên *">
                  <input
                    name="full_name"
                    type="text"
                    value={form.full_name}
                    onChange={handleChange}
                    required
                    placeholder="Nguyễn Văn A"
                    className={inputClass}
                  />
                </Field>
                <Field label="Số điện thoại">
                  <div className="relative">
                    <Phone className={iconClass} />
                    <input
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="0901234567"
                      className={inputClass + " pl-10"}
                    />
                  </div>
                </Field>
                <Field label="Ngày sinh">
                  <div className="relative">
                    <Calendar className={iconClass} />
                    <input
                      name="date_of_birth"
                      type="date"
                      value={form.date_of_birth}
                      onChange={handleChange}
                      max={new Date().toISOString().split("T")[0]}
                      className={inputClass + " pl-10"}
                    />
                  </div>
                </Field>
                <Field label="Giới tính">
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    {GENDER_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </Field>
              </Grid>
            </Section>

            {/* === SECTION 2: Địa chỉ === */}
            <Section icon={MapPin} title="Địa chỉ" desc="Để bác sĩ ước tính thời gian di chuyển và gợi ý phòng khám gần nhất">
              <Grid>
                <Field label="Tỉnh / Thành phố">
                  <SearchableSelect
                    options={provinceOptions}
                    value={form.province_id}
                    onChange={handleProvinceChange}
                    placeholder="-- Chọn tỉnh/thành --"
                  />
                </Field>
                <Field label="Phường / Xã">
                  <SearchableSelect
                    options={wardOptions}
                    value={form.ward_id}
                    onChange={handleWardChange}
                    disabled={!form.province_id || loadingWards}
                    placeholder={
                      !form.province_id
                        ? "-- Chọn tỉnh/thành trước --"
                        : loadingWards
                        ? "Đang tải phường/xã..."
                        : "-- Chọn phường/xã --"
                    }
                    emptyText={loadingWards ? "Đang tải..." : "Không tìm thấy phường/xã"}
                  />
                </Field>
              </Grid>
              <Field label="Địa chỉ chi tiết" className="mt-4">
                <input
                  name="address"
                  type="text"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Số nhà, tên đường..."
                  className={inputClass}
                />
              </Field>
            </Section>

            {/* === SECTION 3: Y tế === */}
            <Section icon={Heart} title="Thông tin y tế" desc="Giúp bác sĩ chẩn đoán và kê đơn an toàn hơn">
              <Grid>
                <Field label="Nhóm máu">
                  <select
                    name="blood_type"
                    value={form.blood_type}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    {BLOOD_TYPES.map((b) => (
                      <option key={b} value={b}>{b || "-- Chọn --"}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Mã thẻ BHYT">
                  <div className="relative">
                    <FileText className={iconClass} />
                    <input
                      name="insurance_code"
                      type="text"
                      value={form.insurance_code}
                      onChange={handleChange}
                      placeholder="DN4..."
                      className={inputClass + " pl-10"}
                    />
                  </div>
                </Field>
              </Grid>

              <Field label="Dị ứng" hint="Liệt kê thuốc, thực phẩm hoặc chất bạn bị dị ứng" className="mt-4">
                <textarea
                  name="allergies"
                  value={form.allergies}
                  onChange={handleChange}
                  placeholder="VD: Penicillin, hải sản, phấn hoa..."
                  rows={2}
                  className={inputClass + " resize-none"}
                />
              </Field>

              <Field label="Tiền sử bệnh" hint="Các bệnh đã/đang mắc, phẫu thuật từng trải qua" className="mt-4">
                <textarea
                  name="medical_history"
                  value={form.medical_history}
                  onChange={handleChange}
                  placeholder="VD: Tiểu đường type 2, mổ ruột thừa năm 2020..."
                  rows={3}
                  className={inputClass + " resize-none"}
                />
              </Field>
            </Section>

            {/* === SECTION 4: Khẩn cấp === */}
            <Section
              icon={ShieldAlert}
              title="Liên hệ khẩn cấp"
              desc="Người sẽ được liên lạc khi có sự cố trong quá trình khám"
            >
              <Grid>
                <Field label="Họ tên người liên hệ">
                  <input
                    name="emergency_contact_name"
                    type="text"
                    value={form.emergency_contact_name}
                    onChange={handleChange}
                    placeholder="Nguyễn Văn B"
                    className={inputClass}
                  />
                </Field>
                <Field label="Số điện thoại">
                  <div className="relative">
                    <Phone className={iconClass} />
                    <input
                      name="emergency_contact_phone"
                      type="tel"
                      value={form.emergency_contact_phone}
                      onChange={handleChange}
                      placeholder="0901234567"
                      className={inputClass + " pl-10"}
                    />
                  </div>
                </Field>
              </Grid>
            </Section>

            {/* === Submit === */}
            <div className="sticky bottom-4 bg-white rounded-xl shadow-lg border border-gray-100 p-4 flex items-center justify-between">
              <p className="text-xs text-gray-500 hidden sm:block">
                Thông tin của bạn được mã hoá và bảo mật
              </p>
              <button
                type="submit"
                disabled={saving}
                className="ml-auto inline-flex items-center gap-2 text-white px-6 py-2.5 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#3498db" }}
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="size-4" /> Lưu thay đổi
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ============== UI helpers ============== */

const inputClass =
  "w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all";

const iconClass =
  "absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none";

function Section({ icon: Icon, title, desc, children }) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-start gap-3 mb-5">
        <div
          className="size-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: "#e8f4fd" }}
        >
          <Icon className="size-5" style={{ color: "#3498db" }} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-800">{title}</h3>
          {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Grid({ children }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

function Field({ label, hint, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-sm font-medium text-gray-700 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-gray-400 mt-1">{hint}</span>}
    </label>
  );
}
