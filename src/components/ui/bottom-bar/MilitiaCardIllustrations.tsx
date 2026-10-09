import React from 'react';

export const SpearmanIllustration: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => {
  return (
    <svg viewBox="0 0 100 180" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="spear_parch" cx="48%" cy="46%" r="68%">
          <stop offset="0%" stopColor="#faf5e9" />
          <stop offset="60%" stopColor="#ede0c8" />
          <stop offset="88%" stopColor="#dac29e" />
          <stop offset="100%" stopColor="#b4966e" />
        </radialGradient>

        <pattern id="mail_pattern" x="0" y="0" width="3.5" height="3.5" patternUnits="userSpaceOnUse">
          <circle cx="1.75" cy="1.75" r="1.3" stroke="#2d3748" strokeWidth="0.6" fill="#718096" fillOpacity="0.35" />
        </pattern>

        <linearGradient id="spear_blade_grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="38%" stopColor="#f8fafc" />
          <stop offset="65%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>

        <linearGradient id="spear_helm_grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="40%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>

        <linearGradient id="shield_heater_grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#b45309" />
          <stop offset="60%" stopColor="#78350f" />
          <stop offset="100%" stopColor="#451a03" />
        </linearGradient>

        <linearGradient id="spear_tunic_grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6b7280" />
          <stop offset="50%" stopColor="#4b5563" />
          <stop offset="100%" stopColor="#374151" />
        </linearGradient>
      </defs>

      <rect width="100" height="180" fill="url(#spear_parch)" />

      <line x1="6" y1="26" x2="94" y2="26" stroke="#cbb493" strokeWidth="0.5" strokeDasharray="1.5 2.5" opacity="0.6" />
      <line x1="6" y1="46" x2="94" y2="46" stroke="#cbb493" strokeWidth="0.5" strokeDasharray="1.5 2.5" opacity="0.6" />
      <line x1="6" y1="68" x2="94" y2="68" stroke="#cbb493" strokeWidth="0.5" strokeDasharray="1.5 2.5" opacity="0.6" />
      <line x1="6" y1="90" x2="94" y2="90" stroke="#cbb493" strokeWidth="0.5" strokeDasharray="1.5 2.5" opacity="0.6" />
      <line x1="6" y1="112" x2="94" y2="112" stroke="#cbb493" strokeWidth="0.5" strokeDasharray="1.5 2.5" opacity="0.6" />
      <line x1="6" y1="134" x2="94" y2="134" stroke="#cbb493" strokeWidth="0.5" strokeDasharray="1.5 2.5" opacity="0.6" />

      <rect x="3" y="3" width="94" height="174" stroke="#5c4428" strokeWidth="1.4" fill="none" opacity="0.85" />
      <rect x="5.5" y="5.5" width="89" height="169" stroke="#8c6d44" strokeWidth="0.6" strokeDasharray="2 1.5" fill="none" opacity="0.5" />

      <path d="M0 148 Q25 144 50 147 T100 149 L100 180 L0 180 Z" fill="#9e8460" opacity="0.35" />
      <path d="M8 153 Q24 150 40 153" stroke="#684f2f" strokeWidth="0.8" fill="none" opacity="0.5" />
      <path d="M60 151 Q78 149 92 152" stroke="#684f2f" strokeWidth="0.8" fill="none" opacity="0.5" />

      <rect x="36" y="122" width="10" height="32" fill="#334155" stroke="#172033" strokeWidth="1.2" rx="1" />
      <rect x="50" y="122" width="10" height="32" fill="#1e293b" stroke="#0f172a" strokeWidth="1.2" rx="1" />
      <path d="M34 150 L47 150 L48 156 L32 156 Z" fill="#2d1c10" stroke="#160d07" strokeWidth="1.1" />
      <path d="M48 150 L61 150 L62 156 L46 156 Z" fill="#24140a" stroke="#160d07" strokeWidth="1.1" />

      <path
        d="M14 66 C14 66 38 64 45 76 C45 106 34 130 18 138 C10 126 8 98 8 76 Z"
        fill="url(#shield_heater_grad)"
        stroke="#271809"
        strokeWidth="1.8"
      />
      <path d="M10 88 L43 86" stroke="#facc15" strokeWidth="2.4" opacity="0.9" />
      <path d="M26 68 L24 128" stroke="#facc15" strokeWidth="2.4" opacity="0.9" />
      <circle cx="25" cy="87" r="2.8" fill="#fef08a" stroke="#271809" strokeWidth="0.8" />

      <path
        d="M30 64 L72 64 L76 124 L24 124 Z"
        fill="url(#spear_tunic_grad)"
        stroke="#1e293b"
        strokeWidth="1.6"
      />
      <line x1="36" y1="64" x2="32" y2="124" stroke="#1f2937" strokeWidth="0.8" opacity="0.7" />
      <line x1="44" y1="64" x2="42" y2="124" stroke="#1f2937" strokeWidth="0.8" opacity="0.7" />
      <line x1="52" y1="64" x2="52" y2="124" stroke="#1f2937" strokeWidth="0.8" opacity="0.7" />
      <line x1="60" y1="64" x2="62" y2="124" stroke="#1f2937" strokeWidth="0.8" opacity="0.7" />
      <line x1="68" y1="64" x2="72" y2="124" stroke="#1f2937" strokeWidth="0.8" opacity="0.7" />

      <rect x="25" y="94" width="51" height="5" fill="#271809" stroke="#120a04" strokeWidth="1" />
      <rect x="47" y="93" width="7" height="7" fill="#fbbf24" stroke="#78350f" strokeWidth="0.9" rx="0.8" />

      <path
        d="M36 40 C36 28 66 28 66 40 L70 68 L32 68 Z"
        fill="#475569"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      <path
        d="M36 40 C36 28 66 28 66 40 L70 68 L32 68 Z"
        fill="url(#mail_pattern)"
        opacity="0.85"
      />

      <path
        d="M42 38 C42 32 60 32 60 38 C60 48 57 56 50 58 C45 56 42 48 42 38 Z"
        fill="#fde68a"
        stroke="#92400e"
        strokeWidth="1.1"
      />
      <path d="M45 39 Q48 38 50 40" stroke="#451a03" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <circle cx="48" cy="40.5" r="1.1" fill="#261205" />
      <path d="M51 40 L53 45 L50 46" stroke="#78350f" strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M46 48 Q51 51 56 48" stroke="#451a03" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M48 52 Q50 53 52 52" stroke="#92400e" strokeWidth="1" fill="none" strokeLinecap="round" />

      <path
        d="M34 35 C36 18 64 18 66 35 L76 40 L24 40 Z"
        fill="url(#spear_helm_grad)"
        stroke="#0f172a"
        strokeWidth="1.6"
      />
      <path d="M24 40 Q50 38 76 40" stroke="#f8fafc" strokeWidth="1" fill="none" opacity="0.8" />
      <circle cx="50" cy="19" r="1.8" fill="#fbbf24" stroke="#0f172a" strokeWidth="0.7" />

      <path d="M64 66 L78 84 L74 92 L62 74 Z" fill="#4b5563" stroke="#1f2937" strokeWidth="1.3" />
      <ellipse cx="77" cy="88" rx="4" ry="4.8" fill="#fde68a" stroke="#78350f" strokeWidth="1.1" />

      <line x1="78" y1="172" x2="78" y2="14" stroke="#5a2e0a" strokeWidth="3.2" strokeLinecap="round" />
      <line x1="77.2" y1="172" x2="77.2" y2="14" stroke="#92400e" strokeWidth="1" opacity="0.7" />

      <rect x="73" y="27" width="10" height="2" fill="#334155" stroke="#0f172a" strokeWidth="0.8" rx="0.4" />

      <path
        d="M78 6 C74 15 73 23 75 27 L81 27 C83 23 82 15 78 6 Z"
        fill="url(#spear_blade_grad)"
        stroke="#0f172a"
        strokeWidth="1.3"
      />
      <line x1="78" y1="6" x2="78" y2="27" stroke="#ffffff" strokeWidth="0.9" opacity="0.9" />
    </svg>
  );
};

