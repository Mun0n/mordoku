import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

const SKIN = ['#f6d7bf', '#e7b48a', '#c68658', '#8d552f', '#f3e0c4'];
const HAIR = ['#2b241f', '#6b4a32', '#c4a15a', '#1c1c1c', '#a86b45', '#d9c4a0'];
const BACK = ['#f6d7c4', '#d9e6cf', '#f6e6b8', '#e6d4f0', '#f4cfc8', '#d5e7ee'];

type PortraitProps = {
  seed: string;
  shirt: string;
  victim?: boolean;
  width: number;
};

export function Portrait({ seed, shirt, victim = false, width }: PortraitProps) {
  const height = width * 1.12;
  const n = hash(seed);
  const skin = SKIN[n % SKIN.length];
  const hair = HAIR[(n >>> 3) % HAIR.length];
  const style = (n >>> 6) % 6;
  const glasses = (n >>> 9) % 5 === 0;
  const bg = victim ? '#f6d3d6' : BACK[(n >>> 4) % BACK.length];

  return (
    <Svg width={width} height={height} viewBox="0 0 80 90">
      <Rect width={80} height={90} fill={bg} />
      <Ellipse cx={40} cy={86} rx={32} ry={22} fill={shirt} />
      <Rect x={33} y={62} width={14} height={14} rx={4} fill={skin} />
      <HairBack style={style} color={hair} />
      <Circle cx={40} cy={44} r={18} fill={skin} />
      <HairFront style={style} color={hair} />
      <Circle cx={33.5} cy={45} r={1.3} fill="#2c2622" />
      <Circle cx={46.5} cy={45} r={1.3} fill="#2c2622" />
      {glasses ? (
        <G>
          <Circle cx={33.5} cy={45} r={5} fill="none" stroke="#2c2622" strokeWidth={1.3} />
          <Circle cx={46.5} cy={45} r={5} fill="none" stroke="#2c2622" strokeWidth={1.3} />
          <Line x1={38.5} y1={45} x2={41.5} y2={45} stroke="#2c2622" strokeWidth={1.2} />
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

function HairBack({ style, color }: { style: number; color: string }) {
  if (style === 5) return null;
  if (style === 2) {
    return (
      <G>
        <Rect x={12} y={36} width={14} height={40} rx={7} fill={color} />
        <Rect x={54} y={36} width={14} height={40} rx={7} fill={color} />
      </G>
    );
  }
  if (style === 1) {
    return <Path d="M16 46 C16 20 64 20 64 46 L60 68 C40 58 20 68 20 68 Z" fill={color} />;
  }
  return <Ellipse cx={40} cy={32} rx={22} ry={16} fill={color} />;
}

function HairFront({ style, color }: { style: number; color: string }) {
  if (style === 3) {
    return (
      <G>
        <Ellipse cx={40} cy={28} rx={20} ry={10} fill={color} />
        <Circle cx={40} cy={16} r={7} fill={color} />
      </G>
    );
  }
  if (style === 4) {
    return <Ellipse cx={30} cy={30} rx={18} ry={11} fill={color} />;
  }
  if (style === 0 || style === 2) {
    return <Ellipse cx={40} cy={30} rx={18} ry={9} fill={color} />;
  }
  if (style === 5) {
    return <Ellipse cx={40} cy={28} rx={16} ry={5} fill={color} />;
  }
  return <Path d="M24 40 C28 28 52 28 56 40 C48 34 32 34 24 40 Z" fill={color} />;
}

function hash(seed: string): number {
  let value = 2166136261;
  for (const char of seed) {
    value ^= char.charCodeAt(0);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}
