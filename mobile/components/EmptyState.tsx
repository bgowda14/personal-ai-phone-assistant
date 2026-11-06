import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import type { SFSymbol } from 'sf-symbols-typescript';

import { FADE_IN } from '../lib/motion';
import { tint } from '../lib/theme';
import { styles } from '../styles/shared';
import { Card, Icon } from './ui';

export function EmptyState({
  icon,
  color,
  title,
  subtitle,
}: {
  icon: SFSymbol;
  color: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <Animated.View entering={FADE_IN} style={styles.section}>
      <Card style={styles.emptyCard}>
        <View style={[styles.emptyIcon, { backgroundColor: tint(color, 0.12) }]}>
          <Icon name={icon} size={26} color={color} />
        </View>
        <Text style={styles.emptyTitle}>{title}</Text>
        {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
      </Card>
    </Animated.View>
  );
}
