import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfileStore } from '../state/useProfileStore';
import { API_BASE_URL } from '../utils/config';

export default function ManualEntryPage() {
  const { tenantSchema, role } = useProfileStore();
  const userId = 'usr_device_user';
  
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedProjectName, setSelectedProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  
  // تاریخ و ساعت‌ها (به صورت ساده برای ورودی متنی یا پیکا)
  const [startDateStr, setStartDateStr] = useState(''); // مثلاً 2026-06-06 09:00
  const [endDateStr, setEndDateStr] = useState('');     // مثلاً 2026-06-06 17:00
  const [note, setNote] = useState('');                 // دلیل ثبت دستی (اجباری)

  // گرفتن لیست پروژه‌ها برای انتخاب
  useEffect(() => {
    fetchProjects();
  }, [tenantSchema]);

  const fetchProjects = async () => {
    if (!tenantSchema) return;
    try {
      const response = await fetch(`${API_BASE_URL}/projects/list?tenantSchema=${tenantSchema}`);
      if (response.ok) {
        const data = await response.json();
        // استخراج پروژه‌ها از لیست مشتریان
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

  const handleSelectProject = (proj: any) => {
    setSelectedProjectId(proj.id);
    setSelectedProjectName(proj.name);
    setClientName(proj.clientName || '');
  };

  const handleSubmitManualEntry = async () => {
    if (!selectedProjectId || !startDateStr || !endDateStr || !note.trim()) {
      Alert.alert('خطا', 'لطفاً پروژه، بازه زمانی و دلیل ثبت دستی را وارد کنید.');
      return;
    }

    try {
      // تبدیل تاریخ‌های متنی به Timestamp (میلی‌ثانیه)
      const startTime = new Date(startDateStr).getTime();
      const endTime = new Date(endDateStr).getTime();

      if (isNaN(startTime) || isNaN(endTime) || endTime <= startTime) {
        Alert.alert('خطا', 'فرمت تاریخ یا ساعت نامعتبر است.');
        return;
      }

      const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));

      const payload = {
        tenantSchema,
        userId: userId || 'usr_default',
        projectId: selectedProjectId,
        projectName: selectedProjectName,
        clientName: clientName,
        startTime,
        endTime,
        duration: durationMinutes,
        note: note.trim(),
      };

      const response = await fetch(`${API_BASE_URL}/time-entries/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        Alert.alert('موفقیت', 'درخواست ثبت دستی با موفقیت ارسال شد و در انتظار تایید ادمین است.');
        setStartDateStr('');
        setEndDateStr('');
        setNote('');
      } else {
        Alert.alert('خطا', 'ثبت درخواست با شکست مواجه شد.');
      }
    } catch (error: any) {
      Alert.alert('خطا', error.message || 'مشکل در ارتباط با سرور.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>✍️ ثبت دستی زمان کارکرد</Text>
        <Text style={styles.subtitle}>برای مواردی که فراموش کرده‌اید تایمر را روشن کنید</Text>

        {/* انتخاب پروژه */}
        <Text style={styles.label}>انتخاب پروژه:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
          {projects.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.chip, selectedProjectId === p.id && styles.selectedChip]}
              onPress={() => handleSelectProject(p)}
            >
              <Text style={[styles.chipText, selectedProjectId === p.id && styles.selectedChipText]}>
                {p.name} ({p.clientName})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* تاریخ و ساعت شروع */}
        <Text style={styles.label}>زمان شروع (مثلاً: 2026-06-06T09:00:00):</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD HH:MM"
          placeholderTextColor="#8E8E93"
          value={startDateStr}
          onChangeText={setStartDateStr}
        />

        {/* تاریخ و ساعت پایان */}
        <Text style={styles.label}>زمان پایان (مثلاً: 2026-06-06T17:00:00):</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD HH:MM"
          placeholderTextColor="#8E8E93"
          value={endDateStr}
          onChangeText={setEndDateStr}
        />

        {/* دلیل ثبت دستی (اجباری) */}
        <Text style={styles.label}>دلیل ثبت دستی (توضیحات):</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          placeholder="مثلاً: قطع اینترنت یا فراموشی در شروع کار..."
          placeholderTextColor="#8E8E93"
          multiline
          value={note}
          onChangeText={setNote}
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmitManualEntry}>
          <Text style={styles.submitButtonText}>ارسال برای تایید ادمین</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  scroll: { padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#8E8E93', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#3A3A3C', marginBottom: 6, marginTop: 10 },
  chipsRow: { flexDirection: 'row', marginBottom: 15 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#FFFFFF', borderRadius: 8, marginRight: 8, borderWidth: 1, borderColor: '#C7C7CC' },
  selectedChip: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  chipText: { fontSize: 13, color: '#333333' },
  selectedChipText: { color: '#FFFFFF', fontWeight: 'bold' },
  input: { backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, fontSize: 14, color: '#1C1C1E', borderWidth: 1, borderColor: '#C7C7CC' },
  submitButton: { backgroundColor: '#34C759', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 25 },
  submitButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
});