import { useEffect, useState } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';

import { API_BASE_URL } from '../../../lib/api';
import { decisionBadgeVariant, decisionLabel } from '../../../lib/decisions';
import { formatDateTime } from '../../../lib/format';
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
    fetch(`${API_BASE_URL}/calls/${id}`)
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
    const dismissedAt = new Date().toISOString();
    setCall({ ...call, dismissed_at: dismissedAt });
    fetch(`${API_BASE_URL}/calls/${call.id}/dismiss`, {
      method: 'POST',
    }).catch(() => setError('Could not dismiss call'));
  };

  if (loading) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <StatusBar style="auto" />
        <Text style={styles.emptyText}>Loading...</Text>
      </ScrollView>
    );
  }

  if (error || !call) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <StatusBar style="auto" />
        <Text style={styles.error}>{error || 'Call not found'}</Text>
      </ScrollView>
    );
  }

  const name =
    call.matched_contact_name ||
    call.ai_name ||
    call.caller_name ||
    call.phone_number;
  const dismissed = !!call.dismissed_at;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar style="auto" />
      <Stack.Screen options={{ title: name }} />

      <Text style={styles.detailName}>{name}</Text>
      {call.ai_company && <Text style={styles.callCompany}>{call.ai_company}</Text>}
      <Text style={styles.label}>{call.phone_number}</Text>

      <View style={styles.chipRow}>
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
        {call.ai_priority && (
          <Text
            style={[
              styles.callPriorityBadge,
              call.ai_priority === 'high' && styles.callPriorityHigh,
            ]}
          >
            {call.ai_priority}
          </Text>
        )}
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.formLabel}>When</Text>
        <Text style={styles.callReason}>{formatDateTime(call.started_at)}</Text>
      </View>

      {call.ai_message && (
        <View style={styles.detailSection}>
          <Text style={styles.formLabel}>AI Summary</Text>
          <Text style={styles.callReason}>{call.ai_message}</Text>
        </View>
      )}

      {call.ai_recommended_action && (
        <View style={styles.detailSection}>
          <Text style={styles.formLabel}>AI Recommendation</Text>
          <Text style={styles.callReason}>{call.ai_recommended_action}</Text>
        </View>
      )}

      <View style={styles.detailSection}>
        <Text style={styles.formLabel}>What They Said</Text>
        <Text style={styles.callReason}>
          {call.reason || '(no answer given)'}
        </Text>
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.formLabel}>Urgent?</Text>
        <Text style={styles.callReason}>
          {call.urgency || '(no answer given)'}
        </Text>
      </View>

      {call.transfer_result && (
        <View style={styles.detailSection}>
          <Text style={styles.formLabel}>Transfer Outcome</Text>
          <Text style={styles.callReason}>{call.transfer_result}</Text>
        </View>
      )}

      {call.ai_error && (
        <View style={styles.detailSection}>
          <Text style={styles.formLabel}>Classification Error</Text>
          <Text style={styles.error}>{call.ai_error}</Text>
        </View>
      )}

      {!dismissed && (
        <View style={[styles.callActionRow, styles.detailSection]}>
          <Pressable style={styles.callActionButton} onPress={callBack}>
            <Text style={styles.callActionText}>Call Back</Text>
          </Pressable>
          <Pressable
            style={[styles.callActionButton, styles.callActionGhost]}
            onPress={dismiss}
          >
            <Text style={[styles.callActionText, styles.callActionGhostText]}>
              Dismiss
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}