export const SwordsmanIllustration: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => {
  return (
    <svg viewBox="0 0 100 180" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="sw_parch" cx="48%" cy="46%" r="68%">
          <stop offset="0%" stopColor="#faf5e9" />
          <stop offset="60%" stopColor="#ede0c8" />
          <stop offset="88%" stopColor="#dac29e" />
          <stop offset="100%" stopColor="#b4966e" />
        </radialGradient>

        <pattern id="sw_mail_pat" x="0" y="0" width="3.5" height="3.5" patternUnits="userSpaceOnUse">
          <circle cx="1.75" cy="1.75" r="1.3" stroke="#1e293b" strokeWidth="0.6" fill="#475569" fillOpacity="0.4" />
        </pattern>

        <linearGradient id="sw_blade_grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="35%" stopColor="#ffffff" />
          <stop offset="65%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>

        <linearGradient id="sw_tabard_blue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="60%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#172554" />
        </linearGradient>

        <linearGradient id="sw_plate_grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="45%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
      </defs>

      <rect width="100" height="180" fill="url(#sw_parch)" />

      <line x1="6" y1="26" x2="94" y2="26" stroke="#cbb493" strokeWidth="0.5" strokeDasharray="1.5 2.5" opacity="0.6" />
      <line x1="6" y1="46" x2="94" y2="46" stroke="#cbb493" strokeWidth="0.5" strokeDasharray="1.5 2.5" opacity="0.6" />
      <line x1="6" y1="68" x2="94" y2="68" stroke="#cbb493" strokeWidth="0.5" strokeDasharray="1.5 2.5" opacity="0.6" />
      <line x1="6" y1="90" x2="94" y2="90" stroke="#cbb493" strokeWidth="0.5" strokeDasharray="1.5 2.5" opacity="0.6" />
      <line x1="6" y1="112" x2="94" y2="112" stroke="#cbb493" strokeWidth="0.5" strokeDasharray="1.5 2.5" opacity="0.6" />
      <line x1="6" y1="134" x2="94" y2="134" stroke="#cbb493" strokeWidth="0.5" strokeDasharray="1.5 2.5" opacity="0.6" />

      <rect x="3" y="3" width="94" height="174" stroke="#5c4428" strokeWidth="1.4" fill="none" opacity="0.85" />
      <rect x="5.5" y="5.5" width="89" height="169" stroke="#8c6d44" strokeWidth="0.6" strokeDasharray="2 1.5" fill="none" opacity="0.5" />

      <path d="M0 148 Q25 144 50 147 T100 149 L100 180 L0 180 Z" fill="#9e8460" opacity="0.35" />

      <rect x="36" y="122" width="10" height="32" fill="url(#sw_plate_grad)" stroke="#0f172a" strokeWidth="1.2" rx="1" />
      <rect x="50" y="122" width="10" height="32" fill="#334155" stroke="#0f172a" strokeWidth="1.2" rx="1" />
      <path d="M33 150 L47 150 L48 156 L31 156 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="1.1" />
      <path d="M47 150 L61 150 L62 156 L45 156 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="1.1" />

      <path
        d="M13 66 C13 66 37 64 44 76 C44 106 33 130 17 138 C9 126 7 98 7 76 Z"
        fill="#991b1b"
        stroke="#1c1917"
        strokeWidth="1.8"
      />
      <path
        d="M13 66 C13 66 37 64 44 76 C44 106 33 130 17 138"
        stroke="#facc15"
        strokeWidth="1.8"
        fill="none"
      />
      <polygon points="21,80 29,80 33,94 29,106 21,106 17,94" fill="#facc15" stroke="#78350f" strokeWidth="0.8" />

      <path
        d="M28 64 L72 64 L76 124 L24 124 Z"
        fill="url(#sw_tabard_blue)"
        stroke="#0f172a"
        strokeWidth="1.6"
      />
      <path
        d="M48 76 C44 74 42 78 44 82 C46 85 50 84 52 88 C52 92 46 93 48 96 C52 98 58 94 56 90 C58 86 54 82 54 78 Z"
        fill="#facc15"
        stroke="#78350f"
        strokeWidth="0.7"
      />

      <rect x="25" y="94" width="51" height="5" fill="#29180c" stroke="#1c1917" strokeWidth="1" />
      <rect x="47" y="93" width="7" height="7" fill="#facc15" stroke="#78350f" strokeWidth="0.9" rx="0.8" />

      <path
        d="M34 38 C34 26 66 26 66 38 L70 66 L30 66 Z"
        fill="#475569"
        stroke="#0f172a"
        strokeWidth="1.5"
      />
      <path
        d="M34 38 C34 26 66 26 66 38 L70 66 L30 66 Z"
        fill="url(#sw_mail_pat)"
        opacity="0.85"
      />

      <path
        d="M34 20 C36 10 64 10 66 20 L68 48 L32 48 Z"
        fill="url(#sw_plate_grad)"
        stroke="#0f172a"
        strokeWidth="1.6"
      />
      <rect x="40" y="32" width="20" height="3" fill="#090d16" stroke="#000000" strokeWidth="0.7" rx="0.8" />
      <circle cx="45" cy="40" r="0.8" fill="#0f172a" />
      <circle cx="49" cy="40" r="0.8" fill="#0f172a" />
      <circle cx="53" cy="40" r="0.8" fill="#0f172a" />
      <circle cx="57" cy="40" r="0.8" fill="#0f172a" />

      <path d="M64 64 L80 75 L74 85 L62 72 Z" fill="#1e3a8a" stroke="#0f172a" strokeWidth="1.3" />
      <ellipse cx="79" cy="78" rx="4.2" ry="5.2" fill="#64748b" stroke="#0f172a" strokeWidth="1.1" />

      <circle cx="80" cy="90" r="3.4" fill="#facc15" stroke="#78350f" strokeWidth="0.8" />
      <rect x="78.5" y="80" width="3.6" height="8" fill="#29180c" stroke="#170d07" strokeWidth="0.7" rx="0.4" />
      <rect x="69" y="77" width="22" height="3.5" fill="#facc15" stroke="#78350f" strokeWidth="1" rx="0.8" />
      <polygon points="76,77 82,77 80.5,14 78,14" fill="url(#sw_blade_grad)" stroke="#0f172a" strokeWidth="1.4" />
      <line x1="79.3" y1="76" x2="79.3" y2="20" stroke="#ffffff" strokeWidth="0.8" opacity="0.9" />
    </svg>
  );
};

