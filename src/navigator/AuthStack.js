import { StyleSheet } from 'react-native'
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { NavigationContainer } from '@react-navigation/native'
import AgentLogin from '../screens/AgentLogin'
import AdminLogin from '../screens/AdminLogin'
import WelcomePage from '../screens/WelcomePage'

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName='WelcomePage' screenOptions={{ headerShown:false }}>
        <Stack.Screen name='WelcomePage' component={WelcomePage}/>
        <Stack.Screen name='AdminLogin' component={AdminLogin}/>
        <Stack.Screen name='AgentLogin' component={AgentLogin}/>
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default AuthStack;

const styles = StyleSheet.create({})