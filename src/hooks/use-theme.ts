/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useSettings } from '@/settings';

export function useTheme() {
  const { resolved } = useSettings();
  return Colors[resolved];
}
