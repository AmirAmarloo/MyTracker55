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
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfileStore } from '../state/useProfileStore';
import { API_BASE_URL } from '../utils/config';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { useProjectStore } from '../state/useProjectStore';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AdminApprovalPage() {
  const { tenantSchema } = useProfileStore();
  
  const [pendingEntries, setPendingEntries] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  //const { projects: storeProjects } = useProjectStore();
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [startDateStr, setStartDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');
  const [note, setNote] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 3600000));
  const [showPicker, setShowPicker] = useState<{
    target: 'start' | 'end' | null;
    mode: 'date' | 'time';
  }>({ target: null, mode: 'date' });

  const onChangePicker = (event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setShowPicker({ target: null, mode: 'date' });
      return;
    }
    if (selectedDate) {
      if (showPicker.target === 'start') {
        setStartDate(selectedDate);
      } else if (showPicker.target === 'end') {
        setEndDate(selectedDate);
      }
    }
    setShowPicker({ target: null, mode: 'date' });
  };

// 🌟 هر بار که ادمین وارد این تب می‌شود، داده‌ها به صورت خودکار رفرش می‌شوند
  useFocusEffect(
    useCallback(() => {
      if (tenantSchema) {
        loadPendingEntries();
        loadUsers();
        loadProjects();
      }
    }, [tenantSchema])
  );

  // 1. Load pending entries
