import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function EtusivuScreen() {
  const [priceNow, setPriceNow] = useState(null); // Hinta nyt
  const [avgPrice7Days, setAvgPrice7Days] = useState(null); // 7 vrk keskihinta
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Haetaan ajankohtainen sähkönhinta (Hinta nyt)
    const fetchPriceNow = async () => {
      const date = new Date();
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hour = date.getHours();

      const twoDigits = (number) => (number < 10 ? `0${number}` : `${number}`);
      const params = `date=${year}-${twoDigits(month)}-${twoDigits(day)}&hour=${twoDigits(hour)}`;
      
      try {
        const response = await fetch(`https://api.porssisahko.net/v1/price.json?${params}`);
        const data = await response.json();
        if (data.price) {
          setPriceNow(data.price);
        } else {
          setPriceNow('Hinta ei saatavilla');
        }
      } catch (error) {
        setPriceNow('Virhe hinnan haussa');
      }
    };

    // Haetaan sähkön 7 vrk keskihinta
    const fetchAvgPrice7Days = async () => {
      try {
        const response = await fetch('https://api.porssisahko.net/v1/latest-prices.json');
        const data = await response.json();
        
        // Lasketaan viimeisen 7 päivän keskihinta
        const last7DaysPrices = data.prices.slice(0, 168); // Oletetaan, että 168 tuntia vastaa 7 päivää
        const totalPrice = last7DaysPrices.reduce((sum, entry) => sum + entry.price, 0);
        const avgPrice = totalPrice / last7DaysPrices.length;
        
        setAvgPrice7Days(avgPrice.toFixed(2)); // Pyöristetään 2 desimaaliin
      } catch (error) {
        setAvgPrice7Days('Virhe keskihinnan haussa');
      }
    };

    // Kutsu molempia API-pyyntöjä
    fetchPriceNow();
    fetchAvgPrice7Days();
    
    setLoading(false);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tervetuloa Etusivulle</Text>
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <>
          <Text style={styles.priceText}>
            Hinta nyt: {priceNow ? `${priceNow} snt / kWh` : 'Hinta ei saatavilla'}
          </Text>
          <Text style={styles.avgPriceText}>
            Sähkön 7 vrk keskihinta: {avgPrice7Days ? `${avgPrice7Days} snt / kWh` : 'Keskihinta ei saatavilla'}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  priceText: {
    fontSize: 18,
    color: 'green',
    marginBottom: 10,
  },
  avgPriceText: {
    fontSize: 18,
    color: 'blue',
  },
});
