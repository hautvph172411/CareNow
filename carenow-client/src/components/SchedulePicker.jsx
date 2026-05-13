import { useEffect, useState, useMemo } from "react";
import { Calendar, Clock, Loader2, AlertCircle } from "lucide-react";
import { getScheduleBlocks } from "../api/catalog.api";
import {
  getNext14Days, getActiveDaysOfWeek, getSlotsForDate,
  DOW_SHORT, SESSION_LABEL, toISODate, toDisplayDate,
} from "../utils/scheduleUtils";

/**
 * SchedulePicker — chọn ngày + giờ từ lịch thực của clinic trong DB
 *
 * Props:
 *   clinicId       {number|string}  – id của clinic/bác sĩ
 *   selectedDate   {string}         – "YYYY-MM-DD"
 *   selectedTime   {string}         – "HH:mm"
 *   onSelect       {fn(date, time)} – callback khi chọn slot
 *   compact        {boolean}        – mode nhỏ gọn (dùng trong list bác sĩ)
 */
export function SchedulePicker({
  clinicId,
  selectedDate,
  selectedTime,
  onSelect,
  compact = false,
}) {
  const [blocks,  setBlocks]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  /* ── Fetch blocks khi clinicId thay đổi ─────────────────────────────── */
  useEffect(() => {
    if (!clinicId) return;
    let cancelled = false;
    setLoading(true);
    setError("");

    getScheduleBlocks({ clinic_id: clinicId, status: 1, limit: 100 })
      .then((data) => { if (!cancelled) setBlocks(data); })
      .catch(() => { if (!cancelled) setError("Không tải được lịch khám"); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [clinicId]);

  const days14      = useMemo(() => getNext14Days(), []);
  const activeDows  = useMemo(() => getActiveDaysOfWeek(blocks), [blocks]);

  /* Ngày đang chọn hoặc default là ngày đầu tiên có lịch */
  const pickedDate = useMemo(() => {
    if (selectedDate) return selectedDate;
    if (blocks.length === 0) return null;
    const first = days14.find((d) => activeDows.has(d.getDay()));
    return first ? toISODate(first) : null;
  }, [selectedDate, blocks, activeDows, days14]);

  /* Slots cho ngày đang chọn */
  const slots = useMemo(() => {
    if (!pickedDate || blocks.length === 0) return { morning: [], afternoon: [], evening: [], all: [] };
    return getSlotsForDate(blocks, pickedDate);
  }, [pickedDate, blocks]);

  const hasSlots = slots.all.length > 0;

  /* ── Loading ─────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-gray-400 text-sm py-3 ${compact ? "" : "py-6"}`}>
        <Loader2 className="size-4 animate-spin" />
        Đang tải lịch khám…
      </div>
    );
  }

  if (!clinicId) {
    return (
      <p className="text-xs text-gray-400 py-2">Chưa chọn bác sĩ / phòng khám</p>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-orange-600 text-sm py-2">
        <AlertCircle className="size-4" /> {error}
      </div>
    );
  }

  if (blocks.length === 0) {
    return (
      <p className="text-xs text-gray-400 py-2">Chưa có lịch khám cho bác sĩ này</p>
    );
  }

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {/* ── Thanh chọn ngày ──────────────────────────────────────────── */}
      <div>
        {!compact && (
          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
            <Calendar className="size-4 text-blue-500" /> Chọn ngày khám
          </div>
        )}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {days14.map((d) => {
            const iso     = toISODate(d);
            const dow     = d.getDay();
            const hasDay  = activeDows.has(dow);
            const isToday = iso === toISODate(new Date());
            const isPicked = iso === pickedDate;

            return (
              <button
                key={iso}
                onClick={() => hasDay && onSelect(iso, "")}
                disabled={!hasDay}
                className={`
                  flex-none flex flex-col items-center rounded-xl border-2 transition-all
                  ${compact ? "w-12 py-1.5 text-[11px]" : "w-14 py-2 text-xs"}
                  ${isPicked
                    ? "border-blue-500 bg-blue-500 text-white shadow-md"
                    : hasDay
                      ? "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50 cursor-pointer"
                      : "border-dashed border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed opacity-60"
                  }
                `}
              >
                <span className={`font-bold ${compact ? "text-base" : "text-lg"} leading-none`}>
                  {d.getDate()}
                </span>
                <span className="font-medium mt-0.5">{DOW_SHORT[dow]}</span>
                {isToday && !isPicked && (
                  <span className="text-[9px] font-semibold text-blue-500 mt-0.5">Hôm nay</span>
                )}
                {hasDay && !isPicked && (
                  <span className="size-1 rounded-full bg-blue-400 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Slots theo buổi ──────────────────────────────────────────── */}
      {pickedDate && (
        <div>
          {!compact && (
            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
              <Clock className="size-4 text-blue-500" />
              {hasSlots
                ? `${slots.all.length} khung giờ trống — ${new Date(pickedDate + "T00:00:00").toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" })}`
                : "Không có lịch ngày này"}
            </div>
          )}

          {!hasSlots ? (
            <p className="text-sm text-gray-400 py-2">Không có giờ khám cho ngày này.</p>
          ) : (
            <div className="space-y-3">
              {[
                { key: "morning",   slots: slots.morning,   label: "Buổi sáng",  color: "#f59e0b" },
                { key: "afternoon", slots: slots.afternoon, label: "Buổi chiều", color: "#3498db" },
                { key: "evening",   slots: slots.evening,   label: "Buổi tối",   color: "#8b5cf6" },
              ]
                .filter((s) => s.slots.length > 0)
                .map(({ key, slots: s, label, color }) => (
                  <div key={key}>
                    {!compact && (
                      <p className="text-xs font-semibold mb-1.5" style={{ color }}>
                        {label}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {s.map((time) => {
                        const isPicked = pickedDate === selectedDate && time === selectedTime;
                        return (
                          <button
                            key={time}
                            onClick={() => onSelect(pickedDate, time)}
                            className={`
                              rounded-lg border-2 font-semibold transition-all
                              ${compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"}
                              ${isPicked
                                ? "text-white border-blue-500 bg-blue-500 shadow-sm"
                                : "text-gray-700 border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                              }
                            `}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
