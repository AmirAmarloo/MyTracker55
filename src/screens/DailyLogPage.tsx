import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTimeStore } from '../state/useTimeStore';
import { useProfileStore } from '../state/useProfileStore';
import { useProjectStore } from '../state/useProjectStore';
import { useAbsenceStore } from '../state/useAbsenceStore';
import { formatDurationHHMM } from '../helpers/timeFormatter';
import { TimeEntry } from '../state/useTimeStore';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function DailyLogPage() {
  const entries = useTimeStore((state) => state.entries) || [];
  const clearProfile = useProfileStore((state) => state.clearProfile);
  const clearProjects = useProjectStore((state) => state.clearProjects);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { absences, fetchAbsences, submitAbsence } = useAbsenceStore();
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [absenceType, setAbsenceType] = useState<'urlaub' | 'krankheit'>('urlaub');
  
  const [startDateObj, setStartDateObj] = useState<Date>(new Date());
  const [endDateObj, setEndDateObj] = useState<Date>(new Date());
  
  const [absenceNote, setAbsenceNote] = useState('');

  useEffect(() => {
    fetchAbsences();
  }, []);

  const now = new Date();

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
  startOfWeek.setHours(0, 0, 0, 0);

  const weeklyMinutes = entries
    .filter((e) => new Date(e.startTime) >= startOfWeek)
    .reduce((sum, e) => sum + (e.duration || 0), 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyMinutes = entries
    .filter((e) => new Date(e.startTime) >= startOfMonth)
    .reduce((sum, e) => sum + (e.duration || 0), 0);

  const filteredEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.startTime).toDateString();
    const targetDate = selectedDate.toDateString();
    return entryDate === targetDate;
  });

  const currentDayAbsence = absences.find((abs) => {
    const start = new Date(abs.startDate);
    const end = new Date(abs.endDate);
    const current = new Date(selectedDate.toDateString());
    return current >= start && current <= end;
  });

  const [showDetails, setShowDetails] = useState(false);
  const totalDayMinutes = filteredEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);

  const handleLogoutPress = () => {
    Alert.alert(
      'Logout',
      'Are you sure? All data for this user will be cleared.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Reset',
          style: 'destructive',
          onPress: () => {
            clearProfile();
            clearProjects();
            useTimeStore.setState({ entries: [], activeEntry: null });
          },
        },
      ]
    );
  };

  const formatDateString = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleAbsenceSubmit = async () => {
    if (startDateObj > endDateObj) {
      Alert.alert('Error', 'End Date cannot be before Start Date.');
      return;
    }

    const success = await submitAbsence({
      absenceType,
      startDate: formatDateString(startDateObj),
      endDate: formatDateString(endDateObj),
      note: absenceNote,
    });

    if (success) {
      Alert.alert('Success', 'Absence request submitted successfully!');
      setIsAbsenceModalOpen(false);
      setAbsenceNote('');
    } else {
      Alert.alert('Error', 'Failed to submit absence request.');
    }
  };

  const groupedByCompany = filteredEntries.reduce((acc: any, entry: TimeEntry) => {
    const client = entry.clientName || 'General';
    const project = entry.projectName || 'Unknown';

    if (!acc[client]) acc[client] = {};
    acc[client][project] = (acc[client][project] || 0) + (entry.duration || 0);

    return acc;
  }, {});

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
        <View style={styles.dateHeader}>
          <TouchableOpacity
            onPress={() => {
              const prev = new Date(selectedDate);
              prev.setDate(prev.getDate() - 1);
              setSelectedDate(prev);
            }}
          >
            <Text style={styles.arrow}>◀</Text>
          </TouchableOpacity>

          <Text style={styles.dateTitle}>
            {selectedDate.toLocaleDateString('de-DE', {
              weekday: 'short',
              day: '2-digit',
              month: '2-digit',
            })}
          </Text>

          <TouchableOpacity
            onPress={() => {
              const next = new Date(selectedDate);
              next.setDate(next.getDate() + 1);
              setSelectedDate(next);
            }}
          >
            <Text style={styles.arrow}>▶</Text>
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 15, marginBottom: 10 }}>
          <TouchableOpacity
            style={styles.absenceBtn}
            onPress={() => setIsAbsenceModalOpen(true)}
          >
            <Text style={styles.absenceBtnText}>+ Request Absence / Sick Leave</Text>
          </TouchableOpacity>
        </View>

        {currentDayAbsence && (
          <View
            style={[
              styles.absenceBanner,
              currentDayAbsence.absenceType === 'urlaub'
                ? styles.urlaubBanner
                : styles.krankheitBanner,
            ]}
          >
            <Text style={styles.absenceBannerText}>
              {currentDayAbsence.absenceType === 'urlaub'
                ? '🌴 Holiday / Vacation (Urlaub)'
                : '🩺 Sick Leave (Krankheit)'}
            </Text>
            {currentDayAbsence.note ? (
              <Text style={styles.absenceNoteText}>Note: {currentDayAbsence.note}</Text>
            ) : null}
          </View>
        )}

        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Daily Summary</Text>

          {Object.entries(groupedByCompany).map(([company, projects]: [string, any]) => (
            <View key={company} style={{ marginBottom: 10 }}>
              <Text style={styles.companySubHeader}>🏢 {company}</Text>

              {Object.entries(projects).map(([projectName, duration]: [string, any]) => (
                <View key={projectName} style={styles.summaryRow}>
                  <Text style={styles.summaryProjectName}>{projectName}</Text>
                  <Text style={styles.summaryProjectTime}>{formatDurationHHMM(duration)}</Text>
                </View>
              ))}
            </View>
          ))}

          <View style={styles.totalDivider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Today:</Text>
            <Text style={styles.totalValue}>{formatDurationHHMM(totalDayMinutes)}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>This Week</Text>
              <Text style={styles.statValue}>{formatDurationHHMM(weeklyMinutes)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>This Month</Text>
              <Text style={styles.statValue}>{formatDurationHHMM(monthlyMinutes)}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.detailsToggleButton}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setShowDetails(!showDetails);
            }}
          >
            <Text style={styles.toggleButtonText}>
              {showDetails ? '▲ Hide Details' : '▼ Show Detailed Logs'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1 }}>
          {showDetails ? (
            <FlatList
              data={filteredEntries}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.entryRow}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <View style={[styles.projectTag, { maxWidth: 250 }]}>
                        <Text
                          style={styles.projectTagText}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {item.clientName || 'No Client'}
                        </Text>
                      </View>
                      <Text style={styles.projectNameText} numberOfLines={1}>
                        {item.projectName}
                      </Text>
                    </View>
                    <Text style={styles.dateText}>
                      {new Date(item.startTime).toLocaleTimeString('de-DE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' - '}
                      {item.endTime
                        ? new Date(item.endTime).toLocaleTimeString('de-DE', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '--:--'}
                    </Text>
                  </View>
                  <Text style={styles.durationText}>{formatDurationHHMM(item.duration)}</Text>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>Keine Einträge.</Text>}
              ListFooterComponent={
                <TouchableOpacity
                  style={[styles.logoutBtn, { marginTop: 30, marginBottom: 50 }]}
                  onPress={handleLogoutPress}
                >
                  <Text style={styles.logoutText}>Reset Profile (Logout)</Text>
                </TouchableOpacity>
              }
              contentContainerStyle={{ paddingHorizontal: 15 }}
            />
          ) : (
            <View style={{ padding: 20 }}>
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogoutPress}>
                <Text style={styles.logoutText}>Reset Profile (Logout)</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Modal فرم ثبت مرخصی / استعلاجی با DatePicker کامپکت و خوانا */}
      <Modal visible={isAbsenceModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request Absence / Sick Leave</Text>

            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeButton, absenceType === 'urlaub' && styles.selectedType]}
                onPress={() => setAbsenceType('urlaub')}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    absenceType === 'urlaub' && styles.selectedTypeText,
                  ]}
                >
                  🌴 Urlaub
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeButton, absenceType === 'krankheit' && styles.selectedType]}
                onPress={() => setAbsenceType('krankheit')}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    absenceType === 'krankheit' && styles.selectedTypeText,
                  ]}
                >
                  🩺 Krankheit
                </Text>
              </TouchableOpacity>
            </View>

            {/* تاریخ شروع با استایل کامپکت iOS */}
            <View style={styles.dateRow}>
              <Text style={styles.inputLabel}>Start Date:</Text>
              <DateTimePicker
                value={startDateObj}
                mode="date"
                display={Platform.OS === 'ios' ? 'compact' : 'default'}
                themeVariant="light"
                onChange={(event, selectedDate) => {
                  if (selectedDate) setStartDateObj(selectedDate);
                }}
              />
            </View>

            {/* تاریخ پایان با استایل کامپکت iOS */}
            <View style={styles.dateRow}>
              <Text style={styles.inputLabel}>End Date:</Text>
              <DateTimePicker
                value={endDateObj}
                mode="date"
                display={Platform.OS === 'ios' ? 'compact' : 'default'}
                themeVariant="light"
                onChange={(event, selectedDate) => {
                  if (selectedDate) setEndDateObj(selectedDate);
                }}
              />
            </View>

            <Text style={styles.inputLabel}>Note (Optional):</Text>
            <TextInput
              style={styles.input}
              placeholder="Reason or notes..."
              placeholderTextColor="#999"
              value={absenceNote}
              onChangeText={setAbsenceNote}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsAbsenceModalOpen(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.submitButton} onPress={handleAbsenceSubmit}>
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 0,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  absenceBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  absenceBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  absenceBanner: {
    marginHorizontal: 15,
    marginBottom: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  urlaubBanner: {
    backgroundColor: '#E3F2FD',
    borderColor: '#90CAF9',
  },
  krankheitBanner: {
    backgroundColor: '#FFEBEE',
    borderColor: '#EF9A9A',
  },
  absenceBannerText: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#333',
  },
  absenceNoteText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  entryRow: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#f1f3f5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoutBtn: {
    backgroundColor: '#ff3b30',
    padding: 15,
    margin: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dateText: { fontSize: 12, color: '#adb5bd', marginTop: 4 },
  durationText: { fontSize: 18, fontWeight: 'bold', color: '#007AFF' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },
  projectTag: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  projectTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  projectNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginLeft: 10,
    flex: 1,
  },
  summaryContainer: {
    backgroundColor: '#f8f9fa',
    margin: 15,
    padding: 15,
    marginTop: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  summaryTitle: { fontSize: 16, fontWeight: 'bold', color: '#666', marginBottom: 15 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryProjectTime: { fontWeight: '600', color: '#333' },
  totalDivider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#007AFF' },
  detailsToggleButton: {
    marginTop: 15,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#444',
  },
  companySubHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#007AFF',
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 5,
    marginTop: 5,
  },
  toggleButtonText: { color: '#007AFF', fontWeight: 'bold', fontSize: 13 },
  summaryProjectName: { fontWeight: '600', color: '#333' },
  dateTitle: { fontSize: 17, fontWeight: '600', color: '#1a1a1a', letterSpacing: 0.5 },
  arrow: { fontSize: 22, color: '#007AFF', paddingHorizontal: 15 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color: '#1C1C1E' },
  typeSelector: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeButton: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#C7C7CC', alignItems: 'center' },
  selectedType: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  typeButtonText: { fontSize: 14, fontWeight: '600', color: '#1C1C1E' },
  selectedTypeText: { color: '#FFFFFF' },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#3A3A3C' },
  input: { borderWidth: 1, borderColor: '#C7C7CC', borderRadius: 8, padding: 10, marginBottom: 16, fontSize: 14, color: '#1C1C1E' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  cancelButton: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#E5E5EA', alignItems: 'center' },
  cancelButtonText: { color: '#3A3A3C', fontWeight: '600' },
  submitButton: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#34C759', alignItems: 'center' },
  submitButtonText: { color: '#FFFFFF', fontWeight: '600' },
});