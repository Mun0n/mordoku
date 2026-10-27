import { useRef, type ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, G, Line, Rect, Text as SvgText } from 'react-native-svg';

import { bodyCell } from '@/engine/check';
import { gridOf } from '@/engine/grid';
import { initial } from '@/engine/text';
import { cellKey, sameCell, type Assignment, type Cell, type Puzzle } from '@/engine/types';
import type { Notes } from '@/game/state';
import { ObjectGlyph } from '@/ui/Glyph';

const PAPER = '#f3ecdf';
const INK = '#2b2622';
const GRID = 'rgba(43, 38, 34, 0.14)';
const PAD = 14;

type BoardProps = {
  puzzle: Puzzle;
  placements: Assignment;
  notes: Notes;
  selectedId: string | null;
  width: number;
  onTap: (r: number, c: number) => void;
  onLongPress: (r: number, c: number) => void;
};

export function Board({ puzzle, placements, notes, selectedId, width, onTap, onLongPress }: BoardProps) {
  const grid = gridOf(puzzle);
  const cell = Math.floor((width - PAD * 2) / puzzle.size);
  const inner = cell * puzzle.size;
  const board = inner + PAD * 2;
  const selected = selectedId ? puzzle.suspects.find((suspect) => suspect.id === selectedId) : null;
  const wall = Math.max(3.5, cell * 0.07);
  const body = bodyCell(puzzle, placements);

  return (
    <View style={{ width: board, height: board }}>
      <Svg width={board} height={board}>
        <Rect x={0} y={0} width={board} height={board} rx={10} fill={PAPER} />
        {Array.from({ length: puzzle.size }, (_, r) =>
          Array.from({ length: puzzle.size }, (_, c) => {
            const area = grid.areaId[r][c];
            const occupied = occupant(puzzle, placements, r, c);
            const illegal =
              Boolean(selected) &&
              !sameCell({ r, c }, occupied?.cell ?? { r: -1, c: -1 }) &&
              (grid.blocked[r][c] ||
                (body !== null && (r === body.r || c === body.c)) ||
                puzzle.suspects.some((suspect) => {
                  if (suspect.id === selectedId) return false;
                  const placed = placements[suspect.id];
                  return placed && (placed.r === r || placed.c === c);
                }));
            return (
              <Floor
                key={`${r}-${c}`}
                x={PAD + c * cell}
                y={PAD + r * cell}
                size={cell}
                color={grid.areaColor.get(area) ?? PAPER}
                pattern={floorPattern(area)}
                light={(r + c) % 2 === 0}
                dim={illegal}
              />
            );
          }),
        )}
        {roomGrid(grid.areaId, cell)}
        {puzzle.objects.map((item) => {
          const inset = item.kind === 'alfombra' ? cell * 0.08 : cell * 0.16;
          return (
            <ObjectGlyph
              key={`${item.r}-${item.c}`}
              kind={item.kind}
              x={PAD + item.c * cell + inset}
              y={PAD + item.r * cell + inset}
              size={cell - inset * 2}
            />
          );
        })}
        {Array.from({ length: puzzle.size }, (_, r) =>
          Array.from({ length: puzzle.size }, (_, c) => {
            if (occupant(puzzle, placements, r, c)) return null;
            const marks = notes[cellKey({ r, c })];
            if (!marks?.length) return null;
            const letters = marks
              .map((id) => initial(puzzle.suspects.find((suspect) => suspect.id === id)?.name ?? '?'))
              .join('');
            const font = Math.max(8, cell * 0.2);
            const pillW = letters.length * font * 0.72 + 6;
            return (
              <G key={`n-${r}-${c}`}>
                <Rect
                  x={PAD + c * cell + 3}
                  y={PAD + r * cell + 3}
                  width={pillW}
                  height={font + 4}
                  rx={3}
                  fill="#fffdf8"
                  stroke={INK}
                  strokeWidth={0.6}
                />
                <SvgText
                  x={PAD + c * cell + 6}
                  y={PAD + r * cell + font + 2}
                  fill={INK}
                  fontSize={font}
                  fontWeight="700"
                >
                  {letters}
                </SvgText>
              </G>
            );
          }),
        )}
        {areaEdges(grid.areaId, cell, wall)}
        <Rect x={PAD} y={PAD} width={inner} height={inner} fill="none" stroke={INK} strokeWidth={wall + 1.5} />
        {windows(puzzle, cell)}
        {roomLabels(puzzle, cell)}
        {puzzle.suspects.map((suspect) => {
          const placed = placements[suspect.id];
          if (!placed) return null;
          const standing = puzzle.objects.some((item) => item.r === placed.r && item.c === placed.c);
          return (
            <PersonToken
              key={suspect.id}
              cx={PAD + placed.c * cell + cell / 2}
              cy={PAD + placed.r * cell + (standing ? cell * 0.32 : cell / 2)}
              size={standing ? cell * 0.4 : cell * 0.56}
              color={suspect.color}
              letter={initial(suspect.name)}
              selected={suspect.id === selectedId}
              victim={false}
            />
          );
        })}
        {body ? (
          <PersonToken
            cx={PAD + body.c * cell + cell / 2}
            cy={PAD + body.r * cell + (onObject(puzzle, body) ? cell * 0.32 : cell / 2)}
            size={onObject(puzzle, body) ? cell * 0.4 : cell * 0.56}
            color="#3e3834"
            letter={initial(puzzle.victim.name)}
            selected={false}
            victim
          />
        ) : null}
      </Svg>
      <View style={{ position: 'absolute', left: PAD, top: PAD, width: inner, height: inner }}>
        {Array.from({ length: puzzle.size }, (_, r) =>
          Array.from({ length: puzzle.size }, (_, c) => (
            <CellHit
              key={`${r}-${c}`}
              x={c * cell}
              y={r * cell}
              size={cell}
              label={cellLabel(puzzle, placements, r, c)}
              onTap={() => onTap(r, c)}
              onLongPress={() => onLongPress(r, c)}
            />
          )),
        )}
      </View>
    </View>
  );
}

