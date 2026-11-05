import AsyncStorage from '@react-native-async-storage/async-storage';

import { blankAssignment } from '@/engine/check';
import type { Assignment, Puzzle } from '@/engine/types';
import type { Notes } from '@/game/state';

const PROGRESS_KEY = 'caso.v1.progress';
const HOW_TO_KEY = 'caso.v1.seenHowTo';

export type CaseStatus = 'new' | 'in_progress' | 'solved' | 'revealed';

export type CaseProgress = {
  placements: Assignment;
  notes: Notes;
  status: CaseStatus;
  updatedAt?: number;
};

export type ProgressFile = Record<string, CaseProgress>;

let memory: ProgressFile | null = null;
let tail: Promise<void> = Promise.resolve();

export async function loadProgress(): Promise<ProgressFile> {
  if (memory) return memory;
  const raw = await AsyncStorage.getItem(PROGRESS_KEY);
  if (!raw) {
    memory = {};
    return memory;
  }
  try {
    const parsed = JSON.parse(raw) as ProgressFile;
    memory = parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    memory = {};
  }
  return memory;
}

function enqueue(job: Promise<void>): Promise<void> {
  tail = job.then(
    () => undefined,
    () => undefined,
  );
  return job;
}

export function progressSnapshot(): ProgressFile {
  return memory ?? {};
}

export function writeCase(id: string, progress: CaseProgress): Promise<void> {
  return enqueue(
    tail.then(async () => {
      if (!memory) await loadProgress();
      memory = { ...memory, [id]: { ...progress, updatedAt: Date.now() } };
      await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(memory));
    }),
  );
}

export function clearProgress(): Promise<void> {
  return enqueue(
    tail.then(async () => {
      memory = {};
      await AsyncStorage.removeItem(PROGRESS_KEY);
    }),
  );
}

export function resumeCaseId(file: ProgressFile): string | null {
  let id: string | null = null;
  let at = -1;
  for (const [key, saved] of Object.entries(file)) {
    if (saved?.status !== 'in_progress') continue;
    const stamp = saved.updatedAt ?? 0;
    if (stamp >= at) {
      id = key;
      at = stamp;
    }
  }
  return id;
}

export async function hasSeenHowTo(): Promise<boolean> {
  return (await AsyncStorage.getItem(HOW_TO_KEY)) === '1';
}

export async function markHowToSeen(): Promise<void> {
  await AsyncStorage.setItem(HOW_TO_KEY, '1');
}

export function readProgress(puzzle: Puzzle, saved: CaseProgress | undefined): CaseProgress {
  const placements = blankAssignment(puzzle);
  const notes: Notes = {};
  if (!saved) return { placements, notes, status: 'new' };

  for (const suspect of puzzle.suspects) {
    const cell = saved.placements?.[suspect.id];
    if (!cell) continue;
    if (
      Number.isInteger(cell.r) &&
      Number.isInteger(cell.c) &&
      cell.r >= 0 &&
      cell.c >= 0 &&
      cell.r < puzzle.size &&
      cell.c < puzzle.size
    ) {
      placements[suspect.id] = { r: cell.r, c: cell.c };
    }
  }

  for (const [key, ids] of Object.entries(saved.notes ?? {})) {
    if (!Array.isArray(ids)) continue;
    const kept = ids.filter((id) => puzzle.suspects.some((suspect) => suspect.id === id));
    if (kept.length > 0) notes[key] = kept;
  }

  const status: CaseStatus =
    saved.status === 'solved' || saved.status === 'revealed' || saved.status === 'in_progress'
      ? saved.status
      : 'new';

  return { placements, notes, status };
}
