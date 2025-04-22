// KulutusScreen.js

import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function KulutusScreen() {
  const [devices, setDevices] = useState([]);
  const [panelSize, setPanelSize] = useState(5);
  const [efficiency, setEfficiency] = useState(80);

  useEffect(() => {
    loadDevices();
    loadSettings();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('deviceList', JSON.stringify(devices));
  }, [devices]);

  const loadDevices = async () => {
    const saved = await AsyncStorage.getItem('deviceList');
    if (saved) setDevices(JSON.parse(saved));
    else setDevices([
      { name: 'Jääkaappi', watt: 150, hours: 24 },
      { name: 'Sähkösauna', watt: 6000, hours: 1 },
      { name: 'TV', watt: 100, hours: 4 },
    ]);
  };

  const loadSettings = async () => {
    const savedSettings = await AsyncStorage.getItem('panelSettings');
    if (savedSettings) {
      const { panelSize, efficiency } = JSON.parse(savedSettings);
      setPanelSize(panelSize || 5);
      setEfficiency(efficiency || 80);
    }
  };

  const calculateTotalConsumption = () => {
    const totalKWh = devices.reduce((sum, d) => sum + ((d.watt * d.hours) / 1000), 0);
    return totalKWh;
  };

  const estimateProduction = () => {
    const hoursSunshine = 5;
    return panelSize * (efficiency / 100) * hoursSunshine;
  };

  const addDevice = () => {
    setDevices([...devices, { name: 'Uusi laite', watt: 0, hours: 0 }]);
  };

  const removeDevice = (index) => {
    const updated = devices.filter((_, i) => i !== index);
    setDevices(updated);
  };

  const updateDevice = (index, field, value) => {
    const updated = [...devices];
    updated[index][field] = field === 'name' ? value : parseFloat(value) || 0;
    setDevices(updated);
  };

  const totalConsumption = calculateTotalConsumption();
  const totalProduction = estimateProduction();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.infoContainer}>
        <Text style={styles.title}>Kodin laitteiden kulutus</Text>
        {devices.map((device, index) => (
          <View key={index} style={styles.deviceRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={device.name}
              onChangeText={(v) => updateDevice(index, 'name', v)}
              placeholder="Laitteen nimi"
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Text style={styles.label}>Teho:</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={device.watt.toString()}
                onChangeText={(v) => updateDevice(index, 'watt', v)}
                placeholder="W"
              />
              <Text style={styles.unit}>W</Text>
              <Text style={styles.label}>Aika:</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={device.hours.toString()}
                onChangeText={(v) => updateDevice(index, 'hours', v)}
                placeholder="h"
              />
              <Text style={styles.unit}>h/pv</Text>
              <Text style={{ marginLeft: 6 }}>{((device.watt * device.hours) / 1000).toFixed(2)} kWh</Text>
              <TouchableOpacity onPress={() => removeDevice(index)}>
                <MaterialCommunityIcons name="delete" size={24} color="red" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
        <TouchableOpacity style={styles.button} onPress={addDevice}>
          <Text style={styles.buttonText}>Lisää laite</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 10 }}>
          Päivittäinen kokonaiskulutus: {totalConsumption.toFixed(2)} kWh
        </Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.title}>Tuotanto vs. Kulutus</Text>
        <LineChart
          data={{
            labels: ['Tuotanto', 'Kulutus'],
            datasets: [
              {
                data: [totalProduction, totalConsumption],
              },
            ],
          }}
          width={screenWidth - 20}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(255, 165, 0, ${opacity})`,
            labelColor: () => '#333',
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#ffa726',
            },
          }}
          bezier
          style={{ borderRadius: 12 }}
        />
        <Text style={{ marginTop: 10 }}>
          Päivittäinen tuotanto: {totalProduction.toFixed(2)} kWh (asetuksista: {panelSize} kW, {efficiency}% hyötysuhde)
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F6F6' },
  infoContainer: { padding: 10, backgroundColor: '#fff', margin: 10, borderRadius: 12, elevation: 2 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 6, marginHorizontal: 4, width: 80, textAlign: 'center' },
  label: { fontSize: 14, marginLeft: 6 },
  unit: { fontSize: 14, marginRight: 6 },
  deviceRow: { marginBottom: 12 },
  button: { backgroundColor: '#FFA500', padding: 10, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold' }
});
