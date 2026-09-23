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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CallCard } from '../../components/CallCard';
import { API_BASE_URL } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import { STATUS_OPTIONS, Status } from '../../lib/options';
import type { Call, StatusInterpretation } from '../../lib/types';
import { styles } from '../../styles/shared';

export default function HomeScreen() {
  const router = useRouter();
  // Home has no native header (headerShown: false), so nothing else
  // accounts for the status bar / Dynamic Island — push content down
  // manually using the real safe-area inset instead of a guessed constant.
  const insets = useSafeAreaInsets();
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
    return fetch(`${API_BASE_URL}/calls`)
      .then((res) => res.json())
      .then((data) => setCalls(data))
      .catch(() => setCallsError('Could not load recent calls'));
  };

  const loadStatus = () => {
    return fetch(`${API_BASE_URL}/status`)
      .then((res) => res.json())
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
    setStatus(option);
    setCustomInstruction(null);
    setCustomExpiresAt(null);
    setError(null);
    fetch(`${API_BASE_URL}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: option }),
    }).catch(() => setError('Could not reach backend'));
  };

  const interpretInstruction = () => {
    if (!naturalInput.trim()) return;
    setInterpreting(true);
    setInterpretError(null);
    fetch(`${API_BASE_URL}/status/interpret`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instruction: naturalInput.trim() }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('request failed');
        return res.json();
      })
      .then((data) => setPendingInterpretation(data))
      .catch(() =>
        setInterpretError("Couldn't understand that — try rephrasing")
      )
      .finally(() => setInterpreting(false));
  };

  const confirmCustomStatus = () => {
    if (!pendingInterpretation) return;
    setApplyingCustom(true);
    fetch(`${API_BASE_URL}/status/apply-custom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pendingInterpretation),
    })
      .then((res) => res.json())
      .then((data) => {
        setStatus(data.mode);
        setCustomInstruction(data.custom_instruction);
        setCustomExpiresAt(data.expires_at);
        setPendingInterpretation(null);
        setNaturalInput('');
      })
      .catch(() => setInterpretError('Could not apply — try again'))
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
    const dismissedAt = new Date().toISOString();
    setCalls((prev) =>
      prev.map((call) =>
        call.id === callId ? { ...call, dismissed_at: dismissedAt } : call
      )
    );
    fetch(`${API_BASE_URL}/calls/${callId}/dismiss`, { method: 'POST' }).catch(
      () => setCallsError('Could not dismiss call')
    );
  };

  // Dismissed calls are handled — keep them out of the Recent Calls
  // preview (they still show up in Calls, which is the full history).
  const recentCalls = calls.filter((call) => !call.dismissed_at);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 24 },
      ]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <StatusBar style="auto" />
      <Text style={styles.title}>Personal AI Assistant</Text>

      <Text style={styles.label}>Current Status</Text>
      <Text style={styles.status}>{status.toUpperCase()}</Text>
      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.buttonRow}>
        {STATUS_OPTIONS.map((option) => (
          <Pressable
            key={option}
            onPress={() => updateStatus(option)}
            style={[styles.button, option === status && styles.buttonActive]}
          >
            <Text
              style={[
                styles.buttonText,
                option === status && styles.buttonTextActive,
              ]}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>

      {customInstruction && (
        <View style={styles.activeRuleBanner}>
          <Text style={styles.activeRuleText}>
            &ldquo;{customInstruction}&rdquo;
          </Text>
          {customExpiresAt && (
            <Text style={styles.activeRuleExpiry}>
              Until {formatDateTime(customExpiresAt)}
            </Text>
          )}
        </View>
      )}

      <Text style={[styles.sectionTitle, styles.sectionTitleStandalone]}>
        Tell My Assistant
      </Text>
      {!pendingInterpretation ? (
        <View style={styles.naturalInputBox}>
          <TextInput
            style={[styles.textInput, styles.naturalInputField]}
            placeholder="e.g. Studying until 8, let family and recruiters through"
            value={naturalInput}
            onChangeText={setNaturalInput}
            multiline
          />
          {interpretError && (
            <Text style={styles.error}>{interpretError}</Text>
          )}
          <Pressable
            style={styles.addContactButton}
            onPress={interpretInstruction}
            disabled={interpreting || !naturalInput.trim()}
          >
            <Text style={styles.callActionText}>
              {interpreting ? 'Thinking...' : 'Tell Assistant'}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.naturalInputBox}>
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
            <Pressable
              style={styles.callActionButton}
              onPress={confirmCustomStatus}
              disabled={applyingCustom}
            >
              <Text style={styles.callActionText}>
                {applyingCustom ? 'Applying...' : 'Confirm'}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.callActionButton, styles.callActionGhost]}
              onPress={cancelCustomStatus}
            >
              <Text
                style={[styles.callActionText, styles.callActionGhostText]}
              >
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Recent Calls</Text>
        <Pressable onPress={() => router.push('/calls')} hitSlop={8}>
          <Text style={styles.viewAllLink}>View All Calls</Text>
        </Pressable>
      </View>
      {callsError && <Text style={styles.error}>{callsError}</Text>}
      {!callsError && recentCalls.length === 0 && (
        <Text style={styles.emptyText}>No calls yet</Text>
      )}
      <View style={styles.callList}>
        {recentCalls.map((call) => (
          <CallCard
            key={call.id}
            call={call}
            onCallBack={callBack}
            onDismiss={dismissCall}
          />
        ))}
      </View>
    </ScrollView>
  );
}
