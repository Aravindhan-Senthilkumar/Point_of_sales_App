import React, { useEffect } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { NavigationContainer } from '@react-navigation/native'
import AgentHomePage from '../screens/AgentHomePage';
import DriveLogin from '../screens/DriveLogin';
import ProductDetailsScreen from '../screens/ProductDetailsScreen';
import AgentProductsListScreen from '../screens/AgentProductsListScreen';
import CartScreen from '../screens/CartScreen';
import PaymentScreen from '../screens/PaymentScreen';
import InvoiceGenerationScreen from '../screens/InvoiceGenerationScreen';
import FileViewer from 'react-native-file-viewer';
import notifee, {EventType} from '@notifee/react-native';
import ViewReports from '../screens/ViewReports';
import TodaySalesScreen from '../screens/TodaySalesScreen';


const Stack = createNativeStackNavigator();

const AgentStack = () => {

    useEffect(() => {
        // Handle foreground notifications
        const unsubscribe = notifee.onForegroundEvent(async ({ type,detail }) => {
            if(type === EventType.PRESS){
                const filePath = detail.notification?.data?.filePath
                if(filePath){
                    try{
                        await FileViewer.open(filePath,{ showOpenWithDialog:true })
                        console.log("Opening the downloaded pdf invoice successfully")
                    }catch(error){
                        console.log("Error while opening invoice",error)
                    }
                }
            }
        })

        notifee.getInitialNotification().then(async (initialnotification) => {
            if(initialnotification){
                const filePath = initialnotification.notification?.data?.filePath
                if(filePath){
                    try{
                        await FileViewer.open(filePath,{ showOpenWithDialog:true })
                        console.log("Opening the downloaded pdf invoice successfully in killed state")
                    }catch(error){
                        console.log("Error while opening invoice when app is in killed state",error)
                    }
                }
            }
        })
        
        return () => unsubscribe();
    }, []);
    
    return (
        <NavigationContainer>
        <Stack.Navigator initialRouteName='AgentHomePage' screenOptions={{ headerShown:false }}>
        <Stack.Screen name='AgentHomePage' component={AgentHomePage}/>
        <Stack.Screen name='DriveLogin' component={DriveLogin}/>
        <Stack.Screen name='ProductDetailsScreen' component={ProductDetailsScreen}/>
        <Stack.Screen name='AgentProductsListScreen' component={AgentProductsListScreen}/>
        <Stack.Screen name='PaymentScreen' component={PaymentScreen}/>
        <Stack.Screen name='CartScreen' component={CartScreen}/>
        <Stack.Screen name='InvoiceGenerationScreen' component={InvoiceGenerationScreen}/>
        <Stack.Screen name='ViewReports' component={ViewReports}/>
        <Stack.Screen name='TodaySalesScreen' component={TodaySalesScreen}/>
        </Stack.Navigator>
        </NavigationContainer>
    )
}

export default AgentStack;