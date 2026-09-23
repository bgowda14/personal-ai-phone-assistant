import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { API_BASE_URL, TWILIO_NUMBER } from '../../lib/api';
import type { Config } from '../../lib/types';
import { styles } from '../../styles/shared';

export default function SettingsScreen() {
  const router = useRouter();
  const [config, setConfig] = useState<Config | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/config`)
      .then((res) => res.json())
      .then(setConfig)
      .catch(() => setError('Could not reach backend'));
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar style="auto" />
      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.settingsCard}>
        <Text style={styles.settingsLabel}>Twilio Assistant Number</Text>
        <Text style={styles.settingsValue}>{TWILIO_NUMBER}</Text>
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.settingsLabel}>Backend</Text>
        <Text style={styles.settingsValue}>{API_BASE_URL}</Text>
      </View>

      {config && (
        <View style={styles.settingsCard}>
          <View style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>AI classification</Text>
            <Text
              style={
                config.openai_configured
                  ? styles.settingsOk
                  : styles.settingsMissing
              }
            >
              {config.openai_configured ? 'Configured' : 'Not configured'}
            </Text>
          </View>
          <View style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Live call transfer</Text>
            <Text
              style={
                config.transfer_configured
                  ? styles.settingsOk
                  : styles.settingsMissing
              }
            >
              {config.transfer_configured ? 'Configured' : 'Not configured'}
            </Text>
          </View>
        </View>
      )}

      <Pressable
        style={styles.manageContactsLink}
        onPress={() => router.push('/rules')}
        hitSlop={8}
      >
        <Text style={styles.viewAllLink}>View Rules</Text>
      </Pressable>
    </ScrollView>
  );
}
