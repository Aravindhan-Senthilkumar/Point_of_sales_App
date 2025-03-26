import { Image, Pressable,Text, StyleSheet,  View } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { colors } from '../constants/colors';
import { dimensions } from '../constants/dimensions';
import Footer from '../components/Footer';
import { fonts } from '../constants/fonts';
import { useNavigation } from '@react-navigation/native';
import RNFS from 'react-native-fs';
import { getFirestore } from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useAdminStore from '../store/useAdminStore';

const WelcomePage = () => {
  const navigation = useNavigation(); 

  const { setAdminLogoUri,adminLogoUri } = useAdminStore();

  useEffect(useCallback(() => {
    fetchFromLocalStorage();
  },[]),[adminLogoUri])

  const fetchFromLocalStorage = async () => {
    if(adminLogoUri === null || adminLogoUri === undefined){
     await downloadAdminLogo();
    }
  }

  const removeLogoFromLocalStorage = async () => {
    await AsyncStorage.removeItem("AdminLogo")
    const alreadyPresent = await AsyncStorage.getItem("AdminLogo")
    console.log('alreadyPresent: ', alreadyPresent);
    setAdminLogoUri(null)
  }

  const downloadAdminLogo = async () => {
    try{
      const response = await (await getFirestore().collection('admin').doc('admin').get()).data()
      console.log('response: ', response);
      const imageLogo = await response.AdminLogoUri
      console.log('imageLogo: ', imageLogo);
      const localPath = `${RNFS.DocumentDirectoryPath}/AdminLogo.png`

      const downloadedResult =  await RNFS.downloadFile({
        fromUrl:imageLogo,
        toFile:localPath,
      }).promise;

      if(downloadedResult.statusCode !== 200){
        console.log("Error downloading admin logo from firestore");
        return;
      }
      const logoPath = 'file://' + localPath;
      await AsyncStorage.setItem("AdminLogo",logoPath);
      setAdminLogoUri(logoPath)
    }catch(error){
      console.log("Please connect with internet",error)
    }
  }

  return (
    <>
    <View style={styles.container}>

    <View style={styles.container2}>
      <Image 
      source={require('../images/logo.png')}
      style={styles.logoImage}
      />
    </View>


    <View style={styles.Innercontainer}>
      <View style={styles.btnContainer}>
      <Pressable style={styles.PressableContainer} onPress={() => navigation.navigate('AdminLogin')}>
        <Text style={styles.pressableText}>Admin Login</Text>
      </Pressable>
      <Pressable style={styles.PressableContainer} onPress={() => navigation.navigate('AgentLogin')}>
        <Text style={styles.pressableText}>Agent Login</Text>
      </Pressable>
      </View>
    </View> 

    
    <Footer />
    </View>
    </>
  )
}

export default WelcomePage

const styles = StyleSheet.create({
  Innercontainer:{
    flex:1,
    backgroundColor:'f0f0f0',
    justifyContent:'center',
    alignItems:'center',
    marginBottom:dimensions.xl * 2
  },
  btnContainer:{
    gap:dimensions.md
  },
  container:{
    flex:1
  },
  PressableContainer:{
    backgroundColor:colors.pureWhite,
    borderWidth:1,
    borderColor:colors.lightGray,
    paddingHorizontal:dimensions.xl * 2,
    paddingVertical:dimensions.sm,
    borderRadius:dimensions.sm
  },
  pressableText:{
    color:colors.grayText,
    fontFamily:fonts.bold,
    fontSize:dimensions.sm * 1.25
  },
  container2:{
  backgroundColor: colors.orange,
  height:dimensions.height/1.75,
  width:'auto',
  borderBottomLeftRadius:dimensions.xl,
  borderBottomRightRadius:dimensions.xl,
  justifyContent:'center',
  alignItems:'center',
  },
  logoImage:{
    height:dimensions.height/6,
    width:dimensions.height/6,
    resizeMode:'contain'
  }
})