const loadPendingEntries = async () => {
    try {
      console.log('--- CURRENT TENANT SCHEMA ---:', tenantSchema);
      const res = await fetch(`${API_BASE_URL}/time-entries/pending?tenantSchema=${tenantSchema}`);
      const data = await res.json();
      console.log('--- FULL API RESPONSE ---:', data); // 👈 خروجی کامل را در کنسول چک کنید
      
      if (res.ok) {
        setPendingEntries(data.entries || []);
        console.log('--- SETTED ENTRIES COUNT ---:', (data.entries || []).length);
      } else {
        console.log('--- API FAILED WITH STATUS ---:', res.status);
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
    // 🌟 بررسی فیلدها با استفاده از startDate و endDate واقعی
    if (!selectedUserId || !selectedProjectId || !startDate || !endDate || !note.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    try {
      const startTime = startDate.getTime();
      const endTime = endDate.getTime();

      if (isNaN(startTime) || isNaN(endTime) || endTime <= startTime) {
        Alert.alert('Error', 'Invalid start or end time. End time must be after start time.');
        return;
      }

      const duration = Math.round((endTime - startTime) / (1000 * 60));
      const selectedProj = projects.find((p) => p.id === selectedProjectId);
      const selectedUser = users.find((u) => u.id === selectedUserId);

      const payload = {
        tenantSchema,
        userId: selectedUserId,
        userName: selectedUser?.fullName || 'Unknown User',
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
        setNote('');
        setSelectedUserId('');
        setSelectedProjectId('');
      } else {
        Alert.alert('Error', 'Failed to submit entry.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Server connection error.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadPendingEntries(),
        loadUsers(),
       // loadProjects()
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  };
  
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedUserForAssign, setSelectedUserForAssign] = useState<string>('');
  const [assignedProjectIds, setAssignedProjectIds] = useState<string[]>([]);
  // دریافت پروژه‌های انتساب‌داده شده به کاربر انتخاب‌شده
  const fetchAssignedProjectsForUser = async (userId: string) => {
    setSelectedUserForAssign(userId);
    try {
      const res = await fetch(`${API_BASE_URL}/projects/assigned-list?tenantSchema=${tenantSchema}&userId=${userId}&isAdmin=false`);
      const data = await res.json();
      if (res.ok) {
        // فرض بر این است که سرور لیست پروژه‌های کاربر را برمی‌گرداند
        const ids = data.projects.map((p: any) => p.id);
        setAssignedProjectIds(ids);
      }
    } catch (error) {
      console.error('Failed to load user projects:', error);
    }
  };

  // ثبت یا تغییر انتساب پروژه
  const handleToggleProjectAssignment = async (projectId: string) => {
    if (!selectedUserForAssign) {
      Alert.alert('Error', 'Please select an employee first.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/projects/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSchema,
          userId: selectedUserForAssign,
          projectId: projectId,
        }),
      });

      if (res.ok) {
        // به‌روزرسانی محلی لیست تیک‌ها
        if (assignedProjectIds.includes(projectId)) {
          setAssignedProjectIds(assignedProjectIds.filter(id => id !== projectId));
        } else {
          setAssignedProjectIds([...assignedProjectIds, projectId]);
        }
      } else {
        Alert.alert('Error', 'Failed to update assignment.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Server connection error.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🛡️ Admin Approval Panel</Text>
        <TouchableOpacity style={styles.adminActionBtn} onPress={() => 
        {
          loadProjects();
          loadUsers();
          setModalVisible(true)
        }}
          >
          <Text style={styles.adminActionText}>+ Manual Entry</Text>
        </TouchableOpacity>
        
      </View>

      <View style={styles.header}>
      {/* دکمه باز کردن مدیریت دسترسی پروژه‌ها */}
        <TouchableOpacity 
          style={styles.manageProjectsBtn} 
          onPress={() => setAssignModalVisible(true)}
        >
          <Text style={styles.manageProjectsBtnText}>⚙️ Manage User Projects</Text>
        </TouchableOpacity>
      </View>


      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
        }
      >
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
      {/* Manual Entry Modal for Admin */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              <Text style={styles.modalTitle}>Add Entry for Employee</Text>

              {/* ۱. انتخاب کارمند */}
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

              {/* انتخاب پروژه */}
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

              {/* ۲. انتخاب زمان شروع با DateTimePicker */}
              <Text style={styles.label}>Start Time:</Text>
              <View style={styles.dateTimeRow}>
                <TouchableOpacity
                  style={styles.pickerBtn}
                  onPress={() => setShowPicker({ target: 'start', mode: 'date' })}
                >
                  <Text style={styles.pickerBtnText}>📅 {startDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pickerBtn}
                  onPress={() => setShowPicker({ target: 'start', mode: 'time' })}
                >
                  <Text style={styles.pickerBtnText}>⏰ {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </TouchableOpacity>
              </View>

              {/* انتخاب زمان پایان با DateTimePicker */}
              <Text style={styles.label}>End Time:</Text>
              <View style={styles.dateTimeRow}>
                <TouchableOpacity
                  style={styles.pickerBtn}
                  onPress={() => setShowPicker({ target: 'end', mode: 'date' })}
                >
                  <Text style={styles.pickerBtnText}>📅 {endDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pickerBtn}
                  onPress={() => setShowPicker({ target: 'end', mode: 'time' })}
                >
                  <Text style={styles.pickerBtnText}>⏰ {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </TouchableOpacity>
              </View>

              {/* نمایش DatePicker */}
              {showPicker.target !== null && (
                <DateTimePicker
                  value={showPicker.target === 'start' ? startDate : endDate}
                  mode={showPicker.mode}
                  is24Hour={true}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onChangePicker}
                />
              )}

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
            </ScrollView>
          </View>
        </View>
      </Modal>

{/* Modal for Assigning Projects to Users */}
      <Modal visible={assignModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              <Text style={styles.modalTitle}>Assign Projects to Employee</Text>

              {/* انتخاب کارمند */}
              <Text style={styles.label}>Select Employee:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
                {users.map((u) => (
                  <TouchableOpacity
                    key={u.id}
                    style={[styles.chip, selectedUserForAssign === u.id && styles.selectedChip]}
                    onPress={() => fetchAssignedProjectsForUser(u.id)}
                  >
                    <Text style={[styles.chipText, selectedUserForAssign === u.id && styles.selectedChipText]}>
                      {u.fullName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* لیست پروژه‌ها با قابلیت انتخاب/لغو */}
              <Text style={styles.label}>Projects (Tap to toggle access):</Text>
              {projects.map((p) => {
                const isAssigned = assignedProjectIds.includes(p.id);
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.projectRowItem, isAssigned && styles.projectRowItemActive]}
                    onPress={() => handleToggleProjectAssignment(p.id)}
                  >
                    <Text style={[styles.projectRowText, isAssigned && styles.projectRowTextActive]}>
                      {isAssigned ? '✅ ' : '⬜️ '} {p.name} ({p.clientName})
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#8E8E93', marginTop: 20 }]}
                onPress={() => setAssignModalVisible(false)}
              >
                <Text style={styles.btnText}>Done / Close</Text>
              </TouchableOpacity>
            </ScrollView>
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
  dateTimeRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  pickerBtn: { 
    flex: 0.48, 
    backgroundColor: '#F2F2F7', 
    padding: 10, 
    borderRadius: 6, 
    borderWidth: 1, 
    borderColor: '#C7C7CC', 
    alignItems: 'center' 
  },
  pickerBtnText: { 
    fontSize: 12, 
    color: '#1C1C1E', 
    fontWeight: '500' 
  },

manageProjectsBtn: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  manageProjectsBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  projectRowItem: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7C7CC',
    marginBottom: 8,
  },
  projectRowItemActive: {
    backgroundColor: '#E8F2FF',
    borderColor: '#007AFF',
  },
  projectRowText: {
    fontSize: 14,
    color: '#333333',
  },
  projectRowTextActive: {
    fontWeight: '600',
    color: '#007AFF',
  },  
});