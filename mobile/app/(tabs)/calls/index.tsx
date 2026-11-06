import { Fragment, useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  RefreshControl,
  Text,
  View,
} from 'react-native';

import Animated from 'react-native-reanimated';

import { CallCard } from '../../../components/CallCard';
import { EmptyState } from '../../../components/EmptyState';
import {
  AuraScrollView,
  Card,
  TintButton,
} from '../../../components/ui';
import { apiFetch } from '../../../lib/api';
import { decisionBadgeVariant } from '../../../lib/decisions';
import { dayLabel } from '../../../lib/format';
import { EXIT, FADE_IN, REFLOW, haptic, riseIn } from '../../../lib/motion';
import { colors, palette } from '../../../lib/theme';
import type { Call } from '../../../lib/types';
import { styles } from '../../../styles/shared';

const CALLS_LIMIT = 200;

export default function CallsScreen() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadCalls = () => {
    setError(null);
    setLoading(true);
    return apiFetch(`/calls?limit=${CALLS_LIMIT}`)
      .then((res) => {
        if (!res.ok) throw new Error('request failed');
        return res.json();
      })
      .then((data) => setCalls(data))
      .catch(() => setError('Could not load call history'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCalls();
  }, []);

  // Refresh whenever the app comes back to the foreground (e.g. after
  // backgrounding it to make a phone call). Real-time push updates without
  // reopening the app would need Phase 11 (declined).
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
    loadCalls().finally(() => setRefreshing(false));
  };

  const callBack = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`).catch(() =>
      setError('Could not open phone dialer')
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
      setError('Could not dismiss call')
    );
  };

  const deleteOldCalls = () => {
    apiFetch('/calls/old?days=30', { method: 'DELETE' })
      .then((res) => {
        if (!res.ok) throw new Error('request failed');
        return res.json();
      })
      .then(() => {
        haptic.medium();
        return loadCalls();
      })
      .catch(() => setError('Could not delete old calls'));
  };

  const confirmDeleteOldCalls = () => {
    Alert.alert(
      'Delete old calls',
      'Delete all calls older than 30 days? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: deleteOldCalls },
      ]
    );
  };

  const deleteDismissedCalls = () => {
    apiFetch('/calls/dismissed', { method: 'DELETE' })
      .then((res) => {
        if (!res.ok) throw new Error('request failed');
        return res.json();
      })
      .then(() => {
        haptic.medium();
        return loadCalls();
      })
      .catch(() => setError('Could not delete dismissed calls'));
  };

  const confirmDeleteDismissedCalls = () => {
    Alert.alert(
      'Delete dismissed calls',
      "Delete all calls you've dismissed? This cannot be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: deleteDismissedCalls,
        },
      ]
    );
  };

  const stats = [
    { label: 'Total', value: calls.length, color: colors.text },
    {
      label: 'Put Through',
      value: calls.filter((c) => decisionBadgeVariant(c) === 'transfer').length,
      color: palette.green,
    },
    {
      label: 'Messages',
      value: calls.filter((c) => c.decided_action === 'TAKE_MESSAGE').length,
      color: palette.blue,
    },
    {
      label: 'Blocked',
      value: calls.filter((c) => c.decided_action === 'REJECT').length,
      color: palette.red,
    },
  ];

  return (
    <AuraScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <StatusBar style="dark" />
      <Card style={styles.statsCard}>
        {stats.map((stat, index) => (
          <Fragment key={stat.label}>
            {index > 0 && <View style={styles.statDivider} />}
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: stat.color }]}>
                {stat.value}
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          </Fragment>
        ))}
      </Card>

      <View style={styles.cleanupRow}>
        <TintButton
          label="Older than 30 days"
          icon="calendar.badge.minus"
          color={palette.red}
          onPress={confirmDeleteOldCalls}
          style={styles.flex}
          textStyle={styles.cleanupText}
        />
        <TintButton
          label="Dismissed"
          icon="trash"
          color={palette.red}
          onPress={confirmDeleteDismissedCalls}
          style={styles.flex}
          textStyle={styles.cleanupText}
        />
      </View>

      {error && (
        <Animated.Text entering={FADE_IN} style={styles.error}>
          {error}
        </Animated.Text>
      )}
      {/* Only on first load — a refresh keeps the list on screen. */}
      {loading && calls.length === 0 && (
        <ActivityIndicator style={styles.loading} color={colors.accent} />
      )}
      {!loading && !error && calls.length === 0 && (
        <View style={[styles.section, { marginTop: 16 }]}>
          <EmptyState
            icon="phone.badge.waveform.fill"
            color={colors.accent}
            title="No calls yet"
            subtitle="When someone calls your assistant, it'll show up here."
          />
        </View>
      )}
      <View style={[styles.cardList, { marginTop: 8 }]}>
        {calls.map((call, index) => {
          const day = dayLabel(call.started_at);
          const newDay =
            index === 0 || dayLabel(calls[index - 1].started_at) !== day;
          return (
            // Deleted calls fade out and the rest slide up; a card
            // shrinking after Dismiss pushes the ones below smoothly.
            <Animated.View
              key={call.id}
              entering={riseIn(index)}
              exiting={EXIT}
              layout={REFLOW}
            >
              {newDay && <Text style={styles.dayHeader}>{day}</Text>}
              <View style={newDay && { marginTop: 8 }}>
                <CallCard
                  call={call}
                  showClockTime
                  onCallBack={callBack}
                  onDismiss={dismissCall}
                />
              </View>
            </Animated.View>
          );
        })}
      </View>
    </AuraScrollView>
  );
}
