import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTimeStore } from '../state/useTimeStore';
import { useProfileStore } from '../state/useProfileStore';
import { useProjectStore } from '../state/useProjectStore';
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

  const now = new Date();

  // ۱. محاسبه مجموع هفته جاری 
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
  startOfWeek.setHours(0, 0, 0, 0);

  const weeklyMinutes = entries
    .filter(e => new Date(e.startTime) >= startOfWeek)
    .reduce((sum, e) => sum + (e.duration || 0), 0);

  // ۲. محاسبه مجموع ماه جاری
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyMinutes = entries
    .filter(e => new Date(e.startTime) >= startOfMonth)
    .reduce((sum, e) => sum + (e.duration || 0), 0);

  const filteredEntries = entries.filter(entry => {
    const entryDate = new Date(entry.startTime).toDateString();
    const targetDate = selectedDate.toDateString();
    return entryDate === targetDate;
  });

  const [showDetails, setShowDetails] = useState(false);
  const totalDayMinutes = filteredEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);

const handleLogoutPress = () => {
  Alert.alert(
    "Logout", 
    "Are you sure? All data for this user will be cleared.", 
    [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Yes, Reset", 
        style: "destructive", 
        onPress: () => {
          clearProfile();
          clearProjects();
          useTimeStore.setState({ entries: [], activeEntry: null });
        } 
      }
    ]
  );
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
        
        {/* هدر تاریخ */}
        <View style={styles.dateHeader}>
          <TouchableOpacity onPress={() => {
            const prev = new Date(selectedDate);
            prev.setDate(prev.getDate() - 1);
            setSelectedDate(prev);
          }}>
            <Text style={styles.arrow}>◀</Text>
          </TouchableOpacity>

          <Text style={styles.dateTitle}>
            {selectedDate.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}
          </Text>

          <TouchableOpacity onPress={() => {
            const next = new Date(selectedDate);
            next.setDate(next.getDate() + 1);
            setSelectedDate(next);
          }}>
            <Text style={styles.arrow}>▶</Text>
          </TouchableOpacity>
        </View>

        {/* بخش خلاصه */}
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
              {showDetails ? "▲ Hide Details" : "▼ Show Detailed Logs"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* لیست جزئیات */}
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
                        <Text style={styles.projectTagText} numberOfLines={1} ellipsizeMode="tail">
                          {item.clientName || "No Client"}
                        </Text>
                      </View>
                      <Text style={styles.projectNameText} numberOfLines={1}>
                        {item.projectName}
                      </Text>
                    </View>
                    <Text style={styles.dateText}>
                      {new Date(item.startTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} 
                      {' - '}
                      {item.endTime ? new Date(item.endTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </Text>
                  </View>
                  <Text style={styles.durationText}>{formatDurationHHMM(item.duration)}</Text>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Keine Einträge.</Text>
              }
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
              <TouchableOpacity 
                style={styles.logoutBtn}
                onPress={handleLogoutPress}
              >
                <Text style={styles.logoutText}>Reset Profile (Logout)</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
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
  entryRow: { 
    padding: 15, 
    borderBottomWidth: 1, 
    borderColor: '#f1f3f5', 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center'
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
    fontSize: 16
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
  arrow: { fontSize: 22, color: '#007AFF', paddingHorizontal: 15 }
});

