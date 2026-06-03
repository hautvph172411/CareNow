import { useMemo, useState } from "react";
import { X } from "lucide-react";

function formatVnd(value) {
  const n = Number(value);
  if (Number.isNaN(n) || n <= 0) return null;
  return `${n.toLocaleString("vi-VN")}đ`;
}

function formatRange(min, max) {
  const minText = formatVnd(min);
  const maxText = formatVnd(max);
  if (minText && maxText && minText !== maxText) return `${minText} - ${maxText}`;
  return minText || maxText || null;
}

function insuranceLabel(item) {
  return item?.insurer_name || item?.package_name || item?.insurer_code || "";
}

function normalizeInsuranceType(item) {
  if (item?.insurance_type === "public") return "public";
  const text = `${item?.insurer_name || ""} ${item?.insurer_code || ""}`.toLowerCase();
  return text.includes("bhyt") ? "public" : "private";
}

export function getPricePackages(priceSummary) {
  return Array.isArray(priceSummary?.packages) ? priceSummary.packages : [];
}

export function getDefaultPricePackageId(priceSummary) {
  const pkg = getPricePackages(priceSummary)[0];
  return pkg?.id != null ? String(pkg.id) : "";
}

export function getSelectedPricePackage(priceSummary, selectedId) {
  const packages = getPricePackages(priceSummary);
  if (!packages.length) return null;
  return packages.find((pkg) => String(pkg.id) === String(selectedId)) || packages[0];
}

export function getPricePackageAmount(pkg) {
  const directMin = Number(pkg?.min);
  if (!Number.isNaN(directMin) && directMin > 0) return directMin;
  const itemAmounts = (Array.isArray(pkg?.items) ? pkg.items : [])
    .map((item) => Number(item.amount_vnd))
    .filter((n) => !Number.isNaN(n) && n > 0);
  return itemAmounts.length ? Math.min(...itemAmounts) : null;
}

export function getInsurancePackageGroups(insuranceSummary) {
  const items = Array.isArray(insuranceSummary?.items) ? insuranceSummary.items : [];
  const groups = new Map();
  items.forEach((item) => {
    const key = item.package_id != null ? String(item.package_id) : `item-${item.id}`;
    const type = normalizeInsuranceType(item);
    if (!groups.has(key)) {
      groups.set(key, {
        id: item.package_id,
        key,
        name: item.package_name || insuranceLabel(item) || "Gói bảo hiểm",
        has_public: type === "public",
        has_private: type === "private",
        items: [],
      });
    }
    const group = groups.get(key);
    group.has_public = group.has_public || type === "public";
    group.has_private = group.has_private || type === "private";
    group.items.push(item);
  });
  return Array.from(groups.values());
}

export function getDefaultInsurancePackageId(insuranceSummary) {
  const group = getInsurancePackageGroups(insuranceSummary)[0];
  return group?.id != null ? String(group.id) : "";
}

export function getSelectedInsurancePackageGroup(insuranceSummary, selectedId) {
  const groups = getInsurancePackageGroups(insuranceSummary);
  if (!groups.length) return null;
  return groups.find((group) => String(group.id) === String(selectedId)) || groups[0];
}

export function buildFinanceSelectionPayload({
  priceSummary,
  insuranceSummary,
  pricePackageId,
  insurancePackageId,
}) {
  const selectedPricePackage = getSelectedPricePackage(priceSummary, pricePackageId);
  const selectedInsuranceGroup = getSelectedInsurancePackageGroup(insuranceSummary, insurancePackageId);
  const amount = getPricePackageAmount(selectedPricePackage);
  return {
    price_package_id: selectedPricePackage?.id != null ? Number(selectedPricePackage.id) : undefined,
    insurance_package_id: selectedInsuranceGroup?.id != null ? Number(selectedInsuranceGroup.id) : undefined,
    amount_vnd: amount || undefined,
  };
}

function insuranceTypeLabel(group) {
  if (group?.has_public && group?.has_private) return "BHYT & bảo hiểm tư nhân";
  if (group?.has_public) return "BHYT";
  return "Bảo hiểm tư nhân";
}

