import { StyleSheet } from 'react-native'
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { NavigationContainer } from '@react-navigation/native'
import AgentLogin from '../screens/AgentLogin'
import AdminLogin from '../screens/AdminLogin'
import WelcomePage from '../screens/WelcomePage'
import AdminHomePage from '../screens/AdminHomePage'
import AgentHomePage from '../screens/AgentHomePage'
import RegisterAgent from '../screens/RegisterAgent'
import AddedProductsList from '../screens/AddedProductsList'
import ProductAddingScreen from '../screens/ProductAddingScreen'
import DriveLogin from '../screens/DriveLogin'
import BarcodeGeneration from '../screens/BarcodeGeneration'
import BarcodeScannerScreen from '../screens/BarcodeScannerScreen'

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName='WelcomePage' screenOptions={{ headerShown:false }}>
        <Stack.Screen name='WelcomePage' component={WelcomePage}/>
        <Stack.Screen name='AdminLogin' component={AdminLogin}/>
        <Stack.Screen name='AgentLogin' component={AgentLogin}/>
        <Stack.Screen name='AdminHomePage' component={AdminHomePage}/>
        <Stack.Screen name='AgentHomePage' component={AgentHomePage}/>
        <Stack.Screen name='RegisterAgent' component={RegisterAgent}/>
        <Stack.Screen name='AddedProductsList' component={AddedProductsList}/>
        <Stack.Screen name='ProductAddingScreen' component={ProductAddingScreen}/>
        <Stack.Screen name='DriveLogin' component={DriveLogin}/>
        <Stack.Screen name='BarcodeGeneration' component={BarcodeGeneration}/>
        <Stack.Screen name='BarcodeScannerScreen' component={BarcodeScannerScreen}/>
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default AuthStack

const styles = StyleSheet.create({})