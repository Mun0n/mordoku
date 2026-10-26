import Svg, { Ellipse, G, Rect } from 'react-native-svg';

import type { ObjectKind } from '@/engine/types';

const INK = '#2c2622';
const CREAM = '#f7f3ec';
const WOOD = '#c4894a';
const WOOD_DARK = '#8a5528';
const LEAF = '#3c8f4a';
const LEAF_DARK = '#2c6b38';
const POT = '#c45b3e';
const SOFA = '#4e7d74';
const SOFA_LIGHT = '#6fa399';

type Box = { x: number; y: number; size: number };

export function ObjectGlyph({ kind, x, y, size }: Box & { kind: ObjectKind }) {
  switch (kind) {
    case 'silla':
      return <Chair x={x} y={y} size={size} />;
    case 'planta':
      return <Plant x={x} y={y} size={size} />;
    case 'mesa':
      return <Table x={x} y={y} size={size} />;
    case 'alfombra':
      return <Rug x={x} y={y} size={size} />;
    case 'estanteria':
      return <Shelf x={x} y={y} size={size} />;
    case 'sofa':
      return <Sofa x={x} y={y} size={size} />;
  }
}

export function ObjectSwatch({ kind }: { kind: ObjectKind }) {
  return (
    <Svg width={36} height={36}>
      <Rect x={0} y={0} width={36} height={36} rx={6} fill="#f4efe6" />
      <ObjectGlyph kind={kind} x={4} y={4} size={28} />
    </Svg>
  );
}

function Chair({ x, y, size }: Box) {
  const sw = stroke(size);
  return (
    <G>
      <Rect x={x + size * 0.22} y={y + size * 0.78} width={size * 0.1} height={size * 0.14} rx={1} fill={WOOD_DARK} />
      <Rect x={x + size * 0.68} y={y + size * 0.78} width={size * 0.1} height={size * 0.14} rx={1} fill={WOOD_DARK} />
      <Rect
        x={x + size * 0.16}
        y={y + size * 0.08}
        width={size * 0.68}
        height={size * 0.3}
        rx={size * 0.12}
        fill={CREAM}
        stroke={INK}
        strokeWidth={sw}
      />
      <Rect
        x={x + size * 0.08}
        y={y + size * 0.3}
        width={size * 0.18}
        height={size * 0.42}
        rx={size * 0.06}
        fill={CREAM}
        stroke={INK}
        strokeWidth={sw}
      />
      <Rect
        x={x + size * 0.74}
        y={y + size * 0.3}
        width={size * 0.18}
        height={size * 0.42}
        rx={size * 0.06}
        fill={CREAM}
        stroke={INK}
        strokeWidth={sw}
      />
      <Rect
        x={x + size * 0.24}
        y={y + size * 0.34}
        width={size * 0.52}
        height={size * 0.4}
        rx={size * 0.08}
        fill="#eadccb"
        stroke={INK}
        strokeWidth={sw}
      />
    </G>
  );
}

function Plant({ x, y, size }: Box) {
  const sw = stroke(size);
  const cx = x + size / 2;
  return (
    <G>
      <Ellipse cx={x + size * 0.3} cy={y + size * 0.4} rx={size * 0.2} ry={size * 0.22} fill={LEAF} />
      <Ellipse cx={x + size * 0.7} cy={y + size * 0.4} rx={size * 0.2} ry={size * 0.22} fill="#57a85e" />
      <Ellipse cx={cx} cy={y + size * 0.26} rx={size * 0.16} ry={size * 0.2} fill={LEAF_DARK} />
      <Ellipse cx={cx} cy={y + size * 0.4} rx={size * 0.1} ry={size * 0.12} fill="#8dca78" />
      <Rect x={x + size * 0.3} y={y + size * 0.56} width={size * 0.4} height={size * 0.08} rx={1} fill="#a34732" />
      <Rect
        x={x + size * 0.34}
        y={y + size * 0.62}
        width={size * 0.32}
        height={size * 0.26}
        rx={2}
        fill={POT}
        stroke={INK}
        strokeWidth={sw}
      />
    </G>
  );
}

