import React, { useContext, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { DeviceLimitsContext } from '../DeviceLimitsContext';

export default function HälytysScreen() {
  const { limits, setLimits } = useContext(DeviceLimitsContext);
  const [localLimits, setLocalLimits] = useState({ ...limits });

  const handleLimitChange = (device, type, value) => {
    const normalized = value.replace(',', '.');
    const isValidInput =
      normalized === '' ||
      normalized === '.' ||
      /^(\d+)?(\.\d*)?$/.test(normalized);

    if (isValidInput) {
      if (type) {
        // Alaraja tai yläraja
        setLocalLimits((prev) => ({
          ...prev,
          [device]: {
            ...prev[device],
            [type]: normalized,
          },
        }));
      } else {
        // Yleinen raja
        setLocalLimits((prev) => ({
          ...prev,
          generalLimit: normalized,
        }));
      }
    }
  };

  const getDisplayValue = (val) => {
    return val !== undefined ? val.toString() : '';
  };

  const handleSave = () => {
    const newLimits = {};
    for (const [device, values] of Object.entries(localLimits)) {
      if (device === 'generalLimit') continue;

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

    const general = parseFloat(localLimits.generalLimit);
    if (isNaN(general)) {
      Alert.alert('Virhe', 'Yleinen sähkönhintaraja on virheellinen.');
      return;
    }

    newLimits.generalLimit = parseFloat(general.toFixed(1));

    setLimits(newLimits);
    Alert.alert('Tallennettu', 'Kaikki rajat tallennettu onnistuneesti!');
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
            value={getDisplayValue(localLimits.generalLimit)}
            onChangeText={(text) => handleLimitChange(null, null, text)}
          />
        </View>
      </View>

      {/* Laitteet */}
      {Object.keys(localLimits).map((device) =>
        device !== 'generalLimit' ? (
          <View key={device} style={styles.deviceBox}>
            <Text style={styles.deviceTitle}>{device}</Text>
            <View style={styles.row}>
              <Text>Alaraja (c/kWh):</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={getDisplayValue(localLimits[device].lower)}
                onChangeText={(text) => handleLimitChange(device, 'lower', text)}
              />
            </View>
            <View style={styles.row}>
              <Text>Yläraja (c/kWh):</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={getDisplayValue(localLimits[device].upper)}
                onChangeText={(text) => handleLimitChange(device, 'upper', text)}
              />
            </View>
          </View>
        ) : null
      )}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Tallenna</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  deviceBox: {
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
  },
  deviceTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 10 },
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
    width: 80,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
