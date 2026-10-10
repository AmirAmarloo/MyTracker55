import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useTimeStore } from '../state/useTimeStore';
import { useProfileStore } from '../state/useProfileStore';

export default function AdminReportsPage() {
  const entries = useTimeStore((state) => state.entries);
  const syncWithBackend = useTimeStore((state) => state.syncWithBackend);
  const clientName = useProfileStore((state) => state.clientName);

  const unSyncedCount = entries.filter((e) => !e.synced).length;

  const handleSync = async () => {
    if (unSyncedCount === 0) {
      Alert.alert('Sync Status', 'All entries are already synced to the database.');
      return;
    }

    await syncWithBackend();
    Alert.alert('Sync Complete', 'Data successfully saved to PostgreSQL database!');
  };

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
        <Text style={styles.cardTitle}>Unsynced Records</Text>
        <Text style={styles.statValue}>{unSyncedCount} Pending</Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.syncButton} onPress={handleSync}>
          <Text style={styles.syncButtonText}>☁️ Sync Entries to Database</Text>
        </TouchableOpacity>

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
  section: { marginTop: 10 },
  syncButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  syncButtonText: { fontSize: 15, fontWeight: 'bold', color: '#fff' },
  actionButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
  },
  actionButtonText: { fontSize: 15, fontWeight: 'bold', color: '#007AFF' },
});