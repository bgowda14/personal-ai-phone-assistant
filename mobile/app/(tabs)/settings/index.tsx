import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { API_BASE_URL, TWILIO_NUMBER, apiFetch } from '../../../lib/api';
import { FADE_IN } from '../../../lib/motion';
import type { Config } from '../../../lib/types';
import { styles } from '../../../styles/shared';

export default function SettingsScreen() {
  const router = useRouter();
  const [config, setConfig] = useState<Config | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/config')
      .then((res) => {
        if (!res.ok) throw new Error('request failed');
        return res.json();
      })
      .then(setConfig)
      .catch(() => setError('Could not reach backend'));
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <StatusBar style="auto" />
      {error && (
        <Animated.Text entering={FADE_IN} style={styles.error}>
          {error}
        </Animated.Text>
      )}

      <View style={styles.settingsCard}>
        <Text style={styles.settingsLabel}>Twilio Assistant Number</Text>
        <Text style={styles.settingsValue}>{TWILIO_NUMBER}</Text>
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.settingsLabel}>Backend</Text>
        <Text style={styles.settingsValue}>{API_BASE_URL}</Text>
      </View>

      {config && (
        <Animated.View entering={FADE_IN} style={styles.settingsCard}>
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
          <View style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>App/backend authentication</Text>
            <Text
              style={
                config.api_key_configured
                  ? styles.settingsOk
                  : styles.settingsMissing
              }
            >
              {config.api_key_configured ? 'Enforced' : 'Not enforced'}
            </Text>
          </View>
          <View style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Twilio request verification</Text>
            <Text
              style={
                config.twilio_signature_verified
                  ? styles.settingsOk
                  : styles.settingsMissing
              }
            >
              {config.twilio_signature_verified
                ? 'Enforced'
                : 'Not enforced'}
            </Text>
          </View>
        </Animated.View>
      )}

      <Pressable
        style={styles.manageContactsLink}
        onPress={() => router.push('/settings/rules')}
        hitSlop={8}
      >
        <Text style={styles.viewAllLink}>View Rules</Text>
      </Pressable>
    </ScrollView>
  );
}
