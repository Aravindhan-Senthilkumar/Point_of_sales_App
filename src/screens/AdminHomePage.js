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
import { ActivityIndicator, Button, Modal } from 'react-native-paper';
import AntDesign from 'react-native-vector-icons/AntDesign';
import useAdminStore from '../store/useAdminStore';
import BackgroundService from 'react-native-background-actions';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { getFirestore } from '@react-native-firebase/firestore';
import useBackUpStore from '../store/useBackupStore';

const AdminHomePage = () => {
  const navigation = useNavigation();
  const { setAuthUser } = useAuthStore();
  const { adminId,setAdminUserName,setAdminId } = useAdminStore();
  const { setLastBackedUpTime,lastBackedUpTime } = useBackUpStore();
  console.log('lastBackedUpTime: ', lastBackedUpTime);
  //Backup Logics
  const [loading,setLoading] = useState(false)

  useEffect(() => {
        GoogleSignin.configure({
          webClientId:
            '103001125235-rrvtlq3toiv24psed413e1d0h18e8m3s.apps.googleusercontent.com',
          scopes: ['https://www.googleapis.com/auth/drive.file'],
        });
      }, []);  

  const backupTask = async () => {
    return new Promise(async (resolve) => {
      setLoading(true);
      try {
          const userId = adminId;
          await GoogleSignin.signIn();
          BackgroundService.updateNotification({
            taskTitle: 'Signing in to Google...',
            taskDesc: 'Backing up data to Google Drive',
            progressBar: { max: 100, value: 20, indeterminate: false },
          });
          const currentUser = await GoogleSignin.getTokens();
          const token = currentUser.accessToken;
          BackgroundService.updateNotification({
            taskTitle: 'Preparing backup data...',
            taskDesc: 'Backing up data to Google Drive',
            progressBar: { max: 100, value: 40, indeterminate: false },
          });
          const agentsData = await getFirestore().collection('agents').get()
          const MetaData = await getFirestore().collection('metadata').get()
          const MetaDataCollection = MetaData.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }))
          const AgentsDataCollection = agentsData.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          const orderData = await getFirestore().collection('orders').get()
          const OrderDataCollection = orderData.docs.map(doc => ({
            id:doc.id,
            ...doc.data(),
          }))
          const productsData = await getFirestore().collection('products').get()
          const ProductDataCollection = productsData.docs.map(doc => ({
            id:doc.id,
            ...doc.data(),
          }))
          const jsonData = JSON.stringify([MetaDataCollection,AgentsDataCollection,OrderDataCollection,ProductDataCollection]);
          BackgroundService.updateNotification({
            taskTitle: 'Uploading metadata...',
            taskDesc: 'Backing up data to Google Drive',
            progressBar: { max: 100, value: 60, indeterminate: false },
          });
          const metadata = {
            name: `backup_${userId}_${new Date().toISOString()}.json`,
            mimeType: 'application/json',
          };
          // Upload metadata to get file ID
          const metadataResponse = await fetch(
            'https://www.googleapis.com/drive/v3/files?uploadType=multipart',
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json; charset=UTF-8',
              },
              body: JSON.stringify(metadata),
            },
          );
          console.log('metadataResponse: ', metadataResponse);
          const fileMetadata = await metadataResponse.json();
          console.log('fileMetadata: ', fileMetadata);
          BackgroundService.updateNotification({
            taskTitle: 'Uploading backup data...',
            taskDesc: 'Backing up data to Google Drive',
            progressBar: { max: 100, value: 80, indeterminate: false },
          });
          // Upload raw JSON data (without encryption)
          await fetch(
            `https://www.googleapis.com/upload/drive/v3/files/${fileMetadata.id}?uploadType=media`,
            {
              method: 'PATCH',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: jsonData, // No encryption applied
            },
          );
          BackgroundService.updateNotification({
            taskTitle: 'Backup Completed',
            taskDesc: 'Data backed up successfully to Google Drive',
            progressBar: { max: 100, value: 100, indeterminate: false },
          });
          setBackUpSuccessModal(true);
          await setLastBackedUpTime(new Date().getTime()); // Store completion time
          setTimeout(() => {
            setBackUpSuccessModal(false);
          }, 1000);
          resolve();
        } catch (error) {
          Alert.alert('Backup failed: ' + error.message);
          console.error('Backup error:', error);
          BackgroundService.updateNotification({
            taskTitle: 'Backup Failed',
            taskDesc: 'An error occurred during backup',
            progressBar: { max: 100, value: 0, indeterminate: false },
          });
          throw error;
        } finally {
          setLoading(false);
        }
      }
    );
  };
  
  const options = {
    taskName: 'GoogleDriveBackup',
    taskTitle: 'Backup in Progress',
    taskDesc: 'Backing up data to Google Drive',
    taskIcon: { name: 'ic_launcher', type: 'mipmap' },
    progressBar:{
      max:100,
      value:0,
      indeterminate:false
    }, // Replace with your app icon
    color: '#ff0000', // Notification color (e.g., red)
    parameters: { interval: 86400000 }, // 1 second for testing, use 86400000 for 24 hours in production
    foreground: true, // Force foreground mode for Android 15
    };

    useEffect(() => {
      const startBackgroundTask = async () => {
        const now = new Date().getTime();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        if (!BackgroundService.isRunning() && (!lastBackedUpTime || now - lastBackedUpTime >= twentyFourHours)) {
          try {
            await BackgroundService.start(backupTask, options);
            console.log('Background service started for periodic backup');
            await setLastBackedUpTime(now)
          } catch (error) {
            console.error('Failed to start background service:', error);
            Alert.alert('Backup Error', 'Failed to start backup service. Please try again.');
          }
        }
      };
    
      startBackgroundTask();
      return () => {
        if (BackgroundService.isRunning()) {
          BackgroundService.stop();
        }
      };
    }, [lastBackedUpTime]);
  
  const [backUpSuccessModal, setBackUpSuccessModal] = useState(false);

  const handleLogout = async () => {
    await backupTaskWhileLogOut();
  }
  const backupTaskWhileLogOut = async () => {
        setConfirmationModal(false)
        setLoading(true)
        try {
          const userId = adminId;
          console.log('userId: ', userId);
          await GoogleSignin.signIn();
          const currentUser = await GoogleSignin.getTokens();
          console.log('currentUser: ', currentUser);
          const token = currentUser.accessToken;
          console.log('token: ', token);
          const agentsData = await getFirestore().collection('agents').get()
          console.log('agentsData: ', agentsData);
          const MetaData = await getFirestore().collection('metadata').get()
          console.log('MetaData: ', MetaData);
          const MetaDataCollection = MetaData.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }))
          const AgentsDataCollection = agentsData.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          const orderData = await getFirestore().collection('orders').get()
          console.log('orderData: ', orderData);
          const OrderDataCollection = orderData.docs.map(doc => ({
            id:doc.id,
            ...doc.data(),
          }))
          const productsData = await getFirestore().collection('products').get()
          const ProductDataCollection = productsData.docs.map(doc => ({
            id:doc.id,
            ...doc.data(),
          }))
          const backupData = [MetaDataCollection,AgentsDataCollection,OrderDataCollection,ProductDataCollection]
          const jsonData = JSON.stringify(backupData);
          const metadata = {
            name: `backup_${userId}_${new Date().toISOString()}.json`,
            mimeType: 'application/json',
          };
          // Upload metadata to get file ID
          const metadataResponse = await fetch(
            'https://www.googleapis.com/drive/v3/files?uploadType=multipart',
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json; charset=UTF-8',
              },
              body: JSON.stringify(metadata),
            },
          );
          console.log('metadataResponse: ', metadataResponse);
          const fileMetadata = await metadataResponse.json();
          console.log('fileMetadata: ', fileMetadata);
          // Upload raw JSON data (without encryption)
          await fetch(
            `https://www.googleapis.com/upload/drive/v3/files/${fileMetadata.id}?uploadType=media`,
            {
              method: 'PATCH',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: jsonData, // No encryption applied
            },
          );
          setBackUpSuccessModal(true);
          setTimeout(() => {
            setAdminUserName(null);
            setAdminId(null)
            setAuthUser(null);
            setBackUpSuccessModal(false);
          },900)
        } catch (error) {
          Alert.alert('Backup failed: ' + error.message);
        } finally {
          setLoading(false);
        }
  };

  const [confirmationModal, setConfirmationModal] = useState(false);
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
            onPress={() => navigation.navigate('AssignScreen')}>
            <MaterialCommunityIcons
              name="format-list-bulleted"
              size={30}
              color="black"
            />
            <Text style={styles.AdminDashboardText}>Assign Agents</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('View')}>
            <MaterialCommunityIcons
              name="file-document"
              size={30}
              color="black"
            />
            <Text style={styles.AdminDashboardText}>View Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.card, styles.logout]}
            onPress={() => setConfirmationModal(true)}>
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
        <Modal visible={confirmationModal}>
          <View style={{ backgroundColor:colors.pureWhite,height:dimensions.height / 4,marginHorizontal:dimensions.xl,borderRadius:dimensions.sm,justifyContent:'center',alignItems:'center' }}>
          <Text style={{ fontFamily:fonts.semibold,marginVertical:dimensions.md,fontSize:dimensions.sm * 1.25 }}>Are you sure?</Text>
          <View style={{ flexDirection:'row',gap:dimensions.md }}>
          <Button icon='check' mode='contained' buttonColor='green' onPress={() => handleLogout()}>Yes</Button>
          <Button icon='close' mode='contained' buttonColor='red' onPress={() => setConfirmationModal(false)}>No</Button>
          </View>
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
