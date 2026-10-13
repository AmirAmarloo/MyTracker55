import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfileStore } from '../state/useProfileStore';
import { API_BASE_URL } from '../utils/config';

interface Project {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  totalMinutes?: number; // اضافه شده برای دریافت مجموع کارکرد
}

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  projects: Project[];
}

export default function ProjectsPage() {
  const { tenantSchema } = useProfileStore();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [clients, setClients] = useState<Client[]>([]);

  // States for New Client Form
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientTaxId, setClientTaxId] = useState('');

  // States for New Project Form
  const [selectedClientId, setSelectedClientId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  const fetchData = async () => {
    if (!tenantSchema) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/list?tenantSchema=${tenantSchema}`
      );
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      }
    } catch (e) {
      console.error('Failed to fetch clients and projects:', e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [tenantSchema]);

  // تابع کمکی برای تبدیل دقایق به ساعت و دقیقه
  const formatWorkTime = (totalMinutes?: number) => {
    if (!totalMinutes || totalMinutes === 0) return '0 min';
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const handleCreateClient = async () => {
    if (!clientName.trim()) {
      Alert.alert('Error', 'Please enter a client name.');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/clients/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSchema,
          name: clientName.trim(),
          email: clientEmail.trim() || null,
          phone: clientPhone.trim() || null,
          address: clientAddress.trim() || null,
          taxId: clientTaxId.trim() || null,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Client created successfully!');
        setClientName('');
        setClientEmail('');
        setClientPhone('');
        setClientAddress('');
        setClientTaxId('');
        fetchData();
      } else {
        Alert.alert('Error', 'Failed to create client.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Network request failed.');
    }
  };

  const handleCreateProject = async () => {
    if (!selectedClientId || !projectName.trim()) {
      Alert.alert('Error', 'Please select a client and enter a project name.');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/projects/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSchema,
          clientId: selectedClientId,
          name: projectName.trim(),
          description: projectDescription.trim() || null,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Project created successfully!');
        setProjectName('');
        setProjectDescription('');
        fetchData();
      } else {
        Alert.alert('Error', 'Failed to create project.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Network request failed.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Clients & Projects Management</Text>
        <Text style={styles.subtitle}>Organize enterprise clients, tax details, and projects</Text>

        {/* فرم ایجاد مشتری جدید */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏢 Add New Client</Text>
          <TextInput
            style={styles.input}
            placeholder="Client / Company Name *"
            placeholderTextColor="#8E8E93"
            value={clientName}
            onChangeText={setClientName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#8E8E93"
            value={clientEmail}
            onChangeText={setClientEmail}
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor="#8E8E93"
            value={clientPhone}
            onChangeText={setClientPhone}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Tax ID (USt-IdNr)"
            placeholderTextColor="#8E8E93"
            value={clientTaxId}
            onChangeText={setClientTaxId}
          />
          <TextInput
            style={styles.input}
            placeholder="Address (Street, City, Postal Code)"
            placeholderTextColor="#8E8E93"
            value={clientAddress}
            onChangeText={setClientAddress}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleCreateClient}>
            <Text style={styles.addButtonText}>+ Save Client</Text>
          </TouchableOpacity>
        </View>

        {/* فرم ایجاد پروژه جدید */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📁 Add Project to Client</Text>
          
          <Text style={styles.label}>Select Client:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
            {clients.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[
                  styles.chip,
                  selectedClientId === c.id && styles.selectedChip,
                ]}
                onPress={() => setSelectedClientId(c.id)}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedClientId === c.id && styles.selectedChipText,
                  ]}
                >
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TextInput
            style={styles.input}
            placeholder="Project Name *"
            placeholderTextColor="#8E8E93"
            value={projectName}
            onChangeText={setProjectName}
          />
          <TextInput
            style={styles.input}
            placeholder="Description (Optional)"
            placeholderTextColor="#8E8E93"
            value={projectDescription}
            onChangeText={setProjectDescription}
          />
          <TouchableOpacity style={[styles.addButton, { backgroundColor: '#34C759' }]} onPress={handleCreateProject}>
            <Text style={styles.addButtonText}>+ Save Project</Text>
          </TouchableOpacity>
        </View>

        {/* لیست مشتریان و پروژه‌های ثبت‌شده */}
        <Text style={styles.sectionTitle}>Registered Clients & Projects</Text>

        {isLoading ? (
          <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
        ) : clients.length === 0 ? (
          <Text style={styles.emptyText}>No clients found in database.</Text>
        ) : (
          clients.map((c) => (
            <View key={c.id} style={styles.clientCard}>
              <Text style={styles.clientNameHeader}>🏢 {c.name}</Text>
              {c.taxId ? <Text style={styles.clientDetail}>Tax ID: {c.taxId}</Text> : null}
              {c.email ? <Text style={styles.clientDetail}>Email: {c.email}</Text> : null}
              {c.address ? <Text style={styles.clientDetail}>Address: {c.address}</Text> : null}

              <View style={styles.projectsContainer}>
                <Text style={styles.projectsHeader}>Projects:</Text>
                {c.projects.length === 0 ? (
                  <Text style={styles.noProjectsText}>No projects added yet.</Text>
                ) : (
                  c.projects.map((p) => (
                    <View key={p.id} style={styles.projectRow}>
                      <View style={styles.projectInfoRow}>
                        <Text style={styles.projectName}>🔹 {p.name}</Text>
                        <Text style={styles.projectTimeBadge}>
                          ⏱️ {formatWorkTime(p.totalMinutes)}
                        </Text>
                      </View>
                      {p.description ? <Text style={styles.projectDesc}>{p.description}</Text> : null}
                    </View>
                  ))
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  scrollContent: { padding: 20 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1C1C1E' },
  subtitle: { fontSize: 13, color: '#8E8E93', marginBottom: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1C1C1E', marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', color: '#8E8E93', marginBottom: 6 },
  chipsRow: { flexDirection: 'row', marginBottom: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F2F2F7', borderRadius: 8, marginRight: 8, borderWidth: 1, borderColor: '#E5E5EA' },
  selectedChip: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  chipText: { fontSize: 13, color: '#333333', fontWeight: '500' },
  selectedChipText: { color: '#FFFFFF', fontWeight: 'bold' },
  input: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 14,
    color: '#1C1C1E',
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 5,
  },
  addButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 12 },
  emptyText: { color: '#8E8E93', fontSize: 13, fontStyle: 'italic' },
  clientCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  clientNameHeader: { fontSize: 16, fontWeight: 'bold', color: '#007AFF', marginBottom: 4 },
  clientDetail: { fontSize: 12, color: '#666666', marginBottom: 2 },
  projectsContainer: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#E5E5EA', paddingTop: 8 },
  projectsHeader: { fontSize: 13, fontWeight: '600', color: '#1C1C1E', marginBottom: 4 },
  noProjectsText: { fontSize: 12, color: '#8E8E93', fontStyle: 'italic' },
  projectRow: { paddingVertical: 6, paddingLeft: 4, borderBottomWidth: 0.5, borderBottomColor: '#E5E5EA' },
  projectInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  projectName: { fontSize: 13, fontWeight: '600', color: '#333333' },
  projectTimeBadge: { fontSize: 11, fontWeight: '600', color: '#007AFF', backgroundColor: '#E1F5FE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  projectDesc: { fontSize: 11, color: '#8E8E93', paddingLeft: 16, marginTop: 2 },
});
