import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { decisionBadgeVariant, decisionLabel } from '../lib/decisions';
import { formatDateTime, timeAgo } from '../lib/format';
import type { Call } from '../lib/types';
import { styles } from '../styles/shared';

export function CallCard({
  call,
  showDateTime,
  onCallBack,
  onDismiss,
}: {
  call: Call;
  showDateTime?: boolean;
  onCallBack: (phoneNumber: string) => void;
  onDismiss: (callId: number) => void;
}) {
  const router = useRouter();
  const name =
    call.matched_contact_name ||
    call.ai_name ||
    call.caller_name ||
    call.phone_number;
  const message = call.ai_message || call.reason;
  const dismissed = !!call.dismissed_at;

  return (
    <Pressable
      style={[styles.callCard, dismissed && styles.callCardDismissed]}
      onPress={() => router.push(`/calls/${call.id}`)}
    >
      <View style={styles.callCardHeader}>
        <View style={styles.callNameColumn}>
          <Text style={styles.callName}>{name}</Text>
          {call.ai_company && (
            <Text style={styles.callCompany}>{call.ai_company}</Text>
          )}
        </View>
        <Text style={styles.callTime}>
          {showDateTime
            ? formatDateTime(call.started_at)
            : timeAgo(call.started_at)}
        </Text>
      </View>
      {message && <Text style={styles.callReason}>{message}</Text>}
      {call.ai_recommended_action && (
        <Text style={styles.callRecommendation}>
          Recommended: {call.ai_recommended_action}
        </Text>
      )}
      <View style={styles.callMetaRow}>
        <View style={styles.callBadgeRow}>
          {call.decided_action && (
            <Text
              style={[
                styles.decisionBadge,
                decisionBadgeVariant(call) === 'transfer' &&
                  styles.decisionBadgeTransfer,
                decisionBadgeVariant(call) === 'failed' &&
                  styles.decisionBadgeFailed,
                decisionBadgeVariant(call) === 'reject' &&
                  styles.decisionBadgeReject,
              ]}
            >
              {decisionLabel(call)}
            </Text>
          )}
          {call.ai_type && (
            <Text style={styles.callTypeBadge}>{call.ai_type}</Text>
          )}
          {call.ai_priority ? (
            <Text
              style={[
                styles.callPriorityBadge,
                call.ai_priority === 'high' && styles.callPriorityHigh,
              ]}
            >
              {call.ai_priority}
            </Text>
          ) : call.urgency ? (
            <Text style={styles.callUrgency}>Urgent: {call.urgency}</Text>
          ) : null}
        </View>
        <Text style={styles.callStatus}>
          {dismissed ? 'dismissed' : call.status}
        </Text>
      </View>
      {!dismissed && (
        <View style={styles.callActionRow}>
          <Pressable
            style={styles.callActionButton}
            onPress={() => onCallBack(call.phone_number)}
          >
            <Text style={styles.callActionText}>Call Back</Text>
          </Pressable>
          <Pressable
            style={[styles.callActionButton, styles.callActionGhost]}
            onPress={() => onDismiss(call.id)}
          >
            <Text style={[styles.callActionText, styles.callActionGhostText]}>
              Dismiss
            </Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}
