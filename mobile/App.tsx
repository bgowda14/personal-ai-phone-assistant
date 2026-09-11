import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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

export default function App() {
  const [status, setStatus] = useState<Status>('Available');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/status`)
      .then((res) => res.json())
      .then((data) => setStatus(data.mode))
      .catch(() => setError('Could not reach backend'));
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
    <View style={styles.container}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
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
});
