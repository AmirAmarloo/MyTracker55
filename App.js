import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useProfileStore } from './src/state/useProfileStore';
import { useProjectStore } from './src/state/useProjectStore'; // 👈 اضافه شد
import ActivationScanScreen from './src/screens/ActivationScanScreen';
import TimerPage from './src/screens/TimerPage'; 
import DailyLogPage from './src/screens/DailyLogPage';
import AdminReportsPage from './src/screens/AdminReportsPage';
import AdminApprovalPage from './src/screens/AdminApprovalPage';
import ProjectPage from './src/screens/ProjectsPage';
import ManualEntryPage from './src/screens/ManualEntryPage';
import AdminUsersPage from './src/screens/AdminUsersPage';

const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  const role = useProfileStore((state) => state.role);
  const projects = useProjectStore((state) => state.projects); // 👈 گرفتن لیست پروژه‌ها از استور

  // 🌟 اگر هیچ پروژه‌ای وجود نداشت، تب پیش‌فرض روی 'Projects' تنظیم می‌شود تا Fresh Start رعایت شود
  const initialRoute = (!projects || projects.length === 0) ? 'Projects' : 'Timer';

  return (
    <Tab.Navigator
      initialRouteName={initialRoute} // 👈 اعمال تب پیش‌فرض هوشمند
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
            iconName = 'folder-open-outline'; 
          } else if (route.name === 'Approvals') {
            iconName = 'checkmark-done-circle-outline';
          } else if (route.name === 'ManualEntry') {
            iconName = 'create-outline'; 
          } else if (route.name === 'Users') {
            iconName = 'people-outline';  
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
      <Tab.Screen 
        name="ManualEntry" 
        component={ManualEntryPage} 
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
      {role === 'admin' && (
        <Tab.Screen 
          name="Users" 
          component={AdminUsersPage} 
          options={{ title: 'Users' }}
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