import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { PressableScale } from '../../../components/PressableScale';
import {
  AuraScrollView,
  Card,
  GradientButton,
  Icon,
  IconTile,
  LiveDot,
  Pill,
  SectionHeader,
  TintButton,
} from '../../../components/ui';
import { apiFetch } from '../../../lib/api';
import { formatDateTime } from '../../../lib/format';
import {
  CROSSFADE_IN,
  CROSSFADE_OUT,
  EASE_OUT_CSS,
  ENTER,
  EXIT,
  FADE_IN,
  REFLOW,
  colorTransition,
  haptic,
} from '../../../lib/motion';
import { STATUS_OPTIONS, Status } from '../../../lib/options';
import { colors, modeMeta, palette } from '../../../lib/theme';
import type { StatusInterpretation } from '../../../lib/types';
import { styles } from '../../../styles/shared';

export default function HomeScreen() {
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
  const [refreshing, setRefreshing] = useState(false);

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
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadStatus().finally(() => setRefreshing(false));
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

  const meta = modeMeta(status);

  return (
    <AuraScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="interactive"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <StatusBar style="dark" />

      <Animated.View layout={REFLOW} style={styles.heroShadow}>
        <View style={styles.hero}>
          {/* Each mode has its own blurred color field; they cross-fade
              when the status changes. */}
          <Animated.View
            key={`hero-${meta.color}`}
            entering={CROSSFADE_IN}
            exiting={CROSSFADE_OUT}
            style={StyleSheet.absoluteFill}
          >
            <Image
              source={meta.image}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          </Animated.View>

          <View style={styles.heroTopRow}>
            <Animated.View key={`icon-${status}`} entering={ENTER}>
              <IconTile name={meta.icon} color="#fff" size={50} onDark />
            </Animated.View>
            <View style={styles.heroLive}>
              <LiveDot />
              <Text style={styles.heroLiveText}>On duty</Text>
            </View>
          </View>

          <View>
            <Text style={styles.heroLabel}>You're currently</Text>
            {/* Keyed so a new status cross-fades in rather than swapping text. */}
            <Animated.Text
              key={status}
              entering={ENTER}
              style={styles.heroMode}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {status}
            </Animated.Text>
            <Animated.Text
              key={`tagline-${status}`}
              entering={FADE_IN}
              style={styles.heroTagline}
            >
              {meta.tagline}
            </Animated.Text>
          </View>

          {customInstruction && (
            <Animated.View
              entering={ENTER}
              exiting={EXIT}
              layout={REFLOW}
              style={styles.heroRule}
            >
              <Text style={styles.heroRuleText}>
                &ldquo;{customInstruction}&rdquo;
              </Text>
              {customExpiresAt && (
                <View style={styles.heroRuleExpiry}>
                  <Icon name="clock" size={12} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.heroRuleExpiryText}>
                    Until {formatDateTime(customExpiresAt)}
                  </Text>
                </View>
              )}
            </Animated.View>
          )}
        </View>
      </Animated.View>

      {error && (
        <Animated.Text entering={FADE_IN} style={styles.error}>
          {error}
        </Animated.Text>
      )}

      {/* Everything below slides smoothly when the hero or the
          Tell My Assistant box changes size. */}
      <Animated.View layout={REFLOW} style={styles.section}>
        <SectionHeader title="Set Status" />
        <View style={styles.modeGrid}>
          {STATUS_OPTIONS.map((option) => {
            const optionMeta = modeMeta(option);
            const active = option === status;
            return (
              <PressableScale
                key={option}
                onPress={() => updateStatus(option)}
                style={styles.modeTile}
              >
                {/* The selected tile fills with its mode's color field. */}
                <Animated.View
                  style={[
                    StyleSheet.absoluteFill,
                    tileFill,
                    { opacity: active ? 1 : 0 },
                  ]}
                >
                  <Image
                    source={optionMeta.image}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                  />
                </Animated.View>
                <IconTile
                  name={optionMeta.icon}
                  color={optionMeta.color}
                  size={40}
                  onDark={active}
                />
                <Animated.Text
                  style={[
                    styles.modeTileText,
                    colorTransition,
                    active && styles.modeTileTextActive,
                  ]}
                >
                  {option}
                </Animated.Text>
              </PressableScale>
            );
          })}
        </View>

        <SectionHeader title="Tell My Assistant" />
        {!pendingInterpretation ? (
          <Animated.View key="input" entering={ENTER} style={styles.section}>
            <Card style={styles.assistantCard}>
              <View style={styles.assistantHeader}>
                <IconTile name="sparkles" color={colors.accent} />
                <Text style={styles.assistantHeaderText}>
                  Describe what you're up to
                </Text>
              </View>
              <TextInput
                style={styles.assistantInput}
                placeholder="e.g. Studying until 8, let family and recruiters through"
                placeholderTextColor={colors.textTertiary}
                value={naturalInput}
                onChangeText={setNaturalInput}
                multiline
              />
              {interpretError && (
                <Animated.Text entering={FADE_IN} style={styles.error}>
                  {interpretError}
                </Animated.Text>
              )}
              <GradientButton
                label={interpreting ? 'Thinking...' : 'Tell Assistant'}
                icon={interpreting ? 'ellipsis' : 'arrow.up.right'}
                onPress={interpretInstruction}
                disabled={interpreting || !naturalInput.trim()}
              />
            </Card>
          </Animated.View>
        ) : (
          <Animated.View key="confirm" entering={ENTER} style={styles.section}>
            <Card style={styles.assistantCard}>
              <View style={styles.assistantHeader}>
                <IconTile name="sparkles" color={colors.accent} />
                <Text style={styles.assistantHeaderText}>I understood</Text>
              </View>
              <Text style={styles.confirmSummary}>
                {pendingInterpretation.summary}
              </Text>
              <View style={styles.pillRow}>
                <Pill
                  label={pendingInterpretation.mode_label}
                  color={modeMeta(pendingInterpretation.mode_label).color}
                  icon={modeMeta(pendingInterpretation.mode_label).icon}
                />
                {pendingInterpretation.expires_at && (
                  <Pill
                    label={`Until ${formatDateTime(pendingInterpretation.expires_at)}`}
                    color={palette.gray}
                    icon="clock"
                  />
                )}
              </View>
              {pendingInterpretation.transfer_types.length > 0 && (
                <View style={styles.confirmLine}>
                  <Icon name="checkmark.circle" size={15} color={palette.green} />
                  <Text style={styles.confirmLineText}>
                    Let through: {pendingInterpretation.transfer_types.join(', ')}
                  </Text>
                </View>
              )}
              {pendingInterpretation.urgent_always_transfers && (
                <View style={styles.confirmLine}>
                  <Icon
                    name="exclamationmark.circle"
                    size={15}
                    color={palette.orange}
                  />
                  <Text style={styles.confirmLineText}>
                    Urgent callers always let through
                  </Text>
                </View>
              )}
              {interpretError && (
                <Animated.Text entering={FADE_IN} style={styles.error}>
                  {interpretError}
                </Animated.Text>
              )}
              <View style={styles.buttonPair}>
                <GradientButton
                  label={applyingCustom ? 'Applying...' : 'Confirm'}
                  icon="checkmark"
                  onPress={confirmCustomStatus}
                  disabled={applyingCustom}
                  style={styles.flex}
                />
                <TintButton
                  label="Cancel"
                  color={palette.gray}
                  onPress={cancelCustomStatus}
                  style={styles.flex}
                  textStyle={{ color: colors.text }}
                />
              </View>
            </Card>
          </Animated.View>
        )}
      </Animated.View>
    </AuraScrollView>
  );
}

const tileFill = {
  transitionProperty: 'opacity',
  transitionDuration: 250,
  transitionTimingFunction: EASE_OUT_CSS,
} as const;
