import 'react-native-get-random-values';
import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, FlatList } from 'react-native';
import { useTimeStore } from './src/state/useTimeStore';
//import { formatToLocalTime, formatDurationHHMM } from './src/helpers/timeFormatter';
// حتماً نام تابع را داخل { } قرار دهید
import { formatDurationHHMM, formatToLocalTime } from './src/helpers/timeFormatter';

export default function App() {
  const { activeEntry, startEntry, stopActiveEntry, history } = useTimeStore();

const renderLogItem = ({ item }) => (
  <View style={styles.logRow}>
    <View style={styles.logInfo}>
      <Text style={styles.logTime}>
        {formatToLocalTime(item.startTime)} → {item.endTime ? formatToLocalTime(item.endTime) : '...'}
      </Text>
      
      {/* تغییر اصلی اینجاست: استفاده از فرمت HH:MM */}
      {item.endTime && (
      <Text style={styles.durationText}>
        {item.endTime 
          ? formatDurationHHMM((item.endTime - item.startTime) / 1000) 
          : "00:00"}
      </Text>
      )}
    </View>
    <View style={[styles.statusIndicator, { backgroundColor: item.endTime ? '#2e7d32' : '#e67e22' }]} />
  </View>
);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>TimeTracker Business 🇩🇪</Text>
        <Text style={styles.subtitle}>Frankfurt Operations</Text>
      </View>

      <View style={styles.content}>
        {!activeEntry ? (
          <TouchableOpacity 
            style={[styles.button, styles.startBtn]} 
            onPress={() => startEntry("PRJ-2026-ABIDI")}
          >
            <Text style={styles.buttonText}>Start Working</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: '100%', alignItems: 'center' }}>
            <TouchableOpacity 
              style={[styles.button, styles.stopBtn]} 
              onPress={() => stopActiveEntry()}
            >
              <Text style={styles.buttonText}>Stop & Save</Text>
            </TouchableOpacity>
            <View style={styles.activeBadge}>
              <Text style={styles.activeText}>Tracking Active...</Text>
            </View>
          </View>
        )}

        <View style={styles.listSection}>
          <Text style={styles.listTitle}>Today's Log</Text>
          <FlatList
            data={history}
            renderItem={renderLogItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={<Text style={styles.emptyText}>No records for today</Text>}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 40, alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 4 },
  content: { flex: 1, padding: 20 },
  
  // استایل دکمه قبلی که دوست داشتید
  button: { 
    width: '100%', 
    height: 60, 
    borderRadius: 12, // حالت کپسولی مدرن
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  startBtn: { backgroundColor: '#007AFF' }, // آبی استاندارد iOS
  stopBtn: { backgroundColor: '#FF3B30' },  // قرمز استاندارد iOS
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  
  activeBadge: { marginTop: 12, paddingVertical: 4, paddingHorizontal: 12, backgroundColor: '#fff3e0', borderRadius: 20 },
  activeText: { color: '#e67e22', fontSize: 12, fontWeight: 'bold' },

  listSection: { flex: 1, marginTop: 40 },
  listTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  logRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#efefef'
  },
  logInfo: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  logTime: { fontSize: 15, color: '#2c3e50', fontWeight: '500' },
  durationText: { fontSize: 15, color: '#888', fontWeight: 'bold' },
  statusIndicator: { width: 4, height: 20, borderRadius: 2, marginLeft: 15 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 30 }
});