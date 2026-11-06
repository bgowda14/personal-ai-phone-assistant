import { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
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

import { PressableScale } from '../../../components/PressableScale';

import { apiFetch } from '../../../lib/api';
import {
  ENTER,
  EXIT,
  FADE_IN,
  REFLOW,
  colorTransition,
  haptic,
} from '../../../lib/motion';
import { PRIORITY_OPTIONS, RELATIONSHIP_OPTIONS } from '../../../lib/options';
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
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <StatusBar style="auto" />
      <Animated.View layout={REFLOW} style={styles.addContactForm}>
        <Text style={styles.formTitle}>
          {editingId === null ? 'Add Contact' : 'Edit Contact'}
        </Text>
        {editingId === null && (
          <Animated.View entering={FADE_IN} exiting={EXIT}>
            <PressableScale
              style={styles.importButton}
              onPress={importFromPhone}
            >
              <Text style={styles.importButtonText}>Import from Phone</Text>
            </PressableScale>
          </Animated.View>
        )}
        <TextInput
          style={styles.textInput}
          placeholder="Name"
          value={newName}
          onChangeText={setNewName}
        />
        <TextInput
          style={styles.textInput}
          placeholder="+15551234567"
          value={newPhone}
          onChangeText={setNewPhone}
          keyboardType="phone-pad"
        />
        {phoneChoices.length > 0 && (
          <Animated.View entering={ENTER} exiting={EXIT}>
            <Text style={styles.formLabel}>Which number?</Text>
            <View style={styles.chipRow}>
              {phoneChoices.map((choice) => (
                <Chip
                  key={choice.number}
                  label={`${choice.label}: ${choice.number}`}
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
        <PressableScale
          style={styles.addContactButton}
          onPress={saveContact}
          disabled={addingContact}
        >
          <Text style={styles.callActionText}>
            {editingId === null
              ? addingContact
                ? 'Adding...'
                : 'Add Contact'
              : addingContact
                ? 'Saving...'
                : 'Save Changes'}
          </Text>
        </PressableScale>
        {editingId !== null && (
          <Animated.View entering={FADE_IN} exiting={EXIT}>
            <Pressable style={styles.cancelEditButton} onPress={resetForm}>
              <Text style={styles.cancelEditText}>Cancel</Text>
            </Pressable>
          </Animated.View>
        )}
      </Animated.View>

      <Animated.View layout={REFLOW} style={styles.section}>
        <Text style={styles.sectionTitle}>All Contacts</Text>
      </Animated.View>
      {loading && contacts.length === 0 && (
        <Text style={styles.emptyText}>Loading...</Text>
      )}
      {!loading && contacts.length === 0 && (
        <Animated.Text entering={FADE_IN} style={styles.emptyText}>
          No contacts yet
        </Animated.Text>
      )}
      <Animated.View layout={REFLOW} style={styles.callList}>
        {contacts.map((contact) => (
          // Removed contacts fade out and the rest slide up to fill the gap.
          <Animated.View
            key={contact.id}
            entering={FADE_IN}
            exiting={EXIT}
            layout={REFLOW}
          >
            <PressableScale
              style={[
                styles.contactCard,
                editingId === contact.id && styles.contactCardEditing,
              ]}
              onPress={() => startEditing(contact)}
            >
              <View style={styles.callNameColumn}>
                <Text style={styles.callName}>{contact.name}</Text>
                <Text style={styles.callCompany}>{contact.phone_number}</Text>
              </View>
              <View style={styles.contactBadgeColumn}>
                <Text style={styles.callTypeBadge}>{contact.relationship}</Text>
                <Text style={styles.callPriorityBadge}>{contact.priority}</Text>
              </View>
              <Pressable
                hitSlop={8}
                onPress={() => confirmDeleteContact(contact.id, contact.name)}
              >
                <Text style={styles.deleteContactLink}>Remove</Text>
              </Pressable>
            </PressableScale>
          </Animated.View>
        ))}
      </Animated.View>
    </ScrollView>
  );
}

// A selectable chip: tick haptic on a new choice, and the fill and label
// colors cross-fade together.
function Chip({
  label,
  active,
  onSelect,
}: {
  label: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <PressableScale
      style={[styles.chip, active && styles.chipActive]}
      onPress={() => {
        if (!active) haptic.select();
        onSelect();
      }}
    >
      <Animated.Text
        style={[styles.chipText, colorTransition, active && styles.chipTextActive]}
      >
        {label}
      </Animated.Text>
    </PressableScale>
  );
}
