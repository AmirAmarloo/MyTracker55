import React from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  projects: Array<{ id: string; name: string }>;
  onSelect: (project: { id: string; name: string }) => void;
}

export const ProjectSelectModal = ({ visible, onClose, projects, onSelect }: Props) => {
  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.title}>Select Project</Text>
          <FlatList
            data={projects}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.item} 
                onPress={() => { onSelect(item); onClose(); }}
              >
                <Text style={styles.itemText}>{item.name}</Text>
                <Text style={styles.itemSubText}>{item.id}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalView: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  item: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemText: { fontSize: 16, fontWeight: '500' },
  itemSubText: { fontSize: 12, color: '#888' },
  closeBtn: { marginTop: 15, padding: 15, alignItems: 'center' },
  closeBtnText: { color: '#007AFF', fontWeight: '600' }
});