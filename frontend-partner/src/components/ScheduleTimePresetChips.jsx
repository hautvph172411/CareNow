import { SCHEDULE_TIME_PRESETS } from '../utils/scheduleLabels';

/**
 * Nút gợi ý khung giờ nhanh (buổi + start/end).
 * onApply: ({ session_type, start_time, end_time }) => void
 */
export default function ScheduleTimePresetChips({ onApply, disabled }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 12 }}>
      <span style={{ fontSize: 13, color: '#64748b', marginRight: 4 }}>Gợi ý nhanh:</span>
      {SCHEDULE_TIME_PRESETS.map((p) => (
        <button
          key={p.key}
          type="button"
          className="btn-secondary"
          disabled={disabled}
          style={{ padding: '0.35rem 0.65rem', fontSize: 13 }}
          onClick={() => onApply({ session_type: p.session_type, start_time: p.start_time, end_time: p.end_time })}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
