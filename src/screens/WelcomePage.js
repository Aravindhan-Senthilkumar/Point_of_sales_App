import { Image, Pressable,Text, StyleSheet, TouchableWithoutFeedback, View } from 'react-native'
import React from 'react'
import { colors } from '../constants/colors';
import { dimensions } from '../constants/dimensions';
import Footer from '../components/Footer';
import { fonts } from '../constants/fonts';
import { useNavigation } from '@react-navigation/native';


const WelcomePage = () => {
  const navigation = useNavigation();
  
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
    paddingBottom:dimensions.xl * 2.5
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
  height:dimensions.height/2,
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