import React from 'react';
import type { BuildingType } from '../../../types/game';

export const BuildingIllustration: React.FC<{ type: BuildingType; className?: string }> = ({ type, className = 'w-full h-full' }) => {
  switch (type) {
    case 'tent':
      return (
        <svg viewBox="0 0 100 110" className={className} fill="none">
          <defs>
            <linearGradient id="sky_tent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#dbe4e6" />
              <stop offset="60%" stopColor="#ede6d6" />
              <stop offset="100%" stopColor="#d9cdb6" />
            </linearGradient>
            <linearGradient id="grass_tent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7a8c54" />
              <stop offset="50%" stopColor="#5d6e3c" />
              <stop offset="100%" stopColor="#45542a" />
            </linearGradient>
            <linearGradient id="canvas_tent" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f3e8d2" />
              <stop offset="70%" stopColor="#d9c39c" />
              <stop offset="100%" stopColor="#bfa57c" />
            </linearGradient>
          </defs>
          <rect width="100" height="110" fill="url(#sky_tent)" />
          <path d="M0 68 C30 64 70 65 100 68 L100 110 L0 110 Z" fill="url(#grass_tent)" />
          <path d="M0 64 C25 60 50 63 65 65" stroke="#9bb074" strokeWidth="1" fill="none" opacity="0.6" />

          <path d="M6 72 C12 60 16 60 22 72 Z" fill="#4d5c32" opacity="0.6" />
          <path d="M80 70 C85 58 89 58 94 70 Z" fill="#4d5c32" opacity="0.6" />

          <line x1="12" y1="78" x2="22" y2="70" stroke="#523e25" strokeWidth="1.5" />
          <circle cx="12" cy="78" r="1.5" fill="#382914" />
          <line x1="88" y1="78" x2="78" y2="70" stroke="#523e25" strokeWidth="1.5" />
          <circle cx="88" cy="78" r="1.5" fill="#382914" />

          <polygon points="50,16 16,74 84,74" fill="url(#canvas_tent)" stroke="#4a371e" strokeWidth="1.8" strokeLinejoin="round" />
          <polygon points="50,16 40,74 16,74" fill="#cfb68c" stroke="#4a371e" strokeWidth="1.2" />
          <polygon points="50,16 42,74 58,74" fill="#291a0c" />
          <line x1="50" y1="12" x2="50" y2="18" stroke="#3b2b16" strokeWidth="2.5" strokeLinecap="round" />

          <line x1="32" y1="46" x2="38" y2="74" stroke="#876e47" strokeWidth="1" opacity="0.6" strokeDasharray="2 1" />
          <line x1="68" y1="46" x2="62" y2="74" stroke="#876e47" strokeWidth="1" opacity="0.6" strokeDasharray="2 1" />

          <ellipse cx="28" cy="84" rx="8" ry="4" fill="#382e21" opacity="0.4" />
          <circle cx="24" cy="83" r="2.5" fill="#695e4f" />
          <circle cx="28" cy="85" r="3" fill="#807361" />
          <circle cx="32" cy="83" r="2.5" fill="#695e4f" />
          <path d="M28 82 Q30 76 28 72" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" />
          <circle cx="28" cy="81" r="1.5" fill="#facc15" />

          <path d="M68 84 Q72 80 76 84" stroke="#8da857" strokeWidth="1.5" fill="none" />
          <path d="M78 86 Q82 82 86 86" stroke="#8da857" strokeWidth="1.5" fill="none" />
          <circle cx="74" cy="81" r="1.2" fill="#ef4444" />
          <circle cx="84" cy="83" r="1.2" fill="#3b82f6" />
        </svg>
      );

    case 'peasant_house':
      return (
        <svg viewBox="0 0 100 110" className={className} fill="none">
          <defs>
            <linearGradient id="sky_house" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#cfe0e8" />
              <stop offset="70%" stopColor="#ede5d3" />
              <stop offset="100%" stopColor="#cfc2a7" />
            </linearGradient>
            <linearGradient id="thatch_roof" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b5874c" />
              <stop offset="50%" stopColor="#8f632f" />
              <stop offset="100%" stopColor="#664319" />
            </linearGradient>
          </defs>
          <rect width="100" height="110" fill="url(#sky_house)" />
          <path d="M0 66 Q50 62 100 66 L100 110 L0 110 Z" fill="#657540" />

          <rect x="68" y="16" width="8" height="22" fill="#807466" stroke="#3b3227" strokeWidth="1.2" />
          <line x1="68" y1="22" x2="76" y2="22" stroke="#4d4438" strokeWidth="1" />
          <line x1="68" y1="28" x2="76" y2="28" stroke="#4d4438" strokeWidth="1" />
          <path d="M72 14 C70 9 76 6 74 2" stroke="#9ca3af" strokeWidth="1.5" opacity="0.7" strokeLinecap="round" />

          <rect x="18" y="44" width="64" height="34" fill="#ede0ca" stroke="#3d2b17" strokeWidth="1.8" />
          <line x1="18" y1="60" x2="82" y2="60" stroke="#4a341c" strokeWidth="2" />
          <line x1="38" y1="44" x2="38" y2="78" stroke="#4a341c" strokeWidth="1.8" />
          <line x1="62" y1="44" x2="62" y2="78" stroke="#4a341c" strokeWidth="1.8" />
          <line x1="18" y1="44" x2="38" y2="60" stroke="#4a341c" strokeWidth="1.2" />
          <line x1="38" y1="60" x2="18" y2="78" stroke="#4a341c" strokeWidth="1.2" />
          <line x1="62" y1="44" x2="82" y2="60" stroke="#4a341c" strokeWidth="1.2" />
          <line x1="82" y1="60" x2="62" y2="78" stroke="#4a341c" strokeWidth="1.2" />

          <polygon points="50,16 10,46 90,46" fill="url(#thatch_roof)" stroke="#38220c" strokeWidth="2" strokeLinejoin="round" />
          <line x1="50" y1="16" x2="26" y2="46" stroke="#523717" strokeWidth="1.2" />
          <line x1="50" y1="16" x2="74" y2="46" stroke="#523717" strokeWidth="1.2" />
          <line x1="22" y1="36" x2="78" y2="36" stroke="#422a10" strokeWidth="1" strokeDasharray="3 2" />

          <rect x="44" y="58" width="12" height="20" fill="#422911" stroke="#211204" strokeWidth="1.2" />
          <circle cx="53" cy="68" r="1" fill="#facc15" />

          <rect x="23" y="49" width="10" height="8" fill="#fef08a" stroke="#4a341c" strokeWidth="1.2" />
          <line x1="28" y1="49" x2="28" y2="57" stroke="#4a341c" strokeWidth="0.8" />
          <line x1="23" y1="53" x2="33" y2="53" stroke="#4a341c" strokeWidth="0.8" />

          <rect x="67" y="49" width="10" height="8" fill="#fef08a" stroke="#4a341c" strokeWidth="1.2" />
          <line x1="72" y1="49" x2="72" y2="57" stroke="#4a341c" strokeWidth="0.8" />
          <line x1="67" y1="53" x2="77" y2="53" stroke="#4a341c" strokeWidth="0.8" />

          <path d="M6 82 L14 82 L14 74 L6 74 Z" fill="#695638" stroke="#3b2d19" strokeWidth="1" />
          <line x1="14" y1="80" x2="22" y2="80" stroke="#544128" strokeWidth="1.5" />
          <line x1="14" y1="76" x2="22" y2="76" stroke="#544128" strokeWidth="1.5" />
        </svg>
      );

    case 'manor':
      return (
        <svg viewBox="0 0 100 110" className={className} fill="none">
          <defs>
            <linearGradient id="sky_manor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b8cad4" />
              <stop offset="60%" stopColor="#e2dacc" />
              <stop offset="100%" stopColor="#c7baa1" />
            </linearGradient>
            <linearGradient id="stone_wall_grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#9e9487" />
              <stop offset="50%" stopColor="#b8ad9e" />
              <stop offset="100%" stopColor="#8c8275" />
            </linearGradient>
          </defs>
          <rect width="100" height="110" fill="url(#sky_manor)" />
          <path d="M0 72 L100 72 L100 110 L0 110 Z" fill="#525e3b" />

          <rect x="14" y="36" width="24" height="42" fill="url(#stone_wall_grad)" stroke="#383229" strokeWidth="1.6" />
          <polygon points="26,14 10,36 42,36" fill="#8c2f27" stroke="#45120d" strokeWidth="1.5" />
          <line x1="26" y1="14" x2="26" y2="6" stroke="#2b2014" strokeWidth="1.5" />
          <polygon points="26,6 34,9 26,12" fill="#dc2626" />

          <rect x="62" y="36" width="24" height="42" fill="url(#stone_wall_grad)" stroke="#383229" strokeWidth="1.6" />
          <polygon points="74,14 58,36 90,36" fill="#8c2f27" stroke="#45120d" strokeWidth="1.5" />
          <line x1="74" y1="14" x2="74" y2="6" stroke="#2b2014" strokeWidth="1.5" />
          <polygon points="74,6 82,9 74,12" fill="#dc2626" />

          <rect x="34" y="44" width="32" height="34" fill="#a89d8e" stroke="#383229" strokeWidth="1.6" />
          <polygon points="50,26 30,44 70,44" fill="#a13b32" stroke="#45120d" strokeWidth="1.5" />

          <path d="M43 78 L43 62 C43 56 57 56 57 62 L57 78 Z" fill="#291b10" stroke="#120b05" strokeWidth="1.5" />
          <path d="M43 66 L57 66" stroke="#4a3725" strokeWidth="1.2" />

          <rect x="22" y="46" width="8" height="12" rx="4" fill="#1e293b" stroke="#383229" strokeWidth="1" />
          <rect x="70" y="46" width="8" height="12" rx="4" fill="#1e293b" stroke="#383229" strokeWidth="1" />
          <rect x="46" y="49" width="8" height="9" rx="4" fill="#fef08a" stroke="#383229" strokeWidth="0.8" />
        </svg>
      );

    case 'lumberjack_hut':
      return (
        <svg viewBox="0 0 100 110" className={className} fill="none">
          <defs>
            <linearGradient id="sky_lumber" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c8d6db" />
              <stop offset="70%" stopColor="#e5decb" />
              <stop offset="100%" stopColor="#cfc2a5" />
            </linearGradient>
          </defs>
          <rect width="100" height="110" fill="url(#sky_lumber)" />
          <path d="M0 68 Q50 62 100 68 L100 110 L0 110 Z" fill="#586938" />

          <polygon points="12,30 4,68 20,68" fill="#2d4220" />
          <polygon points="12,18 6,42 18,42" fill="#3a542a" />
          <polygon points="88,32 80,68 96,68" fill="#2d4220" />
          <polygon points="88,20 82,44 94,44" fill="#3a542a" />

          <rect x="24" y="46" width="52" height="32" fill="#9e7343" stroke="#3d2913" strokeWidth="1.8" />
          <line x1="24" y1="54" x2="76" y2="54" stroke="#4d3419" strokeWidth="1.2" />
          <line x1="24" y1="62" x2="76" y2="62" stroke="#4d3419" strokeWidth="1.2" />
          <line x1="24" y1="70" x2="76" y2="70" stroke="#4d3419" strokeWidth="1.2" />

          <polygon points="50,22 18,46 82,46" fill="#54371a" stroke="#2e1b09" strokeWidth="2" strokeLinejoin="round" />
          <line x1="50" y1="22" x2="30" y2="46" stroke="#3b240f" strokeWidth="1.2" />
          <line x1="50" y1="22" x2="70" y2="46" stroke="#3b240f" strokeWidth="1.2" />

          <rect x="44" y="58" width="12" height="20" fill="#241609" />
          <rect x="29" y="52" width="7" height="7" fill="#fde047" stroke="#3d2913" strokeWidth="0.8" />

          <ellipse cx="80" cy="74" rx="6" ry="3" fill="#8c5e31" stroke="#38230f" strokeWidth="1" />
          <ellipse cx="80" cy="70" rx="5" ry="2.5" fill="#8c5e31" stroke="#38230f" strokeWidth="1" />
          <ellipse cx="80" cy="66" rx="4" ry="2" fill="#b07d48" stroke="#38230f" strokeWidth="1" />

          <rect x="12" y="74" width="8" height="6" fill="#52391d" stroke="#2b1c0b" strokeWidth="1" />
          <line x1="16" y1="72" x2="22" y2="65" stroke="#71717a" strokeWidth="2" strokeLinecap="round" />
          <polygon points="21,65 24,67 22,70" fill="#3f3f46" />
        </svg>
      );

    case 'stone_quarry':
      return (
        <svg viewBox="0 0 100 110" className={className} fill="none">
          <defs>
            <linearGradient id="sky_quarry" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c4d1d6" />
              <stop offset="70%" stopColor="#e2ded4" />
              <stop offset="100%" stopColor="#baa993" />
            </linearGradient>
          </defs>
          <rect width="100" height="110" fill="url(#sky_quarry)" />

          <polygon points="0,38 36,32 76,42 100,34 100,110 0,110" fill="#7d7870" />
          <polygon points="12,46 44,40 50,76 18,82" fill="#69635b" stroke="#3b3731" strokeWidth="1.5" />
          <polygon points="44,40 76,46 84,80 50,76" fill="#8c857d" stroke="#3b3731" strokeWidth="1.5" />

          <rect x="18" y="76" width="16" height="10" fill="#b0aba2" stroke="#3b3731" strokeWidth="1.2" />
          <rect x="36" y="74" width="14" height="12" fill="#c4bfb6" stroke="#3b3731" strokeWidth="1.2" />
          <rect x="28" y="68" width="14" height="8" fill="#9e988e" stroke="#3b3731" strokeWidth="1.2" />

          <line x1="68" y1="30" x2="68" y2="68" stroke="#4d351e" strokeWidth="3" strokeLinecap="round" />
          <line x1="54" y1="38" x2="82" y2="38" stroke="#4d351e" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="56" y1="38" x2="68" y2="30" stroke="#4d351e" strokeWidth="2" />
          <line x1="80" y1="38" x2="80" y2="58" stroke="#1f1811" strokeWidth="1.2" strokeDasharray="2 1" />
          <rect x="76" y="58" width="8" height="7" fill="#999287" stroke="#2b2722" strokeWidth="1" />
        </svg>
      );

    case 'iron_mine':
      return (
        <svg viewBox="0 0 100 110" className={className} fill="none">
          <defs>
            <linearGradient id="sky_mine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b8c2c7" />
              <stop offset="60%" stopColor="#d4cbc0" />
              <stop offset="100%" stopColor="#8a7e70" />
            </linearGradient>
          </defs>
          <rect width="100" height="110" fill="url(#sky_mine)" />
          <path d="M0 32 Q50 16 100 36 L100 110 L0 110 Z" fill="#575046" />

          <path d="M26 84 C26 44 74 44 74 84 Z" fill="#171411" stroke="#332c25" strokeWidth="2" />

          <line x1="22" y1="84" x2="22" y2="44" stroke="#54381c" strokeWidth="3.5" />
          <line x1="78" y1="84" x2="78" y2="44" stroke="#54381c" strokeWidth="3.5" />
          <line x1="18" y1="44" x2="82" y2="44" stroke="#54381c" strokeWidth="4" />
          <line x1="26" y1="62" x2="74" y2="62" stroke="#54381c" strokeWidth="2.5" />

          <line x1="34" y1="84" x2="28" y2="98" stroke="#382e25" strokeWidth="2" />
          <line x1="66" y1="84" x2="72" y2="98" stroke="#382e25" strokeWidth="2" />
          <line x1="28" y1="92" x2="72" y2="92" stroke="#5c4328" strokeWidth="2" />

          <rect x="40" y="72" width="20" height="12" fill="#473a30" stroke="#1f1812" strokeWidth="1.5" />
          <circle cx="44" cy="86" r="2.5" fill="#78350f" />
          <circle cx="56" cy="86" r="2.5" fill="#78350f" />
          <polygon points="44,68 56,66 54,72 42,72" fill="#c2410c" />
        </svg>
      );

    case 'clay_pit':
      return (
        <svg viewBox="0 0 100 110" className={className} fill="none">
          <defs>
            <linearGradient id="sky_clay" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#cad6db" />
              <stop offset="60%" stopColor="#ebdcc9" />
              <stop offset="100%" stopColor="#bfa382" />
            </linearGradient>
          </defs>
          <rect width="100" height="110" fill="url(#sky_clay)" />
          <path d="M0 64 Q50 58 100 64 L100 110 L0 110 Z" fill="#697548" />

          <ellipse cx="50" cy="76" rx="44" ry="24" fill="#a8683e" stroke="#4d2c14" strokeWidth="2" />
          <ellipse cx="48" cy="78" rx="34" ry="16" fill="#8a4f29" />
          <ellipse cx="44" cy="80" rx="20" ry="8" fill="#3b6978" />

          <path d="M14 62 Q24 48 34 58" fill="#ba7a4e" stroke="#4d2c14" strokeWidth="1.5" />
          <path d="M66 58 Q78 44 88 60" fill="#ba7a4e" stroke="#4d2c14" strokeWidth="1.5" />

          <line x1="70" y1="84" x2="78" y2="68" stroke="#54371c" strokeWidth="2" strokeLinecap="round" />
          <polygon points="76,68 82,70 80,64" fill="#71717a" />

          <rect x="22" y="70" width="10" height="10" rx="1" fill="#69482b" stroke="#2b1a0d" strokeWidth="1.2" />
          <path d="M24 70 C24 65 30 65 30 70" stroke="#2b1a0d" strokeWidth="1.2" fill="none" />
        </svg>
      );

    case 'salt_works':
      return (
        <svg viewBox="0 0 100 110" className={className} fill="none">
          <defs>
            <linearGradient id="sky_salt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#cfdfe6" />
              <stop offset="60%" stopColor="#ede6d8" />
              <stop offset="100%" stopColor="#d1cbbe" />
            </linearGradient>
          </defs>
          <rect width="100" height="110" fill="url(#sky_salt)" />

          <rect x="12" y="54" width="34" height="26" fill="#6b9aa6" stroke="#36545c" strokeWidth="1.8" />
          <rect x="54" y="54" width="34" height="26" fill="#7eaab5" stroke="#36545c" strokeWidth="1.8" />

          <polygon points="29,50 20,62 38,62" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
          <polygon points="71,48 60,62 82,62" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
          <polygon points="50,70 42,80 58,80" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />

          <polygon points="50,18 22,38 78,38" fill="#8c663f" stroke="#3d2813" strokeWidth="1.8" />
          <rect x="30" y="38" width="40" height="16" fill="#b59067" stroke="#3d2813" strokeWidth="1.5" />

          <path d="M46 16 C44 10 52 8 48 2" stroke="#94a3b8" strokeWidth="1.5" opacity="0.7" strokeLinecap="round" />
        </svg>
      );

    case 'fishermans_hut':
      return (
        <svg viewBox="0 0 100 110" className={className} fill="none">
          <defs>
            <linearGradient id="sky_fish" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c2d7e0" />
              <stop offset="60%" stopColor="#e2ecf0" />
              <stop offset="100%" stopColor="#9fc1cc" />
            </linearGradient>
            <linearGradient id="water_grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#437785" />
              <stop offset="50%" stopColor="#2e5966" />
              <stop offset="100%" stopColor="#1e3e47" />
            </linearGradient>
          </defs>
          <rect width="100" height="110" fill="url(#sky_fish)" />
          <path d="M0 64 C30 62 70 66 100 64 L100 110 L0 110 Z" fill="url(#water_grad)" />
          <path d="M0 76 Q50 72 100 76" stroke="#6aa2b0" strokeWidth="1.2" opacity="0.6" />
          <path d="M0 90 Q50 86 100 90" stroke="#6aa2b0" strokeWidth="1.2" opacity="0.6" />

          <line x1="18" y1="56" x2="18" y2="88" stroke="#3d2714" strokeWidth="2.5" />
          <line x1="38" y1="56" x2="38" y2="88" stroke="#3d2714" strokeWidth="2.5" />
          <line x1="58" y1="56" x2="58" y2="88" stroke="#3d2714" strokeWidth="2.5" />

          <rect x="14" y="36" width="48" height="26" fill="#9c7347" stroke="#3d2714" strokeWidth="1.8" />
          <polygon points="38,16 10,38 66,38" fill="#593b1d" stroke="#2b1a0a" strokeWidth="1.8" />

          <line x1="56" y1="50" x2="88" y2="50" stroke="#4d3219" strokeWidth="2.5" />
          <line x1="84" y1="50" x2="84" y2="84" stroke="#3d2714" strokeWidth="2.5" />

          <path d="M68 40 Q76 34 84 50" stroke="#c4a274" strokeWidth="1.2" strokeDasharray="2 1" fill="none" />

          <ellipse cx="26" cy="70" rx="4.5" ry="6.5" fill="#694827" stroke="#291809" strokeWidth="1.2" />
        </svg>
      );

    case 'foragers_hut':
      return (
        <svg viewBox="0 0 100 110" className={className} fill="none">
          <defs>
            <linearGradient id="sky_forager" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#cfdfd5" />
              <stop offset="60%" stopColor="#ebe8d8" />
              <stop offset="100%" stopColor="#c7d4bc" />
            </linearGradient>
          </defs>
          <rect width="100" height="110" fill="url(#sky_forager)" />
          <path d="M0 66 Q50 60 100 68 L100 110 L0 110 Z" fill="#586e3f" />

          <polygon points="50,18 14,50 86,50" fill="#3f5c2a" stroke="#1f3013" strokeWidth="2" strokeLinejoin="round" />
          <rect x="22" y="50" width="56" height="28" fill="#ab8755" stroke="#3b2913" strokeWidth="1.8" />
          <rect x="44" y="58" width="12" height="20" fill="#29190a" />

          <ellipse cx="18" cy="84" rx="6" ry="5" fill="#8f5b2b" stroke="#3b210a" strokeWidth="1.2" />
          <circle cx="16" cy="82" r="2" fill="#ef4444" />
          <circle cx="20" cy="81" r="2" fill="#a855f7" />
          <circle cx="18" cy="85" r="2" fill="#ef4444" />

          <ellipse cx="82" cy="82" rx="7" ry="5" fill="#8f5b2b" stroke="#3b210a" strokeWidth="1.2" />
          <path d="M80 80 Q82 74 84 80" stroke="#f59e0b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M77 82 Q79 77 81 82" stroke="#d97706" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'hunters_hut':
      return (
        <svg viewBox="0 0 100 110" className={className} fill="none">
          <defs>
            <linearGradient id="sky_hunter" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#cad6d9" />
              <stop offset="60%" stopColor="#e5ded0" />
              <stop offset="100%" stopColor="#baa68f" />
            </linearGradient>
          </defs>
          <rect width="100" height="110" fill="url(#sky_hunter)" />
          <path d="M0 68 Q50 62 100 70 L100 110 L0 110 Z" fill="#575240" />

          <rect x="22" y="44" width="56" height="34" fill="#8c6237" stroke="#36220e" strokeWidth="1.8" />
          <polygon points="50,18 14,46 86,46" fill="#4a3017" stroke="#211306" strokeWidth="2" strokeLinejoin="round" />

          <rect x="42" y="56" width="16" height="22" fill="#1f1105" />

          <path d="M44 34 L50 42 L56 34 M41 32 L46 36 M59 32 L54 36" stroke="#f8fafc" strokeWidth="2" strokeLinecap="round" />
          <circle cx="50" cy="43" r="2" fill="#f8fafc" />

          <line x1="78" y1="50" x2="78" y2="80" stroke="#3d2712" strokeWidth="2" />
          <line x1="90" y1="50" x2="90" y2="80" stroke="#3d2712" strokeWidth="2" />
          <line x1="76" y1="54" x2="92" y2="54" stroke="#3d2712" strokeWidth="2" />
          <polygon points="80,56 88,56 90,70 84,76 78,70" fill="#a8432a" stroke="#451408" strokeWidth="1" />
        </svg>
      );

    case 'stockpile':
      return (
        <svg viewBox="0 0 100 110" className={className} fill="none">
          <defs>
            <linearGradient id="sky_stock" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#cfdadb" />
              <stop offset="60%" stopColor="#ede5d3" />
              <stop offset="100%" stopColor="#c4b8a1" />
            </linearGradient>
          </defs>
          <rect width="100" height="110" fill="url(#sky_stock)" />
          <path d="M0 72 L100 72 L100 110 L0 110 Z" fill="#695f4c" />

          <rect x="12" y="66" width="76" height="8" fill="#6e4c27" stroke="#33200c" strokeWidth="1.8" />
          <line x1="18" y1="32" x2="18" y2="66" stroke="#422a13" strokeWidth="3" />
          <line x1="82" y1="32" x2="82" y2="66" stroke="#422a13" strokeWidth="3" />
          <polygon points="50,18 10,34 90,34" fill="#a17a47" stroke="#3d270e" strokeWidth="2" strokeLinejoin="round" />

          <rect x="22" y="48" width="16" height="18" fill="#8c6031" stroke="#38220c" strokeWidth="1.2" />
          <line x1="22" y1="48" x2="38" y2="66" stroke="#38220c" strokeWidth="1" />
          <rect x="36" y="50" width="14" height="16" fill="#784f24" stroke="#38220c" strokeWidth="1.2" />

          <ellipse cx="62" cy="58" rx="6" ry="8" fill="#573a1c" stroke="#241608" strokeWidth="1.2" />
          <ellipse cx="74" cy="58" rx="6" ry="8" fill="#573a1c" stroke="#241608" strokeWidth="1.2" />
          <ellipse cx="68" cy="46" rx="5" ry="7" fill="#694723" stroke="#241608" strokeWidth="1.2" />
        </svg>
      );

    case 'campfire':
      return (
        <svg viewBox="0 0 100 110" className={className} fill="none">
          <defs>
            <linearGradient id="sky_camp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e2433" />
              <stop offset="60%" stopColor="#3d373b" />
              <stop offset="100%" stopColor="#5c4436" />
            </linearGradient>
          </defs>
          <rect width="100" height="110" fill="url(#sky_camp)" />
          <ellipse cx="50" cy="80" rx="40" ry="20" fill="#3b3226" />

          <circle cx="26" cy="78" r="6" fill="#71717a" stroke="#27272a" strokeWidth="1.2" />
          <circle cx="36" cy="86" r="7" fill="#52525b" stroke="#27272a" strokeWidth="1.2" />
          <circle cx="52" cy="88" r="6.5" fill="#71717a" stroke="#27272a" strokeWidth="1.2" />
          <circle cx="68" cy="85" r="7" fill="#52525b" stroke="#27272a" strokeWidth="1.2" />
          <circle cx="74" cy="76" r="6" fill="#71717a" stroke="#27272a" strokeWidth="1.2" />
          <circle cx="64" cy="70" r="6" fill="#52525b" stroke="#27272a" strokeWidth="1.2" />
          <circle cx="48" cy="68" r="6" fill="#71717a" stroke="#27272a" strokeWidth="1.2" />
          <circle cx="34" cy="70" r="6.5" fill="#52525b" stroke="#27272a" strokeWidth="1.2" />

          <line x1="30" y1="82" x2="70" y2="70" stroke="#3b210c" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="32" y1="70" x2="68" y2="82" stroke="#3b210c" strokeWidth="4.5" strokeLinecap="round" />

          <path d="M50 28 C40 46 38 62 43 72 C48 78 54 78 57 72 C64 62 60 44 50 28 Z" fill="#ea580c" opacity="0.9" />
          <path d="M50 38 C44 50 44 62 48 70 C51 72 53 72 54 70 C58 62 56 48 50 38 Z" fill="#facc15" />
          <path d="M50 50 C48 58 48 66 50 68 C52 66 52 58 50 50 Z" fill="#ffffff" />
        </svg>
      );

    case 'wheat_farm':
      return (
        <svg viewBox="0 0 100 110" className={className} fill="none">
          <defs>
            <linearGradient id="sky_wheat" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#bfd7e6" />
              <stop offset="50%" stopColor="#e8e5d1" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>
          </defs>
          <rect width="100" height="110" fill="url(#sky_wheat)" />
          <path d="M0 56 L100 56 L100 110 L0 110 Z" fill="#ca8a04" opacity="0.6" />

          <rect x="54" y="32" width="36" height="28" fill="#9e7343" stroke="#3d2913" strokeWidth="1.6" />
          <polygon points="72,12 48,34 96,34" fill="#69221c" stroke="#2d0b08" strokeWidth="1.6" />
          <rect x="64" y="42" width="14" height="18" fill="#241407" />

          <line x1="8" y1="70" x2="92" y2="70" stroke="#854d0e" strokeWidth="1.5" strokeDasharray="5 3" />
          <line x1="4" y1="84" x2="96" y2="84" stroke="#854d0e" strokeWidth="1.5" strokeDasharray="5 3" />
          <line x1="0" y1="98" x2="100" y2="98" stroke="#854d0e" strokeWidth="1.5" strokeDasharray="5 3" />

          <path d="M16 60 L16 46 M13 46 C16 42 19 42 19 46 M12 51 C16 48 20 48 20 51" stroke="#eab308" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M28 66 L28 52 M25 52 C28 48 31 48 31 52 M24 57 C28 54 32 54 32 57" stroke="#eab308" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M40 62 L40 48 M37 48 C40 44 43 44 43 48 M36 53 C40 50 44 50 44 53" stroke="#eab308" strokeWidth="2.2" strokeLinecap="round" />

          <path d="M22 92 C32 88 34 78 30 78" stroke="#71717a" strokeWidth="2" fill="none" strokeLinecap="round" />
          <line x1="30" y1="78" x2="18" y2="100" stroke="#4d351b" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'windmill':
      return (
        <svg viewBox="0 0 100 110" className={className} fill="none">
          <defs>
            <linearGradient id="sky_mill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#bed5e3" />
              <stop offset="60%" stopColor="#ebe4d6" />
              <stop offset="100%" stopColor="#bfb297" />
            </linearGradient>
          </defs>
          <rect width="100" height="110" fill="url(#sky_mill)" />
          <path d="M0 72 Q50 66 100 72 L100 110 L0 110 Z" fill="#617345" />

          <polygon points="34,36 66,36 72,82 28,82" fill="#d1c7b4" stroke="#3b3327" strokeWidth="2" />
          <polygon points="50,18 32,36 68,36" fill="#694220" stroke="#2e1a08" strokeWidth="1.8" />
          <rect x="44" y="62" width="12" height="20" fill="#241407" />

          <circle cx="50" cy="36" r="4" fill="#241407" stroke="#d4af37" strokeWidth="1.2" />

          <line x1="50" y1="36" x2="18" y2="4" stroke="#3d2713" strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="18,4 30,7 42,28 30,25" fill="#f8fafc" stroke="#3d2713" strokeWidth="1" />

          <line x1="50" y1="36" x2="82" y2="4" stroke="#3d2713" strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="82,4 79,16 58,28 61,16" fill="#f8fafc" stroke="#3d2713" strokeWidth="1" />

          <line x1="50" y1="36" x2="82" y2="68" stroke="#3d2713" strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="82,68 70,65 58,44 70,47" fill="#f8fafc" stroke="#3d2713" strokeWidth="1" />

          <line x1="50" y1="36" x2="18" y2="68" stroke="#3d2713" strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="18,68 21,56 42,44 39,56" fill="#f8fafc" stroke="#3d2713" strokeWidth="1" />
        </svg>
      );

    case 'bakery':
      return (
        <svg viewBox="0 0 100 110" className={className} fill="none">
          <defs>
            <linearGradient id="sky_bakery" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#cfd8de" />
              <stop offset="60%" stopColor="#ede3d1" />
              <stop offset="100%" stopColor="#c9b69b" />
            </linearGradient>
          </defs>
          <rect width="100" height="110" fill="url(#sky_bakery)" />
          <path d="M0 72 L100 72 L100 110 L0 110 Z" fill="#695f50" />

          <rect x="18" y="38" width="64" height="40" fill="#d4c7b2" stroke="#3d3326" strokeWidth="2" />
          <polygon points="50,14 12,40 88,40" fill="#8a3629" stroke="#3d120c" strokeWidth="2" strokeLinejoin="round" />

          <rect x="66" y="8" width="9" height="22" fill="#71717a" stroke="#27272a" strokeWidth="1.5" />
          <path d="M70 6 C68 2 74 0 72 -4" stroke="#9ca3af" strokeWidth="2" opacity="0.7" strokeLinecap="round" />

          <path d="M36 78 L36 56 C36 48 64 48 64 56 L64 78 Z" fill="#1f1610" stroke="#3b2719" strokeWidth="1.8" />
          <ellipse cx="50" cy="68" rx="9" ry="6" fill="#ea580c" />
          <ellipse cx="50" cy="69" rx="5" ry="3.5" fill="#fef08a" />

          <ellipse cx="26" cy="74" rx="4.5" ry="3" fill="#d97706" stroke="#78350f" strokeWidth="1" />
          <ellipse cx="74" cy="74" rx="4.5" ry="3" fill="#d97706" stroke="#78350f" strokeWidth="1" />
        </svg>
      );

    case 'brewery':
      return (
        <svg viewBox="0 0 100 110" className={className} fill="none">
          <defs>
            <linearGradient id="sky_brew" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#cfdce3" />
              <stop offset="60%" stopColor="#ebe1cf" />
              <stop offset="100%" stopColor="#baa68a" />
            </linearGradient>
          </defs>
          <rect width="100" height="110" fill="url(#sky_brew)" />
          <path d="M0 72 L100 72 L100 110 L0 110 Z" fill="#574e40" />

          <rect x="20" y="38" width="60" height="40" fill="#a87f51" stroke="#3b2914" strokeWidth="2" />
          <polygon points="50,16 14,40 86,40" fill="#4d3521" stroke="#21150b" strokeWidth="2" />

          <ellipse cx="36" cy="64" rx="10" ry="14" fill="#784b22" stroke="#331e0b" strokeWidth="1.5" />
          <line x1="26" y1="58" x2="46" y2="58" stroke="#211204" strokeWidth="1.2" />
          <line x1="26" y1="70" x2="46" y2="70" stroke="#211204" strokeWidth="1.2" />

          <ellipse cx="66" cy="66" rx="9" ry="11" fill="#b45309" stroke="#451a03" strokeWidth="1.5" />
          <path d="M66 48 L66 42 L72 42" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />

          <rect x="76" y="68" width="14" height="12" fill="#69431f" stroke="#2e1b09" strokeWidth="1.2" />
        </svg>
      );

    case 'charcoal_kiln':
      return (
        <svg viewBox="0 0 100 110" className={className} fill="none">
          <defs>
            <linearGradient id="sky_kiln" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b4c2c7" />
              <stop offset="60%" stopColor="#c7bcb1" />
              <stop offset="100%" stopColor="#7a6e60" />
            </linearGradient>
          </defs>
          <rect width="100" height="110" fill="url(#sky_kiln)" />
          <path d="M0 76 L100 76 L100 110 L0 110 Z" fill="#474138" />

          <path d="M18 76 C18 32 82 32 82 76 Z" fill="#2e2a25" stroke="#12100d" strokeWidth="2.5" />
          <path d="M28 76 C28 44 72 44 72 76 Z" fill="#1a1815" stroke="#0a0907" strokeWidth="1.8" />

          <ellipse cx="50" cy="38" rx="6" ry="3.5" fill="#0f0e0c" />
          <path d="M50 36 C44 24 56 16 48 4" stroke="#71717a" strokeWidth="3" opacity="0.8" strokeLinecap="round" />
          <path d="M52 36 C58 26 48 18 54 6" stroke="#9ca3af" strokeWidth="2.5" opacity="0.7" strokeLinecap="round" />

          <ellipse cx="50" cy="68" rx="7" ry="5" fill="#ea580c" />
          <ellipse cx="50" cy="69" rx="3.5" ry="2.5" fill="#facc15" />
        </svg>
      );

    case 'iron_smelter':
      return (
        <svg viewBox="0 0 100 110" className={className} fill="none">
          <defs>
            <linearGradient id="sky_smelter" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b8c6cc" />
              <stop offset="60%" stopColor="#c4b6a5" />
              <stop offset="100%" stopColor="#756453" />
            </linearGradient>
          </defs>
          <rect width="100" height="110" fill="url(#sky_smelter)" />
          <path d="M0 76 L100 76 L100 110 L0 110 Z" fill="#4d4338" />

          <polygon points="32,24 68,24 76,76 24,76" fill="#52493d" stroke="#241f18" strokeWidth="2.5" />
          <rect x="38" y="10" width="24" height="14" fill="#3b342b" stroke="#1c1813" strokeWidth="2" />

          <path d="M50 8 C42 0 58 -4 50 -10" stroke="#71717a" strokeWidth="3" opacity="0.8" strokeLinecap="round" />

          <path d="M38 76 L38 56 C38 50 62 50 62 56 L62 76 Z" fill="#14110e" stroke="#2e241a" strokeWidth="1.8" />
          <ellipse cx="50" cy="66" rx="8" ry="7" fill="#ea580c" />
          <ellipse cx="50" cy="67" rx="4.5" ry="3.5" fill="#fef08a" />

          <polygon points="70,72 82,72 80,76 68,76" fill="#a1a1aa" stroke="#27272a" strokeWidth="1" />
        </svg>
      );

    case 'stonecutter':
      return (
        <svg viewBox="0 0 100 110" className={className} fill="none">
          <defs>
            <linearGradient id="sky_cutter" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c2d3d9" />
              <stop offset="60%" stopColor="#e5ded0" />
              <stop offset="100%" stopColor="#b5aa98" />
            </linearGradient>
          </defs>
          <rect width="100" height="110" fill="url(#sky_cutter)" />
          <path d="M0 72 L100 72 L100 110 L0 110 Z" fill="#635c50" />

          <line x1="20" y1="38" x2="20" y2="72" stroke="#3d2d1d" strokeWidth="3" />
          <line x1="80" y1="38" x2="80" y2="72" stroke="#3d2d1d" strokeWidth="3" />
          <polygon points="50,18 14,38 86,38" fill="#6e4f30" stroke="#2e1f10" strokeWidth="2" />

          <rect x="28" y="52" width="22" height="20" fill="#a8a092" stroke="#3b352b" strokeWidth="1.8" />
          <line x1="28" y1="62" x2="50" y2="62" stroke="#3b352b" strokeWidth="1.2" />

          <rect x="56" y="46" width="18" height="26" fill="#bfb7a8" stroke="#3b352b" strokeWidth="1.8" />
          <line x1="65" y1="46" x2="65" y2="72" stroke="#3b352b" strokeWidth="1.2" />

          <line x1="58" y1="36" x2="68" y2="44" stroke="#52525b" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'brickworks':
      return (
        <svg viewBox="0 0 100 110" className={className} fill="none">
          <defs>
            <linearGradient id="sky_brick" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c7d4d9" />
              <stop offset="60%" stopColor="#e8ded1" />
              <stop offset="100%" stopColor="#bfa38a" />
            </linearGradient>
          </defs>
          <rect width="100" height="110" fill="url(#sky_brick)" />
          <path d="M0 72 L100 72 L100 110 L0 110 Z" fill="#5c4836" />

          <rect x="16" y="42" width="44" height="34" fill="#b85d3b" stroke="#4a1c0b" strokeWidth="2" />
          <line x1="16" y1="53" x2="60" y2="53" stroke="#4a1c0b" strokeWidth="1.2" />
          <line x1="16" y1="64" x2="60" y2="64" stroke="#4a1c0b" strokeWidth="1.2" />
          <line x1="30" y1="42" x2="30" y2="53" stroke="#4a1c0b" strokeWidth="1.2" />
          <line x1="45" y1="53" x2="45" y2="64" stroke="#4a1c0b" strokeWidth="1.2" />

          <polygon points="38,20 10,42 66,42" fill="#8c371e" stroke="#3b1106" strokeWidth="2" />

          <rect x="68" y="58" width="18" height="7" fill="#c25732" stroke="#4a1c0b" strokeWidth="1.2" />
          <rect x="70" y="51" width="18" height="7" fill="#c25732" stroke="#4a1c0b" strokeWidth="1.2" />
          <rect x="69" y="44" width="18" height="7" fill="#c25732" stroke="#4a1c0b" strokeWidth="1.2" />
        </svg>
      );

    case 'sawmill':
      return (
        <svg viewBox="0 0 100 110" className={className} fill="none">
          <defs>
            <linearGradient id="sky_saw" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c2d5db" />
              <stop offset="60%" stopColor="#e5ded0" />
              <stop offset="100%" stopColor="#baa990" />
            </linearGradient>
          </defs>
          <rect width="100" height="110" fill="url(#sky_saw)" />
          <path d="M0 72 L100 72 L100 110 L0 110 Z" fill="#596347" />

          <rect x="16" y="40" width="68" height="38" fill="#9e7545" stroke="#382510" strokeWidth="2" />
          <polygon points="50,16 10,40 90,40" fill="#523619" stroke="#241506" strokeWidth="2" />

          <rect x="8" y="64" width="84" height="8" fill="#c79758" stroke="#3d260e" strokeWidth="1.5" />

          <circle cx="50" cy="56" r="14" fill="#71717a" stroke="#18181b" strokeWidth="2" />
          <circle cx="50" cy="56" r="3.5" fill="#09090b" />
          <line x1="50" y1="42" x2="50" y2="70" stroke="#18181b" strokeWidth="1.8" />
          <line x1="36" y1="56" x2="64" y2="56" stroke="#18181b" strokeWidth="1.8" />
        </svg>
      );

    case 'weavers_workshop':
      return (
        <svg viewBox="0 0 100 110" className={className} fill="none">
          <defs>
            <linearGradient id="sky_weaver" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#cad7de" />
              <stop offset="60%" stopColor="#e8dfce" />
              <stop offset="100%" stopColor="#baa68f" />
            </linearGradient>
          </defs>
          <rect width="100" height="110" fill="url(#sky_weaver)" />
          <path d="M0 72 L100 72 L100 110 L0 110 Z" fill="#615645" />

          <rect x="20" y="40" width="60" height="38" fill="#bfa073" stroke="#3d2e1a" strokeWidth="2" />
          <polygon points="50,16 14,40 86,40" fill="#7d3b2b" stroke="#3b150c" strokeWidth="2" />

          <rect x="34" y="50" width="32" height="28" fill="#fdfbf7" stroke="#4d371d" strokeWidth="1.8" />
          <line x1="40" y1="50" x2="40" y2="78" stroke="#3b82f6" strokeWidth="1.5" />
          <line x1="46" y1="50" x2="46" y2="78" stroke="#ef4444" strokeWidth="1.5" />
          <line x1="52" y1="50" x2="52" y2="78" stroke="#eab308" strokeWidth="1.5" />
          <line x1="58" y1="50" x2="58" y2="78" stroke="#10b981" strokeWidth="1.5" />

          <ellipse cx="24" cy="70" rx="4.5" ry="7" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1" />
          <ellipse cx="76" cy="70" rx="4.5" ry="7" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
        </svg>
      );

    case 'tavern':
      return (
        <svg viewBox="0 0 100 110" className={className} fill="none">
          <defs>
            <linearGradient id="sky_tavern" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#cfd7de" />
              <stop offset="60%" stopColor="#ede1cb" />
              <stop offset="100%" stopColor="#bfa88c" />
            </linearGradient>
          </defs>
          <rect width="100" height="110" fill="url(#sky_tavern)" />
          <path d="M0 72 L100 72 L100 110 L0 110 Z" fill="#574936" />

          <rect x="18" y="36" width="64" height="42" fill="#9e7442" stroke="#38250f" strokeWidth="2" />
          <polygon points="50,12 12,36 88,36" fill="#4d3014" stroke="#211204" strokeWidth="2" />

          <rect x="42" y="54" width="16" height="24" fill="#241305" stroke="#0d0601" strokeWidth="1.5" />

          <rect x="24" y="44" width="12" height="12" fill="#fde047" stroke="#38250f" strokeWidth="1.2" />
          <rect x="64" y="44" width="12" height="12" fill="#fde047" stroke="#38250f" strokeWidth="1.2" />

          <line x1="14" y1="42" x2="6" y2="42" stroke="#1a0f05" strokeWidth="2" />
          <rect x="4" y="42" width="9" height="12" fill="#eab308" stroke="#1a0f05" strokeWidth="1" />
          <path d="M8 44 C11 46 11 50 8 52" stroke="#ffffff" strokeWidth="1.2" fill="none" />

          <ellipse cx="76" cy="68" rx="6" ry="8" fill="#5e3917" stroke="#211204" strokeWidth="1.2" />
        </svg>
      );

    case 'wooden_church':
      return (
        <svg viewBox="0 0 100 110" className={className} fill="none">
          <defs>
            <linearGradient id="sky_church" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#bfd1de" />
              <stop offset="60%" stopColor="#e5ded0" />
              <stop offset="100%" stopColor="#baa68c" />
            </linearGradient>
          </defs>
          <rect width="100" height="110" fill="url(#sky_church)" />
          <path d="M0 74 L100 74 L100 110 L0 110 Z" fill="#525c40" />

          <rect x="34" y="32" width="32" height="48" fill="#8c6a43" stroke="#362512" strokeWidth="2" />
          <polygon points="50,6 28,32 72,32" fill="#452c13" stroke="#1c1004" strokeWidth="2" />

          <line x1="50" y1="0" x2="50" y2="8" stroke="#d4af37" strokeWidth="2.8" strokeLinecap="round" />
          <line x1="45" y1="3" x2="55" y2="3" stroke="#d4af37" strokeWidth="2.5" strokeLinecap="round" />

          <rect x="14" y="48" width="22" height="32" fill="#9e7a50" stroke="#362512" strokeWidth="1.8" />
          <polygon points="25,36 10,48 40,48" fill="#57381a" stroke="#1c1004" strokeWidth="1.8" />

          <rect x="64" y="48" width="22" height="32" fill="#9e7a50" stroke="#362512" strokeWidth="1.8" />
          <polygon points="75,36 60,48 90,48" fill="#57381a" stroke="#1c1004" strokeWidth="1.8" />

          <path d="M45 80 L45 64 C45 58 55 58 55 64 L55 80 Z" fill="#1f1105" stroke="#0d0601" strokeWidth="1.5" />
          <rect x="46" y="40" width="8" height="12" rx="4" fill="#fde047" stroke="#362512" strokeWidth="1" />
        </svg>
      );

    case 'barracks':
      return (
        <svg viewBox="0 0 100 110" className={className} fill="none">
          <defs>
            <linearGradient id="sky_barracks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c2cfd9" />
              <stop offset="60%" stopColor="#ded5c5" />
              <stop offset="100%" stopColor="#9e917e" />
            </linearGradient>
          </defs>
          <rect width="100" height="110" fill="url(#sky_barracks)" />
          <path d="M0 74 L100 74 L100 110 L0 110 Z" fill="#524e45" />

          <rect x="14" y="38" width="72" height="42" fill="#8f7356" stroke="#36291a" strokeWidth="2" />
          <polygon points="50,14 8,38 92,38" fill="#57221d" stroke="#260906" strokeWidth="2" />

          <rect x="42" y="56" width="16" height="24" fill="#211408" stroke="#0d0601" strokeWidth="1.5" />

          <polygon points="26,44 20,56 26,68 32,56" fill="#dc2626" stroke="#450a0a" strokeWidth="1.2" />
          <line x1="18" y1="46" x2="34" y2="64" stroke="#d4af37" strokeWidth="1.8" />

          <line x1="72" y1="44" x2="72" y2="76" stroke="#36291a" strokeWidth="1.8" />
          <line x1="80" y1="44" x2="80" y2="76" stroke="#36291a" strokeWidth="1.8" />
          <line x1="70" y1="52" x2="82" y2="52" stroke="#36291a" strokeWidth="1.5" />
          <line x1="70" y1="64" x2="82" y2="64" stroke="#36291a" strokeWidth="1.5" />
        </svg>
      );

    case 'wooden_wall':
      return (
        <svg viewBox="0 0 100 110" className={className} fill="none">
          <defs>
            <linearGradient id="sky_wall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c4d5de" />
              <stop offset="60%" stopColor="#e0d7c5" />
              <stop offset="100%" stopColor="#8a7e6b" />
            </linearGradient>
          </defs>
          <rect width="100" height="110" fill="url(#sky_wall)" />
          <path d="M0 74 L100 74 L100 110 L0 110 Z" fill="#4d473b" />

          <polygon points="12,32 18,20 24,32 24,74 12,74" fill="#8c653d" stroke="#33210f" strokeWidth="1.5" />
          <polygon points="24,30 30,18 36,30 36,74 24,74" fill="#a1774a" stroke="#33210f" strokeWidth="1.5" />
          <polygon points="36,32 42,20 48,32 48,74 36,74" fill="#8c653d" stroke="#33210f" strokeWidth="1.5" />
          <polygon points="48,30 54,18 60,30 60,74 48,74" fill="#a1774a" stroke="#33210f" strokeWidth="1.5" />
          <polygon points="60,32 66,20 72,32 72,74 60,74" fill="#8c653d" stroke="#33210f" strokeWidth="1.5" />
          <polygon points="72,30 78,18 84,30 84,74 72,74" fill="#a1774a" stroke="#33210f" strokeWidth="1.5" />

          <line x1="8" y1="44" x2="88" y2="44" stroke="#3d2813" strokeWidth="3.5" />
          <line x1="8" y1="64" x2="88" y2="64" stroke="#3d2813" strokeWidth="3.5" />
        </svg>
      );

    case 'wooden_gate':
      return (
        <svg viewBox="0 0 100 110" className={className} fill="none">
          <defs>
            <linearGradient id="sky_gate" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c4d5de" />
              <stop offset="60%" stopColor="#e0d7c5" />
              <stop offset="100%" stopColor="#8a7e6b" />
            </linearGradient>
          </defs>
          <rect width="100" height="110" fill="url(#sky_gate)" />
          <path d="M0 74 L100 74 L100 110 L0 110 Z" fill="#4d473b" />

          <rect x="14" y="26" width="20" height="52" fill="#8a633a" stroke="#33210f" strokeWidth="1.8" />
          <polygon points="24,10 10,26 38,26" fill="#4a3117" stroke="#1f1205" strokeWidth="1.8" />

          <rect x="66" y="26" width="20" height="52" fill="#8a633a" stroke="#33210f" strokeWidth="1.8" />
          <polygon points="76,10 62,26 90,26" fill="#4a3117" stroke="#1f1205" strokeWidth="1.8" />

          <rect x="34" y="38" width="32" height="40" fill="#2b1a0b" stroke="#120a03" strokeWidth="1.8" />
          <line x1="50" y1="38" x2="50" y2="78" stroke="#120a03" strokeWidth="2.5" />
          <line x1="34" y1="50" x2="66" y2="50" stroke="#52381f" strokeWidth="2.5" />
          <line x1="34" y1="66" x2="66" y2="66" stroke="#52381f" strokeWidth="2.5" />
        </svg>
      );

    case 'stone_wall':
      return (
        <svg viewBox="0 0 100 110" className={className} fill="none">
          <defs>
            <linearGradient id="sky_stonewall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#bed2db" />
              <stop offset="60%" stopColor="#ded9cb" />
              <stop offset="100%" stopColor="#9e9786" />
            </linearGradient>
          </defs>
          <rect width="100" height="110" fill="url(#sky_stonewall)" />
          <path d="M0 74 L100 74 L100 110 L0 110 Z" fill="#524e47" />

          <rect x="12" y="36" width="76" height="42" fill="#999183" stroke="#38332a" strokeWidth="2" />

          <rect x="12" y="26" width="16" height="12" fill="#999183" stroke="#38332a" strokeWidth="1.8" />
          <rect x="42" y="26" width="16" height="12" fill="#999183" stroke="#38332a" strokeWidth="1.8" />
          <rect x="72" y="26" width="16" height="12" fill="#999183" stroke="#38332a" strokeWidth="1.8" />

          <line x1="12" y1="48" x2="88" y2="48" stroke="#423e35" strokeWidth="1.2" />
          <line x1="12" y1="60" x2="88" y2="60" stroke="#423e35" strokeWidth="1.2" />
          <line x1="12" y1="72" x2="88" y2="72" stroke="#423e35" strokeWidth="1.2" />

          <line x1="32" y1="36" x2="32" y2="48" stroke="#423e35" strokeWidth="1.2" />
          <line x1="68" y1="36" x2="68" y2="48" stroke="#423e35" strokeWidth="1.2" />
          <line x1="50" y1="48" x2="50" y2="60" stroke="#423e35" strokeWidth="1.2" />
          <line x1="32" y1="60" x2="32" y2="72" stroke="#423e35" strokeWidth="1.2" />
          <line x1="68" y1="60" x2="68" y2="72" stroke="#423e35" strokeWidth="1.2" />
        </svg>
      );

    case 'market':
      return (
        <svg viewBox="0 0 100 110" className={className} fill="none">
          <defs>
            <linearGradient id="sky_market" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#cfdbe0" />
              <stop offset="60%" stopColor="#eee4d2" />
              <stop offset="100%" stopColor="#c2ab8a" />
            </linearGradient>
          </defs>
          <rect width="100" height="110" fill="url(#sky_market)" />
          <path d="M0 74 L100 74 L100 110 L0 110 Z" fill="#615647" />

          <line x1="18" y1="30" x2="18" y2="76" stroke="#3b2612" strokeWidth="3" />
          <line x1="82" y1="30" x2="82" y2="76" stroke="#3b2612" strokeWidth="3" />

          <polygon points="50,14 12,32 88,32" fill="#b91c1c" stroke="#3d0a0a" strokeWidth="2" />
          <polygon points="24,32 36,32 30,19 18,19" fill="#fef08a" />
          <polygon points="48,32 60,32 54,16 42,16" fill="#fef08a" />
          <polygon points="72,32 84,32 78,19 66,19" fill="#fef08a" />

          <rect x="16" y="52" width="68" height="26" fill="#9e7343" stroke="#3b2612" strokeWidth="1.8" />
          <ellipse cx="30" cy="50" rx="6.5" ry="4.5" fill="#d97706" stroke="#78350f" strokeWidth="1.2" />
          <ellipse cx="50" cy="50" rx="6.5" ry="4.5" fill="#16a34a" stroke="#14532d" strokeWidth="1.2" />
          <ellipse cx="70" cy="50" rx="7.5" ry="5.5" fill="#ca8a04" stroke="#713f12" strokeWidth="1.2" />
        </svg>
      );

    case 'hitching_post':
      return (
        <svg viewBox="0 0 100 110" className={className} fill="none">
          <defs>
            <linearGradient id="sky_hitch" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#dce8ec" />
              <stop offset="50%" stopColor="#ede5d2" />
              <stop offset="100%" stopColor="#c9b99f" />
            </linearGradient>
            <linearGradient id="ground_hitch" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#687948" />
              <stop offset="35%" stopColor="#55442f" />
              <stop offset="100%" stopColor="#3d3020" />
            </linearGradient>
          </defs>
          <rect width="100" height="110" fill="url(#sky_hitch)" />
          <path d="M0 64 C30 60 70 62 100 64 L100 110 L0 110 Z" fill="url(#ground_hitch)" />
          <ellipse cx="50" cy="88" rx="36" ry="12" fill="#d97706" opacity="0.35" />

          <line x1="18" y1="42" x2="18" y2="82" stroke="#452c16" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="82" y1="42" x2="82" y2="82" stroke="#452c16" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="50" y1="44" x2="50" y2="82" stroke="#452c16" strokeWidth="3.5" strokeLinecap="round" />

          <line x1="12" y1="52" x2="88" y2="52" stroke="#664424" strokeWidth="3" strokeLinecap="round" />
          <line x1="12" y1="62" x2="88" y2="62" stroke="#664424" strokeWidth="2.5" strokeLinecap="round" />

          <ellipse cx="50" cy="74" rx="14" ry="9" fill="#71717a" stroke="#27272a" strokeWidth="1.5" />
          <ellipse cx="38" cy="62" rx="7" ry="10" fill="#71717a" stroke="#27272a" strokeWidth="1.5" />
          <ellipse cx="33" cy="60" rx="4" ry="4" fill="#52525b" />
          <polygon points="36,52 33,40 40,50" fill="#71717a" stroke="#27272a" strokeWidth="1" />
          <polygon points="41,52 44,40 46,50" fill="#71717a" stroke="#27272a" strokeWidth="1" />
          <circle cx="34" cy="58" r="1" fill="#09090b" />

          <line x1="42" y1="78" x2="42" y2="95" stroke="#3f3f46" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="47" y1="78" x2="47" y2="94" stroke="#3f3f46" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="56" y1="78" x2="56" y2="95" stroke="#3f3f46" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="61" y1="78" x2="61" y2="94" stroke="#3f3f46" strokeWidth="2.2" strokeLinecap="round" />

          <rect x="47" y="67" width="9" height="7" fill="#b45309" rx="1.5" stroke="#451a03" strokeWidth="1" />
          <line x1="38" y1="58" x2="50" y2="53" stroke="#92400e" strokeWidth="1.2" strokeDasharray="1.5 1" />

          <rect x="70" y="72" width="16" height="8" fill="#ca8a04" rx="2" stroke="#713f12" strokeWidth="1" />
          <circle cx="20" cy="80" r="4.5" fill="#3b82f6" opacity="0.8" stroke="#1e3a8a" strokeWidth="1" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 100 110" className={className} fill="none">
          <rect width="100" height="110" fill="#ded5c2" />
          <rect x="25" y="40" width="50" height="40" fill="#a17a4a" stroke="#3d2a14" strokeWidth="2" />
          <polygon points="50,16 18,40 82,40" fill="#5e3919" stroke="#2e1906" strokeWidth="2" />
        </svg>
      );
  }
};
