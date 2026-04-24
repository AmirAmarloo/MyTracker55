import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTimeStore } from '../state/useTimeStore';
import { formatDurationHHMM } from '../helpers/timeFormatter';
import { ProjectSelectModal } from '../components/ProjectSelectModal';
import { useProjectStore } from '../state/useProjectStore'; 
import { useProfileStore } from '../state/useProfileStore';
 

const TimerPage = () => {
const { activeEntry, startEntry, stopActiveEntry } = useTimeStore();
const [elapsed, setElapsed] = useState(0);
const projects = useProjectStore((state) => state.projects);
const selectedProject = useProjectStore((state) => state.selectedProject);
const selectProject = useProjectStore((state) => state.selectProject);
const [modalVisible, setModalVisible] = useState(false);
const syncProjectsFromQR = useProjectStore((state) => state.syncProjectsFromQR);
const { userId, allowedProjects } = useProfileStore();

/*
useEffect(() => {
  if (allowedProjects && allowedProjects.length > 0) {
    const formattedProjects = allowedProjects.map(name => ({
      id: name,
      name: name
    }));

    // ریختن مستقیم در استور پروژه
    useProjectStore.setState({ 
      projects: formattedProjects, 
      loading: false 
    });
  }
}, [allowedProjects]); // فقط وقتی لیست اسکن شده تغییر کرد، این اجرا شود
*/

useEffect(() => {
  console.log("TEST - Projects in Store:", projects);
}, [projects]);

useEffect(() => {
  console.log("Current Projects in Store:", projects);
}, [projects]);


// به‌روزرسانی ثانیه‌شمار وقتی تایمر فعال است
useEffect(() => {
  let interval: NodeJS.Timeout;
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
    setModalVisible(true); // اگر پروژه انتخاب نشده، اول مدال را باز کن
  } else {
    startEntry(selectedProject.id, selectedProject.name, selectedProject.clientName || "Unknown Client");
    console.log("Timer started for client:", selectedProject.clientName);
  }
};

  return (

    <View style={styles.container}>
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
          activeEntry && { opacity: 0.5 } 
        ]}
      >
        <Text style={styles.projectLabel}>Selected Project:</Text>
        <Text style={styles.projectNameDisplay}>
          {selectedProject ? selectedProject.name : "None - Please Select"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.timerTitle}>Current Session</Text>
      
      <View style={styles.timerCircle}>
        <Text style={styles.timerText}>
          {activeEntry ? formatDurationHHMM(elapsed) : "00:00"}
        </Text>
        {activeEntry && <Text style={styles.secondsText}>{elapsed % 60}s</Text>}
      </View>

      <ProjectSelectModal 
        visible={modalVisible} 
        projects={projects} 
        onClose={() => setModalVisible(false)}
        onSelect={(p: any) => selectProject(p)}
      />

      {!activeEntry ? (
        <TouchableOpacity 
          style={[styles.button, styles.startBtn]} 
          //onPress={() => startEntry('Default Project')}
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
  projectSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    width: '90%',
    alignSelf: 'center',
    // ایجاد سایه ملایم (Shadow)
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  projectLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  projectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
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