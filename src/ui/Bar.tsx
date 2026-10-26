import { useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function ScreenBar({
  title,
  hint,
  hintColor = 'textSecondary',
  onBack,
  backLabel,
  trailing,
}: {
  title: string;
  hint?: string;
  hintColor?: ThemeColor;
  onBack: () => void;
  backLabel: string;
  trailing?: ReactNode;
}) {
  const theme = useTheme();
  const [leftW, setLeftW] = useState(0);
  const [rightW, setRightW] = useState(0);
  const inset = Math.max(leftW, rightW);
  return (
    <View style={[styles.topBar, { borderBottomColor: theme.backgroundSelected, minHeight: hint ? 56 : 44 }]}>
      <View style={styles.leading} onLayout={(event) => setWidth(event, setLeftW)}>
        <BarButton label={backLabel} onPress={onBack}>
          <BackIcon color={theme.text} />
        </BarButton>
      </View>
      <View style={styles.trailing} onLayout={(event) => setWidth(event, setRightW)}>
        {trailing ?? <View style={styles.balance} />}
      </View>
      <View pointerEvents="none" style={[styles.titleLayer, { paddingHorizontal: inset }]}>
        <ThemedText numberOfLines={1} style={styles.topTitle}>
          {title}
        </ThemedText>
        {hint ? (
          <ThemedText type="small" numberOfLines={1} style={styles.hint} themeColor={hintColor}>
            {hint}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

function setWidth(event: LayoutChangeEvent, set: Dispatch<SetStateAction<number>>) {
  const next = Math.ceil(event.nativeEvent.layout.width);
  set((prev) => (prev === next ? prev : next));
}

export function BarButton({
  label,
  onPress,
  disabled = false,
  on = false,
  children,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  on?: boolean;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected: on }}
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={[
        styles.barButton,
        {
          backgroundColor: on ? theme.backgroundSelected : theme.backgroundElement,
          borderColor: theme.backgroundSelected,
          opacity: disabled ? 0.38 : 1,
        },
      ]}
    >
      {children}
    </Pressable>
  );
}

export function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M14.5 5.5 L8 12 L14.5 18.5"
        fill="none"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leading: { paddingLeft: Spacing.three, zIndex: 1 },
  trailing: {
    paddingRight: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    zIndex: 1,
  },
  titleLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: Spacing.two,
    justifyContent: 'center',
  },
  barButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balance: { width: 40 },
  topTitle: {
    fontFamily: Fonts?.serif ?? 'serif',
    fontSize: 22,
    lineHeight: 26,
    fontWeight: 400,
    textAlign: 'center',
  },
  hint: { textAlign: 'center' },
});
