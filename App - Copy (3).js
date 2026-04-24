import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// ۱. فقط ایمپورت می‌کنیم (تعریف مجدد نمی‌کنیم)
import TimerPage from './src/screens/TimerPage'; 
import DailyLogPage from './src/screens/DailyLogPage';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Timer') {
              iconName = focused ? 'stopwatch' : 'stopwatch-outline';
            } else if (route.name === 'Daily Log') {
              iconName = focused ? 'list' : 'list-outline';
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen name="Timer" component={TimerPage} />
        <Tab.Screen name="Daily Log" component={DailyLogPage} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}