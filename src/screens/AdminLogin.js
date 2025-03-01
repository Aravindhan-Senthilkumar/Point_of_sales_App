import {
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  Image,
  TextInput,
  TouchableOpacity,
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
import {ActivityIndicator, Button, MD2Colors, Modal} from 'react-native-paper';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Foundation from 'react-native-vector-icons/Foundation';
import useAdminStore from '../store/useAdminStore';
import useAuthStore from '../store/useAuthStore';
import {GoogleSignin} from '@react-native-google-signin/google-signin';

const AdminLogin = () => {
  // State Updates
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

  //Zustand Store
  const {adminUsername, setAdminUserName, setAdminId, adminId} =
    useAdminStore();

  //LogoUploadingFirebaseStorage
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
        if (!imageUri) {
          setIsErrorVisible(true);
          setModalContent('');
          setModalError('No image is selected');
          return;
        }
        setUploadingLogo(true);
        try {
          // Upload to Firebase Storage
          const fileName = `admin_logos/${adminUsername}/logo.jpg`;
          const reference = firebase.storage().ref(fileName);
          const responseBlob = fetch(imageUri);
          const blob = responseBlob.blob();
          await reference.put(blob);
          const imageUrl = await reference.getDownloadURL();
          // Upload URL to Firestore
          if (adminUsername) {
            await getFirestore()
              .collection('admin')
              .doc(adminUsername)
              .set({AdminLogoUri: imageUrl}, {merge: true});
            setLogoUri(imageUrl);
            setIsVisible(true);
            setModalError('');
            setModalContent('Logo uploaded successfully!!!');
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
  //Login
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
      if (isExists.data().AdminLogoUri) {
        setLogoUri(isExists.data().AdminLogoUri);
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

  // useEffect(() => {
  //   GoogleSignin.configure({
  //     webClientId:
  //       '103001125235-rrvtlq3toiv24psed413e1d0h18e8m3s.apps.googleusercontent.com',
  //     scopes: ['https://www.googleapis.com/auth/drive.file'],
  //   });
  // }, []);

  // const processingCollection = collectionData => {
  //   return collectionData.map(item => {
  //     const {id, ...fields} = item;
  //     return {
  //       documentId: id,
  //       fieldData: fields,
  //     };
  //   });
  // };

  // const [success, setSuccess] = useState(false);
  // const [restoreLoading, setRestoreLoading] = useState(false);

  // const restoringDataFunction = async (data, name) => {
  //   setRestoreLoading(true);
  //   setSuccess(false);
  //   try {
  //     for (const item of data) {
  //       await getFirestore()
  //         .collection(name)
  //         .doc(item.documentId)
  //         .set(item.fieldData);
  //     }
  //     setSuccess(true);
  //   } catch (error) {
  //     console.log(`Error restoring ${name} collection`, error);
  //     throw error;
  //   } finally {
  //     setRestoreLoading(false);
  //   }
  // };
   const [restoreFunctionLoading, setRestoreFunctionLoading] = useState(false);
  const [restoreModalContent, setRestoreModalContent] = useState('');
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);
  // const RestoreDataFromDrive = async () => {
  //   setRestoreModalVisible(true);
  //   setRestoreFunctionLoading(true);
  //   try {
  //     const userId = adminId;
  //     await GoogleSignin.signIn();
  //     const currentUser = await GoogleSignin.getTokens();
  //     const token = currentUser.accessToken;

  //     // Search for the latest backup file in the root directory
  //     const searchResponse = await fetch(
  //       `https://www.googleapis.com/drive/v3/files?q=name contains 'backup_${userId}_'&orderBy=createdTime desc&fields=files(id, name)`,
  //       {
  //         method: 'GET',
  //         headers: {Authorization: `Bearer ${token}`},
  //       },
  //     );

  //     const searchData = await searchResponse.json();
  //     console.log('searchData: ', searchData);
  //     if (!searchData.files || searchData.files.length === 0) {
  //       console.error('No backup files found for user:', userId);
  //       return;
  //     }

  //     const latestFile = searchData.files[0];
  //     console.log('LatestFile', latestFile);
  //     // Download backup file
  //     const downloadResponse = await fetch(
  //       `https://www.googleapis.com/drive/v3/files/${latestFile.id}?alt=media`,
  //       {
  //         method: 'GET',
  //         headers: {Authorization: `Bearer ${token}`},
  //       },
  //     );
  //     console.log('downloadResponse: ', downloadResponse);

  //     if (!downloadResponse.ok) {
  //       console.error('Error downloading file:', await downloadResponse.text());
  //       return;
  //     }

  //     const jsonData = await downloadResponse.json();

  //     const Metadata = processingCollection(jsonData[0]);
  //     const AgentsData = processingCollection(jsonData[1]);
  //     const OrderData = processingCollection(jsonData[2]);
  //     const ProductsData = processingCollection(jsonData[3]);

  //     // Restore Metadata to Firestore
  //     await restoringDataFunction(Metadata, 'metadata');
  //     await restoringDataFunction(AgentsData, 'agents');
  //     await restoringDataFunction(OrderData, 'orders');
  //     await restoringDataFunction(ProductsData, 'products');
  //     setRestoreModalContent('Restored successful');
  //   } catch (error) {
  //     setRestoreModalContent('Restore failed');
  //   } finally {
  //     setRestoreFunctionLoading(false);
  //   }
  // };

  const [integrityLoading, setIntegrityLoading] = useState(false);
  // const checkFireStoreIntegrity = async () => {
  //   setIntegrityLoading(true);
  //   try {
  //     const [agentsSnapShot, ordersSnapShot, ProductsSnapShot, MetadataSnapShot] = await Promise.all([
  //       getFirestore().collection('agents').limit(1).get(),
  //       getFirestore().collection('orders').limit(1).get(),
  //       getFirestore().collection('products').limit(1).get(),
  //       getFirestore().collection('metadata').limit(1).get(),
  //     ]);
  //     const hasAgents = agentsSnapShot.docs.length > 0;
  //     const hasOrders = ordersSnapShot.docs.length > 0;
  //     const hasProducts = ProductsSnapShot.docs.length > 0;
  //     const hasMetadata = MetadataSnapShot.docs.length > 0;

  //     if (!hasAgents)
  //       console.warn('Firestore data missing for Agents Collection');
  //     if (!hasOrders)
  //       console.warn('Firestore data missing for Orders Collection');
  //     if (!hasProducts)
  //       console.warn('Firestore data missing for Products Collection');
  //     if (!hasMetadata)
  //       console.warn('Firestore data missing for metadata Collection');

  //     return !(hasAgents && hasOrders && hasProducts && hasMetadata);
  //   } catch (error) {
  //     console.error('Firestore integrity check failed:', error);
  //     return true;
  //   } finally {
  //     setIntegrityLoading(false);
  //   }
  // };

  const handleRestoreNeeded = async () => {
    const restoreNeeded = await checkFireStoreIntegrity();
    if (restoreNeeded) {
      await RestoreDataFromDrive();
    } else {
      setRestoreModalVisible(true);
      setRestoreModalContent('No restore needed');
    }
  };
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
                    logoUri ? {uri: logoUri} : require('../images/avatar.png')
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
                  style={{padding: dimensions.sm / 4}}
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
                style={{marginLeft: dimensions.sm}}
              />
              <TextInput
                placeholder="Enter your username"
                autoCorrect={false}
                numberOfLines={1}
                style={styles.textInputStyle}
                value={username}
                onChangeText={text => {
                  setUserName(text);
                  setError('');
                }}
                editable={isLogin ? false : true}
              />
            </View>
            <View style={styles.inputContainer2}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: dimensions.sm / 2,
                }}>
                <MaterialCommunityIcons
                  name="key"
                  size={dimensions.md}
                  style={{marginLeft: dimensions.sm}}
                />
                <TextInput
                  placeholder="Enter your password"
                  autoCapitalize="none"
                  autoCorrect={false}
                  numberOfLines={1}
                  style={styles.textInputStyle}
                  secureTextEntry={!passwordVisible}
                  value={password}
                  onChangeText={text => {
                    setPassword(text);
                    setError('');
                  }}
                  editable={isLogin ? false : true}
                />
              </View>

              {passwordVisible ? (
                <Pressable onPress={() => setPasswordVisible(!passwordVisible)}>
                  <MaterialCommunityIcons name="eye-off" size={dimensions.md} />
                </Pressable>
              ) : (
                <Pressable onPress={() => setPasswordVisible(!passwordVisible)}>
                  <MaterialCommunityIcons name="eye" size={dimensions.md} />
                </Pressable>
              )}
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          {isLogin ? (
            <View>
              <TouchableOpacity
                style={styles.LoginContainer}
                onPress={
                  () => setAuthUser('Admin')
                }>
                <LinearGradient
                  colors={[colors.orange, colors.darkblue]}
                  start={{x: 1, y: 0}}
                  end={{x: 0, y: 1}}
                  style={styles.gradient}>
                  <Text style={styles.loginText}>Proceed to HomePage</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <TouchableOpacity
                style={styles.LoginContainer}
                onPress={loading ? null : handleLogin}>
                <LinearGradient
                  colors={[colors.orange, colors.darkblue]}
                  start={{x: 1, y: 0}}
                  end={{x: 0, y: 1}}
                  style={styles.gradient}>
                  {loading ? (
                    <ActivityIndicator
                      animating={true}
                      color={MD2Colors.white}
                    />
                  ) : (
                    <Text style={styles.loginText}>Login</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        <Footer />

        <Modal
          visible={isVisible}
          contentContainerStyle={{
            backgroundColor: colors.pureWhite,
            height: dimensions.height / 3,
            margin: dimensions.xl,
            borderRadius: dimensions.sm,
          }}>
          <View style={{alignItems: 'center'}}>
            <AntDesign
              name="checkcircle"
              color="green"
              size={dimensions.width / 4}
            />
            <Text
              style={{fontFamily: fonts.semibold, marginTop: dimensions.sm}}>
              {modalContent}
            </Text>
            <Button
              onPress={() => {
                setIsVisible(false);
                setModalContent('');
              }}
              style={{paddingHorizontal: dimensions.xl, margin: dimensions.sm}}
              textColor={colors.pureWhite}
              buttonColor={colors.darkblue}>
              Proceed
            </Button>
          </View>
        </Modal>

        <Modal
          visible={isErrorVisible}
          contentContainerStyle={{
            backgroundColor: colors.pureWhite,
            height: dimensions.height / 3,
            margin: dimensions.xl,
            borderRadius: dimensions.sm,
          }}>
          <View style={{alignItems: 'center'}}>
            <Foundation
              name="alert"
              color={colors.red}
              size={dimensions.width / 4}
            />
            <Text style={{fontFamily: fonts.semibold}}>{modalError}</Text>
            <Button
              onPress={() => {
                setIsErrorVisible(false);
                setModalError('');
                setModalContent('');
              }}
              style={{paddingHorizontal: dimensions.xl, margin: dimensions.md}}
              textColor={colors.pureWhite}
              buttonColor={colors.darkblue}>
              Try again
            </Button>
          </View>
        </Modal>

        <Modal
          visible={restoreModalVisible}
          contentContainerStyle={{
            backgroundColor: colors.pureWhite,
            height: dimensions.height / 3,
            margin: dimensions.xl,
            borderRadius: dimensions.sm,
          }}>
          <View style={{alignItems: 'center'}}>
            {restoreFunctionLoading ? (
              <>
                <ActivityIndicator size="large" />
                <Text
                  style={{
                    fontFamily: fonts.semibold,
                    marginTop: dimensions.sm,
                  }}>
                  Restoring....
                </Text>
              </>
            ) : restoreModalContent === 'Restore failed' ? (
              <>
                <Foundation
                  name="alert"
                  color={colors.red}
                  size={dimensions.width / 4}
                />
                <Text style={{fontFamily: fonts.semibold}}>
                  {restoreModalContent}
                </Text>
                <Button
                  onPress={() => {
                    setRestoreModalVisible(false);
                    setAuthUser('Admin')
                  }}
                  style={{
                    paddingHorizontal: dimensions.xl,
                    margin: dimensions.md,
                  }}
                  textColor={colors.pureWhite}
                  buttonColor={colors.darkblue}>
                  Proceed
                </Button>
              </>
            ) : (
              <>
                <AntDesign
                  name="checkcircle"
                  color="green"
                  size={dimensions.width / 4}
                />
                <Text
                  style={{
                    fontFamily: fonts.semibold,
                    marginTop: dimensions.sm,
                  }}>
                  {restoreModalContent}
                </Text>
                <Button
                  onPress={() => {
                    setRestoreModalVisible(false);
                    setAuthUser('Admin')
                  }}
                  style={{
                    paddingHorizontal: dimensions.xl,
                    margin: dimensions.sm,
                  }}
                  textColor={colors.pureWhite}
                  buttonColor={colors.darkblue}>
                  Proceed
                </Button>
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
});
