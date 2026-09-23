import { useEffect, useState } from 'react';
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

import { API_BASE_URL } from '../../lib/api';
import { PRIORITY_OPTIONS, RELATIONSHIP_OPTIONS } from '../../lib/options';
import type { Contact } from '../../lib/types';
import { styles } from '../../styles/shared';

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

  const loadContacts = () => {
    setError(null);
    setLoading(true);
    return fetch(`${API_BASE_URL}/contacts`)
      .then((res) => res.json())
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

  const addContact = () => {
    if (!newName.trim() || !newPhone.trim()) {
      setError('Name and phone number are required');
      return;
    }
    setAddingContact(true);
    setError(null);
    fetch(`${API_BASE_URL}/contacts`, {
      method: 'POST',
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
        setNewName('');
        setNewPhone('');
        setNewRelationship('friend');
        setNewPriority('normal');
        return loadContacts();
      })
      .catch(() =>
        setError(
          "Could not add contact — check the phone number isn't already used"
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
          setContacts((prev) => prev.filter((c) => c.id !== contactId));
          fetch(`${API_BASE_URL}/contacts/${contactId}`, {
            method: 'DELETE',
          }).catch(() => setError('Could not delete contact'));
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <StatusBar style="auto" />
      <View style={styles.addContactForm}>
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
        <Text style={styles.formLabel}>Relationship</Text>
        <View style={styles.chipRow}>
          {RELATIONSHIP_OPTIONS.map((option) => (
            <Pressable
              key={option}
              style={[
                styles.chip,
                newRelationship === option && styles.chipActive,
              ]}
              onPress={() => setNewRelationship(option)}
            >
              <Text
                style={[
                  styles.chipText,
                  newRelationship === option && styles.chipTextActive,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.formLabel}>Priority</Text>
        <View style={styles.chipRow}>
          {PRIORITY_OPTIONS.map((option) => (
            <Pressable
              key={option}
              style={[styles.chip, newPriority === option && styles.chipActive]}
              onPress={() => setNewPriority(option)}
            >
              <Text
                style={[
                  styles.chipText,
                  newPriority === option && styles.chipTextActive,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          ))}
        </View>
        {error && <Text style={styles.error}>{error}</Text>}
        <Pressable
          style={styles.addContactButton}
          onPress={addContact}
          disabled={addingContact}
        >
          <Text style={styles.callActionText}>
            {addingContact ? 'Adding...' : 'Add Contact'}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>All Contacts</Text>
      {loading && <Text style={styles.emptyText}>Loading...</Text>}
      {!loading && contacts.length === 0 && (
        <Text style={styles.emptyText}>No contacts yet</Text>
      )}
      <View style={styles.callList}>
        {contacts.map((contact) => (
          <View key={contact.id} style={styles.contactCard}>
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
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
