import { StyleSheet, View } from 'react-native'
import React from 'react'
import { colors } from '../constants/colors'
import { dimensions } from '../constants/dimensions'

const Header = () => {

  return (
    <View style={styles.container}>
    </View>
  )
}


export default Header

const styles = StyleSheet.create({
  container:{
    backgroundColor:colors.orange,
    height:dimensions.xl * 2.25,
    width:'100%'
  }
})