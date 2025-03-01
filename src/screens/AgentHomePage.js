import {StyleSheet, View, Text, TouchableOpacity, Alert} from 'react-native';
import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {colors} from '../constants/colors';
import {dimensions} from '../constants/dimensions';
import {fonts} from '../constants/fonts';
import {useNavigation} from '@react-navigation/native';
import useAgentStore from '../store/useAgentStore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import AntDesign from 'react-native-vector-icons/AntDesign';
import useAuthStore from '../store/useAuthStore';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {
  getFirestore,
} from '@react-native-firebase/firestore';
import useCartStore from '../store/useCartStore';
import { ActivityIndicator, Modal } from 'react-native-paper';

const AgentHomePage = () => {
  const navigation = useNavigation();
  const { agent,setAgentLogOut } = useAgentStore();
  console.log('agent: ', agent);
  const { cart,clearCart } = useCartStore();
  console.log('cart: ', cart);
  const { setAuthUser } = useAuthStore();
  
  //Backup Logics
  const [loading,setLoading] = useState(false)

  // useEffect(() => {
  //       GoogleSignin.configure({
  //         webClientId:
  //           '103001125235-rrvtlq3toiv24psed413e1d0h18e8m3s.apps.googleusercontent.com',
  //         scopes: ['https://www.googleapis.com/auth/drive.file'],
  //       });
  //     }, []);

  // const backupTask = async () => {
  //   await new Promise(async (resolve) => {
  //     while (BackgroundService.isRunning()) {
  //       setLoading(true);
  //       try {
  //         const userId = agent.AgentID;
  //         await GoogleSignin.signIn();
  //         const currentUser = await GoogleSignin.getTokens();
  //         const token = currentUser.accessToken;
  //         const data = agent;
  //         const backupData = [data,cart]
  //         const jsonData = JSON.stringify(backupData);
  //         const metadata = {
  //           name: `backup_${userId}_${new Date().toISOString()}.json`,
  //           mimeType: 'application/json',
  //         };
    
  //         // Upload metadata to get file ID
  //         const metadataResponse = await fetch(
  //           'https://www.googleapis.com/drive/v3/files?uploadType=multipart',
  //           {
  //             method: 'POST',
  //             headers: {
  //               Authorization: `Bearer ${token}`,
  //               'Content-Type': 'application/json; charset=UTF-8',
  //             },
  //             body: JSON.stringify(metadata),
  //           },
  //         );
    
  //         const fileMetadata = await metadataResponse.json();   
  //         // Upload raw JSON data (without encryption)
  //         await fetch(
  //           `https://www.googleapis.com/upload/drive/v3/files/${fileMetadata.id}?uploadType=media`,
  //           {
  //             method: 'PATCH',
  //             headers: {
  //               Authorization: `Bearer ${token}`,
  //               'Content-Type': 'application/json',
  //             },
  //             body: jsonData, // No encryption applied
  //           },
  //         );
  //         setBackUpSuccessModal(true);
  //         setTimeout(() => {
  //           setBackUpSuccessModal(false)
  //         },900)
  //         resolve();
  //       } catch (error) {
  //         Alert.alert('Backup failed: ' + error.message);
  //       } finally {
  //         setLoading(false);
  //         await new Promise((r) => setTimeout(r, 86400000));
  //       }
  //     }
  //   });
  // };

  // const backUpTaskWhileLogOut = async () => {
  //   setLoading(true);
  //       try {
  //         const userId = agent.AgentID;
  //         await GoogleSignin.signIn();
  //         const currentUser = await GoogleSignin.getTokens();
  //         const token = currentUser.accessToken;
  //         const data = agent;
  //         const backupData = [data,cart]
  //         const jsonData = JSON.stringify(backupData);
  //         const metadata = {
  //           name: `backup_${userId}_${new Date().toISOString()}.json`,
  //           mimeType: 'application/json',
  //         };
    
  //         // Upload metadata to get file ID
  //         const metadataResponse = await fetch(
  //           'https://www.googleapis.com/drive/v3/files?uploadType=multipart',
  //           {
  //             method: 'POST',
  //             headers: {
  //               Authorization: `Bearer ${token}`,
  //               'Content-Type': 'application/json; charset=UTF-8',
  //             },
  //             body: JSON.stringify(metadata),
  //           },
  //         );
    
  //         const fileMetadata = await metadataResponse.json();   
  //         // Upload raw JSON data (without encryption)
  //         await fetch(
  //           `https://www.googleapis.com/upload/drive/v3/files/${fileMetadata.id}?uploadType=media`,
  //           {
  //             method: 'PATCH',
  //             headers: {
  //               Authorization: `Bearer ${token}`,
  //               'Content-Type': 'application/json',
  //             },
  //             body: jsonData, // No encryption applied
  //           },
  //         );
  //         setBackUpSuccessModal(true);
  //       } catch (error) {
  //         Alert.alert('Backup failed: ' + error.message);
  //       } finally {
  //         setLoading(false);
  //       }
  // }

  // const options = {
  // taskName: 'GoogleDriveBackup',
  // taskTitle: 'Backup in Progress',
  // taskDesc: 'Backing up data to Google Drive',
  // taskIcon: { name: 'ic_launcher', type: 'mipmap' }, // Replace with your app icon
  // color: '#ff0000', // Notification color (e.g., red)
  // parameters: { interval: 86400000 },
  // foreground: true, // 1 second for testing, use 86400000 for 24 hours in production // Force foreground mode for Android 15
  // };

  // useEffect(() => {
  //   const unsubscribe = navigation.addListener('focus', async () => {
  //     if (!BackgroundService.isRunning()) {
  //       await BackgroundService.start(backupTask, options);
  //     }
  //   });
  //   return unsubscribe;
  // }, [navigation]);

   const [backUpSuccessModal, setBackUpSuccessModal] = useState(false);

  const handleLogOut = async () => {
    try {
      await backUpTaskWhileLogOut();
      setTimeout(() => {
        clearCart();
        setAgentLogOut();
        setAuthUser(null);
        setBackUpSuccessModal(false)
      },900)
      console.log('Logout completed');
    } catch (error) {
      console.error('Logout failed due to backup error:', error);
      Alert.alert('Logout Failed', 'Backup operation failed. Please try again later.');
    }
  };

  return (
    <View style={styles.container}>
  <Header />

  <View style={styles.mainContainer}>
  <Text style={styles.WelcomeText}>AGENT DASHBOARD</Text>

  <View style={styles.grid}>
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('AgentProductsListScreen')}>
      <FontAwesome6
        name="store"
        size={ 28 }
        color="black"
      />
      <Text style={styles.AdminDashboardText}>Products</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('CartScreen')}>
      <MaterialCommunityIcons
        name="cart"
        size={30}
        color="black"
      />
      <Text style={styles.AdminDashboardText}>Cart</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ListProduct')}>
      <MaterialCommunityIcons
        name="format-list-bulleted"
        size={30}
        color="black"
      />
      <Text style={styles.AdminDashboardText}>Today Sales</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ViewReports')}>
      <MaterialCommunityIcons
        name="file-document"
        size={30}
        color="black"
      />
      <Text style={styles.AdminDashboardText}>View Reports</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.card]}
      onPress={handleLogOut}>
      <MaterialCommunityIcons name="logout" size={30} color="black" />
      <Text style={styles.AdminDashboardText}>Logout</Text>
    </TouchableOpacity>
  </View>

