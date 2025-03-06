import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { NavigationContainer } from '@react-navigation/native'
import AdminHomePage from '../screens/AdminHomePage';
import RegisterAgent from '../screens/RegisterAgent';
import AddedProductsList from '../screens/AddedProductsList';
import ProductAddingScreen from '../screens/ProductAddingScreen';
import ProductUpdatingScreen from '../screens/ProductUpdatingScreen';
import ViewReports from '../screens/ViewReports';
import PendingOrders from '../screens/PendingOrders';

const Stack = createNativeStackNavigator();

const AdminStack = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName='AdminHomePage'  screenOptions={{ headerShown:false }}>
            <Stack.Screen name='AdminHomePage' component={AdminHomePage}/>
            <Stack.Screen name='RegisterAgent' component={RegisterAgent}/>
            <Stack.Screen name='AddedProductsList' component={AddedProductsList}/>
            <Stack.Screen name='ProductAddingScreen' component={ProductAddingScreen}/>
            <Stack.Screen name='ProductUpdatingScreen' component={ProductUpdatingScreen}/>
            <Stack.Screen name='ViewReports' component={ViewReports}/>
            <Stack.Screen name='PendingOrders' component={PendingOrders}/>
            </Stack.Navigator>
        </NavigationContainer>
    )
}

export default AdminStack