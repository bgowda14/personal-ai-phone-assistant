import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// Your Mac's LAN IP running `uvicorn main:app --reload` — update this if your
// network changes or your Mac gets a new IP.
const API_BASE_URL = 'http://100.70.78.175:8000';

const STATUS_OPTIONS = [
  'Available',
  'Busy',
  'Sleeping',
  'In Class',
  'Driving',
  'Custom',
] as const;

type Status = (typeof STATUS_OPTIONS)[number];

type Call = {
  id: number;
  phone_number: string;
  caller_name: string | null;
  reason: string | null;
  urgency: string | null;
  started_at: string;
  ended_at: string | null;
  status: string;
  ai_name: string | null;
  ai_company: string | null;
  ai_type: string | null;
  ai_intent: string | null;
  ai_priority: string | null;
  ai_message: string | null;
  ai_error: string | null;
};

function timeAgo(isoString: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function App() {
  const [status, setStatus] = useState<Status>('Available');
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

  const onRefresh = () => {
    setRefreshing(true);
    loadCalls().finally(() => setRefreshing(false));
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/status`)
      .then((res) => res.json())
      .then((data) => setStatus(data.mode))
      .catch(() => setError('Could not reach backend'));

    loadCalls();
  }, []);

  const updateStatus = (option: Status) => {
    setStatus(option);
    setError(null);
    fetch(`${API_BASE_URL}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: option }),
    }).catch(() => setError('Could not reach backend'));
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
      <Text style={styles.title}>Personal AI Assistant</Text>

      <Text style={styles.label}>Current Status</Text>
      <Text style={styles.status}>{status.toUpperCase()}</Text>
      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.buttonRow}>
        {STATUS_OPTIONS.map((option) => (
          <Pressable
            key={option}
            onPress={() => updateStatus(option)}
            style={[
              styles.button,
              option === status && styles.buttonActive,
            ]}
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

      <Text style={styles.sectionTitle}>Recent Calls</Text>
      {callsError && <Text style={styles.error}>{callsError}</Text>}
      {!callsError && calls.length === 0 && (
        <Text style={styles.emptyText}>No calls yet</Text>
      )}
      <View style={styles.callList}>
        {calls.map((call) => {
          const name = call.ai_name || call.caller_name || call.phone_number;
          const message = call.ai_message || call.reason;
          return (
            <View key={call.id} style={styles.callCard}>
              <View style={styles.callCardHeader}>
                <View style={styles.callNameColumn}>
                  <Text style={styles.callName}>{name}</Text>
                  {call.ai_company && (
                    <Text style={styles.callCompany}>{call.ai_company}</Text>
                  )}
                </View>
                <Text style={styles.callTime}>{timeAgo(call.started_at)}</Text>
              </View>
              {message && <Text style={styles.callReason}>{message}</Text>}
              <View style={styles.callMetaRow}>
                <View style={styles.callBadgeRow}>
                  {call.ai_type && (
                    <Text style={styles.callTypeBadge}>{call.ai_type}</Text>
                  )}
                  {call.ai_priority ? (
                    <Text
                      style={[
                        styles.callPriorityBadge,
                        call.ai_priority === 'high' &&
                          styles.callPriorityHigh,
                      ]}
                    >
                      {call.ai_priority}
                    </Text>
                  ) : call.urgency ? (
                    <Text style={styles.callUrgency}>
                      Urgent: {call.urgency}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.callStatus}>{call.status}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 48,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  status: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  error: {
    fontSize: 13,
    color: '#c0392b',
    marginBottom: 20,
  },
  buttonRow: {
    width: '100%',
    gap: 12,
  },
  button: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  buttonActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111',
  },
  buttonTextActive: {
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginTop: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    alignSelf: 'flex-start',
  },
  callList: {
    width: '100%',
    gap: 12,
  },
  callCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 14,
    backgroundColor: '#fff',
  },
  callCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  callNameColumn: {
    flexShrink: 1,
  },
  callName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  callCompany: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  callTime: {
    fontSize: 12,
    color: '#888',
  },
  callReason: {
    fontSize: 14,
    color: '#333',
    marginTop: 6,
  },
  callMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  callBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  callTypeBadge: {
    fontSize: 11,
    fontWeight: '500',
    color: '#444',
    backgroundColor: '#eee',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    textTransform: 'capitalize',
  },
  callPriorityBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    backgroundColor: '#eee',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    textTransform: 'capitalize',
  },
  callPriorityHigh: {
    color: '#fff',
    backgroundColor: '#c0392b',
  },
  callUrgency: {
    fontSize: 12,
    color: '#c0392b',
    fontWeight: '500',
  },
  callStatus: {
    fontSize: 12,
    color: '#888',
    textTransform: 'capitalize',
  },
});
