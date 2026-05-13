import React, { useState, useEffect } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, Image } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

import DashboardScreen from './src/screens/DashboardScreen';
import HistoryScreen   from './src/screens/HistoryScreen';
import AlertsScreen    from './src/screens/AlertsScreen';
import SettingsScreen  from './src/screens/SettingsScreen';
import { useWebSocket } from './src/hooks/useWebSocket';
import { colors } from './src/theme';

const Tab = createBottomTabNavigator();
const SERVER_KEY = 'aquanet_server_url';

function TabIcon({ source, focused, color }) {
  return (
    <Image
      source={source}
      style={{
        width: 24,
        height: 24,
        tintColor: color,
        opacity: focused ? 1 : 0.6,
      }}
      resizeMode="contain"
    />
  );
}

export default function App() {
  const [serverUrl, setServerUrl] = useState(null);

  // Load persisted server URL on launch
  useEffect(() => {
    AsyncStorage.getItem(SERVER_KEY).then((val) => {
      setServerUrl(val || 'http://10.223.82.232:3001');
    });
  }, []);

  const { connected, nodes, alerts, sensorHistory, sendMotorCommand, dismissAlert } =
    useWebSocket(serverUrl);

  const alertCount = alerts.length;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={colors.bg} />
      <NavigationContainer
        theme={{
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            primary:      colors.primary,
            background:   colors.bg,
            card:         colors.bgCard,
            text:         colors.text,
            border:       colors.border,
            notification: colors.critical,
          },
        }}
      >
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: colors.bgCard,
              borderTopColor:  colors.border,
              borderTopWidth:  1,
              height: 62,
              paddingBottom: 10,
              paddingTop: 6,
            },
            tabBarActiveTintColor:   colors.primary,
            tabBarInactiveTintColor: colors.textMuted,
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          }}
        >
          <Tab.Screen
            name="Dashboard"
            options={{
              tabBarIcon: ({ focused, color }) => (
                <TabIcon source={require('./assets/dashboard.png')} focused={focused} color={color} />
              ),
            }}
          >
            {() => (
              <DashboardScreen
                nodes={nodes}
                connected={connected}
                sensorHistory={sensorHistory}
                sendMotorCommand={sendMotorCommand}
              />
            )}
          </Tab.Screen>

          <Tab.Screen
            name="History"
            options={{
              tabBarIcon: ({ focused, color }) => (
                <TabIcon source={require('./assets/history.png')} focused={focused} color={color} />
              ),
            }}
          >
            {() => (
              <HistoryScreen
                nodes={nodes}
                sensorHistory={sensorHistory}
              />
            )}
          </Tab.Screen>

          <Tab.Screen
            name="Alerts"
            options={{
              tabBarBadge: alertCount > 0 ? alertCount : undefined,
              tabBarIcon: ({ focused, color }) => (
                <TabIcon source={require('./assets/bell.png')} focused={focused} color={color} />
              ),
            }}
          >
            {() => (
              <AlertsScreen
                alerts={alerts}
                dismissAlert={dismissAlert}
              />
            )}
          </Tab.Screen>

          <Tab.Screen
            name="Settings"
            options={{
              tabBarIcon: ({ focused, color }) => (
                <TabIcon source={require('./assets/settings.png')} focused={focused} color={color} />
              ),
            }}
          >
            {() => (
              <SettingsScreen
                connected={connected}
                nodes={nodes}
                onServerChange={setServerUrl}
              />
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
