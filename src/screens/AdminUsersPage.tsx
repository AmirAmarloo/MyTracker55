import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfileStore } from '../state/useProfileStore';
import { API_BASE_URL } from '../utils/config';

export default function AdminUsersPage() {
  const { tenantSchema } = useProfileStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal states for adding user
  const [modalVisible, setModalVisible] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'employee' | 'admin'>('employee');

  useEffect(() => {
    if (tenantSchema) {
      loadUsers();
    }
  }, [tenantSchema]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/users/list?tenantSchema=${tenantSchema}`);
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!fullName.trim() || !email.trim()) {
      Alert.alert('Error', 'Please enter full name and email.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/users/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSchema,
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          role,
        }),
      });

      if (res.ok) {
        Alert.alert('Success', 'User added successfully.');
        setModalVisible(false);
        setFullName('');
        setEmail('');
        setRole('employee');
        loadUsers();
      } else {
        const errData = await res.json();
        Alert.alert('Error', errData.detail || 'Failed to create user.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Server connection error.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>👥 User & Role Management</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Add User</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.sectionTitle}>Tenant Employees & Admins ({users.length})</Text>

          {users.length === 0 ? (
            <Text style={styles.emptyText}>No users found in this schema.</Text>
          ) : (
            users.map((u) => (
              <View key={u.id} style={styles.card}>
                <View style={styles.cardRow}>
                  <Text style={styles.userName}>{u.fullName}</Text>
                  <Text
                    style={[
                      styles.roleBadge,
                      u.role === 'admin' ? styles.adminBadge : styles.employeeBadge,
                    ]}
                  >
                    {u.role.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.userEmail}>✉️ {u.email}</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Modal for adding new user */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New User</Text>

            <Text style={styles.label}>Full Name:</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. John Doe"
              value={fullName}
              onChangeText={setFullName}
            />

            <Text style={styles.label}>Email Address:</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. john@company.de"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>Role:</Text>
            <View style={styles.roleToggleRow}>
              <TouchableOpacity
                style={[styles.roleOption, role === 'employee' && styles.selectedRole]}
                onPress={() => setRole('employee')}
              >
                <Text style={[styles.roleOptionText, role === 'employee' && styles.selectedRoleText]}>
                  Employee
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleOption, role === 'admin' && styles.selectedRole]}
                onPress={() => setRole('admin')}
              >
                <Text style={[styles.roleOptionText, role === 'admin' && styles.selectedRoleText]}>
                  Admin
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#8E8E93' }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#34C759' }]}
                onPress={handleAddUser}
              >
                <Text style={styles.btnText}>Save User</Text>
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
  title: { fontSize: 17, fontWeight: 'bold', color: '#1C1C1E' },
  addBtn: { backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  addBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#3A3A3C', marginBottom: 12 },
  emptyText: { color: '#8E8E93', fontStyle: 'italic', textAlign: 'center', marginTop: 30 },
  card: { backgroundColor: '#FFFFFF', padding: 15, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#C7C7CC' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  userName: { fontSize: 15, fontWeight: 'bold', color: '#1C1C1E' },
  userEmail: { fontSize: 13, color: '#666' },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, fontSize: 10, fontWeight: 'bold' },
  adminBadge: { backgroundColor: '#FF3B30', color: '#FFF' },
  employeeBadge: { backgroundColor: '#007AFF', color: '#FFF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 17, fontWeight: 'bold', marginBottom: 15, color: '#1C1C1E' },
  label: { fontSize: 12, fontWeight: '600', color: '#3A3A3C', marginBottom: 4, marginTop: 10 },
  input: { backgroundColor: '#F2F2F7', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6, fontSize: 13, color: '#1C1C1E', borderWidth: 1, borderColor: '#C7C7CC' },
  roleToggleRow: { flexDirection: 'row', marginTop: 5, gap: 10 },
  roleOption: { flex: 1, padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#C7C7CC', alignItems: 'center', backgroundColor: '#F2F2F7' },
  selectedRole: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  roleOptionText: { fontSize: 13, color: '#333' },
  selectedRoleText: { color: '#FFF', fontWeight: 'bold' },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 10 },
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
});