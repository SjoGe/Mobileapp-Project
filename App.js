import React, { useEffect, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { DeviceLimitsProvider, DeviceLimitsContext } from './DeviceLimitsContext';
import * as Notifications from 'expo-notifications';

import EtusivuScreen from './screens/EtusivuScreen';
import AurinkoenergiaScreen from './screens/AurinkoenergiaScreen';
import KulutusScreen from './screens/KulutusScreen';
import TulotScreen from './screens/TulotScreen';
import HalytyksetScreen from './screens/HalytyksetScreen';
import AsetuksetScreen from './screens/AsetuksetScreen';
import KirjauduScreen from './screens/KirjauduScreen';

const Drawer = createDrawerNavigator();

// Ilmoituslogiikka
const checkAndNotify = (price, limits) => {
  if (!price || !limits) return;

  const generalLimit = limits.generalLimit;

  if (price <= generalLimit) {
    Notifications.scheduleNotificationAsync({
      content: {
        title: 'Sähkönhinta alhaalla!',
        body: `Nyt kannattaa käyttää laitteita. Hinta: ${price} c/kWh`,
      },
      trigger: null,
    });
  }

  Object.entries(limits).forEach(([device, { lower, upper }]) => {
    if (device === 'generalLimit') return;

    if (price <= lower) {
      Notifications.scheduleNotificationAsync({
        content: {
          title: `${device}: Hinta alarajalla`,
          body: `Sähkönhinta on matala – laite ${device} kannattaa käyttää nyt!`,
        },
        trigger: null,
      });
    }
  });
};

// Hinta hakeva wrapper komponentti
const AppWrapper = () => {
  const { limits } = useContext(DeviceLimitsContext);
  const [priceNow, setPriceNow] = React.useState(null);

  useEffect(() => {
    const fetchPriceNow = async () => {
      const date = new Date();
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hour = date.getHours();
      const twoDigits = (n) => (n < 10 ? `0${n}` : `${n}`);
      const params = `date=${year}-${twoDigits(month)}-${twoDigits(day)}&hour=${twoDigits(hour)}`;

      try {
        const response = await fetch(`https://api.porssisahko.net/v1/price.json?${params}`);
        const data = await response.json();
        if (data.price) {
          const price = parseFloat(data.price.toFixed(1));
          setPriceNow(price);
          checkAndNotify(price, limits);
        }
      } catch {
        console.log('Virhe haettaessa sähkönhintaa');
      }
    };

    fetchPriceNow();

    const interval = setInterval(fetchPriceNow, 1000 * 60 * 60); // Hae kerran tunnissa
    return () => clearInterval(interval);
  }, [limits]);

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
        <Drawer.Screen name="Aurinkoenergia" component={AurinkoenergiaScreen} />
        <Drawer.Screen name="Kulutus" component={KulutusScreen} />
        <Drawer.Screen name="Tulot & säästöt" component={TulotScreen} />
        <Drawer.Screen name="Hälytykset" component={HalytyksetScreen} />
        <Drawer.Screen name="Asetukset" component={AsetuksetScreen} />
        <Drawer.Screen name="Kirjaudu" component={KirjauduScreen} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <DeviceLimitsProvider>
      <AppWrapper />
    </DeviceLimitsProvider>
  );
}
