import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  AppState,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { CallCard } from '../../../components/CallCard';
import { PressableScale } from '../../../components/PressableScale';
import { apiFetch } from '../../../lib/api';
import { formatDateTime } from '../../../lib/format';
import {
  ENTER,
  EXIT,
  FADE_IN,
  REFLOW,
  colorTransition,
  haptic,
} from '../../../lib/motion';
import { STATUS_OPTIONS, Status } from '../../../lib/options';
import type { Call, StatusInterpretation } from '../../../lib/types';
import { styles } from '../../../styles/shared';

export default function HomeScreen() {
  const router = useRouter();
  // Plain string, not Status — a natural-language rule (Phase 10) can set
  // a mode label outside the 6 fixed buttons, e.g. "Studying", "Traveling".
  const [status, setStatus] = useState<string>('Available');
  const [customInstruction, setCustomInstruction] = useState<string | null>(
    null
  );
  const [customExpiresAt, setCustomExpiresAt] = useState<string | null>(null);
  const [naturalInput, setNaturalInput] = useState('');
  const [interpreting, setInterpreting] = useState(false);
  const [interpretError, setInterpretError] = useState<string | null>(null);
  const [pendingInterpretation, setPendingInterpretation] =
    useState<StatusInterpretation | null>(null);
  const [applyingCustom, setApplyingCustom] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [callsError, setCallsError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadCalls = () => {
    setCallsError(null);
    return apiFetch('/calls')
      .then((res) => {
        if (!res.ok) throw new Error('request failed');
        return res.json();
      })
      .then((data) => setCalls(data))
      .catch(() => setCallsError('Could not load recent calls'));
  };

  const loadStatus = () => {
    return apiFetch('/status')
      .then((res) => {
        if (!res.ok) throw new Error('request failed');
        return res.json();
      })
      .then((data) => {
        setStatus(data.mode);
        setCustomInstruction(data.custom_instruction);
        setCustomExpiresAt(data.expires_at);
      })
      .catch(() => setError('Could not reach backend'));
  };

  useEffect(() => {
    loadStatus();
    loadCalls();
  }, []);

  // Refresh Recent Calls whenever the app comes back to the foreground
  // (e.g. after backgrounding it to make a phone call). Real-time push
  // updates without reopening the app would need Phase 11 (declined).
  const appState = useRef(AppState.currentState);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appState.current !== 'active' && nextState === 'active') {
        loadCalls();
      }
      appState.current = nextState;
    });
    return () => subscription.remove();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([loadStatus(), loadCalls()]).finally(() =>
      setRefreshing(false)
    );
  };

  const updateStatus = (option: Status) => {
    if (option !== status) haptic.select();
    setStatus(option);
    setCustomInstruction(null);
    setCustomExpiresAt(null);
    setError(null);
    apiFetch('/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: option }),
    }).catch(() => setError('Could not reach backend'));
  };

  const interpretInstruction = () => {
    if (!naturalInput.trim()) return;
    setInterpreting(true);
    setInterpretError(null);
    apiFetch('/status/interpret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instruction: naturalInput.trim() }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('request failed');
        return res.json();
      })
      .then((data) => setPendingInterpretation(data))
      .catch(() => {
        haptic.error();
        setInterpretError("Couldn't understand that — try rephrasing");
      })
      .finally(() => setInterpreting(false));
  };

  const confirmCustomStatus = () => {
    if (!pendingInterpretation) return;
    setApplyingCustom(true);
    apiFetch('/status/apply-custom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pendingInterpretation),
    })
      .then((res) => {
        if (!res.ok) throw new Error('request failed');
        return res.json();
      })
      .then((data) => {
        haptic.success();
        setStatus(data.mode);
        setCustomInstruction(data.custom_instruction);
        setCustomExpiresAt(data.expires_at);
        setPendingInterpretation(null);
        setNaturalInput('');
      })
      .catch(() => {
        haptic.error();
        setInterpretError('Could not apply — try again');
      })
      .finally(() => setApplyingCustom(false));
  };

  const cancelCustomStatus = () => {
    setPendingInterpretation(null);
  };

  const callBack = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`).catch(() =>
      setCallsError('Could not open phone dialer')
    );
  };

  const dismissCall = (callId: number) => {
    haptic.light();
    const dismissedAt = new Date().toISOString();
    setCalls((prev) =>
      prev.map((call) =>
        call.id === callId ? { ...call, dismissed_at: dismissedAt } : call
      )
    );
    apiFetch(`/calls/${callId}/dismiss`, { method: 'POST' }).catch(() =>
      setCallsError('Could not dismiss call')
    );
  };

  // Dismissed calls are handled — keep them out of the Recent Calls
  // preview (they still show up in Calls, which is the full history).
  const recentCalls = calls.filter((call) => !call.dismissed_at);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <StatusBar style="auto" />

      <Text style={styles.label}>Current Status</Text>
      {/* Keyed so a new status cross-fades in rather than swapping text. */}
      <Animated.Text key={status} entering={ENTER} style={styles.status}>
        {status.toUpperCase()}
      </Animated.Text>
      {error && (
        <Animated.Text entering={FADE_IN} style={styles.error}>
          {error}
        </Animated.Text>
      )}

      <View style={styles.buttonRow}>
        {STATUS_OPTIONS.map((option) => (
          <PressableScale
            key={option}
            onPress={() => updateStatus(option)}
            style={[styles.button, option === status && styles.buttonActive]}
          >
            <Animated.Text
              style={[
                styles.buttonText,
                colorTransition,
                option === status && styles.buttonTextActive,
              ]}
            >
              {option}
            </Animated.Text>
          </PressableScale>
        ))}
      </View>

      {customInstruction && (
        <Animated.View
          entering={ENTER}
          exiting={EXIT}
          layout={REFLOW}
          style={styles.activeRuleBanner}
        >
          <Text style={styles.activeRuleText}>
            &ldquo;{customInstruction}&rdquo;
          </Text>
          {customExpiresAt && (
            <Text style={styles.activeRuleExpiry}>
              Until {formatDateTime(customExpiresAt)}
            </Text>
          )}
        </Animated.View>
      )}

      {/* Everything below slides smoothly when the banner or the
          Tell My Assistant box changes size. */}
      <Animated.View layout={REFLOW} style={styles.section}>
        <Text style={[styles.sectionTitle, styles.sectionTitleStandalone]}>
          Tell My Assistant
        </Text>
        {!pendingInterpretation ? (
          <Animated.View
            key="input"
            entering={ENTER}
            style={styles.naturalInputBox}
          >
            <TextInput
              style={[styles.textInput, styles.naturalInputField]}
              placeholder="e.g. Studying until 8, let family and recruiters through"
              value={naturalInput}
              onChangeText={setNaturalInput}
              multiline
            />
            {interpretError && (
              <Animated.Text entering={FADE_IN} style={styles.error}>
                {interpretError}
              </Animated.Text>
            )}
            <PressableScale
              style={[
                styles.addContactButton,
                (interpreting || !naturalInput.trim()) &&
                  styles.buttonDisabled,
              ]}
              onPress={interpretInstruction}
              disabled={interpreting || !naturalInput.trim()}
            >
              <Text style={styles.callActionText}>
                {interpreting ? 'Thinking...' : 'Tell Assistant'}
              </Text>
            </PressableScale>
          </Animated.View>
        ) : (
          <Animated.View
            key="confirm"
            entering={ENTER}
            style={styles.naturalInputBox}
          >
            <Text style={styles.formLabel}>I understood:</Text>
            <Text style={styles.confirmSummary}>
              {pendingInterpretation.summary}
            </Text>
            <View style={styles.chipRow}>
              <Text style={styles.callTypeBadge}>
                {pendingInterpretation.mode_label}
              </Text>
              {pendingInterpretation.expires_at && (
                <Text style={styles.callTypeBadge}>
                  Until {formatDateTime(pendingInterpretation.expires_at)}
                </Text>
              )}
            </View>
            {pendingInterpretation.transfer_types.length > 0 && (
              <Text style={styles.callReason}>
                Let through: {pendingInterpretation.transfer_types.join(', ')}
              </Text>
            )}
            {pendingInterpretation.urgent_always_transfers && (
              <Text style={styles.callReason}>
                Urgent callers always let through
              </Text>
            )}
            <View style={styles.callActionRow}>
              <PressableScale
                style={styles.callActionButton}
                onPress={confirmCustomStatus}
                disabled={applyingCustom}
              >
                <Text style={styles.callActionText}>
                  {applyingCustom ? 'Applying...' : 'Confirm'}
                </Text>
              </PressableScale>
              <PressableScale
                style={[styles.callActionButton, styles.callActionGhost]}
                onPress={cancelCustomStatus}
              >
                <Text
                  style={[styles.callActionText, styles.callActionGhostText]}
                >
                  Cancel
                </Text>
              </PressableScale>
            </View>
          </Animated.View>
        )}
      </Animated.View>

      <Animated.View layout={REFLOW} style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Recent Calls</Text>
        <Pressable onPress={() => router.push('/calls')} hitSlop={8}>
          <Text style={styles.viewAllLink}>View All Calls</Text>
        </Pressable>
      </Animated.View>
      {callsError && (
        <Animated.Text entering={FADE_IN} style={styles.error}>
          {callsError}
        </Animated.Text>
      )}
      {!callsError && recentCalls.length === 0 && (
        <Animated.Text entering={FADE_IN} style={styles.emptyText}>
          No calls yet
        </Animated.Text>
      )}
      <Animated.View layout={REFLOW} style={styles.callList}>
        {recentCalls.map((call) => (
          // Dismissing fades the card out and the rest slide up to close
          // the gap; new calls fade in on refresh.
          <Animated.View
            key={call.id}
            entering={FADE_IN}
            exiting={EXIT}
            layout={REFLOW}
          >
            <CallCard
              call={call}
              onCallBack={callBack}
              onDismiss={dismissCall}
            />
          </Animated.View>
        ))}
      </Animated.View>
    </ScrollView>
  );
}
