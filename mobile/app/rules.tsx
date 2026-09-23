import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { API_BASE_URL } from '../lib/api';
import { formatDateTime } from '../lib/format';
import type { StatusResponse } from '../lib/types';
import { styles } from '../styles/shared';

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
    return fetch(`${API_BASE_URL}/rules`)
      .then((res) => res.json())
      .then((data) => setRules(data))
      .catch(() => setError('Could not load rules'));
  };

  useEffect(() => {
    loadRules();
    fetch(`${API_BASE_URL}/status`)
      .then((res) => res.json())
      .then(setStatus)
      .catch(() => {});
  }, []);

  const setRuleAction = (rule: Rule, action: string) => {
    const key = ruleKey(rule);
    setSavingKey(key);
    setError(null);
    fetch(`${API_BASE_URL}/rules`, {
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
        setRules((prev) =>
          prev.map((r) => (ruleKey(r) === key ? { ...r, action } : r))
        );
        setEditingKey(null);
      })
      .catch(() => setError('Could not save that change — try again'))
      .finally(() => setSavingKey(null));
  };

  const hasCustomRule =
    !!status?.expires_at && new Date(status.expires_at) > new Date();

  const sections = MODE_ORDER.map((mode) => ({
    mode,
    rows: rules.filter((r) => r.mode === mode),
  })).filter((section) => section.rows.length > 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar style="auto" />

      {hasCustomRule && status && (
        <View style={styles.activeRuleBanner}>
          <Text style={styles.formLabel}>
            Active custom rule overrides everything below:
          </Text>
          <Text style={styles.activeRuleText}>
            &ldquo;{status.custom_instruction}&rdquo;
          </Text>
          {status.expires_at && (
            <Text style={styles.activeRuleExpiry}>
              Until {formatDateTime(status.expires_at)}
            </Text>
          )}
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.rulesNote}>
        Tap an action to change it. Known contacts are decided by their
        saved relationship, not AI guesswork. Unknown callers are
        classified by AI after they explain who they are and why they're
        calling.
      </Text>

      <Text style={styles.rulesNote}>
        Always on, not editable here: spam is always rejected, an urgent
        call always transfers when Available, and a family emergency
        (urgent) always transfers even while Sleeping.
      </Text>

      {sections.map((section) => (
        <View key={section.mode} style={styles.rulesSection}>
          <Text style={[styles.sectionTitle, styles.sectionTitleStandalone]}>
            {MODE_LABELS[section.mode] || section.mode}
          </Text>
          <View style={styles.rulesTable}>
            {section.rows.map((row, index) => {
              const key = ruleKey(row);
              const isEditing = editingKey === key;
              return (
                <View key={key}>
                  <Pressable
                    style={[
                      styles.rulesRow,
                      index === section.rows.length - 1 &&
                        !isEditing && { borderBottomWidth: 0 },
                    ]}
                    onPress={() => setEditingKey(isEditing ? null : key)}
                  >
                    <Text style={styles.rulesType}>{row.caller_type}</Text>
                    <Text style={styles.rulesAction}>
                      {ACTION_LABELS[row.action] || row.action}
                    </Text>
                  </Pressable>
                  {isEditing && (
                    <View style={styles.rulesEditRow}>
                      {ACTION_OPTIONS.map((option) => (
                        <Pressable
                          key={option}
                          style={[
                            styles.chip,
                            row.action === option && styles.chipActive,
                          ]}
                          disabled={savingKey === key}
                          onPress={() => setRuleAction(row, option)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              row.action === option && styles.chipTextActive,
                            ]}
                          >
                            {ACTION_LABELS[option]}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
