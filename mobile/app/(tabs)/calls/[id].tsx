import { Fragment, type ReactNode, useEffect, useState } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import type { SFSymbol } from 'sf-symbols-typescript';

import {
  CallPills,
  callAvatarGradient,
  callerName,
} from '../../../components/CallCard';
import { PressableScale } from '../../../components/PressableScale';
import {
  AuraScrollView,
  Avatar,
  Card,
  Icon,
  IconTile,
} from '../../../components/ui';
import { apiFetch } from '../../../lib/api';
import { formatDateTime } from '../../../lib/format';
import { EXIT, FADE_IN, haptic } from '../../../lib/motion';
import { colors, palette, tint } from '../../../lib/theme';
import type { Call } from '../../../lib/types';
import { styles } from '../../../styles/shared';

export default function CallDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [call, setCall] = useState<Call | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiFetch(`/calls/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('not found');
        return res.json();
      })
      .then(setCall)
      .catch(() => setError('Could not load this call'))
      .finally(() => setLoading(false));
  }, [id]);

  const callBack = () => {
    if (!call) return;
    Linking.openURL(`tel:${call.phone_number}`).catch(() =>
      setError('Could not open phone dialer')
    );
  };

  const dismiss = () => {
    if (!call) return;
    haptic.light();
    const dismissedAt = new Date().toISOString();
    setCall({ ...call, dismissed_at: dismissedAt });
    apiFetch(`/calls/${call.id}/dismiss`, {
      method: 'POST',
    }).catch(() => setError('Could not dismiss call'));
  };

  if (loading) {
    return (
      <AuraScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
      >
        <StatusBar style="dark" />
        <ActivityIndicator style={styles.loading} color={colors.accent} />
      </AuraScrollView>
    );
  }

  if (error || !call) {
    return (
      <AuraScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
      >
        <StatusBar style="dark" />
        <Text style={styles.error}>{error || 'Call not found'}</Text>
      </AuraScrollView>
    );
  }

  const name = callerName(call);
  const dismissed = !!call.dismissed_at;

  const details: {
    label: string;
    value: string;
    icon: SFSymbol;
    color: string;
    isError?: boolean;
  }[] = [
    {
      label: 'When',
      value: formatDateTime(call.started_at),
      icon: 'calendar',
      color: palette.red,
    },
    {
      label: 'What They Said',
      value: call.reason || '(no answer given)',
      icon: 'quote.bubble.fill',
      color: palette.blue,
    },
    {
      label: 'Urgent?',
      value: call.urgency || '(no answer given)',
      icon: 'exclamationmark.circle.fill',
      color: palette.orange,
    },
    ...(call.transfer_result
      ? [
          {
            label: 'Transfer Outcome',
            value: call.transfer_result,
            icon: 'phone.arrow.right.fill' as const,
            color: palette.green,
          },
        ]
      : []),
    ...(call.ai_error
      ? [
          {
            label: 'Classification Error',
            value: call.ai_error,
            icon: 'xmark.octagon.fill' as const,
            color: palette.red,
            isError: true,
          },
        ]
      : []),
  ];

  return (
    <AuraScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <StatusBar style="dark" />
      <Stack.Screen options={{ title: name }} />
      {/* The details arrive after the push finishes — fade them in rather
          than popping in under the header. */}
      <Animated.View entering={FADE_IN} style={styles.section}>
        <View style={styles.detailHeader}>
          <Avatar name={name} gradient={callAvatarGradient(call)} size={84} />
          <Text style={styles.detailName}>{name}</Text>
          {call.ai_company && (
            <Text style={styles.detailPhone}>{call.ai_company}</Text>
          )}
          <Text style={styles.detailPhone}>{call.phone_number}</Text>
          <View style={[styles.pillRow, styles.detailPills]}>
            <CallPills call={call} />
          </View>
        </View>

        {!dismissed && (
          <Animated.View exiting={EXIT} style={styles.detailActions}>
            <ActionTile
              label="Call Back"
              icon="phone.fill"
              color={palette.green}
              solid
              onPress={callBack}
            />
            <ActionTile
              label="Dismiss"
              icon="xmark"
              color={palette.gray}
              onPress={dismiss}
            />
          </Animated.View>
        )}

        {(call.ai_message || call.ai_recommended_action) && (
          <Card style={styles.aiCard}>
            <View style={styles.assistantHeader}>
              <IconTile name="sparkles" color={colors.accent} size={26} />
              <Text style={[styles.aiTitle, { color: colors.accent }]}>
                AI Summary
              </Text>
            </View>
            {call.ai_message && (
              <Text style={styles.aiBody}>{call.ai_message}</Text>
            )}
            {call.ai_recommended_action && (
              <View
                style={[
                  styles.callRecommendation,
                  { backgroundColor: tint(colors.accent, 0.1) },
                ]}
              >
                <Icon name="lightbulb.fill" size={14} color={colors.accent} />
                <Text
                  style={[
                    styles.callRecommendationText,
                    { color: colors.accent },
                  ]}
                >
                  Recommended: {call.ai_recommended_action}
                </Text>
              </View>
            )}
          </Card>
        )}

        <Card style={styles.detailList}>
          {details.map((item, index) => (
            <Fragment key={item.label}>
              {index > 0 && (
                <View style={[styles.hairline, styles.detailRowSeparator]} />
              )}
              <DetailRow {...item} />
            </Fragment>
          ))}
        </Card>
      </Animated.View>
    </AuraScrollView>
  );
}

function DetailRow({
  label,
  value,
  icon,
  color,
  isError,
}: {
  label: string;
  value: string;
  icon: SFSymbol;
  color: string;
  isError?: boolean;
}): ReactNode {
  return (
    <View style={styles.detailRow}>
      <IconTile name={icon} color={color} size={30} />
      <View style={styles.flex}>
        <Text style={styles.detailRowLabel}>{label}</Text>
        <Text style={[styles.detailRowValue, isError && styles.detailRowError]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

// Big icon-over-label buttons, like the action row in Apple's Contacts.
function ActionTile({
  label,
  icon,
  color,
  solid,
  onPress,
}: {
  label: string;
  icon: SFSymbol;
  color: string;
  solid?: boolean;
  onPress: () => void;
}) {
  // Primary is solid ink like the inspo's round black button; the other
  // is frosted glass with the icon in its own color.
  const fg = solid ? '#fff' : colors.text;
  return (
    <PressableScale
      onPress={onPress}
      style={[styles.actionTile, solid ? styles.actionTileSolid : styles.actionTileGlass]}
    >
      <Icon name={icon} size={20} color={solid ? '#fff' : color} />
      <Text style={[styles.actionTileText, { color: fg }]}>{label}</Text>
    </PressableScale>
  );
}
