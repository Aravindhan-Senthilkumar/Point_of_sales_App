import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import BarcodeGenerator from './BarcodeGenerator'
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProductInfoScreen from './ProductInfoScreen';
import AuthStack from './src/navigation/AuthStack';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const App = () => {

  const Stack = createNativeStackNavigator()
  return (
    <PaperProvider>
      <SafeAreaProvider>
      <AuthStack />
      </SafeAreaProvider>
      </PaperProvider>
  )
}

  export default App
  
  const styles = StyleSheet.create({})
  //     <NavigationContainer>
  //   <Stack.Navigator screenOptions={{ headerShown:false }}>
  //     <Stack.Screen name='BarCodeGenerator' component={BarcodeGenerator}/>
  //     <Stack.Screen name='ProductInfoScreen' component={ProductInfoScreen}/>
  //   </Stack.Navigator>
  // </NavigationContainer>