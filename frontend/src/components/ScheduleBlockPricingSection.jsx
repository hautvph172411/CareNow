import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { createPricePackage } from '../api/clinicPrice.api';
import { createInsurancePackage } from '../api/clinicInsurance.api';

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Chọn gói giá / BH mặc định cho khung ca + tạo gói nhanh (cùng API CRUD đầy đủ ở tab riêng).
 */
export default function ScheduleBlockPricingSection({
  clinicId,
  partnerId,
  placeId,
  defaultPricePackageId,
  defaultInsurancePackageId,
  pricePkgs,
  insPkgs,
  patchForm,
  reloadPricePackages,
  reloadInsurancePackages,
  disabled,
}) {
  const navigate = useNavigate();
  const [quickPrice, setQuickPrice] = useState({
    name: '',
    amount_vnd: '',
    effective_from: today(),
    label: '',
  });
  const [quickIns, setQuickIns] = useState({ name: '', insurer_name: '', coverage_note: '' });
  const [savingPrice, setSavingPrice] = useState(false);
  const [savingIns, setSavingIns] = useState(false);

  const onSelectPrice = (e) => {
    patchForm({ default_price_package_id: e.target.value });
  };
  const onSelectIns = (e) => {
    patchForm({ default_insurance_package_id: e.target.value });
  };

  const handleQuickPrice = async () => {
    if (!clinicId) return;
    const name = quickPrice.name.trim();
    const amount = parseInt(String(quickPrice.amount_vnd).replace(/\D/g, ''), 10);
    if (!name) {
      alert('Nhập tên gói giá');
      return;
    }
    if (!quickPrice.effective_from) {
      alert('Chọn ngày hiệu lực');
      return;
    }
    if (Number.isNaN(amount) || amount < 0) {
      alert('Số tiền không hợp lệ');
      return;
    }
    setSavingPrice(true);
    try {
      const res = await createPricePackage({
        clinic_id: parseInt(clinicId, 10),
        name,
        items: [
          {
            clinic_place_id: placeId ? parseInt(placeId, 10) : null,
            effective_from: quickPrice.effective_from,
            day_of_week: 'all',
            session_type: 'all',
            amount_vnd: amount,
            label: quickPrice.label.trim() || null,
          },
        ],
      });
      const newId = res?.data?.id;
      await reloadPricePackages();
      if (newId != null) patchForm({ default_price_package_id: String(newId) });
      setQuickPrice({ name: '', amount_vnd: '', effective_from: today(), label: '' });
      alert('Đã tạo gói giá và chọn làm mặc định cho ca này');
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Lỗi tạo gói giá');
    } finally {
      setSavingPrice(false);
    }
  };

  const handleQuickIns = async () => {
    if (!clinicId) return;
    const name = quickIns.name.trim();
    const insurer = quickIns.insurer_name.trim();
    if (!name || !insurer) {
      alert('Nhập tên gói BH và tên công ty / loại BH (insurer)');
      return;
    }
    setSavingIns(true);
    try {
      const res = await createInsurancePackage({
        clinic_id: parseInt(clinicId, 10),
        partner_id: partnerId ? parseInt(partnerId, 10) : null,
        name,
        items: [
          {
            insurer_name: insurer,
            coverage_note: quickIns.coverage_note.trim() || null,
            requires_referral: false,
          },
        ],
      });
      const newId = res?.data?.id;
      await reloadInsurancePackages();
      if (newId != null) patchForm({ default_insurance_package_id: String(newId) });
      setQuickIns({ name: '', insurer_name: '', coverage_note: '' });
      alert('Đã tạo gói BH và chọn làm mặc định cho ca này');
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Lỗi tạo gói BH');
    } finally {
      setSavingIns(false);
    }
  };

  return (
    <div className="form-section">
      <h3 className="form-section-title">Giá khám &amp; bảo hiểm (gắn ca này)</h3>
      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 14, lineHeight: 1.5 }}>
        Chọn gói có sẵn hoặc tạo nhanh ngay tại đây. Dữ liệu vẫn là{' '}
        <strong>gói giá / gói BH</strong> (bảng riêng); chỉnh nhiều dòng giá hay quy tắc phức tạp dùng tab{' '}
        <strong>Gói giá</strong> / <strong>Gói BH</strong>.
      </p>

      <div className="form-grid">
        <div className="form-group full-width">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <label style={{ margin: 0 }}>Gói giá mặc định khi đặt ca này</label>
            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: 12, padding: '0.25rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              onClick={() => navigate('/appointment-schedule/price-packages')}
            >
              <ExternalLink size={14} />
              CRUD đầy đủ
            </button>
          </div>
          <select
            name="default_price_package_id"
            className="form-input"
            value={defaultPricePackageId}
            onChange={onSelectPrice}
            disabled={disabled}
          >
            <option value="">— Không gắn —</option>
            {pricePkgs.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
          <details style={{ marginTop: 10 }}>
            <summary style={{ cursor: 'pointer', fontSize: 13, color: '#475569' }}>Tạo gói giá nhanh (1 mức giá)</summary>
            <div style={{ marginTop: 10, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Tên gói *</label>
                  <input
                    className="form-input"
                    value={quickPrice.name}
                    onChange={(e) => setQuickPrice((p) => ({ ...p, name: e.target.value }))}
                    placeholder="VD: Khám tái khám — chi nhánh A"
                    disabled={disabled || savingPrice}
                  />
                </div>
                <div className="form-group">
                  <label>Giá (VND) *</label>
                  <input
                    className="form-input"
                    inputMode="numeric"
                    value={quickPrice.amount_vnd}
                    onChange={(e) => setQuickPrice((p) => ({ ...p, amount_vnd: e.target.value }))}
                    placeholder="300000"
                    disabled={disabled || savingPrice}
                  />
                </div>
                <div className="form-group">
                  <label>Hiệu lực từ *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={quickPrice.effective_from}
                    onChange={(e) => setQuickPrice((p) => ({ ...p, effective_from: e.target.value }))}
                    disabled={disabled || savingPrice}
                  />
                </div>
                <div className="form-group">
                  <label>Ghi chú dòng giá</label>
                  <input
                    className="form-input"
                    value={quickPrice.label}
                    onChange={(e) => setQuickPrice((p) => ({ ...p, label: e.target.value }))}
                    placeholder="Tùy chọn"
                    disabled={disabled || savingPrice}
                  />
                </div>
              </div>
              <p style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
                Dòng giá gắn <strong>nơi khám</strong> đã chọn (nếu có); không chọn thứ/buổi (áp mọi ngày trong gói này).
              </p>
              <button type="button" className="btn-primary" style={{ marginTop: 8 }} disabled={disabled || savingPrice} onClick={handleQuickPrice}>
                {savingPrice ? 'Đang tạo…' : 'Tạo gói & chọn cho ca'}
              </button>
            </div>
          </details>
        </div>

        <div className="form-group full-width">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <label style={{ margin: 0 }}>Gói BH mặc định khi đặt ca này</label>
            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: 12, padding: '0.25rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              onClick={() => navigate('/appointment-schedule/insurance-packages')}
            >
              <ExternalLink size={14} />
              CRUD đầy đủ
            </button>
          </div>
          <select
            name="default_insurance_package_id"
            className="form-input"
            value={defaultInsurancePackageId}
            onChange={onSelectIns}
            disabled={disabled}
          >
            <option value="">— Không gắn —</option>
            {insPkgs.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
          <details style={{ marginTop: 10 }}>
            <summary style={{ cursor: 'pointer', fontSize: 13, color: '#475569' }}>Tạo gói BH nhanh (1 dòng)</summary>
            <div style={{ marginTop: 10, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Tên gói *</label>
                  <input
                    className="form-input"
                    value={quickIns.name}
                    onChange={(e) => setQuickIns((p) => ({ ...p, name: e.target.value }))}
                    placeholder="VD: BHYT / PVI chi nhánh…"
                    disabled={disabled || savingIns}
                  />
                </div>
                <div className="form-group">
                  <label>Tên công ty / loại BH *</label>
                  <input
                    className="form-input"
                    value={quickIns.insurer_name}
                    onChange={(e) => setQuickIns((p) => ({ ...p, insurer_name: e.target.value }))}
                    placeholder="VD: Bảo hiểm X"
                    disabled={disabled || savingIns}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Ghi chú phạm vi (tuỳ chọn)</label>
                  <input
                    className="form-input"
                    value={quickIns.coverage_note}
                    onChange={(e) => setQuickIns((p) => ({ ...p, coverage_note: e.target.value }))}
                    placeholder="Thanh toán 80%…"
                    disabled={disabled || savingIns}
                  />
                </div>
              </div>
              <button type="button" className="btn-primary" style={{ marginTop: 8 }} disabled={disabled || savingIns} onClick={handleQuickIns}>
                {savingIns ? 'Đang tạo…' : 'Tạo gói & chọn cho ca'}
              </button>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
