import 'react-native-gesture-handler'; // This MUST be at the very top
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

// 1. Import the standard Bottom Tabs library
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// 2. Define your route types for TypeScript
type RootTabParamList = {
  ScreenA: undefined;
  ScreenB: undefined;
};

// 3. Initialize the Bottom Tab Navigator
const Tab = createBottomTabNavigator<RootTabParamList>();

// --- Dummy Screens ---

const ScreenA = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>TurtleRTKv2 - Tab A</Text>
      <Button
        title="Go to Tab B"
        onPress={() => navigation.navigate('ScreenB')}
      />
    </View>
  );
};

const ScreenB = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>You are on Tab B!</Text>
      <Button
        title="Go to Tab A"
        onPress={() => navigation.navigate('ScreenA')}
      />
    </View>
  );
};

// --- Main App Component ---

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator 
        initialRouteName="ScreenA"
        screenOptions={{
          tabBarActiveTintColor: '#6200ee', // Highlight color for the active tab
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            backgroundColor: '#f8f4f4',
            paddingBottom: 5,
            height: 60,
          },
        }}
      >
        <Tab.Screen 
          name="ScreenA" 
          component={ScreenA} 
          options={{ title: 'Home' }} 
        />
        <Tab.Screen 
          name="ScreenB" 
          component={ScreenB} 
          options={{ title: 'Settings' }} 
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  text: {
    fontSize: 20,
    marginBottom: 20,
    color: '#333333',
    fontWeight: 'bold',
  },
});