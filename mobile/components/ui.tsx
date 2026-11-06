import type { ReactNode, Ref } from 'react';
import {
  Image,
  ScrollView,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView, SymbolWeight } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { pulseRing } from '../lib/motion';
import {
  backgroundImage,
  colors,
  fonts,
  initials,
  tint,
} from '../lib/theme';
import { PressableScale } from './PressableScale';

export function Icon({
  name,
  size = 17,
  color = colors.text,
  weight = 'semibold',
  style,
}: {
  name: SFSymbol;
  size?: number;
  color?: string;
  weight?: SymbolWeight;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <SymbolView
      name={name}
      size={size}
      tintColor={color}
      weight={weight}
      style={[{ width: size, height: size }, style]}
    />
  );
}

// Thin-outlined circle with a light glyph in the item's color.
export function IconTile({
  name,
  color,
  size = 34,
  onDark,
}: {
  name: SFSymbol;
  color: string;
  size?: number;
  onDark?: boolean;
}) {
  return (
    <View
      style={[
        ui.iconTile,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: onDark ? 'rgba(255,255,255,0.45)' : colors.hairline,
        },
      ]}
    >
      <Icon
        name={name}
        size={size * 0.44}
        color={onDark ? '#fff' : color}
        weight="regular"
      />
    </View>
  );
}

export function Avatar({
  name,
  gradient,
  size = 44,
}: {
  name: string;
  gradient: readonly [string, string];
  size?: number;
}) {
  const letters = initials(name);
  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[ui.avatar, { width: size, height: size, borderRadius: size / 2 }]}
    >
      {letters ? (
        <Text style={[ui.avatarText, { fontSize: size * 0.38 }]}>
          {letters}
        </Text>
      ) : (
        <Icon name="person.fill" size={size * 0.46} color="#fff" />
      )}
    </LinearGradient>
  );
}

// Tinted capsule label: colored text on a 12% wash of the same color.
export function Pill({
  label,
  color,
  icon,
  solid,
}: {
  label: string;
  color: string;
  icon?: SFSymbol;
  solid?: boolean;
}) {
  const fg = solid ? '#fff' : color;
  return (
    <View
      style={[ui.pill, { backgroundColor: solid ? color : tint(color, 0.12) }]}
    >
      {icon && <Icon name={icon} size={11} color={fg} weight="bold" />}
      <Text style={[ui.pillText, { color: fg }]}>{label}</Text>
    </View>
  );
}

// ScrollView on the shared blurred backdrop. The image stays put while
// content (and the transparent large-title header) scrolls over it.
export function AuraScrollView({
  style,
  ref,
  ...props
}: ScrollViewProps & { ref?: Ref<ScrollView> }) {
  return (
    <View style={[ui.screen, style]}>
      <Image
        source={backgroundImage}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <ScrollView ref={ref} style={ui.screen} {...props} />
    </View>
  );
}

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[ui.card, style]}>{children}</View>;
}

export function SectionHeader({
  title,
  icon,
  color = colors.textSecondary,
  right,
}: {
  title: string;
  icon?: SFSymbol;
  color?: string;
  right?: ReactNode;
}) {
  return (
    <View style={ui.sectionHeader}>
      <View style={ui.sectionHeaderLeft}>
        {icon && <Icon name={icon} size={15} color={color} />}
        <Text style={ui.sectionHeaderText}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

// Primary action: the brand gradient (or a given color), white label.
export function GradientButton({
  label,
  icon,
  onPress,
  disabled,
  gradient,
  style,
}: {
  label: string;
  icon?: SFSymbol;
  onPress: () => void;
  disabled?: boolean;
  gradient?: readonly [string, string, ...string[]];
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      style={[ui.gradientButton, disabled && ui.disabled, style]}
    >
      {gradient && (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      {icon && <Icon name={icon} size={15} color="#fff" />}
      <Text style={ui.gradientButtonText}>{label}</Text>
    </PressableScale>
  );
}

// Secondary action: tinted fill in the action's own color.
export function TintButton({
  label,
  icon,
  color,
  onPress,
  disabled,
  style,
  textStyle,
}: {
  label: string;
  icon?: SFSymbol;
  color: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      style={[
        ui.tintButton,
        { backgroundColor: tint(color, 0.12) },
        disabled && ui.disabled,
        style,
      ]}
    >
      {icon && <Icon name={icon} size={15} color={color} />}
      <Text style={[ui.tintButtonText, { color }, textStyle]}>{label}</Text>
    </PressableScale>
  );
}

// Solid dot with a ring pulsing off it. Reduce Motion keeps the dot only.
export function LiveDot({ color = '#fff' }: { color?: string }) {
  const reduced = useReducedMotion();
  return (
    <View style={ui.liveDotWrap}>
      {!reduced && (
        <Animated.View
          style={[ui.liveDot, ui.liveRing, { backgroundColor: color }, pulseRing]}
        />
      )}
      <View style={[ui.liveDot, { backgroundColor: color }]} />
    </View>
  );
}

// Shared with CallCard, which applies it to a pressable instead of a View.
export const cardSurface = {
  width: '100%',
  backgroundColor: colors.card,
  borderRadius: 30,
  borderCurve: 'continuous',
  borderWidth: 1,
  borderColor: colors.cardBorder,
  padding: 18,
  boxShadow: '0 10px 30px rgba(60,40,20,0.08)',
} as const;

const ui = StyleSheet.create({
  screen: {
    flex: 1,
  },
  iconTile: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontFamily: fonts.semibold,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    textTransform: 'capitalize',
  },
  card: cardSurface,
  sectionHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 28,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sectionHeaderText: {
    fontSize: 22,
    fontFamily: fonts.medium,
    color: colors.text,
    letterSpacing: -0.4,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 15,
    borderRadius: 999,
    backgroundColor: colors.ink,
    overflow: 'hidden',
  },
  gradientButtonText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: '#fff',
  },
  tintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 999,
  },
  tintButtonText: {
    fontSize: 15,
    fontFamily: fonts.medium,
  },
  disabled: {
    opacity: 0.45,
  },
  liveDotWrap: {
    width: 8,
    height: 8,
  },
  liveDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveRing: {},
});
