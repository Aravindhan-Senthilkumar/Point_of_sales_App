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
import React, {useState} from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {colors} from '../constants/colors';
import {dimensions} from '../constants/dimensions';
import {fonts} from '../constants/fonts';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import {launchImageLibrary} from 'react-native-image-picker';
import {getFirestore} from '@react-native-firebase/firestore';
import {ActivityIndicator, Button, MD2Colors, Modal} from 'react-native-paper';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Foundation from 'react-native-vector-icons/Foundation';
import axios from 'axios';
import useAdminStore from '../store/useAdminStore';

const AdminLogin = () => {

  const navigation = useNavigation();
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
  const {adminUsername, setAdminUserName} = useAdminStore();

  //Cloudinary API
  const CLOUDINARY_URL =
    'https://api.cloudinary.com/v1_1/dx5pxvbcv/image/upload';
  const UPLOAD_PRESET = 'admin_logos';

  //Logo Uploading
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
          // Upload to Cloudinary
          const data = new FormData();
          data.append('file', {
            uri: imageUri,
            type: 'image/jpeg',
            name: 'logo.jpg',
          });
          data.append('upload_preset', UPLOAD_PRESET);
          data.append('cloud_name', 'dx5pxvbcv');

          const cloudResponse = await axios.post(CLOUDINARY_URL, data, {
            headers: {'Content-Type': 'multipart/form-data'},
          });

          const imageUrl = cloudResponse.data.secure_url;
          console.log('Uploaded Image URL:', imageUrl);
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
      setAdminUserName(trimmedUsername);
      setIsVisible(true);
      setModalContent('Successfully logged in');
    } catch (error) {
      console.log('Error while signing in', error);
    } finally {
      setLoading(false);
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
                onPress={() => navigation.navigate('AdminHomePage')}>
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
