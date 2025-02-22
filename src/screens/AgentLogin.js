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
import React, {useEffect, useState} from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {colors} from '../constants/colors';
import {dimensions} from '../constants/dimensions';
import {fonts} from '../constants/fonts';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import {launchImageLibrary} from 'react-native-image-picker';
import Feather from 'react-native-vector-icons/Feather';
import {ActivityIndicator, Button, MD2Colors, Modal} from 'react-native-paper';
import axios from 'axios';
import useUserStore from '../store/useUserStore';
import Foundation from 'react-native-vector-icons/Foundation';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {getFirestore} from '@react-native-firebase/firestore';

const AgentLogin = () => {
  const navigation = useNavigation();

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
  const [logoLoading,setLogoLoading] = useState(false);
  const [logoUri, setLogoUri] = useState();

  //Zustand Store
  const {setAgentData, agent} = useUserStore();

  //KeyPad Pressing Function
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


  //Fetching Admin LOGO 
  useEffect(() => {
    setLogoLoading(true)
    try{
      const fetchadminLogo = async () => {
      const adminLogo = await getFirestore().collection('admin').doc('admin').get();
        setLogoUri(adminLogo.data().AdminLogoUri)
      }
      fetchadminLogo();
    }catch(error){
     setLogoUri(null) 
    }finally{
      setLogoLoading(false)
    }
  },[])

  //Handle Agent Login
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
      }else{
        console.log("Agent exists")
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

  //Logo Uploading

  return (
    <TouchableWithoutFeedback>
      <View style={styles.container}>
        <Header />

        <View style={styles.Innercontainer}>
          <Text style={styles.headerText}>AGENT LOGIN</Text>
          <View>
            <View style={[styles.imageWrapper, !logoLoading ? { justifyContent:'center',alignItems:'center' } : null]}>
              {
                logoLoading 
                ? (
                  <View style={{ alignSelf:'center' }}>
                   <ActivityIndicator 
                   animating={true}
                   color={MD2Colors.blue900}
                   />
                    </View>
                )
                : (
                    <Image
                    style={styles.LogoImage}
                    source={
                      logoUri=== null ? require('../images/avatar.png') : { uri:logoUri }
                    }
                  />
                )
              }
                
            </View>
          </View>
          <View>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="key"
                size={dimensions.md}
                style={{marginLeft: dimensions.sm}}
              />
              <TextInput
                placeholder="Enter your Agent ID"
                numberOfLines={1}
                style={styles.textInputStyle}
                value={pin}
                editable={false}
              />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
              <TouchableOpacity
                style={styles.LoginContainer}
                onPress={() => handleLogin()}>
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
        </View>

        <Footer />

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
                setModalError('');
                setModalContent('');
                setTimeout(() => {
                  navigation.replace('AgentHomePage')
                },500)
              }}
              style={{paddingHorizontal: dimensions.xl, margin: dimensions.sm}}
              textColor={colors.pureWhite}
              buttonColor={colors.darkblue}>
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
    resizeMode: 'stretch',
  },
  imageWrapper: {
    height: dimensions.width / 4,
    width: dimensions.width / 4,
    borderRadius: dimensions.width / 8,
    overflow: 'hidden',
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
  gradient: {
    width: dimensions.width / 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: dimensions.md / 2,
    borderRadius: dimensions.sm,
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
});
