import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, Text, TouchableOpacity } from 'react-native';
import QRScanner from '../components/QRScanner';
import { useProfileStore } from '../state/useProfileStore';
import { useProjectStore} from '../state/useProjectStore';
import {ProjectState} from '../state/useProjectStore';

const ActivationScanScreen = () => {
const [loading, setLoading] = useState(false);
//  const activateProfile = useProfileStore((state) => state.activateProfile);

/*

const handleScan = (rawString: string) => {
  try {
    const qrData = JSON.parse(rawString);
    console.log("1. QR Scanned Successfully"); // تست مرحله یک

    // فعال‌سازی پروفایل
    useProfileStore.getState().activateProfile({
      userId: qrData.userId,
      companyId: qrData.projects?.[0]?.companyId || "Co-001",
      userName: qrData.userId,
      companyName: qrData.projects?.[0]?.companyName || "Company",
      allowedProjects: qrData.projects?.map((p: any) => p.id) || []
    });

    // 📍 نقطه حساس: اطمینان از ارسال دیتا به استور پروژه
    console.log("2. Sending to Store:", qrData.projects?.length, "projects");
    useProjectStore.getState().syncProjectsFromQR(qrData);

  } catch (error) {
    console.error("QR Error:", error);
  }
};

*/
const handleScan = (rawString: string) => {
  try {
    const qrData = JSON.parse(rawString);
    useProfileStore.getState().activateProfile({
      userId: qrData.userId,
      companyId: qrData.projects?.[0]?.companyId || "Co-001",
      userName: qrData.userName || "User",
      clientName: qrData.projects?.[0]?.clientName || qrData.projects?.[0]?.companyName || "Client",
      allowedProjects: qrData.projects?.map((p: any) => p.id) || []
    });

    const projectStore = useProjectStore.getState() as ProjectState;
    if (projectStore && typeof projectStore.syncProjectsFromQR === 'function') {
      projectStore.syncProjectsFromQR(qrData);
    }

    Alert.alert("Success", "Projects loaded successfully!");
  } catch (error) {
    Alert.alert("Error", "Invalid QR Format");
  }
};

  return (
     <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ marginTop: 10 }}>Activating...</Text>
        </View>
      ) : (
        /* فرستادن تابع به کامپوننت اسکنر */
        <QRScanner onScanned={handleScan} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#fff' 
  }
});

export default ActivationScanScreen;