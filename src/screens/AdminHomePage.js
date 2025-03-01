import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {colors} from '../constants/colors';
import {dimensions} from '../constants/dimensions';
import {fonts} from '../constants/fonts';
import {useNavigation} from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import useAuthStore from '../store/useAuthStore';
import { ActivityIndicator, Modal } from 'react-native-paper';
import AntDesign from 'react-native-vector-icons/AntDesign';
import useAdminStore from '../store/useAdminStore';

const AdminHomePage = () => {
  const navigation = useNavigation();
  const { setAuthUser } = useAuthStore();
  const { adminId,adminUsername } = useAdminStore();
  
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
  //         const userId = adminId;
  //         await GoogleSignin.signIn();
  //         const currentUser = await GoogleSignin.getTokens();
  //         const token = currentUser.accessToken;
  //         const agentsData = await getFirestore().collection('agents').get()
  //         const MetaData = await getFirestore().collection('metadata').get()
  //         const MetaDataCollection = MetaData.docs.map((doc) => ({
  //           id: doc.id,
  //           ...doc.data()
  //         }))
  //         const AgentsDataCollection = agentsData.docs.map(doc => ({
  //           id: doc.id,
  //           ...doc.data(),
  //         }));
  //         const orderData = await getFirestore().collection('orders').get()
  //         const OrderDataCollection = orderData.docs.map(doc => ({
  //           id:doc.id,
  //           ...doc.data(),
  //         }))
  //         const productsData = await getFirestore().collection('products').get()
  //         const ProductDataCollection = productsData.docs.map(doc => ({
  //           id:doc.id,
  //           ...doc.data(),
  //         }))
  //         const backupData = [MetaDataCollection,AgentsDataCollection,OrderDataCollection,ProductDataCollection]
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
  //         console.log('metadataResponse: ', metadataResponse);
  //         const fileMetadata = await metadataResponse.json();
  //         console.log('fileMetadata: ', fileMetadata);
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
  //       } catch (error) {
  //         Alert.alert('Backup failed: ' + error.message);
  //       } finally {
  //         setLoading(false);
  //         await new Promise((r) => setTimeout(r, 86400000));
  //       }
  //     }
  //   });
  // };
  // const options = {
  // taskName: 'GoogleDriveBackup',
  // taskTitle: 'Backup in Progress',
  // taskDesc: 'Backing up data to Google Drive',
  // taskIcon: { name: 'ic_launcher', type: 'mipmap' }, // Replace with your app icon
  // color: '#ff0000', // Notification color (e.g., red)
  // parameters: { interval: 86400000 }, // 1 second for testing, use 86400000 for 24 hours in production
  // foreground: true, // Force foreground mode for Android 15
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
  return (
    <View style={styles.container}>

      <Header />

      <View style={styles.mainContainer}>
        <Text style={styles.WelcomeText}>ADMIN DASHBOARD</Text>

        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('RegisterAgent')}>
            <MaterialCommunityIcons
              name="account-plus"
              size={30}
              color="black"
            />
            <Text style={styles.AdminDashboardText}>Register Agent</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('AddedProductsList')}>
            <MaterialCommunityIcons
              name="plus-circle"
              size={30}
              color="black"
            />
            <Text style={styles.AdminDashboardText}>Products</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ListProduct')}>
            <MaterialCommunityIcons
              name="format-list-bulleted"
              size={30}
              color="black"
            />
            <Text style={styles.AdminDashboardText}>List Products</Text>
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
            style={[styles.card, styles.logout]}
            onPress={() => setAuthUser(null)}>
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

export default AdminHomePage;

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
