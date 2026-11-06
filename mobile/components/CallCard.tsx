import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { decisionBadgeVariant, decisionLabel } from '../lib/decisions';
import { formatTime, timeAgo } from '../lib/format';
import { EXIT } from '../lib/motion';
import {
  DECISION_VARIANT_META,
  PRIORITY_COLORS,
  avatarGradient,
  colors,
  gradientFor,
  palette,
  tint,
} from '../lib/theme';
import type { Call } from '../lib/types';
import { styles } from '../styles/shared';
import { PressableScale } from './PressableScale';
import { Avatar, Icon, Pill, TintButton, cardSurface } from './ui';

export function callerName(call: Call): string {
  return (
    call.matched_contact_name ||
    call.ai_name ||
    call.caller_name ||
    call.phone_number
  );
}

// The avatar takes the decision's color, so a glance down the list shows
// what the assistant did with each call.
export function callAvatarGradient(call: Call): readonly [string, string] {
  if (!call.decided_action) return avatarGradient(callerName(call));
  return gradientFor(DECISION_VARIANT_META[decisionBadgeVariant(call)].color);
}

export function CallPills({ call }: { call: Call }) {
  const variant = DECISION_VARIANT_META[decisionBadgeVariant(call)];
  return (
    <>
      {call.decided_action && (
        <Pill
          label={decisionLabel(call)}
          color={variant.color}
          icon={variant.icon}
        />
      )}
      {call.ai_type && <Pill label={call.ai_type} color={palette.gray} />}
      {call.ai_priority && (
        <Pill
          label={call.ai_priority}
          color={PRIORITY_COLORS[call.ai_priority] ?? palette.gray}
          icon="flag.fill"
        />
      )}
    </>
  );
}

export function CallCard({
  call,
  showClockTime,
  onCallBack,
  onDismiss,
}: {
  call: Call;
  showClockTime?: boolean;
  onCallBack: (phoneNumber: string) => void;
  onDismiss: (callId: number) => void;
}) {
  const router = useRouter();
  const name = callerName(call);
  const message = call.ai_message || call.reason;
  const dismissed = !!call.dismissed_at;

  return (
    <PressableScale
      style={[
        cardSurface,
        styles.callCard,
        dismissed && styles.callCardDismissed,
      ]}
      onPress={() => router.push(`/calls/${call.id}`)}
    >
      <View style={styles.callHeader}>
        <Avatar name={name} gradient={callAvatarGradient(call)} />
        <View style={styles.flex}>
          <Text style={styles.callName} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.callSub} numberOfLines={1}>
            {call.ai_company || (name !== call.phone_number && call.phone_number) || 'Unknown caller'}
          </Text>
        </View>
        <Text style={styles.callTime}>
          {showClockTime ? formatTime(call.started_at) : timeAgo(call.started_at)}
        </Text>
      </View>

      {message && (
        <Text style={styles.callMessage} numberOfLines={3}>
          {message}
        </Text>
      )}

      {call.ai_recommended_action && (
        <View
          style={[
            styles.callRecommendation,
            { backgroundColor: tint(colors.accent, 0.08) },
          ]}
        >
          <Icon name="lightbulb.fill" size={14} color={colors.accent} />
          <Text
            style={[styles.callRecommendationText, { color: colors.accent }]}
          >
            {call.ai_recommended_action}
          </Text>
        </View>
      )}

      <View style={styles.callFooter}>
        <View style={[styles.pillRow, styles.flex]}>
          <CallPills call={call} />
          {!call.ai_priority && call.urgency && (
            <Text style={styles.callUrgency}>Urgent: {call.urgency}</Text>
          )}
        </View>
        <Text style={styles.callStatus}>
          {dismissed ? 'dismissed' : call.status.replace('_', ' ')}
        </Text>
      </View>

      {!dismissed && (
        <Animated.View exiting={EXIT} style={styles.buttonPair}>
          <TintButton
            label="Call Back"
            icon="phone.fill"
            color={palette.green}
            onPress={() => onCallBack(call.phone_number)}
            style={styles.flex}
          />
          <TintButton
            label="Dismiss"
            icon="xmark"
            color={palette.gray}
            onPress={() => onDismiss(call.id)}
            style={styles.flex}
          />
        </Animated.View>
      )}
    </PressableScale>
  );
}
