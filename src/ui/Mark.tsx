import Svg, { Circle, Line, Rect } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

export function Mark({ size = 72 }: { size?: number }) {
  const theme = useTheme();
  const ink = theme.text;
  const paper = theme.backgroundElement;
  const room = theme.accent;

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Rect x="2.5" y="2.5" width="59" height="59" rx="16" fill={paper} stroke={ink} strokeWidth="2.5" />
      <Rect x="9" y="9" width="21" height="21" rx="2" fill={room} />
      <Line x1="32" y1="8" x2="32" y2="56" stroke={ink} strokeWidth="2.5" />
      <Line x1="8" y1="32" x2="56" y2="32" stroke={ink} strokeWidth="2.5" />
      <Circle cx="44" cy="44" r="3.2" fill={ink} />
    </Svg>
  );
}
