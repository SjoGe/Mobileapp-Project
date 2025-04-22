// screens/RegisterScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, KeyboardAvoidingView, ScrollView, Platform, Keyboard, TouchableWithoutFeedback, Pressable, TouchableOpacity } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../configs/firebaseconfig';
import { doc, setDoc } from 'firebase/firestore';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [birthdayInput, setBirthdayInput] = useState(''); // New string input


  const handleRegister = async () => {
    
    if (!email || !password || !fullName || !birthdayInput) {
      Alert.alert("Täytä kaikki kentät");
      return;
    }
  
    if (password.length < 8) {
      Alert.alert("Salasanan on oltava vähintään 8 merkkiä");
      return;
    }

      // Validate and convert birthday string to Date
      const birthdayParts = birthdayInput.split('.');
      if (birthdayParts.length !== 3) {
      Alert.alert("Syntymäpäivä virheellinen", "Syötä muodossa pp.kk.vvvv");
        return;
  }
  
  const [day, month, year] = birthdayParts.map(part => parseInt(part, 10));
  const birthdayDate = new Date(year, month - 1, day);
  
  if (isNaN(birthdayDate.getTime())) {
    Alert.alert("Virheellinen päivämäärä", "Tarkista syntymäpäivä");
    return;
  }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // ✅ Create Firestore user doc
      await setDoc(doc(db, 'users', user.uid), {
        fullName: fullName,
        birthday: birthdayDate.toISOString(),
        email: user.email,
        createdAt: new Date()
      });
  
      Alert.alert('✅ Tili luotu ja tallennettu!');
      navigation.navigate('Kirjaudu');
    } catch (error) {
      Alert.alert('⚠️ Rekisteröinti epäonnistui', error.message);
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
              <Text style={styles.title}>Rekisteröidy</Text>
  
              <TextInput
                placeholder="Koko nimesi"
                value={fullName}
                onChangeText={setFullName}
                style={styles.input}
                placeholderTextColor="#999"
              />
  
             <TextInput
              placeholder="Syntymäpäivä (pp.kk.vvvv)"
              value={birthdayInput}
              onChangeText={setBirthdayInput}
              style={styles.input}
              keyboardType="numbers-and-punctuation"
              placeholderTextColor="#999"
              />
  
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
  
            <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
              <Text style={styles.registerButtonText}>Luo tili</Text>
            </TouchableOpacity>

  
                <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Kirjaudu')}>
                <Text style={styles.loginButtonText}>Kirjaudu sisään</Text>
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
  text: {
    fontSize: 16,
    color: '#000',
  },
  placeholder: {
    fontSize: 16,
    color: '#aaa',
  },
  button: {
    marginTop: 10,
    marginBottom: 20,
  },
  loginContainer: {
    alignItems: 'center',
  },
  subText: {
    marginBottom: 8,
    fontSize: 14,
    color: '#555',
  },
  registerButton: {
    backgroundColor: '#d9534f',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  registerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  
  loginButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
  }
});