function Floor({
  x,
  y,
  size,
  color,
  pattern,
  light,
  dim,
}: {
  x: number;
  y: number;
  size: number;
  color: string;
  pattern: 'wood' | 'check' | 'tile';
  light: boolean;
  dim: boolean;
}) {
  const wash = pattern === 'check' && light ? 'rgba(255,255,255,0.34)' : 'rgba(43,38,34,0.05)';
  return (
    <G opacity={dim ? 0.42 : 1}>
      <Rect x={x} y={y} width={size} height={size} fill={color} />
      {pattern === 'check' ? <Rect x={x} y={y} width={size} height={size} fill={wash} /> : null}
      {pattern === 'wood'
        ? [0.33, 0.66].map((step) => (
            <Line
              key={step}
              x1={x}
              y1={y + size * step}
              x2={x + size}
              y2={y + size * step}
              stroke="rgba(90, 58, 28, 0.16)"
              strokeWidth={1}
            />
          ))
        : null}
      {pattern === 'tile' ? (
        <Rect
          x={x + size * 0.08}
          y={y + size * 0.08}
          width={size * 0.84}
          height={size * 0.84}
          fill="none"
          stroke="rgba(43, 38, 34, 0.12)"
          strokeWidth={1}
        />
      ) : null}
    </G>
  );
}

function floorPattern(areaId: number): 'wood' | 'check' | 'tile' {
  const patterns = ['wood', 'check', 'tile'] as const;
  return patterns[((areaId % 3) + 3) % 3];
}

function roomGrid(areaId: number[][], cell: number) {
  const lines: ReactElement[] = [];
  const size = areaId.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (c + 1 < size && areaId[r][c] === areaId[r][c + 1]) {
        lines.push(
          <Line
            key={`gv-${r}-${c}`}
            x1={PAD + (c + 1) * cell}
            y1={PAD + r * cell}
            x2={PAD + (c + 1) * cell}
            y2={PAD + (r + 1) * cell}
            stroke={GRID}
            strokeWidth={1}
          />,
        );
      }
      if (r + 1 < size && areaId[r][c] === areaId[r + 1][c]) {
        lines.push(
          <Line
            key={`gh-${r}-${c}`}
            x1={PAD + c * cell}
            y1={PAD + (r + 1) * cell}
            x2={PAD + (c + 1) * cell}
            y2={PAD + (r + 1) * cell}
            stroke={GRID}
            strokeWidth={1}
          />,
        );
      }
    }
  }
  return lines;
}

function areaEdges(areaId: number[][], cell: number, wall: number) {
  const lines: ReactElement[] = [];
  const size = areaId.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (c + 1 < size && areaId[r][c] !== areaId[r][c + 1]) {
        lines.push(
          <Line
            key={`ae-${r}-${c}`}
            x1={PAD + (c + 1) * cell}
            y1={PAD + r * cell}
            x2={PAD + (c + 1) * cell}
            y2={PAD + (r + 1) * cell}
            stroke={INK}
            strokeWidth={wall}
            strokeLinecap="square"
          />,
        );
      }
      if (r + 1 < size && areaId[r][c] !== areaId[r + 1][c]) {
        lines.push(
          <Line
            key={`as-${r}-${c}`}
            x1={PAD + c * cell}
            y1={PAD + (r + 1) * cell}
            x2={PAD + (c + 1) * cell}
            y2={PAD + (r + 1) * cell}
            stroke={INK}
            strokeWidth={wall}
            strokeLinecap="square"
          />,
        );
      }
    }
  }
  return lines;
}

