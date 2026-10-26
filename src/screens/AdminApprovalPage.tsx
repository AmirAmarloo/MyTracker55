import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfileStore } from '../state/useProfileStore';
import { API_BASE_URL } from '../utils/config';

export default function AdminApprovalPage() {
  const { tenantSchema } = useProfileStore();
  
  const [pendingEntries, setPendingEntries] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [startDateStr, setStartDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (tenantSchema) {
      loadPendingEntries();
      loadUsers();
      loadProjects();
    }
  }, [tenantSchema]);

  // 1. Load pending entries
const loadPendingEntries = async () => {
    try {
      console.log('--- FETCHING PENDING ENTRIES FOR SCHEMA ---:', tenantSchema);
      const res = await fetch(`${API_BASE_URL}/time-entries/pending?tenantSchema=${tenantSchema}`);
      const data = await res.json();
      console.log('--- PENDING ENTRIES RESPONSE ---:', data); // 👈 این خط را اضافه کنید
      
      if (res.ok) {
        setPendingEntries(data.entries || []);
      }
    } catch (error) {
      console.error('Failed to load pending entries:', error);
    }
  };
  
  // 2. Load users list
  const loadUsers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/list?tenantSchema=${tenantSchema}`);
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  // 3. Load projects
  const loadProjects = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/projects/list?tenantSchema=${tenantSchema}`);
      const data = await res.json();
      if (res.ok) {
        let allProjects: any[] = [];
        data.clients?.forEach((c: any) => {
          c.projects?.forEach((p: any) => {
            allProjects.push({ ...p, clientName: c.name });
          });
        });
        setProjects(allProjects);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  // 4. Approve or reject entry
  const handleAction = async (entryId: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`${API_BASE_URL}/time-entries/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSchema,
          entryId,
          status,
        }),
      });

      if (res.ok) {
        Alert.alert('Success', `Entry successfully ${status}.`);
        loadPendingEntries();
      } else {
        Alert.alert('Error', 'Operation failed.');
      }
    } catch (error) {
      Alert.alert('Error', 'Server connection error.');
    }
  };

  // 5. Admin manual entry submission
  const handleAdminSubmit = async () => {
    if (!selectedUserId || !selectedProjectId || !startDateStr || !endDateStr || !note.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    try {
      const startTime = new Date(startDateStr).getTime();
      const endTime = new Date(endDateStr).getTime();

      if (isNaN(startTime) || isNaN(endTime) || endTime <= startTime) {
        Alert.alert('Error', 'Invalid date or time format.');
        return;
      }

      const duration = Math.round((endTime - startTime) / (1000 * 60));
      const selectedProj = projects.find((p) => p.id === selectedProjectId);

      const payload = {
        tenantSchema,
        userId: selectedUserId,
        projectId: selectedProjectId,
        projectName: selectedProj?.name || 'Unknown Project',
        clientName: selectedProj?.clientName || '',
        startTime,
        endTime,
        duration,
        note: note.trim(),
        isAdminAction: true,
      };

      const res = await fetch(`${API_BASE_URL}/time-entries/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        Alert.alert('Success', 'Time entry added and approved successfully.');
        setModalVisible(false);
        setStartDateStr('');
        setEndDateStr('');
        setNote('');
      } else {
        Alert.alert('Error', 'Failed to submit entry.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Server connection error.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🛡️ Admin Approval Panel</Text>
        <TouchableOpacity style={styles.adminActionBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.adminActionText}>+ Manual Entry</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>Pending Requests ({pendingEntries.length})</Text>

        {pendingEntries.length === 0 ? (
          <Text style={styles.emptyText}>No pending entries found.</Text>
        ) : (
          pendingEntries.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.userName}>👤 Employee: {item.userName}</Text>
              <Text style={styles.projectText}>📁 Project: {item.projectName}</Text>
              <Text style={styles.timeText}>
                ⏰ Start: {new Date(item.startTime).toLocaleString()}
              </Text>
              <Text style={styles.timeText}>
                ⏱ End: {new Date(item.endTime).toLocaleString()} ({item.duration} mins)
              </Text>

              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.approveBtn]}
                  onPress={() => handleAction(item.id, 'approved')}
                >
                  <Text style={styles.btnText}>Approve</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn]}
                  onPress={() => handleAction(item.id, 'rejected')}
                >
                  <Text style={styles.btnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Manual Entry Modal for Admin */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Entry for Employee</Text>

            <Text style={styles.label}>Select Employee:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
              {users.map((u) => (
                <TouchableOpacity
                  key={u.id}
                  style={[styles.chip, selectedUserId === u.id && styles.selectedChip]}
                  onPress={() => setSelectedUserId(u.id)}
                >
                  <Text style={[styles.chipText, selectedUserId === u.id && styles.selectedChipText]}>
                    {u.fullName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Select Project:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
              {projects.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.chip, selectedProjectId === p.id && styles.selectedChip]}
                  onPress={() => setSelectedProjectId(p.id)}
                >
                  <Text style={[styles.chipText, selectedProjectId === p.id && styles.selectedChipText]}>
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Start Time (e.g. 2026-06-06T09:00:00):</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD HH:MM"
              value={startDateStr}
              onChangeText={setStartDateStr}
            />

            <Text style={styles.label}>End Time (e.g. 2026-06-06T17:00:00):</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD HH:MM"
              value={endDateStr}
              onChangeText={setEndDateStr}
            />

            <Text style={styles.label}>Note / Reason:</Text>
            <TextInput
              style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
              multiline
              placeholder="Admin note..."
              value={note}
              onChangeText={setNote}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#8E8E93' }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#34C759' }]}
                onPress={handleAdminSubmit}
              >
                <Text style={styles.btnText}>Save & Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#C7C7CC' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
  adminActionBtn: { backgroundColor: '#007AFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  adminActionText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  scroll: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#3A3A3C', marginBottom: 15 },
  emptyText: { color: '#8E8E93', fontStyle: 'italic', textAlign: 'center', marginTop: 30 },
  card: { backgroundColor: '#FFFFFF', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#C7C7CC' },
  userName: { fontSize: 15, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 4 },
  projectText: { fontSize: 13, color: '#3A3A3C', marginBottom: 4 },
  timeText: { fontSize: 12, color: '#666', marginBottom: 2 },
  btnRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  actionBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, marginLeft: 8 },
  approveBtn: { backgroundColor: '#34C759' },
  rejectBtn: { backgroundColor: '#FF3B30' },
  btnText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, maxHeight: '90%' },
  modalTitle: { fontSize: 17, fontWeight: 'bold', marginBottom: 15, color: '#1C1C1E' },
  label: { fontSize: 12, fontWeight: '600', color: '#3A3A3C', marginBottom: 4, marginTop: 8 },
  chipsRow: { flexDirection: 'row', marginBottom: 10 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#F2F2F7', borderRadius: 6, marginRight: 6, borderWidth: 1, borderColor: '#C7C7CC' },
  selectedChip: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  chipText: { fontSize: 12, color: '#333' },
  selectedChipText: { color: '#FFF', fontWeight: 'bold' },
  input: { backgroundColor: '#F2F2F7', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6, fontSize: 13, color: '#1C1C1E', borderWidth: 1, borderColor: '#C7C7CC' },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
});