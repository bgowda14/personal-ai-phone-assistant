import type { ImageSourcePropType } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

// Urbanist — a soft geometric sans, loaded in the root layout. Custom
// fonts ignore fontWeight on iOS, so each weight is its own family.
export const fonts = {
  light: 'Urbanist_300Light',
  regular: 'Urbanist_400Regular',
  medium: 'Urbanist_500Medium',
  semibold: 'Urbanist_600SemiBold',
  bold: 'Urbanist_700Bold',
};

// Blurred, grainy color fields behind every screen and inside the status
// card (generated images — see assets/aura).
export const backgroundImage: ImageSourcePropType = require('../assets/aura/background.jpg');

// iOS system palette — the same colors Apple's own apps use, so tints,
// pills and icons sit naturally next to the native tab bar and headers.
export const palette = {
  green: '#34C759',
  mint: '#00C7BE',
  teal: '#30B0C7',
  cyan: '#32ADE6',
  blue: '#007AFF',
  indigo: '#5856D6',
  purple: '#AF52DE',
  pink: '#FF2D55',
  red: '#FF3B30',
  orange: '#FF9500',
  yellow: '#FFCC00',
  gray: '#8E8E93',
};

export const colors = {
  background: '#ECEBE8',
  card: 'rgba(255,255,255,0.84)', // frosted white over the backdrop
  cardBorder: 'rgba(255,255,255,0.95)',
  fill: 'rgba(118,118,128,0.10)', // inputs, ghost buttons
  hairline: 'rgba(20,20,30,0.14)', // icon circle outlines
  ink: '#1C1C1E', // primary buttons
  separator: '#E5E5EA',
  text: '#0B0B0F',
  textSecondary: '#6C6C72',
  textTertiary: '#A1A1A8',
  accent: '#5E5CE6',
  danger: palette.red,
  success: palette.green,
};

// The app's signature gradient — the AI, "Tell My Assistant", primary actions.
export const brandGradient = ['#7B61FF', '#5E5CE6', '#3A86FF'] as const;

// Hex color + alpha, for tinted pill and icon backgrounds.
export function tint(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

type ModeMeta = {
  icon: SFSymbol;
  color: string;
  gradient: readonly [string, string, string];
  image: ImageSourcePropType;
  tagline: string;
};

// Each status has its own color and icon, so the home screen tells you
// the assistant's mode at a glance.
const MODE_META: Record<string, ModeMeta> = {
  available: {
    icon: 'checkmark.circle.fill',
    color: palette.green,
    gradient: ['#34C759', '#1FB58F', '#0E9F9A'],
    image: require('../assets/aura/available.jpg'),
    tagline: "You're reachable — your assistant screens the rest",
  },
  busy: {
    icon: 'briefcase.fill',
    color: palette.orange,
    gradient: ['#FFAA2B', '#FF8A00', '#FF5E3A'],
    image: require('../assets/aura/busy.jpg'),
    tagline: 'Only the calls that matter get through',
  },
  sleeping: {
    icon: 'moon.zzz.fill',
    color: palette.indigo,
    gradient: ['#6E6BF0', '#4B3FC9', '#2B1F7A'],
    image: require('../assets/aura/sleeping.jpg'),
    tagline: 'Quiet hours — emergencies still reach you',
  },
  'in class': {
    icon: 'graduationcap.fill',
    color: palette.blue,
    gradient: ['#3A9BFF', '#007AFF', '#4F46E5'],
    image: require('../assets/aura/in-class.jpg'),
    tagline: 'Messages taken quietly while you learn',
  },
  driving: {
    icon: 'car.fill',
    color: palette.teal,
    gradient: ['#3CC8E0', '#1FA4C9', '#0A6FB8'],
    image: require('../assets/aura/driving.jpg'),
    tagline: 'Eyes on the road — calls are screened',
  },
  custom: {
    icon: 'sparkles',
    color: palette.purple,
    gradient: ['#C66BFF', '#9B4DFF', '#FF4D8D'],
    image: require('../assets/aura/custom.jpg'),
    tagline: 'Following your custom instructions',
  },
};

// Natural-language rules can set any label ("Studying", "Traveling") —
// those use the Custom look.
export function modeMeta(mode: string): ModeMeta {
  return MODE_META[mode.toLowerCase()] ?? MODE_META.custom;
}

export const RELATIONSHIP_COLORS: Record<string, string> = {
  family: palette.pink,
  friend: palette.blue,
  recruiter: palette.purple,
  delivery: palette.orange,
  apartment: palette.teal,
  unknown: palette.gray,
  spam: palette.red,
};

export const PRIORITY_COLORS: Record<string, string> = {
  critical: palette.red,
  high: palette.orange,
  normal: palette.blue,
  low: palette.gray,
};

export const ACTION_META: Record<string, { color: string; icon: SFSymbol }> =
  {
    TRANSFER: { color: palette.green, icon: 'phone.arrow.right.fill' },
    TAKE_MESSAGE: { color: palette.blue, icon: 'text.bubble.fill' },
    SCREEN: { color: palette.orange, icon: 'ear.fill' },
    REJECT: { color: palette.red, icon: 'hand.raised.fill' },
    ASK_ME: { color: palette.purple, icon: 'questionmark.bubble.fill' },
  };

export const DECISION_VARIANT_META: Record<
  'transfer' | 'reject' | 'failed' | 'neutral',
  { color: string; icon: SFSymbol }
> = {
  transfer: { color: palette.green, icon: 'phone.arrow.right.fill' },
  reject: { color: palette.red, icon: 'hand.raised.fill' },
  failed: { color: palette.orange, icon: 'exclamationmark.triangle.fill' },
  neutral: { color: palette.blue, icon: 'text.bubble.fill' },
};

// Stable per-name avatar color for callers with no decision color.
const AVATAR_GRADIENTS: readonly (readonly [string, string])[] = [
  ['#FF8A65', '#FF5E3A'],
  ['#5AC8FA', '#007AFF'],
  ['#A78BFA', '#7C3AED'],
  ['#4ADE80', '#16A34A'],
  ['#F472B6', '#DB2777'],
  ['#FBBF24', '#F59E0B'],
  ['#2DD4BF', '#0D9488'],
  ['#818CF8', '#4F46E5'],
];

export function avatarGradient(seed: string): readonly [string, string] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

export function gradientFor(color: string): readonly [string, string] {
  return [tint(color, 0.75), color];
}

// "Jane Doe" → "JD"; a bare phone number gets no initials (show an icon).
export function initials(name: string): string | null {
  if (!/[a-z]/i.test(name)) return null;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts
    .slice(0, 2)
    .map((p) => p[0])
    .join('');
  return letters.toUpperCase() || null;
}
