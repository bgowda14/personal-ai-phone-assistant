import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>Personal AI Assistant</Text>

      <Text style={styles.label}>Current Status</Text>
      <Text style={styles.status}>{status.toUpperCase()}</Text>

      <View style={styles.buttonRow}>
        {STATUS_OPTIONS.map((option) => (
          <Pressable
            key={option}
            onPress={() => setStatus(option)}
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
    marginBottom: 32,
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
