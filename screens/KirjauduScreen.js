import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../configs/firebaseconfig'; // varmista polku
import { doc, setDoc } from 'firebase/firestore';
import * as Notifications from 'expo-notifications';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const tallennaPushToken = async (kayttaja) => {
    console.log("📍 Tallennetaan push-tunnistetta");

    try {
      const { status } = await Notifications.requestPermissionsAsync();
      console.log("🔑 Ilmoituslupa:", status);

      if (status !== 'granted') {
        console.log("🔒 Ei lupaa ilmoituksiin");
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync();
      console.log("📲 TokenData:", tokenData);

      const token = tokenData.data;
      if (!token) {
        console.log("⚠️ Push-tunniste puuttuu");
        return;
      }

      const kayttajaRef = doc(db, 'users', kayttaja.uid);
      await setDoc(kayttajaRef, {
        email: kayttaja.email,
        expoPushToken: token,
        paivitetty: new Date()
      }, { merge: true });

      console.log("✅ Push-tunniste tallennettu Firestoreen");

    } catch (error) {
      console.log("❌ Virhe push-tunnisteessa:", error.message);
    }
  };

  const handleLogin = async () => {
    const authInstance = getAuth();
    try {
      const kayttaja = await signInWithEmailAndPassword(authInstance, email, password);
      Alert.alert("✅ Kirjautuminen onnistui");

      await tallennaPushToken(auth.currentUser); // 🔗 Save token here

    } catch (error) {
      Alert.alert("❌ Kirjautuminen epäonnistui", error.message);
      console.log("❌ Kirjautumisvirhe:", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kirjaudu sisään</Text>

      <TextInput
        placeholder="Sähköposti"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />

      <TextInput
        placeholder="Salasana"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <Button title="Kirjaudu" onPress={handleLogin} />

      <View style={{ marginTop: 20 }}>
        <Text>Eikö sinulla ole tiliä?</Text>
        <Button title="Rekisteröidy" onPress={() => navigation.navigate('Rekisteröi')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  input: {
    height: 50,
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
});
