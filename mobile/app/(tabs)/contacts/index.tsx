import { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as PhoneContacts from 'expo-contacts/legacy';
import Animated from 'react-native-reanimated';

import { EmptyState } from '../../../components/EmptyState';
import { PressableScale } from '../../../components/PressableScale';
import {
  AuraScrollView,
  Avatar,
  Card,
  GradientButton,
  Icon,
  IconTile,
  Pill,
  SectionHeader,
  TintButton,
} from '../../../components/ui';
import { apiFetch } from '../../../lib/api';
import {
  ENTER,
  EXIT,
  FADE_IN,
  REFLOW,
  colorTransition,
  haptic,
  riseIn,
} from '../../../lib/motion';
import { PRIORITY_OPTIONS, RELATIONSHIP_OPTIONS } from '../../../lib/options';
import {
  PRIORITY_COLORS,
  RELATIONSHIP_COLORS,
  colors,
  gradientFor,
  palette,
  tint,
} from '../../../lib/theme';
import type { Contact } from '../../../lib/types';
import { styles } from '../../../styles/shared';

export default function ContactsScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRelationship, setNewRelationship] =
    useState<(typeof RELATIONSHIP_OPTIONS)[number]>('friend');
  const [newPriority, setNewPriority] =
    useState<(typeof PRIORITY_OPTIONS)[number]>('normal');
  const [addingContact, setAddingContact] = useState(false);
  // Set while the form is editing an existing contact instead of adding one.
  const [editingId, setEditingId] = useState<number | null>(null);
  // When a contact picked from the phone has several numbers, offer them as
  // chips instead of guessing which one to use.
  const [phoneChoices, setPhoneChoices] = useState<
    { label: string; number: string }[]
  >([]);
  const scrollRef = useRef<ScrollView>(null);

  const loadContacts = () => {
    setError(null);
    setLoading(true);
    return apiFetch('/contacts')
      .then((res) => {
        if (!res.ok) throw new Error('request failed');
        return res.json();
      })
      .then((data) => setContacts(data))
      .catch(() => setError('Could not load contacts'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadContacts().finally(() => setRefreshing(false));
  };

  const resetForm = () => {
    setNewName('');
    setNewPhone('');
    setNewRelationship('friend');
    setNewPriority('normal');
    setEditingId(null);
    setPhoneChoices([]);
  };

  // Uses the system contact picker, which hands back only the contact the
  // user taps — no address-book permission prompt needed.
  const importFromPhone = async () => {
    setError(null);
    try {
      const picked = await PhoneContacts.presentContactPickerAsync();
      if (!picked) return;
      const numbers = (picked.phoneNumbers ?? [])
        .filter((p) => p.number)
        .map((p) => ({ label: p.label || 'phone', number: p.number! }));
      if (numbers.length === 0) {
        setError(`${picked.name} has no phone number`);
        return;
      }
      setNewName(picked.name);
      setNewPhone(numbers[0].number);
      setPhoneChoices(numbers.length > 1 ? numbers : []);
    } catch {
      setError('Could not open your contacts');
    }
  };

  const startEditing = (contact: Contact) => {
    setEditingId(contact.id);
    setNewName(contact.name);
    setNewPhone(contact.phone_number);
    setNewRelationship(
      contact.relationship as (typeof RELATIONSHIP_OPTIONS)[number]
    );
    setNewPriority(contact.priority as (typeof PRIORITY_OPTIONS)[number]);
    setPhoneChoices([]);
    setError(null);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const saveContact = () => {
    if (!newName.trim() || !newPhone.trim()) {
      setError('Name and phone number are required');
      return;
    }
    setAddingContact(true);
    setError(null);
    apiFetch(editingId === null ? '/contacts' : `/contacts/${editingId}`, {
      method: editingId === null ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newName.trim(),
        phone_number: newPhone.trim(),
        relationship: newRelationship,
        priority: newPriority,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('request failed');
        return res.json();
      })
      .then(() => {
        haptic.success();
        resetForm();
        return loadContacts();
      })
      .catch(() =>
        setError(
          `Could not ${editingId === null ? 'add' : 'save'} contact — check the phone number isn't already used`
        )
      )
      .finally(() => setAddingContact(false));
  };

  const confirmDeleteContact = (contactId: number, name: string) => {
    Alert.alert('Delete contact', `Remove ${name} from contacts?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          haptic.medium();
          if (editingId === contactId) resetForm();
          setContacts((prev) => prev.filter((c) => c.id !== contactId));
          apiFetch(`/contacts/${contactId}`, {
            method: 'DELETE',
          }).catch(() => setError('Could not delete contact'));
        },
      },
    ]);
  };

  return (
    <AuraScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="interactive"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <StatusBar style="dark" />
      <Animated.View layout={REFLOW} style={styles.section}>
        <Card style={styles.formCard}>
          <View style={styles.assistantHeader}>
            <IconTile
              name={editingId === null ? 'person.badge.plus' : 'pencil'}
              color={editingId === null ? palette.blue : palette.orange}
            />
            <Text style={styles.formTitle}>
              {editingId === null ? 'Add Contact' : 'Edit Contact'}
            </Text>
          </View>
          {editingId === null && (
            <Animated.View entering={FADE_IN} exiting={EXIT}>
              <TintButton
                label="Import from Phone"
                icon="person.crop.circle.badge.plus"
                color={palette.blue}
                onPress={importFromPhone}
              />
            </Animated.View>
          )}
          <View style={styles.inputRow}>
            <Icon name="person.fill" size={16} color={colors.textTertiary} />
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor={colors.textTertiary}
              value={newName}
              onChangeText={setNewName}
            />
          </View>
          <View style={styles.inputRow}>
            <Icon name="phone.fill" size={16} color={colors.textTertiary} />
            <TextInput
              style={styles.input}
              placeholder="+15551234567"
              placeholderTextColor={colors.textTertiary}
              value={newPhone}
              onChangeText={setNewPhone}
              keyboardType="phone-pad"
            />
          </View>
          {phoneChoices.length > 0 && (
            <Animated.View entering={ENTER} exiting={EXIT} style={{ gap: 12 }}>
              <Text style={styles.formLabel}>Which number?</Text>
              <View style={styles.chipRow}>
                {phoneChoices.map((choice) => (
                  <Chip
                    key={choice.number}
                    label={`${choice.label}: ${choice.number}`}
                    color={palette.blue}
                    active={newPhone === choice.number}
                    onSelect={() => setNewPhone(choice.number)}
                  />
                ))}
              </View>
            </Animated.View>
          )}
          <Text style={styles.formLabel}>Relationship</Text>
          <View style={styles.chipRow}>
            {RELATIONSHIP_OPTIONS.map((option) => (
              <Chip
                key={option}
                label={option}
                color={RELATIONSHIP_COLORS[option]}
                active={newRelationship === option}
                onSelect={() => setNewRelationship(option)}
              />
            ))}
          </View>
          <Text style={styles.formLabel}>Priority</Text>
          <View style={styles.chipRow}>
            {PRIORITY_OPTIONS.map((option) => (
              <Chip
                key={option}
                label={option}
                color={PRIORITY_COLORS[option]}
                active={newPriority === option}
                onSelect={() => setNewPriority(option)}
              />
            ))}
          </View>
          {error && (
            <Animated.Text entering={FADE_IN} style={styles.error}>
              {error}
            </Animated.Text>
          )}
          <GradientButton
            label={
              editingId === null
                ? addingContact
                  ? 'Adding...'
                  : 'Add Contact'
                : addingContact
                  ? 'Saving...'
                  : 'Save Changes'
            }
            icon={editingId === null ? 'plus' : 'checkmark'}
            onPress={saveContact}
            disabled={addingContact}
          />
          {editingId !== null && (
            <Animated.View entering={FADE_IN} exiting={EXIT}>
              <Pressable style={styles.cancelButton} onPress={resetForm}>
                <Text style={[styles.linkText, { color: colors.textSecondary }]}>
                  Cancel
                </Text>
              </Pressable>
            </Animated.View>
          )}
        </Card>
      </Animated.View>

      <Animated.View layout={REFLOW} style={styles.section}>
        <SectionHeader
          title="All Contacts"
          right={
            contacts.length > 0 ? (
              <Text style={styles.textMuted}>{contacts.length}</Text>
            ) : undefined
          }
        />
      </Animated.View>
      {loading && contacts.length === 0 && (
        <ActivityIndicator style={styles.loading} color={colors.accent} />
      )}
      {!loading && contacts.length === 0 && (
        <EmptyState
          icon="person.2.fill"
          color={palette.blue}
          title="No contacts yet"
          subtitle="Saved contacts skip the AI and follow their relationship's rules."
        />
      )}
      {contacts.length > 0 && (
        <Animated.View layout={REFLOW} style={styles.section}>
          <Card style={styles.groupedCard}>
            {contacts.map((contact, index) => {
              const relColor =
                RELATIONSHIP_COLORS[contact.relationship] ?? palette.gray;
              const prioColor =
                PRIORITY_COLORS[contact.priority] ?? palette.gray;
              return (
                // Removed contacts fade out and the rest slide up to fill
                // the gap.
                <Animated.View
                  key={contact.id}
                  entering={riseIn(index)}
                  exiting={EXIT}
                  layout={REFLOW}
                >
                  {index > 0 && (
                    <View style={[styles.hairline, styles.contactSeparator]} />
                  )}
                  <PressableScale
                    style={[
                      styles.contactRow,
                      editingId === contact.id && styles.contactRowEditing,
                    ]}
                    onPress={() => startEditing(contact)}
                  >
                    <Avatar
                      name={contact.name}
                      gradient={gradientFor(relColor)}
                    />
                    <View style={styles.flex}>
                      <Text style={styles.callName} numberOfLines={1}>
                        {contact.name}
                      </Text>
                      <Text style={styles.callSub}>{contact.phone_number}</Text>
                    </View>
                    <View style={styles.contactMeta}>
                      <Pill label={contact.relationship} color={relColor} />
                      <View style={styles.contactPriority}>
                        <Icon name="flag.fill" size={10} color={prioColor} />
                        <Text
                          style={[styles.contactPriorityText, { color: prioColor }]}
                        >
                          {contact.priority}
                        </Text>
                      </View>
                    </View>
                    <Pressable
                      hitSlop={8}
                      accessibilityLabel={`Remove ${contact.name}`}
                      style={[
                        styles.removeButton,
                        { backgroundColor: tint(palette.red, 0.1) },
                      ]}
                      onPress={() =>
                        confirmDeleteContact(contact.id, contact.name)
                      }
                    >
                      <Icon name="trash" size={14} color={palette.red} />
                    </Pressable>
                  </PressableScale>
                </Animated.View>
              );
            })}
          </Card>
        </Animated.View>
      )}
    </AuraScrollView>
  );
}

// A selectable chip in its option's color: tick haptic on a new choice,
// and the fill and label colors cross-fade together.
function Chip({
  label,
  color,
  active,
  onSelect,
}: {
  label: string;
  color: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <PressableScale
      style={[styles.chip, active && { backgroundColor: color }]}
      onPress={() => {
        if (!active) haptic.select();
        onSelect();
      }}
    >
      {!active && <View style={[styles.chipDot, { backgroundColor: color }]} />}
      <Animated.Text
        style={[styles.chipText, colorTransition, active && styles.chipTextActive]}
      >
        {label}
      </Animated.Text>
    </PressableScale>
  );
}
