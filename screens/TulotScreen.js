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

export default function TulotScreen() {
  const [selectedMonth, setSelectedMonth] = useState('2025-04');
  const [marketData, setMarketData] = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMarketData(selectedMonth);
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

        if (!response.ok) {
          console.warn(`Ei saatu dataa päivälle ${dateStr}`);
          continue;
        }

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

  const chartData = {
    labels: marketData.map((_, i) => (i + 1).toString()),
    datasets: [{ data: marketData }],
  };

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
                  width={marketData.length * 50}
                  height={260}
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
                  verticalLabelRotation={0} // TÄMÄ tekee pystynumerot
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  summary: { fontSize: 16, marginVertical: 10 },
  pickerContainer: { marginTop: 20 },
});
