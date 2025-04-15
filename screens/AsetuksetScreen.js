// screens/AsetuksetScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AsetuksetScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Asetukset tulevat tänne myöhemmin 🔧</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 16 },
});

