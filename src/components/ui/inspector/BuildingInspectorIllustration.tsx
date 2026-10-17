import type { BuildingType } from '../../../types/game';
import { BUILDING_BLUEPRINTS } from '../../../engine/buildings/blueprints';
import { BuildingIllustration } from '../bottom-bar/BuildingCardIllustrations';
import { HammerIcon, HouseTierIcon, WheatIcon, WoodIcon, StorageIcon, ShieldIcon } from '../icons';
import { PAINTED_BUILDING_ART } from './buildingArt';

export function BuildingInspectorIllustration({ type, tier, showSeal }: { type: BuildingType; tier: number; showSeal: boolean }) {
  const category = BUILDING_BLUEPRINTS[type]?.category;
  const housing = category === 'housing';
  const timber = ['lumberjack_hut', 'sawmill', 'foresters_hut'].includes(type);
  const farm = ['wheat_farm', 'windmill', 'bakery', 'brewery'].includes(type);
  const trade = ['stockpile', 'market', 'trading_post', 'hitching_post'].includes(type);
  const military = category === 'military';
  const Icon = housing ? HouseTierIcon : timber ? WoodIcon : farm ? WheatIcon : trade ? StorageIcon : military ? ShieldIcon : HammerIcon;
  const painting = PAINTED_BUILDING_ART[type];
  if (painting) return <div className="building-inspector-illustration building-inspector-painted" aria-hidden="true" data-building-type={type}>
    <img src={painting} alt="" decoding="async" draggable={false} />
    <div className="building-inspector-ink" />
    {showSeal && <div className="building-inspector-seal"><Icon size={24} />{housing && tier > 1 && <span>{tier}</span>}</div>}
  </div>;
  return <div className="building-inspector-illustration" aria-hidden="true" data-building-type={type}>
    <svg className="building-inspector-vignette" viewBox="0 0 360 126" preserveAspectRatio="xMidYMid slice" fill="none">
      <rect width="360" height="126" fill="#d4c4a1" />
      <path d="M0 44Q42 15 80 42T159 37T238 45T360 25V126H0Z" fill="#899078" opacity=".45" />
      <path d="M0 74Q81 51 167 72T360 60V126H0Z" fill="#b1a67b" />
      <path d="M24 126Q101 67 187 82T335 126" fill="#e1cea3" />
      <g stroke="#6e6248" strokeWidth="2" opacity=".65"><path d="M0 74L180 65M0 83L180 74M16 65V92M55 61V88M96 57V82M141 57V79" /></g>
      <g stroke="#675338" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round">
        {type === 'foresters_hut' ? <>
          <path d="M22 114V84M12 93L22 70L32 93ZM8 106L22 84L36 106Z" fill="#79815c" />
          <path d="M143 115V100M136 105L143 91L151 105Z" fill="#839168" />
          <path d="M117 69L127 112M122 111L135 108L135 120L126 124Z" fill="#8d927e" strokeWidth="2" />
        </> : timber ? <>
          <path d="M15 97L91 78L97 90L21 109Z" fill="#89653f" /><ellipse cx="23" cy="103" rx="8" ry="7" fill="#c6a676" /><ellipse cx="23" cy="103" rx="4" ry="3" />
          <path d="M34 97L89 84M38 101L91 88" opacity=".6" />
          <path d="M114 91L129 84L143 92V110L114 116Z" fill="#886441" /><ellipse cx="129" cy="91" rx="15" ry="7" fill="#c5ac80" />
          <path d="M117 52L137 86" strokeWidth="3" /><path d="M118 51L107 49L104 59L124 62Z" fill="#899085" />
        </> : farm ? <>
          {Array.from({ length: 7 }, (_, i) => <g key={i} transform={`translate(${17 + i * 10}, ${i % 2 * 5})`}><path d="M0 107L4 68M4 74L-2 68M4 80L10 73M3 87L-3 80" stroke="#957641" strokeWidth="2" /><ellipse cx="5" cy="67" rx="3" ry="9" fill="#c8a35a" /></g>)}
          <path d="M114 101Q111 86 123 81Q134 85 136 102Z" fill="#d4bf8c" /><path d="M118 85L130 85M118 88L130 88" />
          <path d="M139 112Q137 96 147 91Q158 95 160 114Z" fill="#b3a178" />
        </> : housing ? <>
          <ellipse cx="26" cy="102" rx="15" ry="10" fill="#8b7050" /><path d="M12 99Q27 87 40 100M15 107L37 99" stroke="#baa075" />
          <path d="M115 110L151 110L147 90L119 90Z" fill="#9b855c" /><path d="M122 88Q128 73 134 91M133 87Q142 75 145 89" stroke="#737b46" strokeWidth="3" />
          <circle cx="125" cy="91" r="5" fill="#a34e3e" /><circle cx="138" cy="95" r="5" fill="#a69d54" />
          <path d="M164 107Q172 92 183 99L191 104L183 113L169 114Z" fill="#e3d5b1" /><path d="M182 99L183 94L188 98M172 113L171 119M180 113L180 119" stroke="#9f6543" />
        </> : type === 'fishermans_hut' ? <>
          <path d="M0 101Q41 94 66 104T163 109L184 126H0Z" fill="#91a6a0" stroke="none" />
          <path d="M4 113L34 111M48 121L89 118M101 116L143 119" stroke="#c3c9ad" />
          <path d="M94 66Q110 48 132 50L149 113" /><path d="M149 113L157 113L160 116L153 120L146 117Z" fill="#d0ccb2" />
          <path d="M20 97L46 92L48 113L23 116Z" fill="#9e8663" /><path d="M22 99L46 110M24 113L44 96M32 95L35 115" />
        </> : type === 'hunters_hut' ? <>
          <path d="M116 60Q139 88 116 115L116 60" stroke="#8c6842" strokeWidth="2" />
          <path d="M106 88L143 88M139 85L144 88L139 91" />
          <path d="M15 113Q32 102 47 110L57 95L62 98L55 114L46 119L45 124M21 116L20 125" fill="#9c8a64" />
          <path d="M56 96L54 89M58 95L62 87" />
        </> : type === 'foragers_hut' ? <>
          <path d="M12 97Q4 77 21 80Q24 66 40 80Q58 77 54 98Z" fill="#7c8559" />
          <g fill="#996257"><circle cx="20" cy="87" r="3" /><circle cx="39" cy="86" r="3" /><circle cx="31" cy="95" r="3" /></g>
          <path d="M123 109L153 109L157 91L119 91Z" fill="#a68a5d" /><path d="M123 91Q135 71 153 91M122 98L154 98M129 91V109M145 91V109" />
        </> : type === 'wooden_church' ? <>
          <path d="M120 101L144 94L165 101V117L144 111L120 118Z" fill="#e0d0a9" /><path d="M144 95V111M124 104L138 100M149 101L160 104" />
          <path d="M29 78V116M20 91H39" strokeWidth="4" stroke="#9f8355" />
        </> : ['tavern','campfire'].includes(type) ? <>
          <path d="M126 88L151 88L151 114L126 114Z" fill="#a6895b" /><path d="M152 93Q168 96 154 108M130 91V109M139 90V110" />
          <path d="M22 115L48 103M22 105L47 117" strokeWidth="5" /><path d="M25 104Q38 88 39 80Q55 102 41 111Z" fill="#b6844a" />
        </> : trade ? <>
          <path d="M17 92L58 89L58 116L17 119Z" fill="#a68758" /><path d="M17 101L58 98M25 92V117M48 91V116" />
          <path d="M126 78Q148 70 154 81L157 110Q142 123 125 113Z" fill="#92774e" /><path d="M126 84L154 86M127 107L156 107M133 79L135 113M145 79L146 114" />
          <ellipse cx="142" cy="79" rx="14" ry="5" fill="#b5996b" />
        </> : military ? <>
          <path d="M27 95L46 92L50 110L34 120L25 110Z" fill="#845745" /><path d="M36 94L39 115M29 104L47 102" stroke="#cdb17b" />
          <path d="M135 113L135 50" strokeWidth="3" /><path d="M131 51L135 39L139 51Z" fill="#9eaa9c" />
          <path d="M148 67L179 70L177 84L149 82Z" fill="#9d835d" /><path d="M161 67L163 48L167 68" strokeWidth="3" />
        </> : <>
          <path d="M13 100L62 94L65 111L14 117Z" fill="#978365" /><path d="M24 98L32 114M47 96L48 113" />
          <path d="M124 99L166 99L161 105L126 106Z" fill="#788079" /><path d="M136 106L135 116L153 116L151 106" fill="#82837a" />
          <path d="M123 70L138 93" strokeWidth="3" /><path d="M119 68L129 63L135 74L125 78Z" fill="#899086" />
        </>}
        <g transform="translate(72 25)">
          <path d="M-9 56L-12 83L-19 85L-17 89L-4 87L2 57M8 56L15 81L11 85L12 89L23 86L18 81L18 56" fill="#554b39" />
          <path d="M-6 23L10 21L21 58L-12 61Z" fill={housing ? '#9c6652' : farm ? '#9b864a' : military ? '#7a7f78' : '#947356'} />
          <path d={housing ? 'M-6 26L-18 43L-28 46M12 25L24 40L39 40' : 'M-6 26L9 39L28 42M12 25L24 37L39 38'} stroke="#9b7857" strokeWidth="7" />
          <ellipse cx="2" cy="13" rx="8" ry="10" fill="#c2a582" /><path d="M-7 10Q-7-1 5 1L11 9Z" fill={housing ? '#c4b99a' : '#8c7b51'} />
          <path d="M5 13L11 15L6 17M-2 23L7 25" /><path d="M-7 45L16 43M-9 50L17 48" opacity=".4" />
        </g>
      </g>
      <g stroke="#7e845d" strokeWidth="1.1" opacity=".6"><path d="M5 122L7 116L11 122M49 120L52 114M180 121L183 115L186 121M202 104L205 97" /></g>
    </svg>
    <div className="building-inspector-building"><BuildingIllustration type={type === 'foresters_hut' ? 'lumberjack_hut' : type} /></div>
    {showSeal && <div className="building-inspector-seal"><Icon size={24} />{housing && tier > 1 && <span>{tier}</span>}</div>}
    <div className="building-inspector-ink" />
  </div>;
}
