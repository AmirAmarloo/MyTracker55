import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useTimeStore } from '../state/useTimeStore';
import { useProfileStore } from '../state/useProfileStore';
import { formatDurationHHMM } from '../helpers/timeFormatter';
import { API_BASE_URL } from '../utils/config';

//const API_BASE_URL = 'http://172.20.10.12:8000';

export default function AdminReportsPage() {
  const entries = useTimeStore((state) => state.entries);
  const syncWithBackend = useTimeStore((state) => state.syncWithBackend);
  const clientName = useProfileStore((state) => state.clientName);
  const tenantSchema = useProfileStore((state) => state.tenantSchema);

  const [isLoading, setIsLoading] = useState(false);
  const [dbReport, setDbReport] = useState<any>(null);

  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);

  const unSyncedCount = entries.filter((e) => !e.synced).length;

  const fetchMonthlyReport = async () => {
    if (!tenantSchema) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/monthly-report?tenantSchema=${tenantSchema}&year=${selectedYear}&month=${selectedMonth}`
      );
      if (response.ok) {
        const data = await response.json();
        setDbReport(data);
      }
    } catch (e) {
      console.error('Failed to fetch monthly report from DB:', e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMonthlyReport();
  }, [selectedYear, selectedMonth, tenantSchema]);

  const handleSync = async () => {
    if (unSyncedCount === 0) {
      Alert.alert('Sync Status', 'All entries are already synced to the database.');
      return;
    }

    await syncWithBackend();
    Alert.alert('Sync Complete', 'Data successfully saved to PostgreSQL database!');
    fetchMonthlyReport(); // بروزرسانی گزارش پس از سینک
  };

  const handleExportCSV = async () => {
    if (!dbReport || (dbReport.entries?.length === 0 && dbReport.absences?.length === 0)) {
      Alert.alert('No Data', 'There are no recorded time entries for this month to export.');
      return;
    }

    try {
      let csvContent = 'Type,Date,Client,Project,Start Time,End Time,Duration (Minutes),Note/Status\n';

      // افزودن کارهای ثبت‌شده
      dbReport.entries.forEach((item: any) => {
        const entryDate = new Date(parseInt(item.startTime)).toLocaleDateString('de-DE');
        const startTimeStr = new Date(parseInt(item.startTime)).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        const endTimeStr = item.endTime ? new Date(parseInt(item.endTime)).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : 'N/A';
        const durationMin = item.durationMinutes || 0;

        const cleanClient = (item.clientName || clientName || 'General').replace(/,/g, ' ');
        const cleanProject = (item.projectName || 'Project').replace(/,/g, ' ');

        csvContent += `"Work","${entryDate}","${cleanClient}","${cleanProject}","${startTimeStr}","${endTimeStr}",${durationMin},"Synced"\n`;
      });

      // افزودن مرخصی‌ها و استعلاجی‌ها به فایل CSV
      dbReport.absences.forEach((abs: any) => {
        csvContent += `"Absence","${abs.startDate} to ${abs.endDate}","-","-","-","-",0,"${abs.absenceType.toUpperCase()}"\n`;
      });

      const fileName = `MonthlyAuditReport_${selectedYear}_${selectedMonth}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Monthly Audit Report',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert('Export Success', `File saved to: ${fileUri}`);
      }
    } catch (error: any) {
      Alert.alert('Export Error', error.message || 'Failed to generate CSV report.');
    }
  };

  // محاسبه مجموع زمان کارکرد ماه از دیتابیس
  const totalMonthMinutes = dbReport?.entries?.reduce(
    (sum: number, entry: any) => sum + (entry.durationMinutes || 0),
    0
  ) || 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={styles.header}>
          <Text style={styles.companyTitle}>{clientName || 'Tenant Account'}</Text>
          <Text style={styles.badge}>ADMIN DASHBOARD & AUDIT</Text>
        </View>

        {/* انتخابگر ماه و سال */}
        <View style={styles.filterCard}>
          <Text style={styles.filterLabel}>Report Period:</Text>
          <View style={styles.periodSelector}>
            <TouchableOpacity
              style={styles.periodButton}
              onPress={() => {
                if (selectedMonth > 1) setSelectedMonth(selectedMonth - 1);
                else {
                  setSelectedMonth(12);
                  setSelectedYear(selectedYear - 1);
                }
              }}
            >
              <Text style={styles.periodArrow}>◀ Prev</Text>
            </TouchableOpacity>

            <Text style={styles.periodText}>
              {selectedMonth.toString().padStart(2, '0')} / {selectedYear}
            </Text>

            <TouchableOpacity
              style={styles.periodButton}
              onPress={() => {
                if (selectedMonth < 12) setSelectedMonth(selectedMonth + 1);
                else {
                  setSelectedMonth(1);
                  setSelectedYear(selectedYear + 1);
                }
              }}
            >
              <Text style={styles.periodArrow}>Next ▶</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* کارت‌های آماری */}
        <View style={styles.statsRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.cardTitle}>Unsynced Records</Text>
            <Text style={styles.statValue}>{unSyncedCount} Pending</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: '#34C759' }]}>
            <Text style={styles.cardTitle}>Month Work Time</Text>
            <Text style={styles.statValue}>{formatDurationHHMM(totalMonthMinutes)}</Text>
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#007AFF" style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.dbInfoContainer}>
            <Text style={styles.dbInfoText}>
              📁 Database Records: {dbReport?.totalEntriesCount || 0} entries, {dbReport?.absences?.length || 0} absences found.
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <TouchableOpacity style={styles.syncButton} onPress={handleSync}>
            <Text style={styles.syncButtonText}>☁️ Sync Entries to Database</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleExportCSV}>
            <Text style={styles.actionButtonText}>📊 Export Monthly Audit Report (CSV)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 20 },
  header: { marginBottom: 15 },
  companyTitle: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a' },
  badge: { fontSize: 11, fontWeight: 'bold', color: '#007AFF', marginTop: 2 },
  filterCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
  },
  filterLabel: { fontSize: 11, fontWeight: '700', color: '#8E8E93', marginBottom: 8, textTransform: 'uppercase' },
  periodSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  periodButton: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#F2F2F7', borderRadius: 8 },
  periodArrow: { fontSize: 13, fontWeight: '600', color: '#007AFF' },
  periodText: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 15 },
  summaryCard: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
  },
  cardTitle: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 'bold' },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginTop: 5 },
  dbInfoContainer: { paddingVertical: 8, marginBottom: 10 },
  dbInfoText: { fontSize: 13, color: '#666', fontStyle: 'italic' },
  section: { marginTop: 5 },
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