export const AddSquadCardIllustration: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => {
  return (
    <svg viewBox="0 0 100 180" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="add_slate_bg" cx="50%" cy="48%" r="65%">
          <stop offset="0%" stopColor="#252834" />
          <stop offset="60%" stopColor="#1a1c24" />
          <stop offset="100%" stopColor="#111217" />
        </radialGradient>

        <radialGradient id="seal_iron" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="50%" stopColor="#334155" />
          <stop offset="100%" stopColor="#1e293b" />
        </radialGradient>

        <linearGradient id="plus_white_bevel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
      </defs>

      <rect width="100" height="180" fill="url(#add_slate_bg)" />

      <rect x="3" y="3" width="94" height="174" stroke="#3e4354" strokeWidth="1.2" fill="none" opacity="0.8" />
      <rect x="5.5" y="5.5" width="89" height="169" stroke="#2a2e3b" strokeWidth="0.6" strokeDasharray="3 2" fill="none" opacity="0.6" />

      <circle cx="8" cy="8" r="1.5" fill="#64748b" opacity="0.5" />
      <circle cx="92" cy="8" r="1.5" fill="#64748b" opacity="0.5" />
      <circle cx="8" cy="172" r="1.5" fill="#64748b" opacity="0.5" />
      <circle cx="92" cy="172" r="1.5" fill="#64748b" opacity="0.5" />

      <circle cx="50" cy="90" r="32" fill="#090a0d" opacity="0.7" />
      <circle cx="50" cy="88" r="30" fill="url(#seal_iron)" stroke="#0f172a" strokeWidth="2" />
      <circle cx="50" cy="88" r="27" stroke="#64748b" strokeWidth="1" strokeDasharray="2 1.5" fill="none" opacity="0.7" />
      <circle cx="50" cy="88" r="23" fill="#15171f" stroke="#090a0d" strokeWidth="1.6" />

      <rect x="45.5" y="73" width="9" height="30" rx="2" fill="url(#plus_white_bevel)" stroke="#090a0d" strokeWidth="1.1" />
      <rect x="35" y="83.5" width="30" height="9" rx="2" fill="url(#plus_white_bevel)" stroke="#090a0d" strokeWidth="1.1" />
    </svg>
  );
};
