import * as Haptics from 'expo-haptics';

import type { Hint } from '@/engine/analyze';
import type { BlockReason, CheckResult } from '@/engine/check';
import { clueLabel, personName } from '@/engine/text';
import type { Puzzle } from '@/engine/types';

export function blockMessage(reason: BlockReason): string {
  switch (reason) {
    case 'blocked':
      return 'Ahí no cabe nadie.';
    case 'occupied':
      return 'Esa casilla está ocupada.';
    case 'row':
      return 'Esa fila ya está ocupada.';
    case 'col':
      return 'Esa columna ya está ocupada.';
  }
}

export function checkMessage(puzzle: Puzzle, result: CheckResult): string {
  if (result.ok) return `El asesino es ${personName(puzzle, result.killerId)}.`;
  switch (result.reason) {
    case 'incomplete':
      return 'Aún falta gente por colocar.';
    case 'killer':
      return 'Las pistas encajan, pero en la sala de la víctima no queda exactamente una persona viva.';
    case 'clue':
      return `Esta pista no cuadra: ${clueLabel(puzzle, result.ref)}`;
    case 'row':
    case 'col':
      return 'Hay dos personas en la misma fila o columna.';
    case 'blocked':
      return 'Alguien está sobre un mueble que no se puede ocupar.';
  }
}

export function hintMessage(puzzle: Puzzle, result: Hint): string {
  if (result.type === 'forced') return `${personName(puzzle, result.personId)} solo puede ir ahí.`;
  if (result.type === 'none') return 'No hay una casilla forzada.';
  switch (result.reason) {
    case 'blocked':
      return 'Alguien está sobre un mueble que no se puede ocupar.';
    case 'row':
    case 'col':
      return 'Hay dos personas en la misma fila o columna.';
    case 'killer':
      return 'En la sala de la víctima no queda exactamente una persona viva.';
    case 'domain':
      return result.ref ? `Esta pista no cuadra: ${clueLabel(puzzle, result.ref)}` : 'Las pistas no dejan sitio.';
  }
}

let hapticsOn = true;

export function setHapticsEnabled(on: boolean) {
  hapticsOn = on;
}

function buzz(run: () => Promise<unknown>) {
  if (!hapticsOn) return;
  void run().catch(() => undefined);
}

export function tapOk() {
  buzz(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

export function tapNo() {
  buzz(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
}

export function tapWin() {
  buzz(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}
