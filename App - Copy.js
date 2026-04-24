import 'react-native-get-random-values'; 
import React from 'react';
// بقیه کدها...
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { useTimeStore } from './src/state/useTimeStore';

export default function App() {
  const { activeEntry, startEntry, stopActiveEntry, history } = useTimeStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>TimeTracker Pro ⏱️</Text>
        <Text style={styles.subtitle}>Frankfurt - Project Control</Text>
      </View>

      <View style={styles.content}>
        {!activeEntry ? (
          // اگر پروژه فعال نداریم، دکمه شروع نشان داده شود
          <TouchableOpacity 
            style={[styles.button, styles.startBtn]} 
            onPress={() => startEntry("PRJ-ABIDI-001")}
          >
            <Text style={styles.buttonText}>Start Working</Text>
          </TouchableOpacity>
        ) : (
          // اگر پروژه فعال داریم، دکمه پایان نشان داده شود
          <View style={{alignItems: 'center'}}>
            <Text style={styles.timerRunning}>Tracking in Progress...</Text>
            <TouchableOpacity 
              style={[styles.button, styles.stopBtn]} 
              onPress={() => stopActiveEntry()}
            >
              <Text style={styles.buttonText}>Stop & Save</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* نمایش تعداد رکوردهای ثبت شده در تاریخچه */}
        <View style={styles.historyBox}>
          <Text>Total Records Saved: {history.length}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f9' },
  header: { padding: 40, alignItems: 'center', backgroundColor: '#2c3e50' },
  title: { fontSize: 22, color: '#fff', fontWeight: 'bold' },
  subtitle: { color: '#bdc3c7', fontSize: 12 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  button: { width: 200, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  startBtn: { backgroundColor: '#27ae60' },
  stopBtn: { backgroundColor: '#e74c3c' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  timerRunning: { marginBottom: 20, color: '#e67e22', fontWeight: 'bold' },
  historyBox: { marginTop: 50, padding: 10, borderTopWidth: 1, borderColor: '#ddd' }
});