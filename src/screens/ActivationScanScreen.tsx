import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useProfileStore } from '../state/useProfileStore';
import { useProjectStore } from '../state/useProjectStore';

const { width } = Dimensions.get('window');
const SCAN_BOX_SIZE = width * 0.7;

export default function ActivationScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const setActivationProfile = useProfileStore((state) => state.setActivationProfile);
  const setProjects = useProjectStore((state) => state.setProjects);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    console.log('--- SCANNED RAW DATA ---:', data);

    try {
      let rawData = data.trim();
      let extractedToken = rawData;

      if (rawData.startsWith('{')) {
        try {
          const parsed = JSON.parse(rawData);
          if (parsed.token) {
            extractedToken = String(parsed.token).trim();
          }
        } catch (e) {
          console.log('JSON Parse Error:', e);
        }
      }

      console.log('--- EXTRACTED TOKEN SENT TO FASTAPI ---:', extractedToken);

      // ⚠️ IP آدرس لپ‌تاپ خود را در شبکه Wi-Fi وارد کنید
      const response = await fetch('http://172.20.10.12:8000/auth/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ token: extractedToken }),
      });

      console.log('--- HTTP STATUS CODE ---:', response.status);

      const responseData = await response.json();
      console.log('--- FASTAPI RESPONSE DATA ---:', responseData);

      if (!response.ok) {
        const errorMessage = typeof responseData.detail === 'string' 
          ? responseData.detail 
          : JSON.stringify(responseData.detail || responseData);
        throw new Error(errorMessage);
      }

      setActivationProfile({
        clientName: responseData.clientName,
        tenantSchema: responseData.tenantSchema,
        authToken: responseData.authToken,
        role: responseData.role || 'admin',
      });

      if (responseData.projects) {
        setProjects(responseData.projects);
      }

      Alert.alert('Success', 'Profile activated successfully!');
    } catch (error: any) {
      console.log('--- ACTIVATION CATCH ERROR ---:', error);
      Alert.alert('Activation Error', error.message || 'Activation failed', [
        { text: 'Try Again', onPress: () => setScanned(false) }
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      <View style={styles.overlay} pointerEvents="box-none">
        <Text style={styles.scanText}>Scan Activation QR Code</Text>
        <View style={styles.scanBox} />
        {scanned && (
          <TouchableOpacity style={styles.btn} onPress={() => setScanned(false)}>
            <Text style={styles.btnText}>Tap to Scan Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000' 
  },
  camera: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  message: { 
    textAlign: 'center', 
    color: '#fff', 
    marginBottom: 20 
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanText: { 
    color: 'white', 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 20 
  },
  scanBox: {
    width: SCAN_BOX_SIZE,
    height: SCAN_BOX_SIZE,
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: 'transparent',
    borderRadius: 16,
    marginBottom: 30,
  },
  btn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});