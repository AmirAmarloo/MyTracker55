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

  // استیت‌های مودال و فرم ثبت‌نام/تولید توکن
  const [modalVisible, setModalVisible] = useState(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'employee'>('employee'); 

  // استیت‌های مودال نمایش توکن خروجی به ادمین
  const [tokenModalVisible, setTokenModalVisible] = useState(false);
  const [generatedToken, setGeneratedToken] = useState('');

  // استخراج پویا‌ی companyId از tenantSchema موجود در استور
  const companyId = tenantSchema ? tenantSchema.replace('tenant_', '').replace(/_/g, '-') : '';

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

  const handleGenerateToken = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter full name.');
      return;
    }

    if (!companyId) {
      Alert.alert('Error', 'Company ID could not be determined from tenant schema.');
      return;
    }

    try {
      const res = await fetch(
        //`${API_BASE_URL}/admin/create-employee-token?company_id=${companyId}&employee_name=${encodeURIComponent(fullName.trim())}`,
        `${API_BASE_URL}/admin/create-employee-token?company_id=${companyId}&employee_name=${encodeURIComponent(fullName.trim())}&role=${role}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const data = await res.json();
      if (res.ok) {
        setModalVisible(false);
        setFullName('');
        setRole('employee');
        
        // نمایش توکن تولیدشده به ادمین
        setGeneratedToken(data.token);
        setTokenModalVisible(true);
        
        loadUsers();
      } else {
        Alert.alert('Error', data.detail || 'Failed to create employee token.');
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
          <Text style={styles.addBtnText}>+ Add Employee</Text>
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
                <Text style={styles.userEmail}>✉️ {u.email || 'Registered via Token'}</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Modal for entering employee full name and role */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Generate Employee Token</Text>

            <Text style={styles.label}>Full Name:</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. John Doe"
              value={fullName}
              onChangeText={setFullName}
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
                onPress={handleGenerateToken}
              >
                <Text style={styles.btnText}>Generate Token</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

      {/* Modal to show generated token to admin */}
      <Modal visible={tokenModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎉 Token Generated Successfully</Text>
            <Text style={styles.label}>Give this activation token to the employee:</Text>
            
            <View style={[styles.input, { backgroundColor: '#E5E5EA', justifyContent: 'center', marginVertical: 10, paddingVertical: 12 }]}>
              <Text style={{ fontWeight: 'bold', color: '#007AFF', textAlign: 'center', fontSize: 16 }}>
                {generatedToken || '---'}
              </Text>
            </View>

            <TouchableOpacity
              style={{ 
                backgroundColor: '#007AFF', 
                marginTop: 15, 
                padding: 12, 
                borderRadius: 8, 
                alignItems: 'center' 
              }}
              onPress={() => setTokenModalVisible(false)}
            >
              <Text style={styles.btnText}>Done</Text>
            </TouchableOpacity>          
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