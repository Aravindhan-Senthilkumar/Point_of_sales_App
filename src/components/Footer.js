import {  StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { colors } from '../constants/colors'
import { dimensions } from '../constants/dimensions'
import { fonts } from '../constants/fonts'

const Footer = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.FooterText}>© 2025 Your Company</Text>
    </View>
  )
}

export default Footer

const styles = StyleSheet.create({
    container:{
      position: 'absolute',
      bottom: 0,
      width: '100%',
      backgroundColor: colors.darkblue,
      paddingVertical: dimensions.sm * 1.75,
      alignItems: 'center',
    },
    FooterText:{
      color:colors.pureWhite,
      fontFamily:fonts.medium
    }
})