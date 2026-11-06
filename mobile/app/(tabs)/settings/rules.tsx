import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { PressableScale } from '../../../components/PressableScale';
import {
  AuraScrollView,
  Card,
  Icon,
  Pill,
  SectionHeader,
} from '../../../components/ui';
import { apiFetch } from '../../../lib/api';
import { formatDateTime } from '../../../lib/format';
import {
  EASE_OUT_CSS,
  ENTER,
  EXIT,
  FADE_IN,
  REFLOW,
  colorTransition,
  haptic,
} from '../../../lib/motion';
import {
  ACTION_META,
  colors,
  modeMeta,
  palette,
} from '../../../lib/theme';
import type { StatusResponse } from '../../../lib/types';
import { styles } from '../../../styles/shared';

type Rule = { mode: string; caller_type: string; action: string };

const MODE_ORDER = ['available', 'busy', 'sleeping'];
const MODE_LABELS: Record<string, string> = {
  available: 'Available',
  busy: 'Busy / In Class / Driving / Custom',
  sleeping: 'Sleeping',
};

const ACTION_OPTIONS = [
  'TRANSFER',
  'TAKE_MESSAGE',
  'SCREEN',
  'REJECT',
  'ASK_ME',
] as const;

const ACTION_LABELS: Record<string, string> = {
  TRANSFER: 'Transfer',
  TAKE_MESSAGE: 'Take Message',
  SCREEN: 'Screen',
  REJECT: 'Reject',
  ASK_ME: 'Ask Me',
};

function ruleKey(rule: Rule): string {
  return `${rule.mode}:${rule.caller_type}`;
}

export default function RulesScreen() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const loadRules = () => {
    return apiFetch('/rules')
      .then((res) => {
        if (!res.ok) throw new Error('request failed');
        return res.json();
      })
      .then((data) => setRules(data))
      .catch(() => setError('Could not load rules'));
  };

  useEffect(() => {
    loadRules();
    apiFetch('/status')
      .then((res) => {
        if (!res.ok) throw new Error('request failed');
        return res.json();
      })
      .then(setStatus)
      .catch(() => {});
  }, []);

  const setRuleAction = (rule: Rule, action: string) => {
    const key = ruleKey(rule);
    setSavingKey(key);
    setError(null);
    apiFetch('/rules', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: rule.mode,
        caller_type: rule.caller_type,
        action,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('request failed');
        return res.json();
      })
      .then(() => {
        haptic.select();
        setRules((prev) =>
          prev.map((r) => (ruleKey(r) === key ? { ...r, action } : r))
        );
        setEditingKey(null);
      })
      .catch(() => {
        haptic.error();
        setError('Could not save that change — try again');
      })
      .finally(() => setSavingKey(null));
  };

  const hasCustomRule =
    !!status?.expires_at && new Date(status.expires_at) > new Date();

  const sections = MODE_ORDER.map((mode) => ({
    mode,
    rows: rules.filter((r) => r.mode === mode),
  })).filter((section) => section.rows.length > 0);

  return (
    <AuraScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <StatusBar style="dark" />

      {hasCustomRule && status && (
        <Animated.View entering={FADE_IN} style={styles.ruleBanner}>
          <Image
            source={modeMeta('custom').image}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <Text style={styles.ruleBannerLabel}>
            Active custom rule overrides everything below
          </Text>
          <Text style={styles.heroRuleText}>
            &ldquo;{status.custom_instruction}&rdquo;
          </Text>
          {status.expires_at && (
            <View style={styles.heroRuleExpiry}>
              <Icon name="clock.fill" size={12} color="rgba(255,255,255,0.9)" />
              <Text style={styles.heroRuleExpiryText}>
                Until {formatDateTime(status.expires_at)}
              </Text>
            </View>
          )}
        </Animated.View>
      )}

      {error && (
        <Animated.Text entering={FADE_IN} style={styles.error}>
          {error}
        </Animated.Text>
      )}

      <Card style={styles.noteCard}>
        <View style={styles.noteRow}>
          <Icon name="hand.tap.fill" size={16} color={colors.accent} />
          <Text style={styles.noteText}>
            Tap an action to change it. Known contacts are decided by their
            saved relationship, not AI guesswork. Unknown callers are
            classified by AI after they explain who they are and why
            they're calling.
          </Text>
        </View>
        <View style={styles.noteRow}>
          <Icon name="lock.fill" size={16} color={palette.orange} />
          <Text style={styles.noteText}>
            Always on, not editable here: spam is always rejected, an urgent
            call always transfers when Available, and a family emergency
            (urgent) always transfers even while Sleeping.
          </Text>
        </View>
      </Card>

      {sections.map((section) => {
        const meta = modeMeta(section.mode);
        return (
          <View key={section.mode} style={styles.section}>
            <SectionHeader
              title={MODE_LABELS[section.mode] || section.mode}
              icon={meta.icon}
              color={meta.color}
            />
            <Animated.View layout={REFLOW}>
              <Card style={styles.groupedCard}>
                {section.rows.map((row, index) => {
                  const key = ruleKey(row);
                  const isEditing = editingKey === key;
                  const action = ACTION_META[row.action];
                  return (
                    <Animated.View key={key} layout={REFLOW}>
                      {index > 0 && (
                        <View style={[styles.hairline, styles.rulesSeparator]} />
                      )}
                      <Pressable
                        style={styles.rulesRow}
                        onPress={() => setEditingKey(isEditing ? null : key)}
                      >
                        <Text style={styles.rulesType}>{row.caller_type}</Text>
                        <Pill
                          label={ACTION_LABELS[row.action] || row.action}
                          color={action?.color ?? palette.gray}
                          icon={action?.icon}
                        />
                        {/* Chevron flips as the picker opens and closes. */}
                        <Animated.View
                          style={[chevronTransition, isEditing && styles.chevronOpen]}
                        >
                          <Icon
                            name="chevron.down"
                            size={12}
                            color={colors.textTertiary}
                          />
                        </Animated.View>
                      </Pressable>
                      {/* The action picker drops open under its row and the
                          rows below slide down to make room. */}
                      {isEditing && (
                        <Animated.View
                          entering={ENTER}
                          exiting={EXIT}
                          style={styles.rulesEditRow}
                        >
                          {ACTION_OPTIONS.map((option) => {
                            const optionMeta = ACTION_META[option];
                            const active = row.action === option;
                            return (
                              <PressableScale
                                key={option}
                                style={[
                                  styles.chip,
                                  active && { backgroundColor: optionMeta.color },
                                ]}
                                disabled={savingKey === key}
                                onPress={() => setRuleAction(row, option)}
                              >
                                <Icon
                                  name={optionMeta.icon}
                                  size={12}
                                  color={active ? '#fff' : optionMeta.color}
                                />
                                <Animated.Text
                                  style={[
                                    styles.chipText,
                                    colorTransition,
                                    active && styles.chipTextActive,
                                  ]}
                                >
                                  {ACTION_LABELS[option]}
                                </Animated.Text>
                              </PressableScale>
                            );
                          })}
                        </Animated.View>
                      )}
                    </Animated.View>
                  );
                })}
              </Card>
            </Animated.View>
          </View>
        );
      })}
    </AuraScrollView>
  );
}

const chevronTransition = {
  transform: [{ rotate: '0deg' }],
  transitionProperty: 'transform',
  transitionDuration: 200,
  transitionTimingFunction: EASE_OUT_CSS,
} as const;
