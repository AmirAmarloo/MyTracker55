import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useTimeStore } from '../state/useTimeStore';
import { useProfileStore } from '../state/useProfileStore';

export default function AdminReportsPage() {
  const entries = useTimeStore((state) => state.entries);
  const clientName = useProfileStore((state) => state.clientName);

  const totalMinutes = entries.reduce((acc, item) => acc + (item.duration || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  const handleExportCSV = async () => {
    if (entries.length === 0) {
      Alert.alert('No Data', 'There are no recorded time entries to export.');
      return;
    }

    try {
      let csvContent = 'Date,Client,Project,Start Time,End Time,Duration (Minutes),Status\n';

      entries.forEach((item) => {
        const dateStr = new Date(item.startTime).toLocaleDateString('de-DE');
        const startTimeStr = new Date(item.startTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        const endTimeStr = item.endTime ? new Date(item.endTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : 'N/A';
        const durationMin = item.duration || 0;
        const syncStatus = item.synced ? 'Synced' : 'Local';

        const cleanClient = (item.clientName || clientName || 'General').replace(/,/g, ' ');
        const cleanProject = (item.projectName || 'Project').replace(/,/g, ' ');

        csvContent += `"${dateStr}","${cleanClient}","${cleanProject}","${startTimeStr}","${endTimeStr}",${durationMin},"${syncStatus}"\n`;
      });

      const fileName = `TimeReport_${new Date().toISOString().slice(0, 10)}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Time Tracking Report',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert('Export Success', `File saved to: ${fileUri}`);
      }
    } catch (error: any) {
      Alert.alert('Export Error', error.message || 'Failed to generate CSV report.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.companyTitle}>{clientName || 'Tenant Account'}</Text>
        <Text style={styles.badge}>ADMIN DASHBOARD</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Total Tracked Time</Text>
        <Text style={styles.statValue}>{totalHours} Hours</Text>
        <Text style={styles.statSub}>{entries.length} Total Recorded Sessions</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tax & Audit Reports</Text>

        <TouchableOpacity style={styles.actionButton} onPress={handleExportCSV}>
          <Text style={styles.actionButtonText}>📊 Export Monthly Report (CSV)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 20 },
  header: { marginBottom: 20 },
  companyTitle: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a' },
  badge: { fontSize: 11, fontWeight: 'bold', color: '#007AFF', marginTop: 2 },
  summaryCard: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 25,
  },
  cardTitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 'bold' },
  statValue: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginTop: 5 },
  statSub: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 5 },
  section: { marginTop: 10 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#444', marginBottom: 12 },
  actionButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionButtonText: { fontSize: 15, fontWeight: 'bold', color: '#007AFF' },
});