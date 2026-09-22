import { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Alert,
  AppState,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

// Your Mac's LAN IP running `uvicorn main:app --reload` — update this if your
// network changes or your Mac gets a new IP.
const API_BASE_URL = 'http://100.70.78.175:8000';

const STATUS_OPTIONS = [
  'Available',
  'Busy',
  'Sleeping',
  'In Class',
  'Driving',
  'Custom',
] as const;

type Status = (typeof STATUS_OPTIONS)[number];

const RELATIONSHIP_OPTIONS = [
  'family',
  'friend',
  'recruiter',
  'delivery',
  'apartment',
  'unknown',
  'spam',
] as const;

const PRIORITY_OPTIONS = ['critical', 'high', 'normal', 'low'] as const;

const DECISION_LABELS: Record<string, string> = {
  TRANSFER: 'Would Transfer',
  TAKE_MESSAGE: 'Take Message',
  SCREEN: 'Screening',
  REJECT: 'Rejected',
  ASK_ME: 'Ask Me',
};

type Call = {
  id: number;
  phone_number: string;
  caller_name: string | null;
  reason: string | null;
  urgency: string | null;
  started_at: string;
  ended_at: string | null;
  status: string;
  ai_name: string | null;
  ai_company: string | null;
  ai_type: string | null;
  ai_intent: string | null;
  ai_priority: string | null;
  ai_message: string | null;
  ai_error: string | null;
  ai_recommended_action: string | null;
  dismissed_at: string | null;
  decided_action: string | null;
  matched_contact_id: number | null;
  matched_contact_name: string | null;
};

type Contact = {
  id: number;
  name: string;
  phone_number: string;
  relationship: string;
  priority: string;
  created_at: string;
};

function timeAgo(isoString: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function CallCard({
  call,
  showDateTime,
  onCallBack,
  onDismiss,
}: {
  call: Call;
  showDateTime?: boolean;
  onCallBack: (phoneNumber: string) => void;
  onDismiss: (callId: number) => void;
}) {
  const name =
    call.matched_contact_name || call.ai_name || call.caller_name || call.phone_number;
  const message = call.ai_message || call.reason;
  const dismissed = !!call.dismissed_at;

  return (
    <View style={[styles.callCard, dismissed && styles.callCardDismissed]}>
      <View style={styles.callCardHeader}>
        <View style={styles.callNameColumn}>
          <Text style={styles.callName}>{name}</Text>
          {call.ai_company && (
            <Text style={styles.callCompany}>{call.ai_company}</Text>
          )}
        </View>
        <Text style={styles.callTime}>
          {showDateTime ? formatDateTime(call.started_at) : timeAgo(call.started_at)}
        </Text>
      </View>
      {message && <Text style={styles.callReason}>{message}</Text>}
      {call.ai_recommended_action && (
        <Text style={styles.callRecommendation}>
          Recommended: {call.ai_recommended_action}
        </Text>
      )}
      <View style={styles.callMetaRow}>
        <View style={styles.callBadgeRow}>
          {call.decided_action && (
            <Text
              style={[
                styles.decisionBadge,
                call.decided_action === 'TRANSFER' &&
                  styles.decisionBadgeTransfer,
                call.decided_action === 'REJECT' &&
                  styles.decisionBadgeReject,
              ]}
            >
              {DECISION_LABELS[call.decided_action] || call.decided_action}
            </Text>
          )}
          {call.ai_type && (
            <Text style={styles.callTypeBadge}>{call.ai_type}</Text>
          )}
          {call.ai_priority ? (
            <Text
              style={[
                styles.callPriorityBadge,
                call.ai_priority === 'high' && styles.callPriorityHigh,
              ]}
            >
              {call.ai_priority}
            </Text>
          ) : call.urgency ? (
            <Text style={styles.callUrgency}>Urgent: {call.urgency}</Text>
          ) : null}
        </View>
        <Text style={styles.callStatus}>
          {dismissed ? 'dismissed' : call.status}
        </Text>
      </View>
      {!dismissed && (
        <View style={styles.callActionRow}>
          <Pressable
            style={styles.callActionButton}
            onPress={() => onCallBack(call.phone_number)}
          >
            <Text style={styles.callActionText}>Call Back</Text>
          </Pressable>
          <Pressable
            style={[styles.callActionButton, styles.callActionGhost]}
            onPress={() => onDismiss(call.id)}
          >
            <Text style={[styles.callActionText, styles.callActionGhostText]}>
              Dismiss
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const ALL_CALLS_LIMIT = 200;

export default function App() {
  const [view, setView] = useState<'home' | 'allCalls' | 'contacts'>('home');
  const [status, setStatus] = useState<Status>('Available');
  const [error, setError] = useState<string | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [callsError, setCallsError] = useState<string | null>(null);
  const [allCalls, setAllCalls] = useState<Call[]>([]);
  const [allCallsError, setAllCallsError] = useState<string | null>(null);
  const [allCallsLoading, setAllCallsLoading] = useState(false);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRelationship, setNewRelationship] =
    useState<(typeof RELATIONSHIP_OPTIONS)[number]>('friend');
  const [newPriority, setNewPriority] =
    useState<(typeof PRIORITY_OPTIONS)[number]>('normal');
  const [addingContact, setAddingContact] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const loadCalls = () => {
    setCallsError(null);
    return fetch(`${API_BASE_URL}/calls`)
      .then((res) => res.json())
      .then((data) => setCalls(data))
      .catch(() => setCallsError('Could not load recent calls'));
  };

  const loadAllCalls = () => {
    setAllCallsError(null);
    setAllCallsLoading(true);
    return fetch(`${API_BASE_URL}/calls?limit=${ALL_CALLS_LIMIT}`)
      .then((res) => res.json())
      .then((data) => setAllCalls(data))
      .catch(() => setAllCallsError('Could not load call history'))
      .finally(() => setAllCallsLoading(false));
  };

  const loadContacts = () => {
    setContactsError(null);
    setContactsLoading(true);
    return fetch(`${API_BASE_URL}/contacts`)
      .then((res) => res.json())
      .then((data) => setContacts(data))
      .catch(() => setContactsError('Could not load contacts'))
      .finally(() => setContactsLoading(false));
  };

  const openAllCalls = () => {
    setView('allCalls');
    loadAllCalls();
  };

  const openContacts = () => {
    setView('contacts');
    loadContacts();
  };

  const onRefresh = () => {
    setRefreshing(true);
    const reload =
      view === 'allCalls'
        ? loadAllCalls()
        : view === 'contacts'
        ? loadContacts()
        : loadCalls();
    reload.finally(() => setRefreshing(false));
  };

  const addContact = () => {
    if (!newName.trim() || !newPhone.trim()) {
      setContactsError('Name and phone number are required');
      return;
    }
    setAddingContact(true);
    setContactsError(null);
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
        setContactsError(
          'Could not add contact — check the phone number isn\'t already used'
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
          }).catch(() => setContactsError('Could not delete contact'));
        },
      },
    ]);
  };

  const callBack = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`).catch(() =>
      setCallsError('Could not open phone dialer')
    );
  };

  const dismissCall = (callId: number) => {
    const dismissedAt = new Date().toISOString();
    const markDismissed = (list: Call[]) =>
      list.map((call) =>
        call.id === callId ? { ...call, dismissed_at: dismissedAt } : call
      );
    setCalls(markDismissed);
    setAllCalls(markDismissed);
    fetch(`${API_BASE_URL}/calls/${callId}/dismiss`, { method: 'POST' }).catch(
      () => setCallsError('Could not dismiss call')
    );
  };

  const deleteOldCalls = () => {
    fetch(`${API_BASE_URL}/calls/old?days=30`, { method: 'DELETE' })
      .then((res) => res.json())
      .then(() => loadAllCalls())
      .catch(() => setAllCallsError('Could not delete old calls'));
  };

  const confirmDeleteOldCalls = () => {
    Alert.alert(
      'Delete old calls',
      'Delete all calls older than 30 days? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: deleteOldCalls },
      ]
    );
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/status`)
      .then((res) => res.json())
      .then((data) => setStatus(data.mode))
      .catch(() => setError('Could not reach backend'));

    loadCalls();
  }, []);

  // Refresh Recent Calls whenever the app comes back to the foreground
  // (e.g. after backgrounding it to make a phone call). Real-time push
  // updates without reopening the app is a bigger feature for later.
  const appState = useRef(AppState.currentState);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appState.current !== 'active' && nextState === 'active') {
        loadCalls();
      }
      appState.current = nextState;
    });
    return () => subscription.remove();
  }, []);

  const updateStatus = (option: Status) => {
    setStatus(option);
    setError(null);
    fetch(`${API_BASE_URL}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: option }),
    }).catch(() => setError('Could not reach backend'));
  };

  if (view === 'allCalls') {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <StatusBar style="auto" />
        <View style={styles.allCallsHeader}>
          <Pressable onPress={() => setView('home')} hitSlop={8}>
            <Text style={styles.backLink}>{'< Back'}</Text>
          </Pressable>
          <Text style={styles.allCallsTitle}>All Calls</Text>
          <View style={styles.backLinkSpacer} />
        </View>

        <Pressable
          style={styles.deleteOldButton}
          onPress={confirmDeleteOldCalls}
        >
          <Text style={styles.deleteOldButtonText}>
            Delete calls older than 30 days
          </Text>
        </Pressable>

        {allCallsError && <Text style={styles.error}>{allCallsError}</Text>}
        {allCallsLoading && (
          <Text style={styles.emptyText}>Loading...</Text>
        )}
        {!allCallsLoading && !allCallsError && allCalls.length === 0 && (
          <Text style={styles.emptyText}>No calls yet</Text>
        )}
        <View style={styles.callList}>
          {allCalls.map((call) => (
            <CallCard
              key={call.id}
              call={call}
              showDateTime
              onCallBack={callBack}
              onDismiss={dismissCall}
            />
          ))}
        </View>
      </ScrollView>
    );
  }

  if (view === 'contacts') {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <StatusBar style="auto" />
        <View style={styles.allCallsHeader}>
          <Pressable onPress={() => setView('home')} hitSlop={8}>
            <Text style={styles.backLink}>{'< Back'}</Text>
          </Pressable>
          <Text style={styles.allCallsTitle}>Contacts</Text>
          <View style={styles.backLinkSpacer} />
        </View>

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
                style={[
                  styles.chip,
                  newPriority === option && styles.chipActive,
                ]}
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
          {contactsError && <Text style={styles.error}>{contactsError}</Text>}
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
        {contactsLoading && <Text style={styles.emptyText}>Loading...</Text>}
        {!contactsLoading && contacts.length === 0 && (
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <StatusBar style="auto" />
      <Text style={styles.title}>Personal AI Assistant</Text>

      <Text style={styles.label}>Current Status</Text>
      <Text style={styles.status}>{status.toUpperCase()}</Text>
      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.buttonRow}>
        {STATUS_OPTIONS.map((option) => (
          <Pressable
            key={option}
            onPress={() => updateStatus(option)}
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

      <Pressable
        style={styles.manageContactsLink}
        onPress={openContacts}
        hitSlop={8}
      >
        <Text style={styles.viewAllLink}>Manage Contacts</Text>
      </Pressable>

      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Recent Calls</Text>
        <Pressable onPress={openAllCalls} hitSlop={8}>
          <Text style={styles.viewAllLink}>View All Calls</Text>
        </Pressable>
      </View>
      {callsError && <Text style={styles.error}>{callsError}</Text>}
      {!callsError && calls.length === 0 && (
        <Text style={styles.emptyText}>No calls yet</Text>
      )}
      <View style={styles.callList}>
        {calls.map((call) => (
          <CallCard
            key={call.id}
            call={call}
            onCallBack={callBack}
            onDismiss={dismissCall}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 48,
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
    marginBottom: 12,
  },
  error: {
    fontSize: 13,
    color: '#c0392b',
    marginBottom: 20,
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
  sectionTitleRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  viewAllLink: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a5276',
  },
  manageContactsLink: {
    width: '100%',
    alignItems: 'flex-end',
    marginTop: 12,
  },
  allCallsHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  allCallsTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  backLink: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a5276',
  },
  backLinkSpacer: {
    width: 48,
  },
  deleteOldButton: {
    width: '100%',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c0392b',
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteOldButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#c0392b',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    alignSelf: 'flex-start',
  },
  callList: {
    width: '100%',
    gap: 12,
  },
  callCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 14,
    backgroundColor: '#fff',
  },
  callCardDismissed: {
    opacity: 0.5,
  },
  callCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  callNameColumn: {
    flexShrink: 1,
  },
  callName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  callCompany: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  callTime: {
    fontSize: 12,
    color: '#888',
  },
  callReason: {
    fontSize: 14,
    color: '#333',
    marginTop: 6,
  },
  callRecommendation: {
    fontSize: 13,
    color: '#1a5276',
    fontWeight: '500',
    marginTop: 6,
  },
  callMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  callBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flexShrink: 1,
    gap: 8,
    alignItems: 'center',
  },
  decisionBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#444',
    backgroundColor: '#eee',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  decisionBadgeTransfer: {
    color: '#fff',
    backgroundColor: '#1a5276',
  },
  decisionBadgeReject: {
    color: '#fff',
    backgroundColor: '#c0392b',
  },
  callTypeBadge: {
    fontSize: 11,
    fontWeight: '500',
    color: '#444',
    backgroundColor: '#eee',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    textTransform: 'capitalize',
  },
  callPriorityBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    backgroundColor: '#eee',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    textTransform: 'capitalize',
  },
  callPriorityHigh: {
    color: '#fff',
    backgroundColor: '#c0392b',
  },
  callUrgency: {
    fontSize: 12,
    color: '#c0392b',
    fontWeight: '500',
  },
  callStatus: {
    fontSize: 12,
    color: '#888',
    textTransform: 'capitalize',
  },
  callActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  callActionButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#111',
  },
  callActionGhost: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  callActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  callActionGhostText: {
    color: '#444',
  },
  addContactForm: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 14,
    backgroundColor: '#fff',
    marginBottom: 24,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 10,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#444',
    textTransform: 'capitalize',
  },
  chipTextActive: {
    color: '#fff',
  },
  addContactButton: {
    marginTop: 6,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#111',
  },
  contactCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 14,
    backgroundColor: '#fff',
  },
  contactBadgeColumn: {
    gap: 6,
    alignItems: 'flex-end',
  },
  deleteContactLink: {
    fontSize: 13,
    fontWeight: '500',
    color: '#c0392b',
    marginLeft: 12,
  },
});