function Table({ x, y, size }: Box) {
  const sw = stroke(size);
  return (
    <G>
      <Rect x={x + size * 0.14} y={y + size * 0.18} width={size * 0.08} height={size * 0.16} rx={1} fill={WOOD_DARK} />
      <Rect x={x + size * 0.78} y={y + size * 0.18} width={size * 0.08} height={size * 0.16} rx={1} fill={WOOD_DARK} />
      <Rect x={x + size * 0.14} y={y + size * 0.7} width={size * 0.08} height={size * 0.16} rx={1} fill={WOOD_DARK} />
      <Rect x={x + size * 0.78} y={y + size * 0.7} width={size * 0.08} height={size * 0.16} rx={1} fill={WOOD_DARK} />
      <Rect
        x={x + size * 0.08}
        y={y + size * 0.26}
        width={size * 0.84}
        height={size * 0.48}
        rx={size * 0.06}
        fill={WOOD}
        stroke={INK}
        strokeWidth={sw}
      />
      <Rect x={x + size * 0.16} y={y + size * 0.34} width={size * 0.68} height={size * 0.08} rx={1} fill="rgba(255,255,255,0.28)" />
    </G>
  );
}

function Rug({ x, y, size }: Box) {
  const inset = size * 0.06;
  const sw = stroke(size);
  return (
    <G>
      <Rect
        x={x + inset}
        y={y + inset}
        width={size - inset * 2}
        height={size - inset * 2}
        rx={size * 0.08}
        fill="#e7d3b4"
        stroke="#8d6a45"
        strokeWidth={sw}
      />
      <Rect
        x={x + inset * 2.4}
        y={y + inset * 2.4}
        width={size - inset * 4.8}
        height={size - inset * 4.8}
        rx={size * 0.04}
        fill="none"
        stroke="#b08968"
        strokeWidth={Math.max(0.6, sw * 0.8)}
      />
      <Rect
        x={x + size * 0.36}
        y={y + size * 0.36}
        width={size * 0.28}
        height={size * 0.28}
        rx={2}
        fill="#c9a27a"
      />
    </G>
  );
}

function Shelf({ x, y, size }: Box) {
  const sw = stroke(size);
  const spines = ['#c4476a', '#3a6fbe', '#e0b15a', '#2f8f55'];
  const rows = [0.16, 0.46, 0.74];
  return (
    <G>
      <Rect
        x={x + size * 0.1}
        y={y + size * 0.06}
        width={size * 0.8}
        height={size * 0.88}
        rx={2}
        fill="#6a4630"
        stroke={INK}
        strokeWidth={sw}
      />
      {rows.map((row) =>
        spines.map((color, index) => (
          <Rect
            key={`${row}-${index}`}
            x={x + size * (0.16 + index * 0.17)}
            y={y + size * row}
            width={size * 0.13}
            height={size * 0.2}
            rx={1}
            fill={color}
          />
        )),
      )}
    </G>
  );
}

function Sofa({ x, y, size }: Box) {
  const sw = stroke(size);
  return (
    <G>
      <Rect
        x={x + size * 0.06}
        y={y + size * 0.16}
        width={size * 0.88}
        height={size * 0.72}
        rx={size * 0.14}
        fill={SOFA}
        stroke={INK}
        strokeWidth={sw}
      />
      <Rect
        x={x + size * 0.18}
        y={y + size * 0.08}
        width={size * 0.64}
        height={size * 0.28}
        rx={size * 0.1}
        fill={SOFA_LIGHT}
        stroke={INK}
        strokeWidth={sw}
      />
      <Rect x={x + size * 0.18} y={y + size * 0.42} width={size * 0.28} height={size * 0.32} rx={size * 0.08} fill="#e7efe9" />
      <Rect x={x + size * 0.52} y={y + size * 0.42} width={size * 0.28} height={size * 0.32} rx={size * 0.08} fill="#f6faf7" />
    </G>
  );
}

function stroke(size: number) {
  return Math.max(0.8, size * 0.035);
}
