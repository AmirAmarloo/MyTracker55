import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useProfileStore } from '../state/useProfileStore';
import { API_BASE_URL } from '../utils/config';

export default function ManualEntryPage() {
  const { tenantSchema } = useProfileStore();
  
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  
  // متغیرهای زمان شروع و پایان به‌صورت شیء Date
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 3600000)); // ۱ ساعت بعد به‌صورت پیش‌فرض
  const [note, setNote] = useState('');

  // وضعیت نمایش انتخابگرها
  const [showPicker, setShowPicker] = useState<{
    target: 'start' | 'end' | null;
    mode: 'date' | 'time';
  }>({ target: null, mode: 'date' });

  useEffect(() => {
    if (tenantSchema) {
      loadProjects();
    }
  }, [tenantSchema]);

  const loadProjects = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/projects/list?tenantSchema=${tenantSchema}`);
      const data = await res.json();
      if (res.ok) {
        let allProjects: any[] = [];
        data.clients?.forEach((c: any) => {
          c.projects?.forEach((p: any) => {
            allProjects.push({ ...p, clientName: c.name });
          });
        });
        setProjects(allProjects);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  // تغییر تاریخ/زمان انتخاب شده
  const onChangePicker = (event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setShowPicker({ target: null, mode: 'date' });
      return;
    }

    if (selectedDate) {
      if (showPicker.target === 'start') {
        setStartDate(selectedDate);
      } else if (showPicker.target === 'end') {
        setEndDate(selectedDate);
      }
    }

    // در اندروید پس از انتخاب تاریخ/زمان پیکر بسته می‌شود
    //if (Platform.OS === 'android') {
      setShowPicker({ target: null, mode: 'date' });
    //}
  };

  const handleEmployeeSubmit = async () => {
    if (!selectedProjectId || !note.trim()) {
      Alert.alert('Error', 'Please select a project and provide a note.');
      return;
    }

    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    if (endTime <= startTime) {
      Alert.alert('Error', 'End time must be after start time.');
      return;
    }

    const duration = Math.round((endTime - startTime) / (1000 * 60));
    const selectedProj = projects.find((p) => p.id === selectedProjectId);
    const currentUserId = 'usr_device_user';

    const payload = {
      tenantSchema,
      userId: currentUserId,
      projectId: selectedProjectId,
      projectName: selectedProj?.name || 'Unknown Project',
      clientName: selectedProj?.clientName || '',
      startTime,
      endTime,
      duration,
      note: note.trim(),
      isAdminAction: false, // وضعیت pending ثبت می‌شود
    };

    try {
      const res = await fetch(`${API_BASE_URL}/time-entries/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        Alert.alert('Success', 'Manual entry submitted successfully and waiting for admin approval.');
        setNote('');
        setSelectedProjectId('');
      } else {
        Alert.alert('Error', 'Failed to submit manual entry.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Server connection error.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>✍️ Manual Time Entry</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.label}>Select Project:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
          {projects.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.chip, selectedProjectId === p.id && styles.selectedChip]}
              onPress={() => setSelectedProjectId(p.id)}
            >
              <Text style={[styles.chipText, selectedProjectId === p.id && styles.selectedChipText]}>
                {p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* بخش انتخاب زمان شروع */}
        <Text style={styles.label}>Start Time:</Text>
        <View style={styles.dateTimeRow}>
          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => setShowPicker({ target: 'start', mode: 'date' })}
          >
            <Text style={styles.pickerBtnText}>📅 {startDate.toLocaleDateString()}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => setShowPicker({ target: 'start', mode: 'time' })}
          >
            <Text style={styles.pickerBtnText}>⏰ {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </TouchableOpacity>
        </View>

        {/* بخش انتخاب زمان پایان */}
        <Text style={styles.label}>End Time:</Text>
        <View style={styles.dateTimeRow}>
          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => setShowPicker({ target: 'end', mode: 'date' })}
          >
            <Text style={styles.pickerBtnText}>📅 {endDate.toLocaleDateString()}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => setShowPicker({ target: 'end', mode: 'time' })}
          >
            <Text style={styles.pickerBtnText}>⏰ {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </TouchableOpacity>
        </View>

        {/* نمایش DatePicker هنگام کلیک */}
        {showPicker.target !== null && (
          <DateTimePicker
            value={showPicker.target === 'start' ? startDate : endDate}
            mode={showPicker.mode}
            is24Hour={true}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onChangePicker}
          />
        )}

        <Text style={styles.label}>Note / Description:</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          multiline
          placeholder="What did you work on?"
          value={note}
          onChangeText={setNote}
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleEmployeeSubmit}>
          <Text style={styles.submitBtnText}>Submit for Approval</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { padding: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#C7C7CC' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
  scroll: { padding: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#3A3A3C', marginBottom: 6, marginTop: 12 },
  chipsRow: { flexDirection: 'row', marginBottom: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#FFFFFF', borderRadius: 8, marginRight: 8, borderWidth: 1, borderColor: '#C7C7CC' },
  selectedChip: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  chipText: { fontSize: 13, color: '#333' },
  selectedChipText: { color: '#FFF', fontWeight: 'bold' },
  dateTimeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  pickerBtn: { flex: 0.48, backgroundColor: '#FFFFFF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#C7C7CC', alignItems: 'center' },
  pickerBtnText: { fontSize: 14, color: '#1C1C1E', fontWeight: '500' },
  input: { backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, fontSize: 14, color: '#1C1C1E', borderWidth: 1, borderColor: '#C7C7CC' },
  submitBtn: { backgroundColor: '#34C759', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 30 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});