const LABEL_WIDTH = 0.66;

function roomLabels(puzzle: Puzzle, cell: number) {
  return puzzle.areas.map((area) => {
    const text = area.name.replace(/^(el|la|los|las)\s+/i, '').toUpperCase();
    const seam = labelSeam(area.cells, puzzle.size);
    const span = seam.end - seam.start + 1;
    const maxW = Math.max(18, span * cell - 8);
    const font = Math.min(10, Math.max(7, (maxW - 8) / (text.length * LABEL_WIDTH)));
    const pillW = Math.min(maxW, text.length * font * LABEL_WIDTH + 8);
    const pillH = font + 4;
    const cx = PAD + ((seam.start + seam.end + 1) / 2) * cell;
    const cy = PAD + seam.line * cell;
    return (
      <G key={`label-${area.id}`}>
        <Rect
          x={cx - pillW / 2}
          y={cy - pillH / 2}
          width={pillW}
          height={pillH}
          rx={pillH / 2}
          fill="#fffdf8"
          stroke={INK}
          strokeWidth={1}
        />
        <SvgText
          x={cx}
          y={cy + font * 0.35}
          fill={INK}
          fontSize={font}
          fontWeight="700"
          textAnchor="middle"
        >
          {text}
        </SvgText>
      </G>
    );
  });
}

function labelSeam(cells: Cell[], size: number): { line: number; start: number; end: number } {
  const set = new Set(cells.map((spot) => cellKey(spot)));
  const cr = cells.reduce((sum, spot) => sum + spot.r, 0) / cells.length;
  const cc = cells.reduce((sum, spot) => sum + spot.c, 0) / cells.length;
  let best: { line: number; start: number; end: number; score: number } | null = null;

  const consider = (line: number, start: number, end: number, internal: boolean) => {
    const span = end - start + 1;
    const mid = (start + end) / 2;
    const score = (internal ? 100 : 0) + span * 4 - (Math.abs(line - 0.5 - cr) + Math.abs(mid - cc)) * 3;
    if (!best || score > best.score) best = { line, start, end, score };
  };

  const rows = [...new Set(cells.map((spot) => spot.r))].sort((a, b) => a - b);
  for (let index = 0; index < rows.length - 1; index++) {
    const above = rows[index];
    const below = rows[index + 1];
    if (below !== above + 1) continue;
    const cols = cells
      .filter((spot) => spot.r === above && set.has(`${below},${spot.c}`))
      .map((spot) => spot.c)
      .sort((a, b) => a - b);
    for (const run of contiguous(cols)) consider(below, run.start, run.end, true);
  }
  if (best) return best;

  const row = rows[0] ?? 0;
  const cols = cells.filter((spot) => spot.r === row).map((spot) => spot.c).sort((a, b) => a - b);
  const run = contiguous(cols)[0] ?? { start: 0, end: 0 };
  const line = row <= 0 ? 1 : row >= size - 1 ? row : row < size / 2 ? row + 1 : row;
  return { line, start: run.start, end: run.end };
}

function contiguous(cols: number[]): { start: number; end: number }[] {
  const out: { start: number; end: number }[] = [];
  if (cols.length === 0) return out;
  let start = cols[0];
  let prev = cols[0];
  for (let index = 1; index < cols.length; index++) {
    if (cols[index] === prev + 1) prev = cols[index];
    else {
      out.push({ start, end: prev });
      start = cols[index];
      prev = cols[index];
    }
  }
  out.push({ start, end: prev });
  return out.sort((a, b) => b.end - b.start - (a.end - a.start));
}

function onObject(puzzle: Puzzle, cell: Cell) {
  return puzzle.objects.some((item) => item.r === cell.r && item.c === cell.c);
}

