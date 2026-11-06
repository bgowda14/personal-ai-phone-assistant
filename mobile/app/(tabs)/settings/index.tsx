import { Fragment, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import type { SFSymbol } from 'sf-symbols-typescript';

import { PressableScale } from '../../../components/PressableScale';
import {
  AuraScrollView,
  Card,
  Icon,
  IconTile,
} from '../../../components/ui';
import { API_BASE_URL, TWILIO_NUMBER, apiFetch } from '../../../lib/api';
import { FADE_IN } from '../../../lib/motion';
import { colors, palette } from '../../../lib/theme';
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

  const health: {
    label: string;
    icon: SFSymbol;
    color: string;
    ok: boolean;
    okText: string;
    missingText: string;
  }[] = config
    ? [
        {
          label: 'AI classification',
          icon: 'sparkles',
          color: palette.purple,
          ok: config.openai_configured,
          okText: 'Configured',
          missingText: 'Not configured',
        },
        {
          label: 'Live call transfer',
          icon: 'phone.arrow.right.fill',
          color: palette.green,
          ok: config.transfer_configured,
          okText: 'Configured',
          missingText: 'Not configured',
        },
        {
          label: 'App authentication',
          icon: 'lock.fill',
          color: palette.blue,
          ok: config.api_key_configured,
          okText: 'Enforced',
          missingText: 'Not enforced',
        },
        {
          label: 'Twilio verification',
          icon: 'checkmark.shield.fill',
          color: palette.orange,
          ok: config.twilio_signature_verified,
          okText: 'Enforced',
          missingText: 'Not enforced',
        },
      ]
    : [];

  return (
    <AuraScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <StatusBar style="dark" />
      {error && (
        <Animated.Text entering={FADE_IN} style={styles.error}>
          {error}
        </Animated.Text>
      )}

      <Card style={styles.profileCard}>
        <IconTile name="phone.bubble.fill" color={colors.accent} size={58} />
        <View style={styles.flex}>
          <Text style={styles.profileTitle}>AI Assistant</Text>
          <Text style={styles.profileSubtitle}>{TWILIO_NUMBER}</Text>
        </View>
      </Card>

      <Text style={styles.settingsGroupTitle}>Connection</Text>
      <Card style={styles.groupedCard}>
        <View style={styles.settingsRow}>
          <IconTile name="server.rack" color={palette.gray} />
          <Text style={styles.settingsLabel}>Backend</Text>
          <Text
            style={[styles.settingsValue, { maxWidth: '55%' }]}
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {API_BASE_URL.replace(/^https?:\/\//, '')}
          </Text>
        </View>
      </Card>

      {config && (
        <Animated.View entering={FADE_IN} style={styles.section}>
          <Text style={styles.settingsGroupTitle}>System Health</Text>
          <Card style={styles.groupedCard}>
            {health.map((item, index) => {
              const statusColor = item.ok ? palette.green : palette.red;
              return (
                <Fragment key={item.label}>
                  {index > 0 && (
                    <View style={[styles.hairline, styles.settingsSeparator]} />
                  )}
                  <View style={styles.settingsRow}>
                    <IconTile name={item.icon} color={item.color} />
                    <Text style={styles.settingsLabel}>{item.label}</Text>
                    <View style={styles.healthValue}>
                      <View
                        style={[styles.healthDot, { backgroundColor: statusColor }]}
                      />
                      <Text style={[styles.healthText, { color: statusColor }]}>
                        {item.ok ? item.okText : item.missingText}
                      </Text>
                    </View>
                  </View>
                </Fragment>
              );
            })}
          </Card>
        </Animated.View>
      )}

      <Text style={styles.settingsGroupTitle}>Call Handling</Text>
      <Card style={styles.groupedCard}>
        <PressableScale
          style={styles.settingsRow}
          onPress={() => router.push('/settings/rules')}
        >
          <IconTile name="list.bullet.rectangle.fill" color={palette.indigo} />
          <Text style={styles.settingsLabel}>Call Rules</Text>
          <Icon name="chevron.right" size={13} color={colors.textTertiary} />
        </PressableScale>
      </Card>

      <Text style={styles.footer}>AI Assistant 1.0</Text>
    </AuraScrollView>
  );
}
