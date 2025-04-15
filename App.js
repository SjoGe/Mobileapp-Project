import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Import screens
import EtusivuScreen from './screens/EtusivuScreen';
import AurinkoenergiaScreen from './screens/AurinkoenergiaScreen';
import KulutusScreen from './screens/KulutusScreen';
import TulotScreen from './screens/TulotScreen';
import HalytyksetScreen from './screens/HalytyksetScreen';
import AsetuksetScreen from './screens/AsetuksetScreen';
import KirjauduScreen from './screens/KirjauduScreen';
import RekisteroiScreen from './screens/RekisteroiScreen';
import ProfiiliScreen from './screens/ProfiiliScreen';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// Configure how notifications behave when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Ask permissions + get Expo push token
    registerForPushNotificationsAsync().then(token => {
      if (token) setExpoPushToken(token);
    });

      // 🟡 Android: Define notification channel
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

    // Listener for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Listener for when user taps the notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('User interacted with notification:', response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return (
    <NavigationContainer>
      <Drawer.Navigator
        screenOptions={{
          headerShown: true,
          drawerActiveTintColor: '#d9534f',
          drawerInactiveTintColor: '#000',
          drawerStyle: {
            width: 250,
          },
        }}
      >
        <Drawer.Screen name="Etusivu" component={EtusivuScreen} />
        <Drawer.Screen name="Profiili" component={ProfiiliScreen} />
        <Drawer.Screen name="Aurinkoenergia" component={AurinkoenergiaScreen} />
        <Drawer.Screen name="Kulutus" component={KulutusScreen} />
        <Drawer.Screen name="Tulot & säästöt" component={TulotScreen} />
        <Drawer.Screen name="Hälytykset" component={HalytyksetScreen} />
        <Drawer.Screen name="Asetukset" children={(props) => <AsetuksetScreen {...props} expoPushToken={expoPushToken} />}/>
        <Drawer.Screen name="Kirjaudu" component={KirjauduScreen} />
        <Drawer.Screen name="Rekisteröi" component={RekisteroiScreen} />

      </Drawer.Navigator>
    </NavigationContainer>
  );
}

// Helper function to request permissions and get token
async function registerForPushNotificationsAsync() {
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert('Permission not granted for notifications!');
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('📱 Expo Push Token:', token);
  } else {
    Alert.alert('Must use physical device for push notifications');
  }

  return token;
}