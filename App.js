import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// ۱. وارد کردن استور و صفحاتی که قبلاً ساختیم
import { useProfileStore } from './src/state/useProfileStore';
import ActivationScanScreen from './src/screens/ActivationScanScreen';
import TimerPage from './src/screens/TimerPage'; 
import DailyLogPage from './src/screens/DailyLogPage';


const Tab = createBottomTabNavigator();

const Placeholder = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Test Page</Text>
  </View>
);
// نویگیتور اصلی (صفحات بعد از فعال‌سازی)
function MainTabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Timer" component={TimerPage} />
      <Tab.Screen 
        name="Logs" 
        component={DailyLogPage} 
        options={{ headerShown: false }}
      />
    </Tab.Navigator>

    
  );
}

export default function App() {
  // ۲. گوش دادن به وضعیت پروفایل
  const profileStatus = useProfileStore((state) => state.profileStatus);
  console.log("App.js render - Status:", profileStatus);
  return (
    <NavigationContainer>
      {/* ۳. شرط اصلی ورود به برنامه */}
      {profileStatus === 'active' ? (
        <MainTabNavigator />
      ) : (
        <ActivationScanScreen />
      )}
    </NavigationContainer>
  );
}