import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React, {useEffect, useState} from 'react';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {
  getFirestore,
} from '@react-native-firebase/firestore';
import useAgentStore from '../store/useAgentStore';

const DriveLogin = () => {
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const {agent} = useAgentStore();
  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        '103001125235-rrvtlq3toiv24psed413e1d0h18e8m3s.apps.googleusercontent.com',
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
  }, []);
  const signIn = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signIn();
      const {accessToken} = await GoogleSignin.getTokens();
      if (!accessToken) throw new Error('Failed to retrieve access token');
      console.log(accessToken);
      if (GoogleSignin.getCurrentUser().idToken !== null) {
        setIsLogin(true);
      } else {
        setIsLogin(false);
      }
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled the sign-in flow');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Sign-in is already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('Google Play Services not available');
      } else {
        console.error('Sign-in error:', error);
      }
      setIsLogin(false);
    } finally {
      setLoading(false);
    }
  };

  const signout = async () => {
    try {
      await GoogleSignin.signOut();
      await GoogleSignin.hasPlayServices();
      setIsLogin(false);
    } catch (error) {
      console.log('Error while signing out', error);
    }
  };

  const backupToDrive = async () => {
    try {
      const userId = agent.AgentID;
      await GoogleSignin.signIn();
      const currentUser = await GoogleSignin.getTokens();
      console.log('currentUser: ', currentUser);
      const token = currentUser.accessToken;
      console.log('token: ', token);
      const userSnap = await getFirestore()
        .collection('agents')
        .doc(userId)
        .get();
      console.log('userSnap: ', userSnap);

      if (!userSnap.exists) {
        console.error('User data not found!');
        return;
      }
      const data = userSnap.data();
      console.log(data);
      const jsonData = JSON.stringify(data);

      // Create metadata for the backup file
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
      console.log('File Metadata:', fileMetadata);

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

      console.log('Backup successful for user:', userId);
    } catch (error) {
      console.error('Error during backup:', error);
    }
  };

  const RestoreDataFromDrive = async () => {
    try {
      const userId = agent.AgentID;
      await GoogleSignin.signIn();
      const currentUser = await GoogleSignin.getTokens();
      const token = currentUser.accessToken;

      // Search for the latest backup file in the root directory
      const searchResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name contains 'backup_${userId}_'&orderBy=createdTime desc&fields=files(id, name)`,
        {
          method: 'GET',
          headers: {Authorization: `Bearer ${token}`},
        },
      );

      const searchData = await searchResponse.json();
      console.log('searchData: ', searchData);
      if (!searchData.files || searchData.files.length === 0) {
        console.error('No backup files found for user:', userId);
        return;
      }

      const latestFile = searchData.files[0];
      console.log('LatestFile', latestFile);
      // Download backup file
      const downloadResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${latestFile.id}?alt=media`,
        {
          method: 'GET',
          headers: {Authorization: `Bearer ${token}`},
        },
      );
      console.log('downloadResponse: ', downloadResponse);

      if (!downloadResponse.ok) {
        console.error('Error downloading file:', await downloadResponse.text());
        return;
      }

      const jsonData = await downloadResponse.json();
      console.log('jsonData: ', jsonData);

      // Restore data to Firestore
      await getFirestore().collection('agents').doc(userId).set(jsonData);

      console.log('Restore successful for user:', userId);
    } catch (error) {
      console.error('Error restoring backup:', error);
    }
  };

  return (
    <View>
      {!isLogin ? (
        <TouchableOpacity onPress={signIn}>
          <Text>Sign in</Text>
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity onPress={backupToDrive}>
        <Text>Backup to Drive</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={RestoreDataFromDrive}>
        <Text>Restore from Drive</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={signout}>
        <Text>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

export default DriveLogin;

const styles = StyleSheet.create({});
