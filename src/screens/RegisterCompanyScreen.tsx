import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfileStore } from '../state/useProfileStore';
import { API_BASE_URL } from '../utils/config';

export default function RegisterCompanyScreen({ navigation }: { navigation: any }) {
  const { setTenantSchema } = useProfileStore(); 
  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!companyName.trim() || !adminName.trim() || !adminEmail.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/auth/register-company`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          adminName: adminName.trim(),
          adminEmail: adminEmail.trim().toLowerCase(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // ذخیره اسکیمای تننت در استور پروفایل
        if (setTenantSchema) {
          setTenantSchema(data.tenantSchema, data.adminId, data.role);
        }

        Alert.alert('Success', 'Company and Admin registered successfully!', [
          {
            text: 'OK',
            onPress: () => {
              // هدایت به صفحه ادمین یا داشبورد اصلی
              // navigation.replace('AdminUsers'); 
            },
          },
        ]);
      } else {
        Alert.alert('Error', data.detail || 'Failed to register company.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>🏢 Register New Company</Text>
            <Text style={styles.subtitle}>Set up your company workspace and admin account</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Company Name:</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Acme GmbH"
              value={companyName}
              onChangeText={setCompanyName}
            />

            <Text style={styles.label}>Admin Full Name:</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Jane Doe"
              value={adminName}
              onChangeText={setAdminName}
            />

            <Text style={styles.label}>Admin Email Address:</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. admin@acme.de"
              autoCapitalize="none"
              keyboardType="email-address"
              value={adminEmail}
              onChangeText={setAdminEmail}
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Register & Initialize</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  scroll: { padding: 20, justifyContent: 'center', flexGrow: 1 },
  headerContainer: { marginBottom: 30, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#8E8E93', textAlign: 'center' },
  formContainer: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  label: { fontSize: 13, fontWeight: '600', color: '#3A3A3C', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#F2F2F7', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, fontSize: 14, color: '#1C1C1E', borderWidth: 1, borderColor: '#C7C7CC' },
  submitBtn: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 25 },
  submitBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
});