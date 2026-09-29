import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTimeStore } from '../state/useTimeStore';
import { formatDurationHHMM } from '../helpers/timeFormatter';
import { ProjectSelectModal } from '../components/ProjectSelectModal';
import { useProjectStore } from '../state/useProjectStore'; 
import { useProfileStore } from '../state/useProfileStore';

const TimerPage = () => {
  // ۱. نام‌های دقیق توابع موجود در useTimeStore شما
  const { activeEntry, startEntry, stopActiveEntry } = useTimeStore();
  const [elapsed, setElapsed] = useState(0);

  // ۲. اکشن‌های useProjectStore
  const projects = useProjectStore((state) => state.projects) || [];
  const selectedProject = useProjectStore((state) => state.selectedProject);
  const setSelectedProject = useProjectStore((state) => state.setSelectedProject);

  // ۳. اطلاعات شرکت
  const clientName = useProfileStore((state) => state.clientName);

  const [modalVisible, setModalVisible] = useState(false);

  // به‌روزرسانی ثانیه‌شمار تایمر (تایپ اصلاح شده برای React Native)
  useEffect(() => {
    let interval: any;
    if (activeEntry) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - activeEntry.startTime) / 1000));
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [activeEntry]);

  const handleStartPress = () => {
    if (!selectedProject) {    
      setModalVisible(true);
      return;
    }

    if (typeof startEntry === 'function') {
      startEntry(
        selectedProject.id, 
        selectedProject.name, 
        clientName || selectedProject.clientName || "General"
      );
    } else {
      console.error("CRITICAL: startEntry is undefined on useTimeStore!");
      Alert.alert("Error", "Time store action not initialized correctly.");
    }
  };

  return (
    <View style={styles.container}>
      {/* نمایش پروژه انتخاب شده */}
      <TouchableOpacity 
        onPress={() => {
          if (activeEntry) {
            Alert.alert(
              "Timer läuft",
              "Bitte stoppen Sie zuerst den aktuellen Timer, bevor Sie das Projekt ändern." 
            );
          } else {
            setModalVisible(true);
          }
        }} 
        style={[
          styles.projectInfoContainer,
          !!activeEntry && { opacity: 0.5 } 
        ]}
      >
        <Text style={styles.projectLabel}>Selected Project:</Text>
        <Text style={styles.projectNameDisplay}>
          {selectedProject ? selectedProject.name : "None - Please Select"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.timerTitle}>Current Session</Text>
      
      {/* دایره نمایش تایمر */}
      <View style={styles.timerCircle}>
        <Text style={styles.timerText}>
          {activeEntry ? formatDurationHHMM(elapsed) : "00:00"}
        </Text>
        {activeEntry && <Text style={styles.secondsText}>{elapsed % 60}s</Text>}
      </View>

      {/* مدال انتخاب پروژه */}
      <ProjectSelectModal 
        visible={modalVisible} 
        projects={projects} 
        onClose={() => setModalVisible(false)}
        onSelect={(p: any) => setSelectedProject(p)}
      />

      {/* دکمه شروع و ثبت تایمر */}
      {!activeEntry ? (
        <TouchableOpacity 
          style={[styles.button, styles.startBtn]} 
          onPress={handleStartPress}
        >
          <Text style={styles.buttonText}>Start Timer</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={[styles.button, styles.stopBtn]} 
          onPress={stopActiveEntry}
        >
          <Text style={styles.buttonText}>Stop & Save</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  timerTitle: { fontSize: 20, color: '#666', marginBottom: 20 },
  timerCircle: {
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 8,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: 40,
  },
  timerText: { fontSize: 48, fontWeight: 'bold', color: '#333' },
  secondsText: { fontSize: 18, color: '#007AFF', position: 'absolute', bottom: 60 },
  button: { paddingVertical: 15, paddingHorizontal: 60, borderRadius: 30, elevation: 5 },
  startBtn: { backgroundColor: '#28a745' },
  stopBtn: { backgroundColor: '#dc3545' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  projectLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  projectInfoContainer: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 12,
    width: '90%',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  projectNameDisplay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },  
});

export default TimerPage;