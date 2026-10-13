import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useProfileStore } from './src/state/useProfileStore';
import ActivationScanScreen from './src/screens/ActivationScanScreen';
import TimerPage from './src/screens/TimerPage'; 
import DailyLogPage from './src/screens/DailyLogPage';
import AdminReportsPage from './src/screens/AdminReportsPage';
import AdminApprovalPage from './src/screens/AdminApprovalPage';
import ProjectPage from './src/screens/ProjectsPage';

const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  const role = useProfileStore((state) => state.role);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName = 'time-outline';

if (route.name === 'Timer') {
            iconName = 'time-outline';
          } else if (route.name === 'Logs') {
            iconName = 'list-outline';
          } else if (route.name === 'Reports') {
            iconName = 'bar-chart-outline';
          } else if (route.name === 'Projects') {
            iconName = 'folder-open-outline'; // 📁 آیکون اختصاصی پروژه‌ها
          } else if (route.name === 'Approvals') {
            iconName = 'checkmark-done-circle-outline'; // ✅ آیکون اختصاصی تاییدیه ادمین
          } 

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Timer" component={TimerPage} />
      <Tab.Screen 
        name="Logs" 
        component={DailyLogPage} 
        options={{ headerShown: false }}
      />
      {role === 'admin' && (
        <Tab.Screen 
          name="Reports" 
          component={AdminReportsPage} 
          options={{ title: 'Admin Reports' }}
        />
      )}
      {role === 'admin' && (
        <Tab.Screen 
          name="Projects" 
          component={ProjectPage} 
          options={{ title: 'Projects' }}
        />
      )}
      {role === 'admin' && (
        <Tab.Screen 
          name="Approvals" 
          component={AdminApprovalPage} 
          options={{ title: 'Approvals' }}
        />
      )}
    </Tab.Navigator>
  );
}

export default function App() {
  const profileStatus = useProfileStore((state) => state.profileStatus);

  return (
    <NavigationContainer>
      {profileStatus === 'active' ? (
        <MainTabNavigator />
      ) : (
        <ActivationScanScreen />
      )}
    </NavigationContainer>
  );
}