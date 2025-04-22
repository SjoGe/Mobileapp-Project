import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { DeviceLimitsContext } from '../DeviceLimitsContext';

export default function HälytysScreen() {
  const { limits, setLimits, visibleDevices, setVisibleDevices } = useContext(DeviceLimitsContext);
  const [localLimits, setLocalLimits] = useState({ ...limits });

  const [newDevice, setNewDevice] = useState('');
  const [newLower, setNewLower] = useState('');
  const [newUpper, setNewUpper] = useState('');

  const handleLimitChange = (device, type, value) => {
    const normalized = value.replace(',', '.');
    const isValidInput = normalized === '' || normalized === '.' || /^(\d+)?(\.\d*)?$/.test(normalized);

    if (isValidInput) {
      setLocalLimits((prev) => ({
        ...prev,
        [device]: {
          ...prev[device],
          [type]: normalized,
        },
      }));
    }
  };

  const getDisplayValue = (val) => (val !== undefined ? val.toString() : '');

  const handleSave = () => {
    const newLimits = {};

    for (const [device, values] of Object.entries(localLimits)) {
      if (device === 'general') continue;
      const lower = parseFloat(values.lower);
      const upper = parseFloat(values.upper);
      if (isNaN(lower) || isNaN(upper)) {
        Alert.alert('Virhe', `Täytä molemmat rajat oikein laitteelle: ${device}`);
        return;
      }
      if (upper <= lower) {
        Alert.alert('Virhe', `Ylärajan täytyy olla suurempi kuin alarajan (${device})`);
        return;
      }
      newLimits[device] = {
        lower: parseFloat(lower.toFixed(1)),
        upper: parseFloat(upper.toFixed(1)),
      };
    }

    const general = parseFloat(localLimits.general);
    if (isNaN(general)) {
      Alert.alert('Virhe', 'Yleinen sähkönhintaraja on virheellinen.');
      return;
    }

    newLimits.general = parseFloat(general.toFixed(1));
    setLimits(newLimits);
    Alert.alert('Tallennettu', 'Kaikki rajat tallennettu onnistuneesti!');
  };

  const handleAddDevice = () => {
    const name = newDevice.trim();
    if (!name) {
      Alert.alert('Virhe', 'Anna laitteen nimi');
      return;
    }

    const lower = parseFloat(newLower.replace(',', '.'));
    const upper = parseFloat(newUpper.replace(',', '.'));

    if (isNaN(lower) || isNaN(upper)) {
      Alert.alert('Virhe', 'Anna kelvolliset rajat');
      return;
    }

    if (upper <= lower) {
      Alert.alert('Virhe', 'Ylärajan täytyy olla suurempi kuin alarajan');
      return;
    }

    if (limits[name]) {
      Alert.alert('Virhe', 'Laite on jo olemassa');
      return;
    }

    const newObj = {
      ...localLimits,
      [name]: { lower: parseFloat(lower.toFixed(1)), upper: parseFloat(upper.toFixed(1)) },
    };

    setLocalLimits(newObj);
    setVisibleDevices((prev) => [...prev, name]);
    setNewDevice('');
    setNewLower('');
    setNewUpper('');
  };

  const handleDeleteDevice = (device) => {
    Alert.alert('Vahvista poisto', `Haluatko varmasti poistaa laitteen "${device}"?`, [
      { text: 'Peruuta', style: 'cancel' },
      {
        text: 'Poista',
        style: 'destructive',
        onPress: () => {
          const updatedLimits = { ...localLimits };
          delete updatedLimits[device];
          setLocalLimits(updatedLimits);
          setVisibleDevices((prev) => prev.filter((d) => d !== device));
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Hälytykset & asetukset</Text>

      {/* Yleinen raja */}
      <View style={styles.deviceBox}>
        <Text style={styles.deviceTitle}>Yleinen sähkönhintaraja</Text>
        <View style={styles.row}>
          <Text>Raja (c/kWh):</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={getDisplayValue(localLimits.general)}
            onChangeText={(text) =>
              setLocalLimits((prev) => ({
                ...prev,
                general: text.replace(',', '.'),
              }))
            }
          />
        </View>
        <View style={styles.row}>
          <Text>Näytä etusivulla</Text>
          <Switch
            value={visibleDevices.includes('general')}
            onValueChange={(val) => {
              setVisibleDevices((prev) =>
                val ? [...prev, 'general'] : prev.filter((d) => d !== 'general')
              );
            }}
          />
        </View>
      </View>

      {/* Laitteet */}
      {Object.entries(localLimits).map(([device, value]) =>
        device !== 'general' ? (
          <View key={device} style={styles.deviceBox}>
            <Text style={styles.deviceTitle}>{device}</Text>
            <View style={styles.row}>
              <Text>Alaraja (c/kWh):</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={getDisplayValue(value.lower)}
                onChangeText={(text) => handleLimitChange(device, 'lower', text)}
              />
            </View>
            <View style={styles.row}>
              <Text>Yläraja (c/kWh):</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={getDisplayValue(value.upper)}
                onChangeText={(text) => handleLimitChange(device, 'upper', text)}
              />
            </View>
            <View style={styles.row}>
              <Text>Näytä etusivulla</Text>
              <Switch
                value={visibleDevices.includes(device)}
                onValueChange={(val) => {
                  setVisibleDevices((prev) =>
                    val ? [...prev, device] : prev.filter((d) => d !== device)
                  );
                }}
              />
            </View>
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteDevice(device)}>
              <Text style={styles.deleteButtonText}>🗑 Poista laite</Text>
            </TouchableOpacity>
          </View>
        ) : null
      )}

      {/* Lisaa uusi laite */}
      <View style={styles.deviceBox}>
        <Text style={styles.deviceTitle}>Lisää uusi laite</Text>
        <TextInput
          style={styles.inputFull}
          placeholder="Laitteen nimi"
          value={newDevice}
          onChangeText={setNewDevice}
        />
        <View style={styles.row}>
          <Text>Alaraja:</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={newLower}
            onChangeText={setNewLower}
          />
        </View>
        <View style={styles.row}>
          <Text>Yläraja:</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={newUpper}
            onChangeText={setNewUpper}
          />
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddDevice}>
          <Text style={styles.addButtonText}>➕ Lisää laite</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>💾 Tallenna asetukset</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  deviceBox: {
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
  },
  deviceTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 5,
    width: 100,
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  inputFull: {
    borderWidth: 1,
    borderColor: '#aaa',
    padding: 8,
    borderRadius: 5,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});