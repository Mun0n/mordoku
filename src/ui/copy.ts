import * as Haptics from 'expo-haptics';

import type { BlockReason, CheckResult } from '@/engine/check';
import { clueLabel, personName } from '@/engine/text';
import type { Puzzle } from '@/engine/types';
import type { Hint } from '@/engine/analyze';

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
  if (result.type === 'forced') {
    const name = personName(puzzle, result.personId);
    return `${name} solo puede estar en la fila ${result.cell.r + 1}, columna ${result.cell.c + 1}.`;
  }
  if (result.type === 'none') {
    return 'No hay ninguna colocación forzada. Puedes seguir, o ver la solución.';
  }
  if (result.ref) return `Esta pista no cuadra: ${clueLabel(puzzle, result.ref)}`;
  if (result.reason === 'killer') return 'En la sala de la víctima ya hay más de una persona.';
  if (result.reason === 'row') return 'Esa fila ya está ocupada.';
  if (result.reason === 'col') return 'Esa columna ya está ocupada.';
  if (result.reason === 'blocked') return 'Ahí no cabe nadie.';
  return 'Estas colocaciones no encajan con las pistas.';
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
