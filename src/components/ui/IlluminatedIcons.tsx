import type { MedievalIconProps } from './MedievalIcons';

export type IlluminatedIconKind =
  | 'wood' | 'planks' | 'stone' | 'clay' | 'bread' | 'wheat' | 'ale'
  | 'ox' | 'storage' | 'gold' | 'weapons' | 'flame' | 'peasants'
  | 'influence' | 'town' | 'shield' | 'road' | 'hammer'
  | 'fish' | 'bow' | 'berry' | 'windmill' | 'brick' | 'cloth'
  | 'church' | 'market' | 'donkey' | 'demolish' | 'pin' | 'unpin'
  | 'plus' | 'minus' | 'chevron' | 'approval'
  | 'flour' | 'salt' | 'meat' | 'hides' | 'vegetables' | 'eggs'
  | 'iron_ore' | 'coal' | 'cut_stone' | 'iron' | 'clothes'
  | 'construction_group' | 'food_group' | 'farm_group' | 'materials_group' | 'goods_group';

const ink = '#44382d';
const wood = '#8b5a32';
const woodLight = '#bc854d';
const gold = '#d9ad4d';
const parchment = '#eee0b8';
const iron = '#9ba5a4';
const green = '#687d4b';

export function IlluminatedIcon({ kind, className = 'w-4 h-4', size, title }: MedievalIconProps & { kind: IlluminatedIconKind }) {
  const drawing = (() => {
    switch (kind) {
      case 'wood': return <><path d="M4 17 16 5l4 3L8 20Z" fill={wood} /><ellipse cx="6" cy="18.5" rx="3" ry="2" transform="rotate(-45 6 18.5)" fill="#d5ad72" /><path d="m6 17 1 2M16 5l2 3" stroke={ink} /></>;
      case 'planks': return <><path d="m3 7 15-3 3 3-15 3Zm0 6 15-3 3 3-15 3Zm0 6 15-3 3 3-15 3Z" fill={woodLight} /><path d="m6 10 15-3m-15 9 15-3m-15 9 15-3" stroke={ink} /><path d="m3 7 3 3v2m-3 1 3 3v2m-3 1 3 3" fill="none" /></>;
      case 'stone': return <><path d="m3 10 6-6 8 1 4 6-2 8-11 2-5-5Z" fill="#a7aaa2" /><path d="m3 10 9 3 9-2m-9 2-4 8" fill="none" stroke="#737c78" /><path d="m9 4 3 9" stroke="#d5d6c4" /></>;
      case 'clay': return <><path d="M5 13q5-9 12-6l3 7-4 6H7Z" fill="#ad6548" /><path d="m7 15 6-6m1 8 4-4" stroke="#d08b64" /><path d="m5 13 2 7h9" fill="none" /></>;
      case 'flour': return <><path d="M6 6h12l-2 4 3 9-3 3H8l-3-3 3-9Z" fill="#e6dcc4" stroke="#776b59" /><path d="M7 7q5 2 10 0M8 11q4 2 8 0" stroke="#aa967b" /><path d="m12 13-2 5m2-5 2 5m-4-2h4" stroke="#b09054" /></>;
      case 'salt': return <><path d="m2 19 5-8 4 3 4-8 7 13Z" fill="#e9e8d8" stroke="#8d9791" /><path d="m7 11 2 8m6-13 2 13M4 19h16" stroke="#b9c7c1" /><circle cx="19" cy="8" r="1.2" fill="#f6f8ed" /></>;
      case 'meat': return <><path d="M5 13q3-9 10-8 7 2 4 9-2 5-8 5-6-1-6-6Z" fill="#a94e43" stroke="#5e312e" /><path d="m15 16 4 4m-1 0 2-2m-2 2 2 2" stroke="#f4e4c7" strokeWidth="2.5" strokeLinecap="round" /><path d="M8 10q2-3 5-3" stroke="#dc8f75" /></>;
      case 'hides': return <><path d="m7 3 4 3h3l4-3 3 5-4 3 2 9-7-2-7 2 2-9-4-3Z" fill="#b58b64" stroke="#664a35" /><path d="m8 12 8 5m0-8-8 7" stroke="#d8b58b" /></>;
      case 'vegetables': return <><path d="M7 9 4 4m3 5 1-7m-1 7 4-5m6 5-2-6m2 6 3-5" stroke="#58804c" strokeWidth="2" /><path d="M4 10q3-2 6 0l-2 10-2 2Zm10 0q3-2 6 0l-2 10-2 2Z" fill="#ce7b3d" stroke="#875237" /><path d="m7 13 1 2m9-2 1 2" stroke="#f2bb6c" /></>;
      case 'eggs': return <><path d="M3 17q9 8 18 0l-2 4H5Z" fill="#9b7547" /><path d="M6 15q-1-8 3-9 4 1 3 9-1 3-3 3t-3-3Zm7 1q-1-9 3-10 4 1 3 10-1 3-3 3t-3-3Z" fill="#f2e5c6" stroke="#a89a7f" /><path d="m3 17 18 0" stroke="#c89d62" strokeWidth="2" /></>;
      case 'iron_ore': return <><path d="m3 17 4-10 8-3 6 6-2 10-11 2Z" fill="#777a78" stroke="#414949" /><path d="m7 7 5 7 9-4m-9 4-4 8" stroke="#b86255" strokeWidth="2" /><path d="m15 4-3 10" stroke="#a9aaa1" /></>;
      case 'coal': return <><path d="m3 19 4-8 4 2 3-8 7 14-5 3H7Z" fill="#373c3a" stroke="#838b82" /><path d="m7 11 3 8m4-14 1 14" stroke="#6b7370" /><path d="m4 19 13 0" stroke="#a29c82" /></>;
      case 'cut_stone': return <><path d="M3 6h9v7H3Zm9 0h9v7h-9ZM3 13h18v7H3Z" fill="#bfc4bd" stroke="#6b7774" /><path d="M12 13v7M5 8h5m5 0h4M5 15h13" stroke="#e7e7d8" /></>;
      case 'iron': return <><path d="M3 11h15l3 5-3 4H3l3-4Z" fill="#8f9b9c" stroke="#444f52" /><path d="m3 11 3 5h15m-15 0-3 4" stroke="#d3dad2" /><path d="M7 7h11l2 3H5Z" fill="#bcc6c3" stroke="#5f6c6b" /></>;
      case 'clothes': return <><path d="m8 4 4 2 4-2 6 5-4 5-2-2v10H8V12l-2 2-4-5Z" fill="#8b5d66" stroke="#e3c2a1" /><path d="M8 4q4 7 8 0M8 15h8m-5 4h2" stroke="#e0c6ad" /></>;
      case 'construction_group': return <><path d="M3 17h14l4 4H6Z" fill="#b17a45" stroke="#e2b87b" /><path d="m4 16 10-10 4 3-10 10" fill="#9fabb0" stroke="#4f5959" /><path d="m2 8 4-4 5 5-4 4Z" fill="#c6c9bc" stroke="#5a655f" /><path d="M12 18h7" stroke="#6a472d" /></>;
      case 'food_group': return <><path d="M3 12h18l-2 9H5Z" fill="#a77b46" stroke="#e3bd7c" /><path d="M5 12q7-8 14 0" stroke="#d4a96c" strokeWidth="2" /><path d="M8 10q-1-5 2-5 3 1 2 6m2 0q1-6 4-5 2 2 1 5" fill="#dca456" stroke="#694c32" /><circle cx="16" cy="12" r="3" fill="#a96053" /></>;
      case 'farm_group': return <><path d="M5 21h14l-2-10H7Z" fill="#c0a26d" stroke="#6e573c" /><path d="M4 11h16" stroke="#e8cf98" strokeWidth="2" /><path d="M12 11V3m0 2Q7 0 7 5q0 3 5 4 5-7 5-4 0 3-5 5" fill={gold} stroke="#856a37" /></>;
      case 'materials_group': return <><path d="m3 17 4-10 7-3 7 7-2 9-10 2Z" fill="#67716d" stroke="#c6b29a" /><path d="m7 7 5 7 9-3m-9 3-3 8" stroke="#b5674e" strokeWidth="2" /><path d="M15 5 12 14" stroke="#d2bd9b" /></>;
      case 'goods_group': return <><path d="m4 3 7 3 2 4-2 3 4 8 5-3-4-8 4-3-3-4-6 3" fill="#b4bcc1" stroke="#505a5b" /><path d="m3 18 3-2 5 5-2 2Z" fill="#b57e50" /><path d="M18 4 22 8l-4 5" fill="none" stroke="#d9bb80" strokeWidth="2" /></>;
      case 'bread': return <><path d="M3 14q1-9 9-9t9 9q0 5-9 5T3 14Z" fill="#c48742" /><path d="M5 15q7 3 14 0M8 10l2-2m1 4 2-3m2 3 2-2" fill="none" stroke="#f1d495" /></>;
      case 'wheat': return <><path d="M12 21V4" stroke="#9b8044" strokeWidth="1.7" /><path d="M12 6q-5-6-5-1t5 4q5-8 5-4t-5 6q-6-6-6-2t6 5q6-6 6-2t-6 5" fill={gold} stroke="#8f7239" /></>;
      case 'ale': return <><path d="M6 7h12l-1 13H7Z" fill={woodLight} /><path d="M18 9q5-1 4 4t-5 3" fill="none" stroke={iron} strokeWidth="2" /><path d="M5 7q-2-4 3-4 2-2 5 0 4-2 6 2 3 3-1 4H7Z" fill={parchment} /><path d="M9 10v7m5-7v7" stroke="#8c5f38" /></>;
      case 'ox': return <><path d="M5 9Q2 7 2 3q4 0 7 5m10 1q3-2 3-6-4 0-7 5" fill="#d7c49b" /><path d="M7 8q5-4 10 0l1 8-4 4h-4l-4-4Z" fill="#97744f" /><path d="M9 15q3 3 6 0v3q-3 3-6 0Z" fill="#c8a37a" /><circle cx="9" cy="11" r=".8" fill={ink} /><circle cx="15" cy="11" r=".8" fill={ink} /></>;
      case 'storage': return <><path d="M7 5h10l-1 4q5 5 3 10-2 3-7 3t-7-3q-2-5 3-10Z" fill="#b6a079" /><path d="M7 5q5 2 10 0M8 9q4 2 8 0M9 15q3 2 6 0" fill="none" stroke="#826847" /><path d="m10 13 2-2 2 2" fill="none" /></>;
      case 'gold': return <><circle cx="12" cy="12" r="9" fill={gold} /><circle cx="12" cy="12" r="6" fill="#eaca6b" stroke="#9c783b" /><path d="M12 7v10m-3-7h6m-6 4h6" fill="none" stroke="#8a642f" /></>;
      case 'weapons': return <><path d="m4 3 4 2 11 12-2 2L5 8Z" fill={iron} /><path d="m20 3-4 2L5 17l2 2L19 8Z" fill="#bbc1b3" /><path d="m3 17 4 4m10 0 4-4" stroke={wood} strokeWidth="2.5" /><circle cx="4" cy="20" r="1.5" fill={gold} /><circle cx="20" cy="20" r="1.5" fill={gold} /></>;
      case 'flame': return <><path d="m3 20 17-3M5 17l14 4" stroke={wood} strokeWidth="2.4" /><path d="M12 3q5 6 4 10 3-2 2-5 5 8 0 12H8Q3 16 8 9q0 5 2 5Q9 8 12 3Z" fill="#c76535" /><path d="M12 10q3 3 3 6t-3 4q-4-2-2-6Z" fill="#f1bf55" /></>;
      case 'peasants': return <><circle cx="9" cy="7" r="3" fill="#cba883" /><circle cx="17" cy="9" r="2.5" fill="#aa8361" /><path d="M3 20q0-8 6-8t6 8Zm11 0q0-6 4-6t4 6Z" fill={green} /><path d="M6 4q3-4 6 0m3 3q2-3 4 0" fill="none" stroke={wood} strokeWidth="2" /></>;
      case 'approval': return <><path d="M3 11h4v9H3zM7 11l5-8c1.3-1.2 3.1-.2 2.6 1.3L13 9h6.5c1.5 0 2.4 1.3 2 2.7l-2.1 7c-.3.9-1.1 1.3-2 1.3H7z" fill="#d6b776" stroke="#5c442d" strokeWidth="1.2" strokeLinejoin="round" /></>;
      case 'influence': return <><circle cx="12" cy="12" r="9" fill="#8e8163" /><circle cx="12" cy="12" r="6.5" fill="#b8a46e" stroke="#e5cf8d" /><path d="m12 6 1.5 4.5L18 12l-4.5 1.5L12 18l-1.5-4.5L6 12l4.5-1.5Z" fill={gold} /></>;
      case 'town': return <><path d="M3 11 12 3l9 8v10H3Z" fill="#d0c3a0" /><path d="M2 11 12 3l10 8-2 2-8-7-8 7Z" fill="#8a5838" /><path d="M9 21v-8h6v8Z" fill={wood} /><path d="M5 14h2v3H5Zm12 0h2v3h-2Z" fill={gold} /></>;
      case 'shield': return <><path d="m12 2 8 3v7q0 7-8 10-8-3-8-10V5Z" fill="#8f4738" /><path d="M12 4v15M6 11h12" stroke={gold} strokeWidth="2" /><path d="m8 6 4-2 4 2" fill="none" stroke="#e7c987" /></>;
      case 'road': return <><path d="M9 2h6l-1 6 3 7 1 7H6l1-7 3-7Z" fill="#a88b62" /><path d="m12 4-.5 5m.5 3v4m0 3v2" stroke={parchment} strokeWidth="1.5" strokeDasharray="2 2" /><path d="m7 15 10 1" stroke="#796344" /></>;
      case 'hammer': return <><path d="m8 8 3-3 10 10-3 3Z" fill={woodLight} /><path d="m4 4 4-2 5 5-3 3Z" fill={iron} /><path d="m6 12 6-6" stroke="#c6c9bc" strokeWidth="2" /><circle cx="19" cy="18" r="2" fill={gold} /></>;
      case 'fish': return <><path d="M4 12q7-8 14 0-7 8-14 0Zm0 0-2-4v8Z" fill="#88aeb0" /><circle cx="14" cy="10" r="1" fill={ink} /><path d="m8 11 3 2m-3 2 3-2" stroke="#d1d8c9" /></>;
      case 'bow': return <><path d="M5 3q15 9 0 18" fill="none" stroke={wood} strokeWidth="3" /><path d="M5 3v18M3 12h18m-4-3 4 3-4 3" fill="none" stroke={iron} /></>;
      case 'berry': return <><path d="M12 12q-2-7 4-9M7 12q-1-6-4-7" fill="none" stroke={green} /><path d="M12 6q6-3 8 1-4 4-8-1ZM5 6q-4-3-4 1 3 3 4-1Z" fill={green} /><circle cx="8" cy="14" r="3" fill="#8c5871" /><circle cx="15" cy="15" r="3" fill="#a25d75" /><circle cx="11" cy="19" r="2.5" fill="#73546e" /></>;
      case 'windmill': return <><path d="m7 21 2-11h6l2 11Z" fill="#c1aa83" /><circle cx="12" cy="9" r="2" fill={wood} /><path d="M11 7 7 1l-2 2 5 5m4 0 5-5-2-2-5 6m0 4 5 6 2-2-6-5m-3 0-5 5 2 2 5-6" fill={parchment} /></>;
      case 'brick': return <><rect x="2" y="6" width="20" height="13" rx="1" fill="#b97051" /><path d="M2 12h20M8 6v6m8 0v7M6 12v7" fill="none" stroke="#e0aa80" /></>;
      case 'cloth': return <><path d="M3 5q5 2 9 0 5 2 9 0v14q-5-2-9 0-4-2-9 0Z" fill="#8c6570" /><path d="M4 9q8 3 16 0M4 14q8 3 16 0m-10-8v12m5-12v12" stroke="#d9b9a5" /></>;
      case 'church': return <><path d="M4 12 12 6l8 6v9H4Z" fill="#c9b48c" /><path d="m3 12 9-7 9 7" fill="none" stroke={wood} strokeWidth="2" /><path d="M12 2v7M9 5h6" stroke={gold} strokeWidth="2" /><path d="M10 21v-6h4v6" fill={wood} /></>;
      case 'market': return <><path d="M3 10 6 4h12l3 6Z" fill="#b46d55" /><path d="M4 10v10h16V10M8 20v-6h8v6" fill="#d9c6a2" /><path d="M3 10h18m-13 0V5m8 5V5" stroke={ink} /><circle cx="11" cy="17" r="1.3" fill={green} /><circle cx="14" cy="17" r="1.3" fill={gold} /></>;
      case 'donkey': return <><path d="M6 10V4l3 4 3-5 1 6q5 0 6 5l-2 5H7l-3-5Z" fill="#8d7965" /><path d="M8 19v3m8-3v3" stroke={ink} strokeWidth="2" /><circle cx="8" cy="12" r=".8" fill={ink} /><path d="M5 15q2 3 5 1" stroke="#c4ad8b" /></>;
      case 'demolish': return <><path d="M5 18 17 6l2 2L7 20Z" fill={woodLight} /><path d="m14 4 3-2 5 5-3 3Z" fill={iron} /><path d="m3 21 3-3m10-1 4 4" stroke="#b77654" strokeWidth="2" /></>;
      case 'pin': return <><path d="m9 3 7 1-1 5 3 4-7 1-1 7-2-7-4-2 5-3Z" fill={gold} /><path d="m10 8 5 1" stroke={parchment} /></>;
      case 'unpin': return <><path d="m9 3 7 1-1 5 3 4-7 1-1 7-2-7-4-2 5-3Z" fill={iron} /><path d="M3 21 21 3" stroke="#b7755a" strokeWidth="2" /></>;
      case 'plus': return <><circle cx="12" cy="12" r="9" fill={green} /><path d="M12 6v12M6 12h12" stroke={parchment} strokeWidth="2.5" /></>;
      case 'minus': return <><circle cx="12" cy="12" r="9" fill="#987e61" /><path d="M6 12h12" stroke={parchment} strokeWidth="2.5" /></>;
      case 'chevron': return <><path d="m4 8 8 8 8-8" fill="none" stroke={gold} strokeWidth="3" /></>;
    }
  })();
  return <svg viewBox="0 0 24 24" className={className} style={{ width: size, height: size }} fill="none" stroke={ink} strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label={title}>
    {title && <title>{title}</title>}{drawing}
  </svg>;
}
