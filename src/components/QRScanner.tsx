import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

interface QRScannerProps {
  onScanned: (data: string) => void;
}

export default function QRScanner({ onScanned }: QRScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) return <View />; // در حال بارگذاری دسترسی

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    onScanned(data);
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />
      <View style={styles.overlay}>
        <View style={styles.unfocusedContainer}></View>
        <View style={styles.focusedContainer}>
          <View style={styles.focusedMarker} />
        </View>
        <View style={styles.unfocusedContainer}></View>
        <Text style={styles.instructionText}>Align QR Code within the frame</Text>
      </View>
      {scanned && (
        <Button title={'Tap to Scan Again'} onPress={() => setScanned(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'column', justifyContent: 'center' },
  text: { textAlign: 'center', marginBottom: 10 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  unfocusedContainer: { flex: 1, width: '100%', backgroundColor: 'rgba(0,0,0,0.5)' },
  focusedContainer: { width: 250, height: 250, flexDirection: 'row' },
  focusedMarker: { flex: 1, borderWidth: 2, borderColor: '#007AFF', borderRadius: 10 },
  instructionText: { color: 'white', position: 'absolute', bottom: 50, fontSize: 16, fontWeight: 'bold' }
});