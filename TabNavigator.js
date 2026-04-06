import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, StyleSheet } from 'react-native';
import Home from './src/Components/Home/Home';
import Horoscope from './src/Components/Horoscope/Horoscope';
import Bookings from './src/Components/Bookings/Bookings';
import LeaveManagementScreen from './src/Components/Bookings/LeaveApply';

const Tab = createBottomTabNavigator();

// Icon component to avoid inline styles and nested components
const TabIcon = ({ source, focused }) => (
  <Image
    source={source}
    style={[
      styles.tabIcon,
      focused ? styles.tabIconFocused : styles.tabIconUnfocused,
    ]}
  />
);

export function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: 'blue', // <-- Badal kar ORANGE kar diya
        tabBarInactiveTintColor: '#9CA3AF', // Gray color for inactive tab
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: 80, // <-- Height badha di
          paddingBottom: 15, // <-- Bottom padding badha di
          paddingTop: 10,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={Home} 
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              source={require('./src/Components/img/home.png')} 
              focused={focused} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Claims" 
        component={Horoscope}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              source={require('./src/Components/img/salary.png')} 
              focused={focused} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Leave" 
        component={LeaveManagementScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              source={require('./src/Components/img/bookings.png')} 
              focused={focused} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={Bookings}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
            source={require('./src/Components/img/astrologers.png')} 
              
              focused={focused} 
            />
          ),
        }}
      />
     
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    width: 24,
    height: 24,
  },
  tabIconFocused: {
    tintColor: 'blue', // <-- Badal kar ORANGE kar diya
  },
  tabIconUnfocused: {
    tintColor: '#9CA3AF',
  },
});