import { useState } from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { EASE_OUT_CSS } from '../lib/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Drop-in Pressable with iOS-style press feedback: shrinks to 97% the instant
// a finger lands and springs back on release. Background/border colors also
// cross-fade instead of snapping, so selected states change smoothly.
// setState is fine here — it fires twice per press, not per frame.
export function PressableScale({
  style,
  onPressIn,
  onPressOut,
  ...props
}: Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle> }) {
  const [pressed, setPressed] = useState(false);
  const reduced = useReducedMotion();

  return (
    <AnimatedPressable
      pressRetentionOffset={16}
      {...props}
      onPressIn={(e) => {
        setPressed(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        onPressOut?.(e);
      }}
      style={[
        pressStyles.base,
        style,
        // Reduce Motion: dim instead of moving.
        pressed && (reduced ? pressStyles.dimmed : pressStyles.pressed),
      ]}
    />
  );
}

const pressStyles = {
  base: {
    transform: [{ scale: 1 }],
    transitionProperty: ['transform', 'opacity', 'backgroundColor', 'borderColor'],
    transitionDuration: 150,
    transitionTimingFunction: EASE_OUT_CSS,
  },
  pressed: { transform: [{ scale: 0.97 }] },
  dimmed: { opacity: 0.6 },
} as const;
