import {
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {colors} from '../constants/colors';
import {dimensions} from '../constants/dimensions';
import {fonts} from '../constants/fonts';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import {ActivityIndicator, Button, MD2Colors, Modal} from 'react-native-paper';
import useAgentStore from '../store/useAgentStore';
import Foundation from 'react-native-vector-icons/Foundation';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {getFirestore} from '@react-native-firebase/firestore';
import useAuthStore from '../store/useAuthStore';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import useCartStore from '../store/useCartStore';
import FastImage from 'react-native-fast-image';
import { Button as RNEUButton } from '@rneui/themed'; 
import useAdminStore from '../store/useAdminStore';

const AgentLogin = () => {
  // KeyPad Arrays
  const arrayButton1 = [1, 2, 3, '⌫'];
  const arrayButton2 = [4, 5, 6, 'CLR'];
  const arrayButton3 = [7, 8, 9, 0];

  // State Updates
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [modalError, setModalError] = useState('');
  const [isErrorVisible, setIsErrorVisible] = useState(false);
  const [logoLoading, setLogoLoading] = useState(false);

  // Zustand Store
  const { setAgentData, agent} = useAgentStore();
  const { setCartFromBackup, cart } = useCartStore();
  const { setAuthUser } = useAuthStore();
  const { adminLogoUri } = useAdminStore();
  
  console.log('adminLogoUri: ', adminLogoUri);
  console.log('cart: ', cart);

  // KeyPad Pressing Function
  const handlePress = key => {
    setError('');
    if (key === '⌫') {
      setPin(pin.slice(0, -1));
    } else if (key === 'CLR') {
      setPin('');
    } else if (pin.length < 6) {
      setPin(pin + key.toString());
    }
  };

  // const fetchAdminLogo = useCallback(async () => {
  //   setLogoLoading(true);
  //   try {
  //     const adminLogo = await getFirestore().collection('admin').doc('admin').get();
  //     setLogoUri(adminLogo.exists ? adminLogo.data().AdminLogoUri : null);
  //     setAdminLogoUri(adminLogo.data().AdminLogoUri);
  //   } catch (error) {
  //     setLogoUri(null);
  //   } finally {
  //     setLogoLoading(false);
  //   }
  // }, []);

  // Handle Agent Login
  const handleLogin = async () => {
    setLoading(true);
    if (pin.length < 6) {
      setError('Agent ID must contain 6 digits');
      setLoading(false);
      return;
    }
    try {
      const isExist = await getFirestore().collection('agents').doc(pin).get();
      if (!isExist.exists) {
        setError("Agent doesn't exist");
        setLoading(false);
        return;
      }
      setAgentData(isExist.data());
      setIsVisible(true);
      setModalError('');
      setModalContent('Successfully logged in');
    } catch (error) {
      setModalContent('');
      setModalError('Please try again later');
    } finally {
      setLoading(false);
    }
  };

  // Backup and Restore gdrive backup
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreModalVisible, setRestoreVisible] = useState(false);
  const [restoreModalContent, setRestoreModalContent] = useState('');

  const RestoreDataFromDrive = async () => {
    setRestoreLoading(true);
    try {
      const userId = agent.AgentID;
      await GoogleSignin.signIn();
      const currentUser = await GoogleSignin.getTokens();
      const token = currentUser.accessToken;
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
        setRestoreModalContent("Data couldn't found");
        return;
      }
      const latestFile = searchData.files[0];
      const downloadResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${latestFile.id}?alt=media`,
        {
          method: 'GET',
          headers: {Authorization: `Bearer ${token}`},
        },
      );
      if (!downloadResponse.ok) {
        setRestoreModalContent("Error downloading file");
        return;
      }
      const jsonData = await downloadResponse.json();
      await setCartFromBackup(jsonData[1]);
      setRestoreModalContent('Restore successful for user');
    } catch (error) {
      console.error('Error restoring backup:', error);
    } finally {
      setRestoreLoading(false);
    }
  };

  // Event Handlers
  const handleErrorModalClose = () => {
    setIsErrorVisible(false);
    setModalError('');
    setModalContent('');
  };

  const handleRestoreModalClose = () => {
    setIsVisible(false);
    setModalError('');
    setModalContent('');
    setRestoreVisible(false);
    setTimeout(() => {
      setAuthUser('Agent');
    }, 500);
  };

  const handleSuccessModalProceed = () => {
    setIsVisible(false);
    setModalError('');
    setModalContent('');
    setRestoreVisible(true);
    RestoreDataFromDrive();
  };

  // // Effects
  // useEffect(() => {
  //   fetchAdminLogo();
  // }, [fetchAdminLogo]);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        '103001125235-rrvtlq3toiv24psed413e1d0h18e8m3s.apps.googleusercontent.com',
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
  }, []);

  return (
    <TouchableWithoutFeedback>
      <View style={styles.container}>
        <Header />
        <View style={styles.Innercontainer}>
          <Text style={styles.headerText}>AGENT LOGIN</Text>
          <View>
            <View style={[styles.imageWrapper, logoLoading && styles.imageWrapperLoading]}>
              {logoLoading ? (
                <View>
                  <ActivityIndicator 
                    animating={true}
                    color={MD2Colors.blue900}
                  />
                </View>
              ) : (
                <FastImage
                  resizeMode='stretch'
                  style={styles.LogoImage}
                  source={
                    adminLogoUri === null || adminLogoUri === undefined
                      ? require('../images/avatar.png') 
                      : { uri: adminLogoUri }
                  }
                />
              )}
            </View>
          </View>
          <View>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="key"
                size={dimensions.md}
                style={styles.iconMargin}
              />
              <TextInput
                placeholder="Enter your Agent ID"
                numberOfLines={1}
                style={styles.textInputStyle}
                value={pin}
                editable={false}
              />
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>

          <View>
            {[arrayButton1, arrayButton2, arrayButton3].map((row, rowIndex) => (
              <View key={rowIndex} style={styles.keypadContainer}>
                {row.map(btn => (
                  <Pressable
                    key={btn}
                    style={styles.singleKeyContainer}
                    onPress={() => handlePress(btn)}>
                    <Text style={styles.btnText}>{btn.toString()}</Text>
                  </Pressable>
                ))}
              </View>
            ))}
          </View>
          <View>
            <RNEUButton 
              loading={loading} 
              onPress={loading ? null : handleLogin}  
              ViewComponent={LinearGradient} 
              linearGradientProps={styles.buttonGradientProps}
              buttonStyle={styles.loginButton}
              titleStyle={styles.loginButtonTitle}
            >
              Login
            </RNEUButton>
          </View>
        </View>

        <Footer />

        <Modal
          visible={isErrorVisible}
          contentContainerStyle={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Foundation
              name="alert"
              color={colors.red}
              size={dimensions.width / 4}
            />
            <Text style={styles.modalText}>{modalError}</Text>
            <Button
              onPress={handleErrorModalClose}
              style={styles.modalButton}
              textColor={colors.pureWhite}
              buttonColor={colors.darkblue}
            >
              Try again
            </Button>
          </View>
        </Modal>

        <Modal
          visible={restoreModalVisible}
          contentContainerStyle={styles.modalContainer}>
          <View style={styles.modalContent}>
            {restoreLoading ? (
              <>
                <ActivityIndicator size='large' />
                <Text style={styles.modalTextLoading}>Restoring backup...</Text>
              </>
            ) : (
              <>
                {restoreModalContent === 'Restore successful for user' ? (
                  <AntDesign 
                    name="checkcircle"
                    color="green"
                    size={dimensions.width / 4}
                  />
                ) : (
                  <Foundation 
                    name="alert"
                    color={colors.red}
                    size={dimensions.width / 4}
                  />
                )}
                <Text style={styles.modalText}>{restoreModalContent}</Text>
                <Button
                  onPress={handleRestoreModalClose}
                  style={styles.modalButton}
                  textColor={colors.pureWhite}
                  buttonColor={colors.darkblue}
                >
                  Proceed to Homepage
                </Button>
              </>
            )}
          </View>
        </Modal>

        <Modal
          visible={isVisible}
          contentContainerStyle={styles.modalContainer}>
          <View style={styles.modalContent}>
            <AntDesign
              name="checkcircle"
              color="green"
              size={dimensions.width / 4}
            />
            <Text style={styles.modalText}>{modalContent}</Text>
            <Button
              onPress={restoreLoading ? null : handleSuccessModalProceed}
              style={styles.modalButton}
              textColor={colors.pureWhite}
              buttonColor={colors.darkblue}
            >
              Proceed
            </Button>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default AgentLogin;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  Innercontainer: {
    flex: 1,
    backgroundColor: colors.halfWhite,
    alignItems: 'center',
    paddingBottom: dimensions.xl * 5,
    gap: dimensions.sm / 2,
    paddingTop: dimensions.md * 2,
  },
  LogoImage: {
    height: dimensions.width / 4,
    width: dimensions.width / 4,
  },
  imageWrapper: {
    height: dimensions.width / 4,
    width: dimensions.width / 4,
    borderRadius: dimensions.width / 8,
    overflow: 'hidden',
  },
  imageWrapperLoading: {
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    borderColor: colors.lightGray,
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: dimensions.sm / 6,
    borderRadius: dimensions.sm,
    backgroundColor: colors.pureWhite,
    gap: dimensions.sm / 2,
    width: dimensions.width / 1.5,
  },
  textInputStyle: {
    width: '80%',
    fontFamily: fonts.regular,
  },
  headerText: {
    fontFamily: fonts.bold,
    fontSize: dimensions.sm * 2,
  },
  LoginContainer: {
    width: dimensions.width / 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  loginText: {
    color: colors.pureWhite,
    fontFamily: fonts.bold,
  },
  buttonGradientProps: {
    colors: [colors.orange, colors.darkblue],
    start: { x: 0, y: 0.5 },
    end: { x: 1, y: 0.5 },
  },
  loginButton: {
    width: dimensions.width / 2,
    borderRadius: dimensions.sm,
    height: dimensions.sm * 3,
  },
  loginButtonTitle: {
    fontFamily: fonts.bold,
  },
  keypadContainer: {
    flexDirection: 'row',
    backgroundColor: colors.pureWhite,
  },
  singleKeyContainer: {
    borderColor: colors.grayText,
    borderWidth: 1,
    width: dimensions.xl * 2,
    height: dimensions.xl * 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontFamily: fonts.bold,
    fontSize: dimensions.xl / 2,
  },
  FABCameraIcon: {
    position: 'absolute',
    bottom: dimensions.sm / 2.25,
    right: dimensions.sm / 2.25,
    borderColor: colors.black,
    borderWidth: 1,
    borderRadius: dimensions.sm,
    backgroundColor: colors.black,
  },
  errorText: {
    color: 'red',
    fontSize: dimensions.sm,
    alignSelf: 'flex-start',
  },
  loaderContainer: {
    position: 'absolute',
    width: '100%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  uploadLogoText: {
    fontFamily: fonts.semibold,
  },
  iconMargin: {
    marginLeft: dimensions.sm,
  },
  modalContainer: {
    backgroundColor: colors.pureWhite,
    height: dimensions.height / 3,
    margin: dimensions.xl,
    borderRadius: dimensions.sm,
  },
  modalContent: {
    alignItems: 'center',
  },
  modalText: {
    fontFamily: fonts.semibold,
    marginTop: dimensions.sm,
  },
  modalTextLoading: {
    fontFamily: fonts.semibold,
    marginTop: dimensions.sm,
  },
  modalButton: {
    paddingHorizontal: dimensions.xl,
    margin: dimensions.sm,
  },
});