function PriceDetailContent({
  priceSummary,
  selectable,
  selectedPricePackageId,
  onSelectPricePackage,
  radioGroupName,
}) {
  const pricePackages = getPricePackages(priceSummary);

  return (
    <section className="mt-3">
      <h4 className="mb-2 text-base font-bold uppercase text-gray-600">Giá khám:</h4>
      <div className="border border-gray-200 bg-white">
        {pricePackages.map((pkg) => (
          <label
            key={pkg.id}
            className={`block border-b border-gray-200 last:border-b-0 ${
              selectable && String(selectedPricePackageId) === String(pkg.id) ? "bg-blue-50" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-4 p-3">
              <div className="flex min-w-0 items-start gap-2">
                {selectable && (
                  <input
                    type="radio"
                    name={`price_package_${radioGroupName}`}
                    value={pkg.id}
                    checked={String(selectedPricePackageId) === String(pkg.id)}
                    onChange={() => onSelectPricePackage?.(String(pkg.id))}
                    className="mt-1"
                  />
                )}
                <div className="min-w-0">
                  <div className="text-lg font-medium leading-snug text-gray-900">{pkg.name || "Giá khám"}</div>
                  <div className="mt-1 text-sm leading-relaxed text-gray-500">
                    {pkg.description || "Giá khám chưa bao gồm chi phí phát sinh nếu có"}
                  </div>
                </div>
              </div>
              <div className="shrink-0 text-lg font-medium text-gray-900">
                {formatRange(pkg.min, pkg.max) || "Liên hệ"}
              </div>
            </div>
            {Array.isArray(pkg.items) && pkg.items.length > 0 && (
              <div className="border-t border-gray-200 bg-gray-50">
                {pkg.items.map((item) => (
                  <div key={item.id} className="flex justify-between gap-4 border-b border-gray-200 p-3 last:border-b-0">
                    <div className="min-w-0">
                      <div className="text-base font-medium leading-snug text-gray-900">
                        {item.label || item.place_name || "Giá áp dụng"}
                      </div>
                      {item.place_name && item.label && (
                        <div className="mt-1 text-sm text-gray-500">{item.place_name}</div>
                      )}
                    </div>
                    <div className="shrink-0 text-base font-medium text-gray-900">
                      {formatVnd(item.amount_vnd) || "Liên hệ"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </label>
        ))}
      </div>
    </section>
  );
}

function InsuranceDetailContent({
  insuranceSummary,
  selectable,
  selectedInsurancePackageId,
  onSelectInsurancePackage,
  radioGroupName,
  onOpenPrivateList,
}) {
  const insuranceGroups = getInsurancePackageGroups(insuranceSummary);

  return (
    <section className="mt-3">
      <h4 className="mb-2 text-base font-bold uppercase text-gray-600">Loại bảo hiểm áp dụng</h4>
      <div className="border border-gray-200 bg-white">
        {insuranceGroups.map((group) => {
          const privateItems = group.items.filter((item) => normalizeInsuranceType(item) === "private");
          return (
            <label
              key={group.key}
              className={`block border-b border-gray-200 p-3 last:border-b-0 ${
                selectable && String(selectedInsurancePackageId) === String(group.id) ? "bg-emerald-50" : ""
              }`}
            >
              <div className="flex items-start gap-2">
                {selectable && group.id != null && (
                  <input
                    type="radio"
                    name={`insurance_package_${radioGroupName}`}
                    value={group.id}
                    checked={String(selectedInsurancePackageId) === String(group.id)}
                    onChange={() => onSelectInsurancePackage?.(String(group.id))}
                    className="mt-1"
                  />
                )}
                <div className="min-w-0">
                  <div className="text-lg font-medium leading-snug text-gray-900">
                    {group.has_public ? "Bảo hiểm y tế nhà nước" : group.name}
                  </div>
                  <div className="mt-1 text-sm leading-relaxed text-gray-500">
                    {group.items.map((item) => item.coverage_note).filter(Boolean)[0] ||
                      (group.has_public
                        ? "Áp dụng theo quy định bảo hiểm y tế"
                        : "Áp dụng với các đơn vị bảo hiểm tư nhân được hỗ trợ")}
                  </div>
                  {group.items.some((item) => item.copay_note) && (
                    <div className="mt-1 text-sm leading-relaxed text-gray-500">
                      {group.items.map((item) => item.copay_note).filter(Boolean)[0]}
                    </div>
                  )}
                  {group.items.some((item) => item.requires_referral) && (
                    <div className="mt-1 text-sm leading-relaxed text-amber-700">
                      Cần giấy chuyển tuyến/giới thiệu
                    </div>
                  )}
                  {privateItems.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        onOpenPrivateList(group);
                      }}
                      className="mt-2 text-sm font-medium text-[#41c4cf] hover:text-[#22aeb9]"
                    >
                      Xem danh sách
                    </button>
                  )}
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </section>
  );
}

export default function DoctorPriceInsuranceInfo({
  priceSummary,
  insuranceSummary,
  legacyPriceMin,
  compact = false,
  defaultExpanded = false,
  selectable = false,
  selectedPricePackageId = "",
  selectedInsurancePackageId = "",
  onSelectPricePackage,
  onSelectInsurancePackage,
  radioGroupName = "doctor_finance",
}) {
  const [expandedSection, setExpandedSection] = useState(defaultExpanded ? "price" : "");
  const [modalSection, setModalSection] = useState("");
  const [privateListGroup, setPrivateListGroup] = useState(null);

  const priceText = useMemo(() => {
    const fromSummary = formatRange(priceSummary?.min, priceSummary?.max);
    if (fromSummary) return fromSummary;
    return formatVnd(legacyPriceMin);
  }, [priceSummary?.min, priceSummary?.max, legacyPriceMin]);

  const insuranceItems = Array.isArray(insuranceSummary?.items) ? insuranceSummary.items : [];
  const insuranceNames = [...new Set(insuranceItems.map(insuranceLabel).filter(Boolean))];
  const hasPriceDetails = Array.isArray(priceSummary?.packages) && priceSummary.packages.length > 0;
  const hasInsuranceDetails = insuranceItems.length > 0;
  const hasDetails = hasPriceDetails || hasInsuranceDetails;

  if (!priceText && insuranceNames.length === 0) return null;

  const openDetails = (section) => {
    if (compact) {
      setModalSection(section);
      return;
    }
    setExpandedSection((current) => (current === section ? "" : section));
  };

  const detailButton = (section, visible) => {
    if (!visible) return null;
    const isOpen = expandedSection === section && !compact;
    return (
      <button
        type="button"
        onClick={() => openDetails(section)}
        className="ml-2 align-baseline font-semibold text-[#41c4cf] hover:text-[#22aeb9]"
      >
        {isOpen ? "Thu gọn" : "Xem chi tiết"}
      </button>
    );
  };

  const priceDetail = (
    <PriceDetailContent
      priceSummary={priceSummary}
      selectable={selectable}
      selectedPricePackageId={selectedPricePackageId}
      onSelectPricePackage={onSelectPricePackage}
      radioGroupName={radioGroupName}
    />
  );

  const insuranceDetail = (
    <InsuranceDetailContent
      insuranceSummary={insuranceSummary}
      selectable={selectable}
      selectedInsurancePackageId={selectedInsurancePackageId}
      onSelectInsurancePackage={onSelectInsurancePackage}
      radioGroupName={radioGroupName}
      onOpenPrivateList={setPrivateListGroup}
    />
  );

  const modalDetail = modalSection === "price" ? priceDetail : insuranceDetail;
  const modalTitle = modalSection === "price" ? "Thông tin giá khám" : "Loại bảo hiểm áp dụng";
  const privateListItems = privateListGroup
    ? privateListGroup.items.filter((item) => normalizeInsuranceType(item) === "private")
    : [];

  return (
    <div className={`${compact ? "text-sm" : "text-base"} text-gray-700`}>
      {priceText && (
        <div className="py-2 leading-relaxed">
          <span className="font-bold uppercase tracking-normal text-gray-600">Giá khám:</span>{" "}
          <span className="font-medium text-gray-900">{priceText}</span>
          {detailButton("price", hasPriceDetails)}
        </div>
      )}

      {insuranceNames.length > 0 && (
        <div className={`${priceText ? "border-t border-gray-200" : ""} py-3 leading-relaxed`}>
          <span className="font-bold uppercase tracking-normal text-gray-600">Loại bảo hiểm áp dụng.</span>
          {detailButton("insurance", hasInsuranceDetails)}
        </div>
      )}

      {!compact && expandedSection === "price" && <div className="pt-2">{priceDetail}</div>}
      {!compact && expandedSection === "insurance" && <div className="pt-2">{insuranceDetail}</div>}

      {compact && modalSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-base font-bold text-gray-800">{modalTitle}</h3>
              <button
                type="button"
                onClick={() => setModalSection("")}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="size-5" />
              </button>
            </div>
            {modalDetail}
          </div>
        </div>
      )}

      {privateListGroup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-xl border border-blue-100 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-blue-100 bg-blue-50 px-4 py-3 text-blue-700">
              <h3 className="text-base font-bold uppercase">Danh sách công ty bảo lãnh</h3>
              <button
                type="button"
                onClick={() => setPrivateListGroup(null)}
                className="rounded-full p-1 text-blue-500 hover:bg-blue-100 hover:text-blue-700"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="max-h-[65vh] overflow-y-auto p-4">
              <table className="w-full border-collapse bg-white text-sm">
                <tbody>
                  {privateListItems.map((item, index) => (
                    <tr key={item.id || `${insuranceLabel(item)}-${index}`} className="border-b border-blue-50 last:border-b-0">
                      <td className="w-12 px-3 py-2 text-center font-semibold text-blue-600">{index + 1}</td>
                      <td className="px-3 py-2 text-gray-700">{insuranceLabel(item)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
