import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useProfileStore } from './src/state/useProfileStore';
import { useProjectStore } from './src/state/useProjectStore'; 

import ActivationScanScreen from './src/screens/ActivationScanScreen';
import RegisterCompanyScreen from './src/screens/RegisterCompanyScreen'; // 👈 اضافه شد
import TimerPage from './src/screens/TimerPage'; 
import DailyLogPage from './src/screens/DailyLogPage';
import AdminReportsPage from './src/screens/AdminReportsPage';
import AdminApprovalPage from './src/screens/AdminApprovalPage';
import ProjectPage from './src/screens/ProjectsPage';
import ManualEntryPage from './src/screens/ManualEntryPage';
import AdminUsersPage from './src/screens/AdminUsersPage';

const Tab = createBottomTabNavigator();
const AuthStack = createNativeStackNavigator(); // 👈 استک برای مرحله احراز هویت و ثبت‌نام

function MainTabNavigator() {
  const role = useProfileStore((state) => state.role);
  const projects = useProjectStore((state) => state.projects);

  const initialRoute = (!projects || projects.length === 0) ? 'Projects' : 'Timer';

  return (
    <Tab.Navigator
      initialRouteName={initialRoute}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName = 'time-outline';

          if (route.name === 'Timer') iconName = 'time-outline';
          else if (route.name === 'Logs') iconName = 'list-outline';
          else if (route.name === 'Reports') iconName = 'bar-chart-outline';
          else if (route.name === 'Projects') iconName = 'folder-open-outline'; 
          else if (route.name === 'Approvals') iconName = 'checkmark-done-circle-outline';
          else if (route.name === 'ManualEntry') iconName = 'create-outline'; 
          else if (route.name === 'Users') iconName = 'people-outline';  

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Timer" component={TimerPage} />
      <Tab.Screen name="Logs" component={DailyLogPage} options={{ headerShown: false }} />
      <Tab.Screen name="ManualEntry" component={ManualEntryPage} options={{ headerShown: false }} />
      {role === 'admin' && <Tab.Screen name="Reports" component={AdminReportsPage} options={{ title: 'Admin Reports' }} />}
      {role === 'admin' && <Tab.Screen name="Projects" component={ProjectPage} options={{ title: 'Projects' }} />}
      {role === 'admin' && <Tab.Screen name="Approvals" component={AdminApprovalPage} options={{ title: 'Approvals' }} />}
      {role === 'admin' && <Tab.Screen name="Users" component={AdminUsersPage} options={{ title: 'Users' }} />}
    </Tab.Navigator>
  );
}

export default function App() {
  const profileStatus = useProfileStore((state) => state.profileStatus);
  //const clearProfile = useProfileStore((state) => state.clearProfile); // 👈 متد پاکسازی استور

//useEffect(() => {
//    clearProfile();
  //}, []);

  return (
    <NavigationContainer>
      {profileStatus === 'active' ? (
        <MainTabNavigator />
      ) : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="RegisterCompany" component={RegisterCompanyScreen} />
          <AuthStack.Screen name="ActivationScan" component={ActivationScanScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}