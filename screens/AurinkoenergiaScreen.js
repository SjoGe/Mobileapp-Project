// AurinkoMapScreen.js

import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, Alert, ActivityIndicator, TouchableOpacity, TextInput, ScrollView, Modal, Pressable, Dimensions } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import SunCalc from 'suncalc';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const screenHeight = Dimensions.get('window').height;

export default function AurinkoMapScreen() {
  const [region, setRegion] = useState(null);
  const [sunLine, setSunLine] = useState([]);
  const [sunTimes, setSunTimes] = useState({});
  const [sunPath, setSunPath] = useState([]);
  const [sunrisePoint, setSunrisePoint] = useState(null);
  const [sunsetPoint, setSunsetPoint] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [panelSize, setPanelSize] = useState(5);
  const [efficiency, setEfficiency] = useState(80);
  const [price, setPrice] = useState(0.15);
  const [showSettings, setShowSettings] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [newMarkerCoords, setNewMarkerCoords] = useState(null);
  const [newMarkerName, setNewMarkerName] = useState('');

  const [mapExpanded, setMapExpanded] = useState(false);

  const mapRef = useRef(null);

  useEffect(() => {
    getLocationAndSun();
    loadData();
  }, []);

  const loadData = async () => {
    const savedSettings = await AsyncStorage.getItem('panelSettings');
    if (savedSettings) {
      const s = JSON.parse(savedSettings);
      setPanelSize(s.panelSize || 5);
      setEfficiency(s.efficiency || 80);
      setPrice(s.price || 0.15);
    }

    const savedMarkers = await AsyncStorage.getItem('panelMarkers');
    if (savedMarkers) {
      setMarkers(JSON.parse(savedMarkers));
    }
  };

  useEffect(() => {
    AsyncStorage.setItem('panelSettings', JSON.stringify({ panelSize, efficiency, price }));
  }, [panelSize, efficiency, price]);

  useEffect(() => {
    AsyncStorage.setItem('panelMarkers', JSON.stringify(markers));
  }, [markers]);

  const getLocationAndSun = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Sijainti estetty', 'Salli sijainti asetuksista.');
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const { latitude, longitude } = location.coords;

      setRegion({ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });

      const now = new Date();
      const sunPos = SunCalc.getPosition(now, latitude, longitude);
      const azimuth = (sunPos.azimuth * 180) / Math.PI;
      const correctedAzimuth = (azimuth + 180) % 360;
      const distance = 0.01;
      const bearingRad = (correctedAzimuth * Math.PI) / 180;
      const destLat = latitude + distance * Math.cos(bearingRad);
      const destLng = longitude + distance * Math.sin(bearingRad);

      setSunLine([{ latitude, longitude }, { latitude: destLat, longitude: destLng }]);

      const times = SunCalc.getTimes(now, latitude, longitude);
      setSunTimes({
        sunrise: times.sunrise.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }),
        sunset: times.sunset.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })
      });

      const path = [];
      for (let hour = 0; hour <= 23; hour++) {
        const date = new Date();
        date.setHours(hour, 0, 0, 0);
        const pos = SunCalc.getPosition(date, latitude, longitude);
        const az = (pos.azimuth * 180) / Math.PI;
        const corrected = (az + 180) % 360;
        const rad = (corrected * Math.PI) / 180;
        const lat = latitude + distance * Math.cos(rad);
        const lng = longitude + distance * Math.sin(rad);
        path.push({ latitude: lat, longitude: lng });
      }
      setSunPath(path);

      const sunrisePos = SunCalc.getPosition(times.sunrise, latitude, longitude);
      const sunrAz = (sunrisePos.azimuth * 180) / Math.PI;
      const sunrRad = ((sunrAz + 180) % 360) * Math.PI / 180;
      setSunrisePoint({
        latitude: latitude + distance * Math.cos(sunrRad),
        longitude: longitude + distance * Math.sin(sunrRad)
      });

      const sunsetPos = SunCalc.getPosition(times.sunset, latitude, longitude);
      const sunsAz = (sunsetPos.azimuth * 180) / Math.PI;
      const sunsRad = ((sunsAz + 180) % 360) * Math.PI / 180;
      setSunsetPoint({
        latitude: latitude + distance * Math.cos(sunsRad),
        longitude: longitude + distance * Math.sin(sunsRad)
      });

      setLoading(false);
    } catch (error) {
      Alert.alert('Virhe', 'Sijainnin hakeminen epäonnistui.');
      setLoading(false);
    }
  };

  const handleLongPress = (e) => {
    setNewMarkerCoords(e.nativeEvent.coordinate);
    setModalVisible(true);
  };

  const addMarker = () => {
    if (!newMarkerCoords) return;
    const newMarker = { coordinate: newMarkerCoords, name: newMarkerName || 'Paneeli' };
    setMarkers([...markers, newMarker]);
    setNewMarkerCoords(null);
    setNewMarkerName('');
    setModalVisible(false);
  };

  const handleMarkerPress = (index) => {
    Alert.alert('Poista merkki?', 'Haluatko varmasti poistaa tämän?', [
      { text: 'Peruuta', style: 'cancel' },
      { text: 'Poista', onPress: () => setMarkers(markers.filter((_, i) => i !== index)) }
    ]);
  };

  const estimateProduction = () => {
    const hoursSunshine = 5;
    const kWh = panelSize * (efficiency / 100) * hoursSunshine;
    const euro = kWh * price;
    return { kWh: kWh.toFixed(2), euro: euro.toFixed(2) };
  };

  const production = estimateProduction();

  if (loading || !region) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Haetaan sijaintia...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {!mapExpanded && (
        <View style={styles.infoContainer}>
          <Text style={styles.text}>Auringonnousu: {sunTimes.sunrise}</Text>
          <Text style={styles.text}>Auringonlasku: {sunTimes.sunset}</Text>
        </View>
      )}

      {!mapExpanded && (
        <TouchableOpacity onPress={() => setShowSettings(!showSettings)}>
          <View style={styles.dropdownHeader}>
            <Text style={styles.dropdownTitle}>Paneelin asetukset {showSettings ? '▲' : '▼'}</Text>
          </View>
        </TouchableOpacity>
      )}

      {!mapExpanded && showSettings && (
        <View style={styles.settings}>
          <Text>Teho (kW):</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={panelSize.toString()} onChangeText={v => setPanelSize(parseFloat(v) || 0)} />
          <Text>Hyötysuhde (%):</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={efficiency.toString()} onChangeText={v => setEfficiency(parseFloat(v) || 0)} />
          <Text>Sähkön hinta (€/kWh):</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={price.toString()} onChangeText={v => setPrice(parseFloat(v) || 0)} />
        </View>
      )}

      {!mapExpanded && (
        <View style={styles.production}>
          <Text style={styles.title}>Arvio päivän tuotto</Text>
          <Text>{production.kWh} kWh → {production.euro} €</Text>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={() => setMapExpanded(!mapExpanded)}>
        <Text style={styles.buttonText}>{mapExpanded ? 'Sulje koko näyttö' : 'Koko näyttö'}</Text>
      </TouchableOpacity>

      <MapView
        ref={mapRef}
        style={[styles.map, mapExpanded && { height: screenHeight }]}
        region={region}
        showsUserLocation={true}
        onLongPress={handleLongPress}
      >
        <Marker coordinate={region} title="Sinä" pinColor="blue" />
        {sunLine.length === 2 && (
          <>
            <Polyline coordinates={sunLine} strokeColor="#FFA500" strokeWidth={4} />
            <Marker coordinate={sunLine[1]} title="Aurinko">
              <MaterialCommunityIcons name="weather-sunny" size={30} color="#FFA500" />
            </Marker>
          </>
        )}
        {sunPath.length > 0 && (
          <Polyline coordinates={sunPath} strokeColor="#FFD700" strokeWidth={2} lineDashPattern={[4, 6]} />
        )}
        {sunrisePoint && (
          <Marker coordinate={sunrisePoint} title="Auringonnousu">
            <MaterialCommunityIcons name="weather-sunset-up" size={30} color="#FFA500" />
          </Marker>
        )}
        {sunsetPoint && (
          <Marker coordinate={sunsetPoint} title="Auringonlasku">
            <MaterialCommunityIcons name="weather-sunset-down" size={30} color="#FFA500" />
          </Marker>
        )}
        {markers.map((marker, index) => {
          const pos = SunCalc.getPosition(new Date(), marker.coordinate.latitude, marker.coordinate.longitude);
          const elevation = (pos.altitude * 180) / Math.PI;
          const shadowLength = elevation > 0 ? (2 / Math.tan(pos.altitude)) : 0;
          const shadowLat = marker.coordinate.latitude - shadowLength * 0.00001;
          const shadowLng = marker.coordinate.longitude - shadowLength * 0.00001;

          return (
            <React.Fragment key={index}>
              <Marker coordinate={marker.coordinate} title={marker.name} pinColor="green" onPress={() => handleMarkerPress(index)} />
              {shadowLength > 0 && (
                <Polyline coordinates={[marker.coordinate, { latitude: shadowLat, longitude: shadowLng }]} strokeColor="#808080" strokeWidth={2} />
              )}
            </React.Fragment>
          );
        })}
      </MapView>

      <TouchableOpacity style={styles.button} onPress={() => mapRef.current.animateToRegion(region, 1000)}>
        <Text style={styles.buttonText}>Sijainti</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text>Paneelin nimi:</Text>
            <TextInput style={styles.input} placeholder="Anna nimi" value={newMarkerName} onChangeText={setNewMarkerName} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <Pressable style={styles.button} onPress={addMarker}>
                <Text style={styles.buttonText}>Tallenna</Text>
              </Pressable>
              <Pressable style={styles.button} onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonText}>Peruuta</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F6F6' },
  infoContainer: { padding: 10, backgroundColor: '#fff', alignItems: 'center', borderBottomWidth: 1, borderColor: '#ddd' },
  text: { fontSize: 16, fontWeight: 'bold' },
  dropdownHeader: { backgroundColor: '#fff', marginHorizontal: 10, marginTop: 10, padding: 12, borderRadius: 12, elevation: 2 },
  dropdownTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  settings: { backgroundColor: '#fff', margin: 10, padding: 10, borderRadius: 12, elevation: 3 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginVertical: 5 },
  production: { backgroundColor: '#fff', margin: 10, padding: 10, borderRadius: 12, elevation: 3, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', marginVertical: 5, color: '#333' },
  map: { margin: 10, borderRadius: 12, overflow: 'hidden', width: 'auto', height: 400 },
  button: { backgroundColor: '#FFA500', padding: 14, margin: 10, borderRadius: 50, alignItems: 'center', elevation: 5 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 12, width: '80%' }
});