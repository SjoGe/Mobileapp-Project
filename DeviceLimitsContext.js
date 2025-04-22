import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DeviceLimitsContext = createContext();

export const DeviceLimitsProvider = ({ children }) => {
  const [limits, setLimits] = useState({
    Astiat: { lower: 2.5, upper: 8.0 },
    Pyykki: { lower: 2.5, upper: 8.0 },
    Sauna: { lower: 2.5, upper: 8.0 },
    'S-Auto': { lower: 2.5, upper: 8.0 },
    general: 4.0,
  });

  const [visibleDevices, setVisibleDevices] = useState(['Astiat', 'Pyykki', 'Sauna', 'S-Auto', 'general']);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem('deviceLimits');
        const visible = await AsyncStorage.getItem('visibleDevices');

        if (stored) setLimits(JSON.parse(stored));
        if (visible) setVisibleDevices(JSON.parse(visible));
      } catch (e) {
        console.log('Virhe ladattaessa asetuksia:', e);
      }
    };
    load();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('deviceLimits', JSON.stringify(limits)).catch(console.log);
  }, [limits]);

  useEffect(() => {
    AsyncStorage.setItem('visibleDevices', JSON.stringify(visibleDevices)).catch(console.log);
  }, [visibleDevices]);

  return (
    <DeviceLimitsContext.Provider value={{ limits, setLimits, visibleDevices, setVisibleDevices }}>
      {children}
    </DeviceLimitsContext.Provider>
  );
};
