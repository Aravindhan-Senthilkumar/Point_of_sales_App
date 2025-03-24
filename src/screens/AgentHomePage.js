import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import React, {useEffect, useState} from 'react';
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
import useCartStore from '../store/useCartStore';
import {ActivityIndicator, Badge, Button, Modal} from 'react-native-paper';
import BackgroundService from 'react-native-background-actions';
import useBackupStore from '../store/useBackupStore';
import {request} from 'react-native-permissions';
import Header from '../components/Header';

const AgentHomePage = () => {
  const navigation = useNavigation();
  const {agent, setAgentLogOut} = useAgentStore();
  const {cart, clearCart} = useCartStore();
  const {setAuthUser} = useAuthStore();

  //Backup Logics
  const [loading, setLoading] = useState(false);
  const {setLastBackedUpTime, lastBackedUpTime} = useBackupStore();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        '103001125235-rrvtlq3toiv24psed413e1d0h18e8m3s.apps.googleusercontent.com',
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
  }, []);

  const backupTask = async () => {
    return new Promise(async resolve => {
      setLoading(true);
      try {
        const userId = agent?.AgentID;
        if (!userId) {
          throw new Error('No user ID found!');
        }
        await GoogleSignin.signIn();
        const currentUser = await GoogleSignin.getTokens();
        BackgroundService.updateNotification({
          taskTitle: 'Signing in to Google...',
          taskDesc: 'Backing up data to Google Drive',
          progressBar: {max: 100, value: 20, indeterminate: false},
        });
        const token = currentUser.accessToken;
        const jsonData = JSON.stringify([agent, cart]);
        const metadata = {
          name: `backup_${userId}_${new Date().toISOString()}.json`,
          mimeType: 'application/json',
        };
        BackgroundService.updateNotification({
          taskTitle: 'Preparing backup data...',
          taskDesc: 'Backing up data to Google Drive',
          progressBar: {max: 100, value: 40, indeterminate: false},
        });
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

        if (!metadataResponse.ok) {
          throw new Error(
            'Failed to upload metadata: ' + metadataResponse.statusText,
          );
        }
        BackgroundService.updateNotification({
          taskTitle: 'Uploading metadata...',
          taskDesc: 'Backing up data to Google Drive',
          progressBar: {max: 100, value: 60, indeterminate: false},
        });
        const fileMetadata = await metadataResponse.json();
        console.log('fileMetadata: ', fileMetadata);

        const uploadResponse = await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${fileMetadata.id}?uploadType=media`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: jsonData,
          },
        );

        if (!uploadResponse.ok) {
          throw new Error(
            'Failed to upload backup data: ' + uploadResponse.statusText,
          );
        }
        BackgroundService.updateNotification({
          taskTitle: 'Uploading backup data...',
          taskDesc: 'Backing up data to Google Drive',
          progressBar: {max: 100, value: 80, indeterminate: false},
        });
        console.log('Backup successful for user:', userId);
        setBackUpSuccessModal(true);
        BackgroundService.updateNotification({
          taskTitle: 'Backup Completed',
          taskDesc: 'Data backed up successfully to Google Drive',
          progressBar: {max: 100, value: 100, indeterminate: false},
        });
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
          progressBar: {max: 100, value: 0, indeterminate: false},
        });
        throw error;
      } finally {
        setLoading(false);
      }
    });
  };

  const requestAndroid15NotificationPermissions = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await request(
        PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        ),
      );
      console.log('The notification requests has sent');
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    console.log('Android version is <= 33');
    return true;
  };

  const options = {
    taskName: 'GoogleDriveBackup',
    taskTitle: 'Backup in Progress',
    taskDesc: 'Backing up data to Google Drive',
    taskIcon: {name: 'ic_launcher', type: 'mipmap'},
    progressBar: {
      max: 100,
      value: 0,
      indeterminate: false,
    }, // Replace with your app icon
    color: '#ff0000', // Notification color (e.g., red)
    parameters: {interval: 86400000}, // 1 second for testing, use 86400000 for 24 hours in production
    foreground: true, // **This is necessary for Android 15+**
    allowExecutionInForeground: true, // **Ensures execution in foreground**
  };

  useEffect(() => {
    const startBackgroundTask = async () => {
      const hasPermission = await requestAndroid15NotificationPermissions();
      console.log('hasPermission: ', hasPermission);

      if (!hasPermission) {
        console.log('Notification permission denied.');
        return;
      }

      const now = new Date().getTime();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      if (
        !BackgroundService.isRunning() &&
        (!lastBackedUpTime || now - lastBackedUpTime >= twentyFourHours)
      ) {
        try {
          await BackgroundService.start(backupTask, options);
          console.log('Background service started for periodic backup');
          setLastBackedUpTime(now);
        } catch (error) {
          console.error('Failed to start background service:', error);
          Alert.alert(
            'Backup Error',
            'Failed to start backup service. Please try again.',
          );
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

  const backUpTaskWhileLogOut = async () => {
    setConfirmationModal(false);
    setLoading(true);
    try {
      const userId = agent.AgentID;
      await GoogleSignin.signIn();
      const currentUser = await GoogleSignin.getTokens();
      const token = currentUser.accessToken;
      const data = agent;
      const backupData = [data, cart];
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

      const fileMetadata = await metadataResponse.json();
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
    } catch (error) {
      Alert.alert('Backup failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const [backUpSuccessModal, setBackUpSuccessModal] = useState(false);

  const handleLogout = async () => {
    try {
      await backUpTaskWhileLogOut();
      setTimeout(() => {
        clearCart();
        setAgentLogOut();
        setAuthUser(null);
        setBackUpSuccessModal(false);
      }, 900);
      console.log('Logout completed');
    } catch (error) {
      console.error('Logout failed due to backup error:', error);
      Alert.alert(
        'Logout Failed',
        'Backup operation failed. Please try again later.',
      );
    }
  };

  const [confirmationModal, setConfirmationModal] = useState(false);

  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.mainContainer}>
        <Text style={styles.dashBoardText}>{agent.AgentName} - {agent.AgentID}</Text>
        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('AgentProductsListScreen')}>
            <FontAwesome6 name="store" size={28} color="black" />
            <Text style={styles.AdminDashboardText}>Products</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('CartScreen')}>
            <MaterialCommunityIcons name="cart" size={30} color="black" />
            {cart.length > 0 && (
              <Badge
                size={dimensions.sm}
                style={{
                  right: dimensions.sm * 4,
                  top: dimensions.md / 2,
                  position: 'absolute',
                }}>
                {cart.length}
              </Badge>
            )}
            <Text style={styles.AdminDashboardText}>Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('TodaySalesScreen')}>
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
            style={[styles.card, {width: '80%'}]}
            onPress={() => setConfirmationModal(true)}>
            <MaterialCommunityIcons name="logout" size={30} color="black" />
            <Text style={styles.AdminDashboardText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Footer />
      <Modal visible={loading}>
        <View
          style={{
            backgroundColor: colors.pureWhite,
            height: dimensions.height / 5,
            marginHorizontal: dimensions.xl*2,
            borderRadius: dimensions.sm,
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop:dimensions.xl
          }}>
          <ActivityIndicator size={dimensions.xl} />
          <Text
            style={{
              fontFamily: fonts.semibold,
              marginVertical: dimensions.sm,
              fontSize: dimensions.sm,
            }}>
            Backing Up.....
          </Text>
        </View>
      </Modal>
      <Modal visible={backUpSuccessModal}>
        <View
          style={{
            backgroundColor: colors.pureWhite,
            height: dimensions.height / 5,
            marginHorizontal: dimensions.xl*2,
            borderRadius: dimensions.sm,
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop:dimensions.xl
          }}>
          <AntDesign
            name="checkcircle"
            color="green"
            size={dimensions.width / 6}
          />
          <Text
            style={{
              fontFamily: fonts.semibold,
              marginVertical: dimensions.sm,
              fontSize: dimensions.sm,
            }}>
            Backup Completed
          </Text>
        </View>
      </Modal>
      <Modal visible={confirmationModal}>
        <View
          style={{
            backgroundColor: colors.pureWhite,
            height: dimensions.height / 4,
            marginHorizontal: dimensions.xl,
            borderRadius: dimensions.sm,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Text
            style={{
              fontFamily: fonts.semibold,
              marginVertical: dimensions.md,
              fontSize: dimensions.sm * 1.25,
            }}>
            Are you sure?
          </Text>
          <View style={{flexDirection: 'row', gap: dimensions.md}}>
            <Button
              icon="check"
              mode="contained"
              buttonColor="green"
              onPress={() => handleLogout()}>
              Yes
            </Button>
            <Button
              icon="close"
              mode="contained"
              buttonColor="red"
              onPress={() => setConfirmationModal(false)}>
              No
            </Button>
          </View>
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
    gap: dimensions.sm,
  },
  WelcomeText: {
    fontFamily: fonts.medium,
    fontSize: dimensions.md,
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
  dashBoardText:{
    fontFamily: fonts.medium,
    fontSize: dimensions.sm * 2,
  },
  innerWelcomeText:{
    fontFamily:fonts.light
  }
});
