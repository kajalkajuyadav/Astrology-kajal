// App.js
import React from 'react';
import RootStack from './RootStack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      
      <RootStack />
    </SafeAreaView>
  );
}
