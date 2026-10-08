import React, { useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, Text } from 'react-native';
import QRScanner from '../components/QRScanner';
import { useProfileStore } from '../state/useProfileStore';
import { useProjectStore } from '../state/useProjectStore';

const API_BASE_URL = 'http://172.20.10.12:8000';

export const ActivationScanScreen = () => {
  const [loading, setLoading] = useState(false);
  const isProcessingRef = useRef(false);

  const setActivationProfile = useProfileStore((state) => state.setActivationProfile);
  const setProjects = useProjectStore((state) => state.setProjects);

  const handleScan = async (qrRawData: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setLoading(true);

    try {
      let token = qrRawData.trim();
      try {
        const parsed = JSON.parse(qrRawData);
        token = (parsed.activationToken || qrRawData).trim();
      } catch {
        token = qrRawData.trim();
      }

      const response = await fetch(`${API_BASE_URL}/auth/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activationToken: token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Activation failed');
      }

      // ذخیره پروژه‌ها در Zustand
      setProjects(data.projects);

      // ذخیره پروفایل و تغییر profileStatus به 'active'
      // با این کار App.tsx به طور خودکار صفحه را به MainTabNavigator تغییر می‌دهد
      setActivationProfile({
        clientName: data.clientName,
        tenantSchema: data.tenantSchema,
        authToken: data.authToken,
        role: data.role,
      });

    } catch (error: any) {
      Alert.alert('Activation Error', error.message || 'Invalid QR Code');
      isProcessingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Activating Device...</Text>
          <Text style={styles.subText}>Setting up tenant workspace...</Text>
        </View>
      ) : (
        <QRScanner onScanned={handleScan} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' },
  loadingText: { marginTop: 15, fontSize: 18, fontWeight: 'bold', color: '#007AFF' },
  subText: { marginTop: 5, fontSize: 14, color: '#666' }
});

export default ActivationScanScreen;