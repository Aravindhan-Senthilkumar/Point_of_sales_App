import {
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  Image,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Keyboard,
  ScrollView,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {colors} from '../constants/colors';
import {dimensions} from '../constants/dimensions';
import {fonts} from '../constants/fonts';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import {launchImageLibrary} from 'react-native-image-picker';
import {getFirestore} from '@react-native-firebase/firestore';
import {firebase} from '@react-native-firebase/storage';
import {ActivityIndicator, MD2Colors, Modal} from 'react-native-paper';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Foundation from 'react-native-vector-icons/Foundation';
import useAdminStore from '../store/useAdminStore';
import useAuthStore from '../store/useAuthStore';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import { Button } from '@rneui/themed';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AdminLogin = () => {
  const [logoUri, setLogoUri] = useState(null);
  const [username, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [isLogin, setIsLogin] = useState(false);
  const [modalError, setModalError] = useState('');
  const [isErrorVisible, setIsErrorVisible] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const {adminUsername, setAdminUserName, setAdminId, adminId,adminLogoUri,setAdminLogoUri} = useAdminStore();
  console.log('adminLogoUri: ', adminLogoUri);

  const handleFireStoreUpload = async (name,imageUrl) => {
    await getFirestore()
              .collection('admin')
              .doc(name)
              .set({AdminLogoUri: imageUrl}, {merge: true});
    return true;
  }

  const handleLogoUpload = () => {
    if (isLogin) {
      const options = {mediaType: 'photo', quality: 1};
      launchImageLibrary(options, async response => {
        if (response.didCancel) {
          console.log('User cancelled gallery selection');
          return;
        }
        if (response.errorMessage) {
          console.log('Gallery Error:', response.errorMessage);
          return;
        }
        if (!response.assets || response.assets?.length === 0) {
          setIsErrorVisible(true);
          setModalError('No image selected');
          return;
        }
        const imageUri = response.assets[0]?.uri;
        console.log('imageUri: ', imageUri);
        if (!imageUri) {
          setIsErrorVisible(true);
          setModalContent('');
          setModalError('No image is selected');
          return;
        }
        setUploadingLogo(true);
        try {
          const fileName = `admin_logos/${adminUsername}/logo.jpg`;
          console.log('fileName: ', fileName);
          const reference = await firebase.storage().ref(fileName);
          console.log('reference: ', reference);
          const responseBlob = await fetch(imageUri);
          console.log('responseBlob: ', responseBlob);
          const blob = await responseBlob.blob();
          console.log('blob: ', blob);
          await reference.put(blob);
          const imageUrl = await reference.getDownloadURL();
          console.log('imageUrl: ', imageUrl);
          if (adminUsername) {
            const hasPermissions = await handleFireStoreUpload(adminUsername,imageUrl);
            if(hasPermissions){
            await downloadAdminLogo();
            setIsVisible(true);
            setModalError('');
            setModalContent('Logo uploaded successfully!!!');
            }
          } else {
            console.log('Agent ID not found. Cannot upload logo to Firestore.');
          }
        } catch (error) {
          setIsErrorVisible(true);
          setModalContent('');
          setModalError('Error while uploading logo');
        } finally {
          setUploadingLogo(false);
        }
      });
    } else {
      setIsErrorVisible(true);
      setModalContent('');
      setModalError('Login first');
    }
  };

  const {setAuthUser} = useAuthStore();

  const downloadAdminLogo = async () => {
    try {
      // Fetch logo URL from Firestore
      const response = await getFirestore().collection('admin').doc('admin').get();
      if (!response.exists) {
        console.log('Admin document not found');
        return;
      }
      const imageLogo = response.data().AdminLogoUri;
      if (!imageLogo) {
        console.log('AdminLogoUri not found in Firestore');
        return;
      }
  
      console.log('New Admin Logo URL:', imageLogo);
      
      // Local storage path for the admin logo
      const localPath = `${RNFS.DocumentDirectoryPath}/AdminLogo.png`;
      
    const fileExists = await RNFS.exists(localPath);
    if (fileExists) {
      await RNFS.unlink(localPath);
      console.log('Old admin logo deleted');
    }

      // Download the image and overwrite existing file
      const downloadedResult = await RNFS.downloadFile({
        fromUrl: imageLogo,
        toFile: localPath,
      }).promise;
  
      if (downloadedResult.statusCode !== 200) {
        console.log("Error downloading admin logo from Firestore");
        return;
      }
  
      console.log("Admin logo updated successfully!");
  
      // Update UI with the new logo
      setAdminLogoUri(`file://${localPath}?t=${new Date().getTime()}`);
    } catch (error) {
      console.log("Error downloading admin logo:", error);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      if (!username || !password) {
        setError('Please fill up the fields');
        setLoading(false);
        return;
      }
      const trimmedUsername = username.trimEnd();
      const isExists = await getFirestore()
        .collection('admin')
        .doc(trimmedUsername)
        .get();

      if (!isExists.exists) {
        setError('Invalid Admin credentials');
        setLoading(false);
        return;
      }
      const dbPassword = isExists.data().password;

      if (dbPassword !== password.trimEnd()) {
        setError('Wrong password');
        setLoading(false);
        return;
      }
      setIsLogin(true);
      setAdminId(isExists.data().id);
      setAdminUserName(isExists.data().username);
      setIsVisible(true);
      setModalContent('Successfully logged in');
    } catch (error) {
      console.log('Error while signing in', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        '103001125235-rrvtlq3toiv24psed413e1d0h18e8m3s.apps.googleusercontent.com',
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
  }, []);

  const processingCollection = collectionData => {
    return collectionData.map(item => {
      const {id, ...fields} = item;
      return {
        documentId: id,
        fieldData: fields,
      };
    });
  };

  const [success, setSuccess] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  const restoringDataFunction = async (data, name) => {
    setRestoreLoading(true);
    setSuccess(false);
    try {
      for (const item of data) {
        await getFirestore()
          .collection(name)
          .doc(item.documentId)
          .set(item.fieldData);
      }
      setSuccess(true);
    } catch (error) {
      console.log(`Error restoring ${name} collection`, error);
      throw error;
    } finally {
      setRestoreLoading(false);
    }
  };

  const [restoreFunctionLoading, setRestoreFunctionLoading] = useState(false);
  const [restoreModalContent, setRestoreModalContent] = useState('');
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);

  const RestoreDataFromDrive = async () => {
    setRestoreModalVisible(true);
    setRestoreFunctionLoading(true);
    try {
      const userId = adminId;
      console.log('userId: ', userId);
      await GoogleSignin.signIn();
      const currentUser = await GoogleSignin.getTokens();
      console.log('currentUser: ', currentUser);
      const token = currentUser.accessToken;
      console.log('token: ', token);

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

      const Metadata = processingCollection(jsonData[0]);
      console.log('Metadata: ', Metadata);
      const AgentsData = processingCollection(jsonData[1]);
      console.log('AgentsData: ', AgentsData);
      const OrderData = processingCollection(jsonData[2]);
      console.log('OrderData: ', OrderData);
      const ProductsData = processingCollection(jsonData[3]);
      console.log('ProductsData: ', ProductsData);

      await restoringDataFunction(Metadata, 'metadata');
      await restoringDataFunction(AgentsData, 'agents');
      await restoringDataFunction(OrderData, 'orders');
      await restoringDataFunction(ProductsData, 'products');
      setRestoreModalContent('Restored successful');
    } catch (error) {
      setRestoreModalContent('Restore failed');
    } finally {
      setRestoreFunctionLoading(false);
    }
  };

  const [integrityLoading, setIntegrityLoading] = useState(false);
  const checkFireStoreIntegrity = async () => {
    setIntegrityLoading(true);
    try {
      const [
        agentsSnapShot,
        ordersSnapShot,
        ProductsSnapShot,
        MetadataSnapShot,
      ] = await Promise.all([
        getFirestore().collection('agents').limit(1).get(),
        getFirestore().collection('orders').limit(1).get(),
        getFirestore().collection('products').limit(1).get(),
        getFirestore().collection('metadata').limit(1).get(),
      ]);
      const hasAgents = agentsSnapShot.docs.length > 0;
      const hasOrders = ordersSnapShot.docs.length > 0;
      const hasProducts = ProductsSnapShot.docs.length > 0;
      const hasMetadata = MetadataSnapShot.docs.length > 0;

      if (!hasAgents)
        console.warn('Firestore data missing for Agents Collection');
      if (!hasOrders)
        console.warn('Firestore data missing for Orders Collection');
      if (!hasProducts)
        console.warn('Firestore data missing for Products Collection');
      if (!hasMetadata)
        console.warn('Firestore data missing for metadata Collection');

      return !(hasAgents && hasOrders && hasProducts && hasMetadata);
    } catch (error) {
      console.error('Firestore integrity check failed:', error);
      return true;
    } finally {
      setIntegrityLoading(false);
    }
  };

  const handleRestoreNeeded = async () => {
    const restoreNeeded = await checkFireStoreIntegrity();
    if (restoreNeeded) {
      await RestoreDataFromDrive();
    } else {
      setRestoreModalVisible(true);
      setRestoreModalContent('No restore needed');
    }
  };

  const togglePasswordVisible = () => {
    setPasswordVisible(!passwordVisible)
  }

  const handleChangeUsername = (text) => {
    setUserName(text);
    setError('');
  }

  const handleChangePassword = (text) => {
    setPassword(text);
    setError('');
  }

  const handleSuccesModalFunction = () => {
    setIsVisible(false);
    setModalContent('');
  }
  const handleErrorModalFunction = () => {
    setIsErrorVisible(false);
    setModalError('');
    setModalContent('');
  }

  const handleRestoreFailedModalFunction = () => {
    setRestoreModalVisible(false);
    handleRestoreNeeded();
  }

  const handleNavigateToHomepage = () => {
    setRestoreModalVisible(false);
    setAuthUser('Admin');
  }
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <Header />

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.headerText}>ADMIN LOGIN</Text>

          <View>
            <View style={styles.imageWrapper}>
              {uploadingLogo ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator
                    animating={true}
                    color={MD2Colors.orange800}
                    size="small"
                  />
                </View>
              ) : (
                <Image
                  style={styles.LogoImage}
                  source={
                    adminLogoUri !== null || adminLogoUri !== undefined ? {uri: adminLogoUri} : require('../images/avatar.png')
                  }
                />
              )}
            </View>
            <Pressable style={styles.FABCameraIcon} onPress={handleLogoUpload}>
              {logoUri ? (
                <Feather
                  name="refresh-ccw"
                  size={dimensions.xl / 2}
                  color={colors.pureWhite}
                  style={styles.featherIconRefresh}
                />
              ) : (
                <Feather
                  name="plus"
                  size={dimensions.md}
                  color={colors.pureWhite}
                />
              )}
            </Pressable>
          </View>
          {isLogin ? (
            <Text style={styles.uploadLogoText}>Upload your logo here</Text>
          ) : null}

          <View>
            <View style={styles.inputContainer1}>
              <MaterialCommunityIcons
                name="account"
                size={dimensions.md}
                style={styles.iconMarginLeft}
              />
              <TextInput
                placeholder="Enter your username"
                autoCorrect={false}
                numberOfLines={1}
                style={styles.textInputStyle}
                value={username}
                onChangeText={(text) => handleChangeUsername(text)}
                editable={isLogin ? false : true}
              />
            </View>
            <View style={styles.inputContainer2}>
              <View style={styles.passwordInputWrapper}>
                <MaterialCommunityIcons
                  name="key"
                  size={dimensions.md}
                  style={styles.iconMarginLeft}
                />
                <TextInput
                  placeholder="Enter your password"
                  autoCapitalize="none"
                  autoCorrect={false}
                  numberOfLines={1}
                  style={styles.textInputStyle}
                  secureTextEntry={!passwordVisible}
                  value={password}
                  onChangeText={(text) => handleChangePassword(text)}
                  editable={isLogin ? false : true}
                />
              </View>

              {passwordVisible ? (
                <Pressable onPress={togglePasswordVisible}>
                  <MaterialCommunityIcons
                    name="eye-off"
                    size={dimensions.md}
                  />
                </Pressable>
              ) : (
                <Pressable onPress={togglePasswordVisible}>
                  <MaterialCommunityIcons name="eye" size={dimensions.md} />
                </Pressable>
              )}
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          {isLogin ? (
            <View>
              <Button
                onPress={handleRestoreNeeded}
                ViewComponent={LinearGradient}
                linearGradientProps={{
                  colors: [colors.orange, colors.darkblue],
                  start: {x: 0, y: 0.5},
                  end: {x: 1, y: 0.5},
                }}
                buttonStyle={styles.buttonStyle}
                titleStyle={styles.buttonTitleStyle}>
                Proceed to Homepage
              </Button>
            </View>
          ) : (
            <View>
              <Button
                loading={loading}
                onPress={loading ? null : handleLogin}
                ViewComponent={LinearGradient}
                linearGradientProps={{
                  colors: [colors.orange, colors.darkblue],
                  start: {x: 0, y: 0.5},
                  end: {x: 1, y: 0.5},
                }}
                buttonStyle={styles.buttonStyle}
                titleStyle={styles.buttonTitleStyle}>
                Login
              </Button>
            </View>
          )}
        </ScrollView>

        <Footer />

        <Modal
          visible={isVisible}
          contentContainerStyle={styles.modalContentContainer}>
          <View style={styles.modalInnerContainer}>
            <AntDesign
              name="checkcircle"
              color="green"
              size={dimensions.width / 4}
            />
            <Text style={styles.modalText}>{modalContent}</Text>
            <Button
              onPress={handleSuccesModalFunction}
              title="Proceed"
              style={styles.modalButtonWrapper}
              buttonStyle={styles.modalButtonStyle}
            />
          </View>
        </Modal>

        <Modal
          visible={isErrorVisible}
          contentContainerStyle={styles.modalContentContainer}>
          <View style={styles.modalInnerContainer}>
            <Foundation
              name="alert"
              color={colors.red}
              size={dimensions.width / 4}
            />
            <Text style={styles.modalErrorText}>{modalError}</Text>
            <Button
              onPress={handleErrorModalFunction}
              title="Try again"
              style={styles.modalButtonWrapper}
              buttonStyle={styles.modalButtonStyle}
            />
          </View>
        </Modal>

        <Modal
          visible={restoreModalVisible}
          contentContainerStyle={styles.modalContentContainer}>
          <View style={styles.modalInnerContainer}>
            {restoreFunctionLoading ? (
              <>
                <ActivityIndicator size="large" />
                <Text style={styles.modalLoadingText}>Restoring....</Text>
              </>
            ) : restoreModalContent === 'Restore failed' ? (
              <>
                <Foundation
                  name="alert"
                  color={colors.red}
                  size={dimensions.width / 4}
                />
                <Text style={styles.modalErrorText}>{restoreModalContent}</Text>
                <Button
                  onPress={handleRestoreFailedModalFunction}
                  title="Proceed"
                  style={styles.modalButtonWrapper}
                  buttonStyle={styles.modalButtonStyle}
                />
              </>
            ) : (
              <>
                <AntDesign
                  name="checkcircle"
                  color="green"
                  size={dimensions.width / 4}
                />
                <Text style={styles.modalText}>{restoreModalContent}</Text>
                <Button
                  onPress={handleNavigateToHomepage}
                  title="Proceed"
                  style={styles.modalButtonWrapper}
                  buttonStyle={styles.modalButtonStyle}
                />
              </>
            )}
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

export default AdminLogin;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: colors.halfWhite,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: dimensions.xl * 6,
    gap: dimensions.sm / 2,
  },
  LogoImage: {
    height: dimensions.width / 4,
    width: dimensions.width / 4,
    resizeMode: 'stretch',
  },
  imageWrapper: {
    height: dimensions.width / 4,
    width: dimensions.width / 4,
    borderRadius: dimensions.width / 8,
    overflow: 'hidden',
  },
  inputContainer1: {
    flexDirection: 'row',
    borderColor: colors.lightGray,
    borderWidth: 1,
    alignItems: 'center',
    borderRadius: dimensions.sm,
    backgroundColor: colors.pureWhite,
    gap: dimensions.sm / 2,
    width: dimensions.width / 1.25,
    marginVertical: dimensions.sm / 2,
  },
  inputContainer2: {
    flexDirection: 'row',
    borderColor: colors.lightGray,
    borderWidth: 1,
    alignItems: 'center',
    borderRadius: dimensions.sm,
    backgroundColor: colors.pureWhite,
    width: dimensions.width / 1.25,
    marginVertical: dimensions.sm / 2,
  },
  textInputStyle: {
    width: '75%',
    fontFamily: fonts.regular,
    paddingVertical: 0,
    height: dimensions.sm * 3,
  },
  headerText: {
    fontFamily: fonts.medium,
    fontSize: dimensions.xl,
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
  gradient: {
    width: dimensions.width / 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: dimensions.md / 2,
    borderRadius: dimensions.sm,
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
    marginLeft: dimensions.sm,
  },
  uploadLogoText: {
    fontFamily: fonts.semibold,
  },
  loaderContainer: {
    position: 'absolute',
    width: '100%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  featherIconRefresh: {
    padding: dimensions.sm / 4,
  },
  iconMarginLeft: {
    marginLeft: dimensions.sm,
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: dimensions.sm / 2,
  },
  buttonStyle: {
    width: dimensions.width / 1.5,
    borderRadius: dimensions.sm,
    height: dimensions.sm * 3,
  },
  buttonTitleStyle: {
    fontFamily: fonts.bold,
  },
  modalContentContainer: {
    backgroundColor: colors.pureWhite,
    height: dimensions.height / 3,
    margin: dimensions.xl,
    borderRadius: dimensions.sm,
  },
  modalInnerContainer: {
    alignItems: 'center',
  },
  modalText: {
    fontFamily: fonts.semibold,
    marginTop: dimensions.sm,
  },
  modalErrorText: {
    fontFamily: fonts.semibold,
  },
  modalButtonWrapper: {
    width: '80%',
  },
  modalButtonStyle: {
    paddingHorizontal: dimensions.md * 2,
    margin: dimensions.sm,
    backgroundColor: colors.darkblue,
    borderRadius: dimensions.md,
  },
  modalLoadingText: {
    fontFamily: fonts.semibold,
    marginTop: dimensions.sm,
  }
});