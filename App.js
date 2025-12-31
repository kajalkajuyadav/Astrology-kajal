// App.js
import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import RootStack from './RootStack';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#FFFFFF" 
        translucent={false}
      />
      <RootStack />
    </SafeAreaView>
  );
}
