/**
 * CareNow – Custom Medical Service Icon Set (stroke, 48×48 viewBox, currentColor)
 */

export function IconStethoscope({ size = 48, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label="Khám Chuyên khoa"
    >
      <line x1="9" y1="5.5" x2="13" y2="9.5" strokeWidth="2.5" />
      <line x1="39" y1="5.5" x2="35" y2="9.5" strokeWidth="2.5" />
      <circle cx="13" cy="10" r="2.8" />
      <circle cx="35" cy="10" r="2.8" />
      <path d="M13 12.8 C13 20 21 24 24 24" />
      <path d="M35 12.8 C35 20 27 24 24 24" />
      <path d="M24 24 C24 31 30 34 31 39" />
      <circle cx="32" cy="42" r="5" />
      <circle cx="32" cy="42" r="2" fill="currentColor" />
    </svg>
  );
}

export function IconTelemedicine({ size = 48, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label="Khám từ xa"
    >
      <rect x="2" y="9" width="30" height="20" rx="3" />
      <path d="M5 19 L9 19 L11 13 L14 25 L16 17 L18 19 L26 19" strokeWidth="1.8" />
      <line x1="17" y1="29" x2="17" y2="35" />
      <line x1="11" y1="35" x2="23" y2="35" />
      <rect x="33" y="13" width="13" height="10" rx="2" />
      <circle cx="39.5" cy="18" r="3" />
      <circle cx="39.5" cy="18" r="1.2" fill="currentColor" />
      <circle cx="44" cy="14.5" r="1.2" fill="currentColor" />
      <path d="M37 9 Q40 6 43 9" />
      <path d="M35 7 Q40 3 45 7" />
    </svg>
  );
}

export function IconGeneralCheckup({ size = 48, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label="Khám tổng quát"
    >
      <rect x="7" y="10" width="34" height="36" rx="3" />
      <rect x="17" y="7" width="14" height="7" rx="2.5" />
      <rect x="12" y="20" width="6" height="6" rx="1.2" />
      <path d="M13 23 L15 25.5 L18 21" strokeWidth="2" />
      <line x1="22" y1="23" x2="37" y2="23" strokeWidth="1.8" />
      <rect x="12" y="29" width="6" height="6" rx="1.2" />
      <path d="M13 32 L15 34.5 L18 30" strokeWidth="2" />
      <line x1="22" y1="32" x2="37" y2="32" strokeWidth="1.8" />
      <rect x="12" y="38" width="6" height="6" rx="1.2" />
      <line x1="22" y1="41" x2="32" y2="41" strokeWidth="1.8" />
    </svg>
  );
}

export function IconLabTest({ size = 48, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label="Xét nghiệm y học"
    >
      <path d="M18 5 L18 18 L8 36 Q6 43 13 43 L35 43 Q42 43 40 36 L30 18 L30 5" />
      <path d="M12.5 31 L35.5 31" strokeDasharray="3 2" strokeWidth="1.5" />
      <path
        d="M11 36 Q9 43 13 43 L35 43 Q39 43 37 36 L12.5 31 L35.5 31 Z"
        fill="currentColor"
        fillOpacity="0.18"
        stroke="none"
      />
      <circle cx="20" cy="38" r="2.2" fill="currentColor" fillOpacity="0.45" stroke="none" />
      <circle cx="28" cy="40" r="1.6" fill="currentColor" fillOpacity="0.38" stroke="none" />
      <circle cx="33" cy="36.5" r="1.1" fill="currentColor" fillOpacity="0.32" stroke="none" />
      <line x1="40" y1="8" x2="40" y2="20" strokeWidth="2.5" />
      <line x1="34" y1="14" x2="46" y2="14" strokeWidth="2.5" />
    </svg>
  );
}

export function IconMentalHealth({ size = 48, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label="Sức khỏe tinh thần"
    >
      <circle cx="22" cy="20" r="13" />
      <line x1="19" y1="33" x2="19" y2="38" />
      <line x1="25" y1="33" x2="25" y2="38" />
      <line x1="15" y1="38" x2="29" y2="38" />
      <path
        d="M14 19 Q16 15 18 19 Q20 15 22 19 Q24 15 26 19 Q28 15 30 19"
        strokeWidth="1.7"
      />
      <path
        d="M14 24 Q16 21 18 24 Q20 21 22 24 Q24 21 26 24 Q28 21 30 24"
        strokeWidth="1.7"
      />
      <path
        d="M38 13 C37.5 11 35.5 11 35.5 13 C35.5 11 33.5 11 33.5 13 C33.5 15 35.5 17 38 19 C40.5 17 42.5 15 42.5 13 C42.5 11 40.5 11 40.5 13 C40.5 11 38.5 11 38 13 Z"
        fill="currentColor"
        fillOpacity="0.85"
        strokeWidth="0"
      />
      <line x1="38" y1="7" x2="38" y2="9.5" strokeWidth="1.5" />
      <line x1="44" y1="13" x2="46.5" y2="13" strokeWidth="1.5" />
      <line x1="29.5" y1="13" x2="32" y2="13" strokeWidth="1.5" />
    </svg>
  );
}

export function IconDental({ size = 48, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label="Khám nha khoa"
    >
      <path
        d="
        M10 9
        C10 9  8 9  7 13
        C6  17  8 23 10 25
        C12 27 14 23 17 23
        C19 23 19 27 24 27
        C29 27 29 23 31 23
        C34 23 36 27 38 25
        C40 23 42 17 41 13
        C40 9  38 9  38 9
        C38 9  33 11 24 11
        C15 11 10 9  10 9 Z
      "
      />
      <line x1="24" y1="11" x2="24" y2="23" strokeDasharray="2 2" strokeWidth="1.4" />
      <path d="M16 27 C15 33 14 39 13 46" />
      <line x1="24" y1="27" x2="24" y2="46" />
      <path d="M32 27 C33 33 34 39 35 46" />
      <path
        d="M42 4 L43 7.5 L46.5 8.5 L43 9.5 L42 13 L41 9.5 L37.5 8.5 L41 7.5 Z"
        fill="currentColor"
        fillOpacity="0.75"
        stroke="none"
      />
    </svg>
  );
}

export function IconSurgery({ size = 48, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label="Gói Phẫu thuật"
    >
      <path d="M5 44 L27 22" strokeWidth="3" />
      <path d="M27 22 L37 10 L42 16 L34 24 Z" fill="currentColor" fillOpacity="0.14" />
      <line x1="27" y1="22" x2="34" y2="24" strokeWidth="1.5" />
      <line x1="13" y1="36.5" x2="16.5" y2="33" strokeWidth="1.5" />
      <line x1="18" y1="31.5" x2="21.5" y2="28" strokeWidth="1.5" />
      <line x1="23" y1="26.5" x2="26" y2="23.5" strokeWidth="1.5" />
      <circle cx="10" cy="12" r="9" />
      <line x1="10" y1="6" x2="10" y2="18" strokeWidth="2.5" />
      <line x1="4" y1="12" x2="16" y2="12" strokeWidth="2.5" />
    </svg>
  );
}
