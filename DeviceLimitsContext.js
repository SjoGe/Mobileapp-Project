import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DeviceLimitsContext = createContext();

export const DeviceLimitsProvider = ({ children }) => {
  const [limits, setLimits] = useState({
    Astiat: { lower: 2.5, upper: 8.0 },
    Pyykki: { lower: 2.5, upper: 8.0 },
    Sauna: { lower: 2.5, upper: 8.0 },
    'S-Auto': { lower: 2.5, upper: 8.0 },
    general: 4.0, // Yleinen rajahinta
  });

  useEffect(() => {
    const loadLimits = async () => {
      try {
        const stored = await AsyncStorage.getItem('deviceLimits');
        if (stored) {
          setLimits(JSON.parse(stored));
        }
      } catch (e) {
        console.log('Virhe ladattaessa rajoja:', e);
      }
    };
    loadLimits();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('deviceLimits', JSON.stringify(limits)).catch(console.log);
  }, [limits]);

  return (
    <DeviceLimitsContext.Provider value={{ limits, setLimits }}>
      {children}
    </DeviceLimitsContext.Provider>
  );
};
