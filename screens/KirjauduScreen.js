import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform, TouchableOpacity } from 'react-native';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../configs/firebaseconfig';
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

    if (!email || !password) {
      Alert.alert("Täytä kaikki kentät");
      return;
    }

    try {
      const kayttaja = await signInWithEmailAndPassword(authInstance, email, password);
      Alert.alert("✅ Kirjautuminen onnistui");

      await tallennaPushToken(auth.currentUser);

      navigation.navigate("Profiili");

    } catch (error) {
      Alert.alert("Kirjautuminen epäonnistui", "Väärä käyttäjänimi tai salasana");
      console.log("❌ Kirjautumisvirhe:", error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.inner}>
            <View style={styles.card}>
              <Text style={styles.title}>Kirjaudu sisään</Text>

              <TextInput
                placeholder="Sähköposti"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                placeholderTextColor="#999"
              />

              <TextInput
                placeholder="Salasana"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
                placeholderTextColor="#999"
              />

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Kirjaudu</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.registerButton} onPress={() => navigation.navigate('Rekisteröi')}>
            <Text style={styles.registerButtonText}>Rekisteröidy</Text>
            </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#f4f4f4',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: '#fafafa',
    justifyContent: 'center',
  },
  button: {
    marginTop: 10,
    marginBottom: 20,
  },
  linkContainer: {
    alignItems: 'center',
  },
  subText: {
    marginBottom: 8,
    fontSize: 14,
    color: '#555',
  },
  loginButton: {
    backgroundColor: '#d9534f',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  
  registerButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonText: {
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
  }
});
