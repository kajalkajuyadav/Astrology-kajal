// RootNavigator.js
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HomeTabs } from './TabNavigator'; // Import the Tab Navigator
import LeaveApply from '././src/Components/Bookings/LeaveApply'
import Login from './src/Components/Auth/Login';
import DaliyClaim from './src/Components/Home/DaliyClaim'
import DaliySafer from './src/Components/Home/DaliySafer';
import Attendance from './src/Components/Home/Attendance';
import MyVisitsScreen from './src/Components/Astrologers/Astrologers';
import SalerySelf from './src/Components/Bookings/SalerySelf';
const Stack = createNativeStackNavigator();

export default function RootStack() {
  const [initialRoute, setInitialRoute] = useState(null); // 'Login' ya 'HomeTabs'

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          setInitialRoute('HomeTabs');
        } else {
          setInitialRoute('Login');
        }
      } catch (e) {
        console.warn('Error reading auth token', e);
        setInitialRoute('Login');
      }
    };

    checkToken();
  }, []);

  // Jab tak token check ho raha hai, simple loader dikhayein
  if (!initialRoute) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        {/* Login screen */}
        <Stack.Screen
          name="Login"
          component={Login}
          options={{ headerShown: false }}
        />

        {/* Main tab navigator - contains all the main screens */}
        <Stack.Screen
          name="HomeTabs"
          component={HomeTabs}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="LeaveApply"
          component={LeaveApply}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="DaliyClaim"
          component={DaliyClaim}
          options={{ headerShown: false }}
        />
         <Stack.Screen
          name="DaliySafer"
          component={DaliySafer}
          options={{ headerShown: false }}
        />
         <Stack.Screen
          name="Attendance"
          component={Attendance}
          options={{ headerShown: false }}
        />
         <Stack.Screen
          name="MyVisitsScreen"
          component={MyVisitsScreen}
          options={{ headerShown: false }}
        />
           <Stack.Screen
          name="SalerySelf"
          component={SalerySelf}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