function windows(puzzle: Puzzle, cell: number) {
  const nodes: ReactElement[] = [];
  for (const area of puzzle.areas) {
    for (const side of ['n', 's', 'e', 'w'] as const) {
      const run = longestRun(area.cells, puzzle.size, side);
      if (!run) continue;
      const at = Math.floor((run.start + run.end) / 2);
      const win = cell * 0.62;
      const along = PAD + at * cell + (cell - win) / 2;
      const thick = Math.max(9, cell * 0.2);
      if (side === 'n' || side === 's') {
        const y = side === 'n' ? PAD - thick / 2 : PAD + puzzle.size * cell - thick / 2;
        nodes.push(<Window key={`${area.id}-${side}`} x={along} y={y} w={win} h={thick} vertical={false} />);
      } else {
        const x = side === 'w' ? PAD - thick / 2 : PAD + puzzle.size * cell - thick / 2;
        nodes.push(<Window key={`${area.id}-${side}`} x={x} y={along} w={thick} h={win} vertical />);
      }
    }
  }
  return nodes;
}

function Window({ x, y, w, h, vertical }: { x: number; y: number; w: number; h: number; vertical: boolean }) {
  const midX = x + w / 2;
  const midY = y + h / 2;
  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} rx={2} fill="#f7fbff" stroke={INK} strokeWidth={1.4} />
      <Rect x={x + 1.5} y={y + 1.5} width={w - 3} height={h - 3} fill="#d5e4f2" />
      {vertical ? (
        <Line x1={x} y1={midY} x2={x + w} y2={midY} stroke={INK} strokeWidth={1} />
      ) : (
        <Line x1={midX} y1={y} x2={midX} y2={y + h} stroke={INK} strokeWidth={1} />
      )}
    </G>
  );
}

function longestRun(cells: Cell[], size: number, side: 'n' | 's' | 'e' | 'w') {
  const coords = cells
    .filter((cell) =>
      side === 'n' ? cell.r === 0 : side === 's' ? cell.r === size - 1 : side === 'w' ? cell.c === 0 : cell.c === size - 1,
    )
    .map((cell) => (side === 'n' || side === 's' ? cell.c : cell.r))
    .sort((a, b) => a - b);
  let best: { start: number; end: number } | null = null;
  let current: { start: number; end: number } | null = null;
  for (const value of coords) {
    if (current && value === current.end + 1) current.end = value;
    else current = { start: value, end: value };
    if (!best || current.end - current.start > best.end - best.start) best = { ...current };
  }
  return best;
}

function PersonToken({
  cx,
  cy,
  size,
  color,
  letter,
  selected,
  victim,
}: {
  cx: number;
  cy: number;
  size: number;
  color: string;
  letter: string;
  selected: boolean;
  victim: boolean;
}) {
  const w = size;
  const h = size * 1.12;
  const head = size * 0.28;
  return (
    <G>
      <Rect
        x={cx - w / 2}
        y={cy - h / 2}
        width={w}
        height={h}
        rx={size * 0.16}
        fill="#fffdf8"
        stroke={selected ? color : victim ? '#8c2f2f' : INK}
        strokeWidth={selected ? 2.6 : 1.3}
      />
      <Circle cx={cx} cy={cy - h * 0.08} r={head} fill={color} />
      <SvgText
        x={cx}
        y={cy - h * 0.08 + head * 0.38}
        fill="#fffaf3"
        fontSize={head * 1.15}
        fontWeight="700"
        textAnchor="middle"
      >
        {letter}
      </SvgText>
    </G>
  );
}

function CellHit({
  x,
  y,
  size,
  label,
  onTap,
  onLongPress,
}: {
  x: number;
  y: number;
  size: number;
  label: string;
  onTap: () => void;
  onLongPress: () => void;
}) {
  const skip = useRef(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onLongPress={() => {
        skip.current = true;
        onLongPress();
      }}
      onPress={() => {
        if (skip.current) {
          skip.current = false;
          return;
        }
        onTap();
      }}
      style={{ position: 'absolute', left: x, top: y, width: size, height: size }}
    />
  );
}

function occupant(puzzle: Puzzle, placements: Assignment, r: number, c: number) {
  const body = bodyCell(puzzle, placements);
  if (body && body.r === r && body.c === c) {
    return { id: puzzle.victim.id, cell: body, name: puzzle.victim.name, victim: true };
  }
  for (const suspect of puzzle.suspects) {
    const cell = placements[suspect.id];
    if (cell && cell.r === r && cell.c === c) {
      return { id: suspect.id, cell, name: suspect.name, victim: false };
    }
  }
  return null;
}

function cellLabel(puzzle: Puzzle, placements: Assignment, r: number, c: number): string {
  const grid = gridOf(puzzle);
  const area = grid.areaName.get(grid.areaId[r][c]) ?? 'sala';
  const who = occupant(puzzle, placements, r, c);
  const state = who ? (who.victim ? `víctima ${who.name}` : who.name) : 'vacía';
  return `Fila ${r + 1}, columna ${c + 1}, ${area}, ${state}`;
}
