import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { NavigationContainer } from '@react-navigation/native'
import AgentHomePage from '../screens/AgentHomePage';
import DriveLogin from '../screens/DriveLogin';
import ProductDetailsScreen from '../screens/ProductDetailsScreen';
import AgentProductsListScreen from '../screens/AgentProductsListScreen';
import CartScreen from '../screens/CartScreen';
import PaymentScreen from '../screens/PaymentScreen';

const Stack = createNativeStackNavigator();

const AgentStack = () => {
    return (
        <NavigationContainer>
        <Stack.Navigator initialRouteName='AgentHomePage' screenOptions={{ headerShown:false }}>
        <Stack.Screen name='AgentHomePage' component={AgentHomePage}/>
        <Stack.Screen name='DriveLogin' component={DriveLogin}/>
        <Stack.Screen name='ProductDetailsScreen' component={ProductDetailsScreen}/>
        <Stack.Screen name='AgentProductsListScreen' component={AgentProductsListScreen}/>
        <Stack.Screen name='PaymentScreen' component={PaymentScreen}/>
        <Stack.Screen name='CartScreen' component={CartScreen}/>
        </Stack.Navigator>
        </NavigationContainer>
    )
}

export default AgentStack;