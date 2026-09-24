import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { CallCard } from '../../../components/CallCard';
import { apiFetch } from '../../../lib/api';
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
      .then((res) => res.json())
      .then((data) => setCalls(data))
      .catch(() => setError('Could not load call history'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCalls();
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
      .then((res) => res.json())
      .then(() => loadCalls())
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
      .then((res) => res.json())
      .then(() => loadCalls())
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <StatusBar style="auto" />
      <View style={styles.deleteButtonRow}>
        <Pressable
          style={[styles.deleteOldButton, styles.deleteButtonHalf]}
          onPress={confirmDeleteOldCalls}
        >
          <Text style={styles.deleteOldButtonText}>
            Delete older than 30 days
          </Text>
        </Pressable>
        <Pressable
          style={[styles.deleteOldButton, styles.deleteButtonHalf]}
          onPress={confirmDeleteDismissedCalls}
        >
          <Text style={styles.deleteOldButtonText}>Delete dismissed</Text>
        </Pressable>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      {loading && <Text style={styles.emptyText}>Loading...</Text>}
      {!loading && !error && calls.length === 0 && (
        <Text style={styles.emptyText}>No calls yet</Text>
      )}
      <View style={styles.callList}>
        {calls.map((call) => (
          <CallCard
            key={call.id}
            call={call}
            showDateTime
            onCallBack={callBack}
            onDismiss={dismissCall}
          />
        ))}
      </View>
    </ScrollView>
  );
}