</View>

<Footer />
  <Modal visible={loading}>
    <View style={{ backgroundColor:colors.pureWhite,height:dimensions.height / 3,marginHorizontal:dimensions.xl,borderRadius:dimensions.sm,justifyContent:'center',alignItems:'center' }}>
    <ActivityIndicator 
    size='large'
    />
    <Text style={{ fontFamily:fonts.semibold,marginVertical:dimensions.md,fontSize:dimensions.sm * 1.25 }}>Backing Up.....</Text>
    </View>
  </Modal>
  <Modal visible={backUpSuccessModal}>
    <View style={{ backgroundColor:colors.pureWhite,height:dimensions.height / 3,marginHorizontal:dimensions.xl,borderRadius:dimensions.sm,justifyContent:'center',alignItems:'center' }}>
    <AntDesign
                  name="checkcircle"
                  color="green"
                  size={dimensions.width / 4}
                />
    <Text style={{ fontFamily:fonts.semibold,marginVertical:dimensions.md,fontSize:dimensions.sm * 1.25 }}>Backup Completed</Text>
    </View>
  </Modal>
    </View>
  );
};

export default AgentHomePage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.halfWhite,
  },
  mainContainer: {
    marginVertical: dimensions.xl * 2,
    alignItems: 'center',
    gap: dimensions.md,
  },
  WelcomeText: {
    fontFamily: fonts.medium,
    fontSize: dimensions.xl,
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: dimensions.md,
  },
  card: {
    width: '37.5%',
    height: dimensions.height / 10,
    backgroundColor: 'white',
    borderRadius: dimensions.md / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.lightGray,
    borderWidth: 1,
  },
  logout: {
    width: dimensions.width / 1.25,
  },
  AdminDashboardText: {
    fontFamily: fonts.regular,
  },
});
