import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import type { Sex } from '@/ui/person';

const SKIN = ['#f6d7bf', '#e7b48a', '#c68658', '#8d552f', '#f3e0c4'];
const HAIR = ['#2b241f', '#6b4a32', '#c4a15a', '#1c1c1c', '#a86b45', '#d9c4a0'];
const BACK = ['#f6d7c4', '#d9e6cf', '#f6e6b8', '#e6d4f0', '#f4cfc8', '#d5e7ee'];
const INK = '#2c2622';

type PortraitProps = {
  seed: string;
  shirt: string;
  sex: Sex;
  victim?: boolean;
  width: number;
};

export function Portrait({ seed, shirt, sex, victim = false, width }: PortraitProps) {
  const height = width * 1.12;
  const n = hash(seed);
  const skin = SKIN[n % SKIN.length];
  const hair = HAIR[(n >>> 3) % HAIR.length];
  const style = (n >>> 6) % 4;
  const glasses = (n >>> 9) % 5 === 0;
  const bg = victim ? '#f6d3d6' : BACK[(n >>> 4) % BACK.length];

  return (
    <Svg width={width} height={height} viewBox="0 0 80 90">
      <Rect width={80} height={90} fill={bg} />
      <Ellipse cx={40} cy={86} rx={32} ry={22} fill={shirt} />
      <Rect x={33} y={62} width={14} height={14} rx={4} fill={skin} />
      <Hair sex={sex} style={style} color={hair} />
      <Circle cx={40} cy={44} r={18} fill={skin} />
      <Bangs sex={sex} style={style} color={hair} />
      {sex === 'man' && style === 3 ? <Beard color={hair} /> : null}
      <Circle cx={33.5} cy={45} r={1.3} fill={INK} />
      <Circle cx={46.5} cy={45} r={1.3} fill={INK} />
      <Path d="M35 53 Q40 56 45 53" fill="none" stroke={INK} strokeWidth={1.2} strokeLinecap="round" />
      {glasses ? (
        <G>
          <Circle cx={33.5} cy={45} r={5} fill="none" stroke={INK} strokeWidth={1.3} />
          <Circle cx={46.5} cy={45} r={5} fill="none" stroke={INK} strokeWidth={1.3} />
          <Line x1={38.5} y1={45} x2={41.5} y2={45} stroke={INK} strokeWidth={1.2} />
        </G>
      ) : null}
      {victim ? (
        <G>
          <Line x1={22} y1={18} x2={58} y2={70} stroke="#e23d3d" strokeWidth={3.4} strokeLinecap="round" />
          <Line x1={58} y1={18} x2={22} y2={70} stroke="#e23d3d" strokeWidth={3.4} strokeLinecap="round" />
        </G>
      ) : null}
    </Svg>
  );
}

function Hair({ sex, style, color }: { sex: Sex; style: number; color: string }) {
  if (sex === 'woman') {
    if (style === 2) return <Circle cx={40} cy={18} r={8} fill={color} />;
    if (style === 3) return <Ellipse cx={40} cy={50} rx={22} ry={18} fill={color} />;
    if (style === 1) return <Path d="M16 44 C16 16 64 16 64 44 L58 76 C40 66 22 76 22 76 Z" fill={color} />;
    return (
      <G>
        <Rect x={14} y={36} width={12} height={40} rx={6} fill={color} />
        <Rect x={54} y={36} width={12} height={40} rx={6} fill={color} />
      </G>
    );
  }
  if (style === 2) {
    return (
      <G>
        <Ellipse cx={24} cy={40} rx={6} ry={8} fill={color} />
        <Ellipse cx={56} cy={40} rx={6} ry={8} fill={color} />
      </G>
    );
  }
  return null;
}

function Bangs({ sex, style, color }: { sex: Sex; style: number; color: string }) {
  if (sex === 'woman') {
    if (style === 2) return <Ellipse cx={40} cy={28} rx={18} ry={8} fill={color} />;
    return <Ellipse cx={40} cy={30} rx={18} ry={9} fill={color} />;
  }
  if (style === 2) return <Ellipse cx={40} cy={30} rx={12} ry={3.5} fill={color} />;
  if (style === 1) return <Ellipse cx={32} cy={29} rx={14} ry={8} fill={color} />;
  return <Ellipse cx={40} cy={29} rx={16} ry={8} fill={color} />;
}

function Beard({ color }: { color: string }) {
  return <Path d="M29 52 Q40 68 51 52 Q46 60 40 60 Q34 60 29 52 Z" fill={color} />;
}

function hash(seed: string): number {
  let value = 2166136261;
  for (const char of seed) {
    value ^= char.charCodeAt(0);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}
