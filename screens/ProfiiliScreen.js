import React, { useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { onAuthStateChanged, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../configs/firebaseconfig';

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const navigation = useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        setUser(null);
        setUserData(null);
        Alert.alert(
          "Et ole kirjautunut sisään",
          "Kirjaudu sisään nähdäksesi profiilisi.",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("Kirjaudu")
            }
          ]
        );
      } else {
        setUser(currentUser);

        const fetchUserData = async () => {
          try {
            const userRef = doc(db, 'users', currentUser.uid);
            const docSnap = await getDoc(userRef);
            if (docSnap.exists()) {
              setUserData(docSnap.data());
            } else {
              console.log("❌ Firestore: Käyttäjätietoja ei löytynyt");
            }
          } catch (error) {
            console.log("❌ Firestore-virhe:", error.message);
          }
        };

        fetchUserData();
      }
    }, [navigation])
  );

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserData(null);
      console.log("✅ Käyttäjä kirjautui ulos");
      Alert.alert("Uloskirjautuminen onnistui");
      navigation.navigate("Etusivu");
    } catch (error) {
      console.log("❌ Uloskirjautumisvirhe:", error.message);
      Alert.alert("Virhe", "Uloskirjautuminen epäonnistui.");
    }
  };

  const handlePasswordReset = async () => {
    try {
      await sendPasswordResetEmail(auth, user.email);
      Alert.alert("Salasanan vaihto", "Salasanan vaihtolinkki lähetetty.");
      console.log("📧 Salasanan vaihtolinkki lähetetty");
    } catch (error) {
      console.log("❌ Password reset error:", error.message);
      Alert.alert("Virhe", "Salasanan vaihto epäonnistui.");
    }
  };

  if (!user) return null;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Profiili</Text>

        <Text style={styles.label}>Nimesi:</Text>
        <Text style={styles.value}>{userData?.fullName || 'Ei asetettu'}</Text>

        <Text style={styles.label}>Syntymäpäivä:</Text>
        <Text style={styles.value}>
          {userData?.birthday
            ? new Date(userData.birthday).toLocaleDateString()
            : 'Ei asetettu'}
        </Text>

        <Text style={styles.label}>Sähköposti:</Text>
        <Text style={styles.value}>{user.email}</Text>

      </View>

      <View style={styles.buttonContainer}>
        <Button title="Vaihda salasana" onPress={handlePasswordReset} />
      </View>

      <View style={styles.logoutContainer}>
        <Button title="Kirjaudu ulos" onPress={handleLogout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f4f4f4',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  value: {
    fontSize: 18,
    color: '#000',
  },
  uid: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  buttonContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  logoutContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
});
