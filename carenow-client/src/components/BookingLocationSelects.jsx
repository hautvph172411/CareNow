import { useEffect, useMemo, useState } from "react";
import { getProvinces, getWards } from "../api/catalog.api";
import SearchableSelect from "./SearchableSelect";

function normalizeList(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

export default function BookingLocationSelects({
  provinceId,
  wardId,
  onProvinceChange,
  onWardChange,
  required = false,
}) {
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingProvinces(true);
      try {
        const provinceRes = await getProvinces().catch(() => []);
        if (cancelled) return;
        setProvinces(normalizeList(provinceRes));
      } finally {
        if (!cancelled) setLoadingProvinces(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!provinceId) {
      setWards([]);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadingWards(true);
      try {
        const list = await getWards(provinceId);
        if (!cancelled) setWards(normalizeList(list));
      } catch {
        if (!cancelled) setWards([]);
      } finally {
        if (!cancelled) setLoadingWards(false);
      }
    })();
    return () => { cancelled = true; };
  }, [provinceId]);

  const provincePlaceholder = useMemo(() => {
    if (loadingProvinces) return "Đang tải tỉnh/thành...";
    return "Chọn tỉnh/thành";
  }, [loadingProvinces]);
  const provinceOptions = useMemo(
    () => provinces.map((province) => ({ value: String(province.id), label: province.name })),
    [provinces]
  );
  const wardOptions = useMemo(
    () => wards.map((ward) => ({ value: String(ward.id), label: ward.name })),
    [wards]
  );

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Tỉnh / Thành {required && <span className="text-red-500">*</span>}
        </label>
        <SearchableSelect
          options={provinceOptions}
          value={provinceId}
          onChange={onProvinceChange}
          disabled={loadingProvinces}
          placeholder={provincePlaceholder}
          emptyText="Không tìm thấy tỉnh/thành"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Xã / Phường {required && <span className="text-red-500">*</span>}
        </label>
        <SearchableSelect
          options={wardOptions}
          value={wardId}
          onChange={onWardChange}
          disabled={!provinceId || loadingWards}
          placeholder={
            !provinceId
              ? "Chọn tỉnh/thành trước"
              : loadingWards
                ? "Đang tải phường/xã..."
                : "Chọn phường/xã"
          }
          emptyText="Không tìm thấy xã/phường"
        />
      </div>
    </div>
  );
}
