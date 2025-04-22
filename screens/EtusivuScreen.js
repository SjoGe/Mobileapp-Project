// Täydellinen ja valmis EtusivuScreen.js
import React, { useState, useEffect, useContext } from 'react';
import { View, Text, Dimensions, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { DeviceLimitsContext } from '../DeviceLimitsContext';

const screenWidth = Dimensions.get('window').width;

export default function EtusivuScreen() {
  const [priceNow, setPriceNow] = useState(null);
  const [avgPrice7Days, setAvgPrice7Days] = useState(null);
  const [priceData, setPriceData] = useState(null);
  const [activeBar, setActiveBar] = useState(-1);
  const { limits: deviceLimits, setLimits, visibleDevices } = useContext(DeviceLimitsContext);
  const [deviceStates, setDeviceStates] = useState({});
  const [selectedPriceInfo, setSelectedPriceInfo] = useState(null);
  const [hasSentNotification, setHasSentNotification] = useState(false);

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  useEffect(() => {
    const fixOldStorage = async () => {
      try {
        const raw = await AsyncStorage.getItem('deviceLimits');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.generalLimit && !parsed.general) {
            parsed.general = parsed.generalLimit;
            delete parsed.generalLimit;
            await AsyncStorage.setItem('deviceLimits', JSON.stringify(parsed));
            setLimits(parsed);
          }
        }
      } catch (e) {
        console.log('⚠️ Virhe migraatiossa:', e);
      }
    };
    fixOldStorage();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hour = now.getHours().toString().padStart(2, '0');

        const responseNow = await fetch(`https://api.porssisahko.net/v1/price.json?date=${year}-${month}-${day}&hour=${hour}`);
        const dataNow = await responseNow.json();
        const price = dataNow.price ? parseFloat(dataNow.price.toFixed(1)) : null;
        setPriceNow(price);

        if (deviceLimits?.general && price <= deviceLimits.general && !hasSentNotification) {
          await sendPushNotification(`💡 Edullinen sähkö nyt!`, `Hinta on ${price} c/kWh — käytä laitteita!`);
          setHasSentNotification(true);
        }

        const responsePrices = await fetch('https://api.porssisahko.net/v1/latest-prices.json');
        const dataPrices = await responsePrices.json();
        const last24h = dataPrices.prices.slice(0, 24).reverse();
        const prices = last24h.map(item => parseFloat(item.price.toFixed(1)));
        const labels = last24h.map((_, i) => {
          const hour = 23 - i;
          return hour % 3 === 0 ? `${hour}:00` : '';
        });

        const avg7d = (dataPrices.prices.slice(0, 168).reduce((acc, p) => acc + p.price, 0) / 168).toFixed(1);
        setAvgPrice7Days(avg7d);

        setPriceData({ labels, datasets: [{ data: prices }] });
      } catch (err) {
        console.error("Data fetching error", err);
      }
    };
    fetchData();
  }, [deviceLimits]);

  useEffect(() => {
    if (priceNow === null || !deviceLimits) return;
    const newStates = {};
    Object.entries(deviceLimits).forEach(([device, value]) => {
      if (typeof value === 'object' && value !== null) {
        const { lower, upper } = value;
        if (priceNow < lower) newStates[device] = 'green';
        else if (priceNow > upper) newStates[device] = 'red';
        else newStates[device] = 'green';
      } else if (device === 'general') {
        newStates[device] = priceNow <= value ? 'green' : 'red';
      }
    });
    setDeviceStates(newStates);
  }, [priceNow, deviceLimits]);

  const sendPushNotification = async (title, body) => {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: null,
    });
  };

  const registerForPushNotificationsAsync = async () => {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('Push-ilmoituksia ei sallittu!');
        return;
      }
    }
  };

  const chartColors = (value) => {
    if (value > 10) return 'red';
    if (value > 5) return 'orange';
    return 'green';
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Etusivu</Text>

      <View style={styles.graphContainer}>
        <Text style={styles.subHeader}>Pörssisähkö viimeisen 24h aikana</Text>

        {priceData && (
          <View style={{ width: '100%', overflow: 'visible' }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <BarChart
                data={priceData}
                width={screenWidth * 1.8}
                height={300}
                fromZero
                yAxisSuffix="c"
                chartConfig={{
                  backgroundColor: '#fff',
                  backgroundGradientFrom: '#fff',
                  backgroundGradientTo: '#fff',
                  decimalPlaces: 1,
                  barPercentage: 0.6,
                  propsForLabels: { fontSize: 10 },
                  color: (opacity = 1, index) =>
                    activeBar === index
                      ? `rgba(0, 0, 255, ${opacity})`
                      : chartColors(priceData.datasets[0].data[index]),
                  labelColor: () => '#000',
                }}
                verticalLabelRotation={-30}
                showBarTops={true}
                onDataPointClick={({ index }) => {
                  const hourStr = priceData.labels[index].replace(':00', '');
                  const hour = parseInt(hourStr);
                  const timeRange = `${hour}:00 - ${hour + 1}:00`;
                  const price = priceData.datasets[0].data[index];
                  setSelectedPriceInfo({ timeRange, price });
                  setActiveBar(index === activeBar ? -1 : index);
                }}
              />
            </ScrollView>
          </View>
        )}

        {selectedPriceInfo && (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>
              <Text style={styles.tooltipLabel}>Kello: </Text>
              {selectedPriceInfo.timeRange}
            </Text>
            <Text style={styles.tooltipText}>
              <Text style={styles.tooltipLabel}>Hinta: </Text>
              {selectedPriceInfo.price.toFixed(2)} snt / kWh
            </Text>
          </View>
        )}

        <Text style={styles.averageLine}>Päivän keskiarvo: {avgPrice7Days} c/kWh</Text>
      </View>

      <View style={styles.priceBoxContainer}>
        <View style={styles.priceBox}>
          <Text style={styles.label}>Sähkön hinta nyt</Text>
          <Text style={styles.value}>
            {priceNow !== null ? `${priceNow} c/kWh` : 'Virhe'}
          </Text>
        </View>
        <View style={styles.priceBox}>
          <Text style={styles.label}>7 vrk keskihinta</Text>
          <Text style={styles.value}>{avgPrice7Days} c/kWh</Text>
        </View>
      </View>

      <Text style={styles.subHeader}>Suositukset kodin sähkölaitteille</Text>

      {priceNow !== null && deviceLimits && visibleDevices && (
        <>
          {visibleDevices.map((device) => {
            const value = deviceLimits[device];
            if (!value) return null;

            if (device === 'general' && priceNow <= value) {
              return (
                <Text key={device} style={styles.recommendation}>
                  ✅ Hinta ({priceNow} c/kWh) on alle yleisrajan ({value} c/kWh)
                </Text>
              );
            }

            if (typeof value === 'object') {
              if (priceNow < value.lower) {
                return (
                  <Text key={device} style={styles.recommendation}>
                    🟢 Voit käyttää laitetta: {device} (alle {value.lower} c/kWh)
                  </Text>
                );
              } else if (priceNow >= value.lower && priceNow <= value.upper) {
                return (
                  <Text key={device} style={styles.recommendation}>
                    🟡 Voit käyttää harkiten: {device} ({value.lower}-{value.upper} c/kWh)
                  </Text>
                );
              }
            }
            return null;
          })}
        </>
      )}

      <View style={styles.buttonRow}>
        {Object.entries(deviceLimits).map(([device, value]) => {
          if (!visibleDevices || !visibleDevices.includes(device)) return null;
          if (typeof device !== 'string') return null;
          if (value === null || (typeof value !== 'object' && device !== 'general')) return null;

          const isGeneral = device === 'general';
          const displayName = isGeneral ? 'yleis sähkö' : device;

          let backgroundColor = '#fff';
          if (deviceStates[device] === 'green') backgroundColor = '#c8facc';
          else if (deviceStates[device] === 'red') backgroundColor = '#f8c6c6';

          return (
            <TouchableOpacity key={device} style={[styles.button, { backgroundColor }]}>
              <Text style={styles.buttonText}>{String(displayName)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 15, backgroundColor: '#fff' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 10 },
  graphContainer: { marginVertical: 10 },
  subHeader: { fontSize: 18, fontWeight: '600', marginVertical: 5 },
  averageLine: { marginTop: 10, fontSize: 16, fontWeight: 'bold', color: 'blue' },
  tooltip: {
    marginTop: 10,
    backgroundColor: '#f2f2f2',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  tooltipText: { fontSize: 14, color: '#333' },
  tooltipLabel: { fontWeight: 'bold', color: '#000' },
  priceBoxContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 20
  },
  priceBox: {
    backgroundColor: '#f4f4f4',
    padding: 15,
    borderRadius: 10,
    width: '45%',
    alignItems: 'center',
    elevation: 3
  },
  label: { fontSize: 14, color: '#333', marginBottom: 8 },
  value: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  recommendation: { fontSize: 14, color: '#2e7d32', marginVertical: 2 },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    width: '100%'
  },
  button: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    margin: 5
  },
  buttonText: { fontSize: 14, color: '#000' },
});