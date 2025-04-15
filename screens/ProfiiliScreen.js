import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../configs/firebaseconfig';

export default function ProfileScreen() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("✅ User signed out");
      Alert.alert("Logged out", "You have been signed out.");
    } catch (error) {
      console.log("❌ Sign-out error:", error.message);
      Alert.alert("Error", "Failed to sign out.");
    }
  };

  if (!user) return null;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Profile</Text>

        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{user.email}</Text>

        <Text style={styles.label}>User ID:</Text>
        <Text style={styles.uid}>{user.uid}</Text>
      </View>

      <View style={styles.logoutContainer}>
        <Button title="Log out" onPress={handleLogout} />
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
    elevation: 4, // Android shadow
    shadowColor: '#000', // iOS shadow
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
  logoutContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
});
