

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTimeStore } from '../state/useTimeStore';
import { useProjectStore } from '../state/useProjectStore';
import { useProfileStore } from '../state/useProfileStore';

export default function TimerPage() {
  const { activeEntry, activeBreak, startEntry, pauseEntry, resumeEntry, stopActiveEntry } = useTimeStore();
  const projects = useProjectStore((state) => state.projects);
  const clientName = useProfileStore((state) => state.clientName);

  // پروژه‌های موجود یا پروژه عمومی پیش‌فرض در صورت خالی بودن استور
  const availableProjects = projects.length > 0 ? projects : [{ id: 'p1', name: 'General Project' }];

  const [selectedProjectId, setSelectedProjectId] = useState<string>(availableProjects[0].id);
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // همگام‌سازی ID پروژه انتخابی هنگام بارگذاری پروژه‌ها از استور
  useEffect(() => {
    if (availableProjects.length > 0) {
      const exists = availableProjects.some((p) => p.id === selectedProjectId);
      if (!exists) {
        setSelectedProjectId(availableProjects[0].id);
      }
    }
  }, [projects]);

  // یافتن پروژه انتخاب‌شده
  const currentProject = availableProjects.find((p) => p.id === selectedProjectId) || availableProjects[0];

  // تایمر زنده
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (activeEntry && !activeBreak) {
      interval = setInterval(() => {
        const now = Date.now();
        const seconds = Math.floor((now - activeEntry.startTime) / 1000);
        setElapsedSeconds(seconds);
      }, 1000);
    } else if (!activeEntry) {
      setElapsedSeconds(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeEntry, activeBreak]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num: number) => String(num).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const handleStart = () => {
    if (!currentProject) {
      Alert.alert('Error', 'Please select a project first.');
      return;
    }
    startEntry(currentProject.id, currentProject.name, clientName || 'Company');
  };

  const handleStop = async () => {
    await stopActiveEntry();
    Alert.alert('Saved & Synced', 'Time entry saved and automatically synced to database!');
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setIsPickerOpen(false);
  };

  const totalWorkMinutes = Math.floor(elapsedSeconds / 60);

  const getArbzgStatus = () => {
    if (totalWorkMinutes >= 600) {
      return {
        type: 'danger',
        message: '⚠️ Maximum daily limit reached (10 Hours - ArbZG §3 Violation)!',
      };
    } else if (totalWorkMinutes >= 540) {
      return {
        type: 'warning',
        message: 'ℹ️ Work exceeds 9 hours: Mandatory 45-minute break required.',
      };
    } else if (totalWorkMinutes >= 360) {
      return {
        type: 'warning',
        message: 'ℹ️ Work exceeds 6 hours: Mandatory 30-minute break required.',
      };
    }
    return null;
  };

  const arbzgNotice = getArbzgStatus();  

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>{clientName || 'Time Tracker'}</Text>

        {/* Combobox انتخابی پروژه (در صورت غیرفعال بودن تایمر) */}
        {!activeEntry ? (
          <View style={styles.projectSection}>
            <Text style={styles.sectionLabel}>Select Project:</Text>
            <TouchableOpacity
              style={styles.comboboxButton}
              onPress={() => setIsPickerOpen(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.comboboxText}>{currentProject.name}</Text>
              <Text style={styles.comboboxArrow}>▼</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.lockedProjectBadge}>
            <Text style={styles.lockedProjectText}>🔒 Working on: {activeEntry.projectName}</Text>
          </View>
        )}


        {arbzgNotice && (
          <View style={[
            styles.noticeBox, 
            arbzgNotice.type === 'danger' ? styles.dangerBox : styles.warningBox
          ]}>
            <Text style={[
              styles.noticeText, 
              arbzgNotice.type === 'danger' ? styles.dangerText : styles.warningText
            ]}>
              {arbzgNotice.message}
            </Text>
          </View>
        )}        

        {/* کارت اصلی تایمر */}
        <View style={styles.card}>
          <Text style={styles.projectLabel}>Active Project</Text>
          <Text style={styles.projectName}>
            {activeEntry ? activeEntry.projectName : currentProject.name}
          </Text>

          <View style={styles.timerContainer}>
            <Text style={[styles.timerText, activeBreak && styles.pausedTimerText]}>
              {formatTime(elapsedSeconds)}
            </Text>
            {activeBreak && <Text style={styles.breakBadge}>PAUSED (BREAK)</Text>}
          </View>

          {!activeEntry ? (
            <TouchableOpacity style={styles.startButton} onPress={handleStart}>
              <Text style={styles.btnText}>▶ Start Work</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.activeControls}>
              {activeBreak ? (
                <TouchableOpacity style={styles.resumeButton} onPress={resumeEntry}>
                  <Text style={styles.btnText}>▶ Resume Work</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.pauseButton} onPress={pauseEntry}>
                  <Text style={styles.btnText}>⏸ Pause (Break)</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
                <Text style={styles.btnText}>⏹ Stop Work</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal منوی کشویی Combobox */}
      <Modal visible={isPickerOpen} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsPickerOpen(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select a Project</Text>
            <FlatList
              data={availableProjects}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.projectOption,
                    item.id === selectedProjectId && styles.selectedProjectOption,
                  ]}
                  onPress={() => handleSelectProject(item.id)}
                >
                  <Text
                    style={[
                      styles.projectOptionText,
                      item.id === selectedProjectId && styles.selectedProjectOptionText,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {item.id === selectedProjectId && <Text style={styles.checkMark}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  scrollContent: { padding: 20 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 20 },
  projectSection: { marginBottom: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#8E8E93', marginBottom: 8, textTransform: 'uppercase' },
  comboboxButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C7C7CC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  comboboxText: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  comboboxArrow: { fontSize: 12, color: '#8E8E93' },
  lockedProjectBadge: {
    backgroundColor: '#E5E5EA',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  lockedProjectText: { fontSize: 14, fontWeight: '600', color: '#555' },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  projectLabel: { fontSize: 12, fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase' },
  projectName: { fontSize: 20, fontWeight: 'bold', color: '#1C1C1E', marginTop: 4, marginBottom: 10 },
  timerContainer: { marginVertical: 15, alignItems: 'center' },
  timerText: { fontSize: 48, fontWeight: '300', color: '#000' },
  pausedTimerText: { color: '#FF9500' },
  breakBadge: {
    backgroundColor: '#FFF3E0',
    color: '#FF9500',
    fontWeight: 'bold',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  startButton: { backgroundColor: '#34C759', paddingVertical: 16, width: '100%', borderRadius: 12, alignItems: 'center' },
  activeControls: { width: '100%', gap: 12 },
  pauseButton: { backgroundColor: '#FF9500', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  resumeButton: { backgroundColor: '#007AFF', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  stopButton: { backgroundColor: '#FF3B30', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    maxHeight: '60%',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#1C1C1E' },
  projectOption: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedProjectOption: { backgroundColor: '#F2F2F7' },
  projectOptionText: { fontSize: 16, color: '#1C1C1E' },
  selectedProjectOptionText: { color: '#007AFF', fontWeight: 'bold' },
  checkMark: { color: '#007AFF', fontWeight: 'bold' },

  noticeBox: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  warningBox: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFE082',
  },
  dangerBox: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2',
  },
  noticeText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  warningText: {
    color: '#B78103',
  },
  dangerText: {
    color: '#C62828',
  },

});