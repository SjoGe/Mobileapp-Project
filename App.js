import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';

// Importoi näkymät
import EtusivuScreen from './screens/EtusivuScreen';
import AurinkoenergiaScreen from './screens/AurinkoenergiaScreen';
import KulutusScreen from './screens/KulutusScreen';
import TulotScreen from './screens/TulotScreen';
import HalytyksetScreen from './screens/HalytyksetScreen';
import AsetuksetScreen from './screens/AsetuksetScreen';
import KirjauduScreen from './screens/KirjauduScreen';

const Drawer = createDrawerNavigator();

export default function App() {
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
}
