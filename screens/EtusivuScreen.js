import React, { useState, useEffect, useContext } from 'react';
import { View, Text, Dimensions, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { DeviceLimitsContext } from '../DeviceLimitsContext';

const screenWidth = Dimensions.get('window').width;

export default function EtusivuScreen() {
  const [priceNow, setPriceNow] = useState(null);
  const [avgPrice7Days, setAvgPrice7Days] = useState(null);
  const [priceData, setPriceData] = useState(null);
  const [activeBar, setActiveBar] = useState(-1);
  const { limits: deviceLimits } = useContext(DeviceLimitsContext);
  const [deviceStates, setDeviceStates] = useState({});

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
        setPriceNow(dataNow.price ? parseFloat(dataNow.price.toFixed(1)) : null);

        const responsePrices = await fetch('https://api.porssisahko.net/v1/latest-prices.json');
        const dataPrices = await responsePrices.json();
        const last24h = dataPrices.prices.slice(0, 24).reverse();
        const prices = last24h.map(item => parseFloat(item.price.toFixed(1)));
        const labels = last24h.map((_, i) => `${23 - i}:00`);

        const avg7d = (dataPrices.prices.slice(0, 168).reduce((acc, p) => acc + p.price, 0) / 168).toFixed(1);
        setAvgPrice7Days(avg7d);

        setPriceData({
          labels,
          datasets: [{ data: prices }]
        });
      } catch (err) {
        console.error("Data fetching error", err);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (priceNow === null || !deviceLimits) return;

    const newStates = {};
    Object.entries(deviceLimits).forEach(([device, value]) => {
      if (device === 'general') return;
      const { lower, upper } = value;
      if (priceNow < lower) newStates[device] = 'green';
      else if (priceNow > upper) newStates[device] = 'red';
      else newStates[device] = 'neutral';
    });
    setDeviceStates(newStates);
  }, [priceNow, deviceLimits]);

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
          <BarChart
            data={priceData}
            width={screenWidth - 20}
            height={300}
            fromZero
            yAxisSuffix="c"
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 1,
              barPercentage: 0.6,
              color: (opacity = 1, index) =>
                activeBar === index
                  ? `rgba(0, 0, 255, ${opacity})`
                  : chartColors(priceData.datasets[0].data[index]),
              labelColor: () => '#000',
            }}
            verticalLabelRotation={-60}
            showBarTops={true}
            onDataPointClick={({ index }) => {
              setActiveBar(index === activeBar ? -1 : index);
            }}
          />
        )}

        {activeBar !== -1 && priceData && (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>
              Kello: {priceData.labels[activeBar]} - {parseInt(priceData.labels[activeBar]) + 1}:00
            </Text>
            <Text style={styles.tooltipText}>
              Hinta: {priceData.datasets[0].data[activeBar]} snt / kWh
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

      {priceNow !== null && deviceLimits && (
        <>
          {Object.entries(deviceLimits).map(([device, value]) =>
            device !== 'general' && priceNow <= value.lower ? (
              <Text key={device} style={styles.recommendation}>
                🔔 Voit käyttää laitetta: {device}
              </Text>
            ) : null
          )}
          {deviceLimits.general && priceNow <= deviceLimits.general && (
            <Text style={styles.recommendation}>
              ✅ Hinta ({priceNow} c/kWh) on alle yleisrajan ({deviceLimits.general} c/kWh)
            </Text>
          )}
        </>
      )}

      <View style={styles.buttonRow}>
        {Object.keys(deviceLimits).map((device) =>
          device !== 'general' ? (
            <TouchableOpacity
              key={device}
              style={[
                styles.button,
                deviceStates[device] === 'green' && { backgroundColor: '#c8facc' },
                deviceStates[device] === 'red' && { backgroundColor: '#f8c6c6' },
              ]}
            >
              <Text style={styles.buttonText}>{device}</Text>
            </TouchableOpacity>
          ) : null
        )}
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
  info: { marginTop: 10, fontSize: 16, fontWeight: '600' },
  tooltip: {
    marginTop: 10,
    backgroundColor: '#f2f2f2',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  tooltipText: {
    fontSize: 14,
    color: '#333',
  },
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    margin: 5
  },
  buttonText: { fontSize: 14, color: '#000' },
});
