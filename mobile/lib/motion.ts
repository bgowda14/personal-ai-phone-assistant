import * as Haptics from 'expo-haptics';
import {
  Easing,
  FadeIn,
  FadeOut,
  Keyframe,
  LinearTransition,
  cubicBezier,
} from 'react-native-reanimated';

// One motion vocabulary for the whole app, so every screen moves the same
// way. Strong custom curves — the built-in easings are too weak to feel
// like iOS.
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);

// For Reanimated CSS transitions (press feedback, color changes).
export const EASE_OUT_CSS = cubicBezier(0.23, 1, 0.32, 1);

// Selected/unselected label colors cross-fade alongside PressableScale's
// background, instead of snapping a frame ahead of it.
export const colorTransition = {
  transitionProperty: 'color',
  transitionDuration: 150,
  transitionTimingFunction: EASE_OUT_CSS,
} as const;

// Things appearing: a slight scale-up from 0.97, never from nothing.
export const ENTER = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.97 }] },
  100: { opacity: 1, transform: [{ scale: 1 }], easing: EASE_OUT },
}).duration(220);

// Exits are quicker than entrances — the user is already done with it.
export const EXIT = FadeOut.duration(160).easing(EASE_OUT);

// Plain fade for small inline text (errors, status lines).
export const FADE_IN = FadeIn.duration(180).easing(EASE_OUT);

// Siblings sliding into the space something left or made.
export const REFLOW = LinearTransition.duration(250).easing(EASE_IN_OUT);

// Haptics never block or throw into the UI — some devices have them off.
export const haptic = {
  select: () => Haptics.selectionAsync().catch(() => {}),
  light: () =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
  medium: () =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}),
  success: () =>
    Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    ).catch(() => {}),
  error: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
      () => {}
    ),
};
