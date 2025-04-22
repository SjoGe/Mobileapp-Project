// TulotScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TulotScreen() {
  const [selectedMonth, setSelectedMonth] = useState('2025-04');
  const [marketData, setMarketData] = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [loading, setLoading] = useState(false);
  const [totalConsumption, setTotalConsumption] = useState(0);
  const [totalProduction, setTotalProduction] = useState(0);
  const [avgPrice7Days, setAvgPrice7Days] = useState(10);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchMarketData(selectedMonth);
    loadSettings();
    loadConsumption();
    fetchPrices();
    loadHistory();
  }, [selectedMonth]);

  const fetchMarketData = async (month) => {
    setLoading(true);
    const year = parseInt(month.split('-')[0]);
    const monthIndex = parseInt(month.split('-')[1]) - 1;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const producedKWhPerHour = 1;
    const dailyIncome = Array(daysInMonth).fill(0);

    try {
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const response = await fetch(`https://api.porssisahko.net/v1/price.json?date=${dateStr}`);

        if (!response.ok) continue;

        const hourlyPrices = await response.json();
        const incomeForDay = hourlyPrices.reduce((sum, entry) => {
          const pricePerMWh = entry.PriceWithTax;
          if (!pricePerMWh && pricePerMWh !== 0) return sum;
          const pricePerKWh = pricePerMWh / 1000;
          return sum + pricePerKWh * producedKWhPerHour;
        }, 0);

        dailyIncome[day - 1] = incomeForDay;
      }

      setMarketData(dailyIncome);
      setTotalIncome(dailyIncome.reduce((sum, val) => sum + val, 0));
    } catch (error) {
      console.error('Virhe haettaessa Pörssisähkö-dataa:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    const savedSettings = await AsyncStorage.getItem('panelSettings');
    if (savedSettings) {
      const { panelSize, efficiency } = JSON.parse(savedSettings);
      const hoursSunshine = 5;
      const production = panelSize * (efficiency / 100) * hoursSunshine;
      setTotalProduction(production);
    }
  };

  const loadConsumption = async () => {
    const saved = await AsyncStorage.getItem('deviceList');
    if (saved) {
      const devices = JSON.parse(saved);
      const totalKWh = devices.reduce((sum, d) => sum + ((d.watt * d.hours) / 1000), 0);
      setTotalConsumption(totalKWh);
    }
  };

  const fetchPrices = async () => {
    try {
      const responseAvg = await fetch('https://api.porssisahko.net/v1/latest-prices.json');
      const avgData = await responseAvg.json();
      const avg = avgData.prices.slice(0, 168).reduce((a, b) => a + b.price, 0) / 168;
      setAvgPrice7Days(avg);
    } catch (e) {
      console.log('Virhe hinnan haussa:', e);
    }
  };

  const loadHistory = async () => {
    const stored = await AsyncStorage.getItem('tulosHistory');
    if (stored) setHistory(JSON.parse(stored));
  };

  useEffect(() => {
    const store = async () => {
      const monthLabel = selectedMonth;
      const data = {
        month: monthLabel,
        kulutus: totalConsumption,
        tuotanto: totalProduction,
        säästö: Math.min(totalConsumption, totalProduction) * avgPrice7Days / 100,
      };
      const updated = [...history.filter(h => h.month !== monthLabel), data];
      setHistory(updated);
      await AsyncStorage.setItem('tulosHistory', JSON.stringify(updated));
    };
    if (totalConsumption && totalProduction) store();
  }, [totalConsumption, totalProduction, selectedMonth]);

  const chartData = {
    labels: marketData.map((_, i) => (i + 1).toString()),
    datasets: [
      { data: marketData },
      { data: Array(marketData.length).fill(totalProduction * avgPrice7Days / 100) },
    ],
    legend: ['Myyntitulot (€/pv)', 'Säästöarvio (€/pv)'],
  };

  const estCost = (totalConsumption * avgPrice7Days) / 100;
  const estSave = (Math.min(totalProduction, totalConsumption) * avgPrice7Days) / 100;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Pörssitulot ({selectedMonth})</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          <Text style={styles.summary}>Yhteensä: {totalIncome.toFixed(2)} €</Text>

          {marketData.length > 0 && (
            <View style={{ marginTop: 20 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <BarChart
                  data={chartData}
                  width={marketData.length * 60}
                  height={280}
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 2,
                    color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
                    labelColor: () => '#333',
                    propsForLabels: { fontSize: 10 },
                  }}
                  fromZero
                  showBarTops
                  withInnerLines={false}
                  verticalLabelRotation={0}
                />
              </ScrollView>
            </View>
          )}
        </>
      )}

      <View style={styles.pickerContainer}>
        <Text>Valitse kuukausi:</Text>
        <Picker
          selectedValue={selectedMonth}
          onValueChange={(itemValue) => setSelectedMonth(itemValue)}
        >
          <Picker.Item label="Huhtikuu 2025" value="2025-04" />
          <Picker.Item label="Maaliskuu 2025" value="2025-03" />
          <Picker.Item label="Helmikuu 2025" value="2025-02" />
        </Picker>
      </View>

      <View style={styles.summaryBox}>
        <Text style={styles.title}>Yhteenveto</Text>
        <Text style={styles.summary}>Kulutettu sähkö: {totalConsumption.toFixed(2)} kWh</Text>
        <Text style={styles.summary}>Arvioitu kustannus: {estCost.toFixed(2)} € ({avgPrice7Days.toFixed(1)} c/kWh)</Text>
        <Text style={styles.summary}>Aurinkotuotanto: {totalProduction.toFixed(2)} kWh</Text>
        <Text style={styles.summary}>Arvioitu säästö: {estSave.toFixed(2)} €</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  summary: { fontSize: 16, marginVertical: 4 },
  pickerContainer: { marginTop: 20 },
  summaryBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f4f4f4',
    borderRadius: 10,
    elevation: 3
  },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
});
