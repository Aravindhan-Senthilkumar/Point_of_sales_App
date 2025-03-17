import { StyleSheet, View } from 'react-native'
import React from 'react'
import { colors } from '../constants/colors'
import { dimensions } from '../constants/dimensions'
import { Appbar } from 'react-native-paper'

const Header = () => {

  return (
    <View>
      <Appbar.Header style={styles.headerContainer}>
      </Appbar.Header>
    </View>
  )
}


export default Header

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: colors.orange,
    height: dimensions.xl * 2.25,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  }
})