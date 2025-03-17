import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Appbar } from 'react-native-paper';
import { colors } from '../constants/colors';
import { dimensions } from '../constants/dimensions';
import { fonts } from '../constants/fonts';

const AssignViewScreen = () => {
  const item = useRoute().params.data;
  console.log('item: ', item);
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.headerContainer}>
        <Appbar.BackAction
          onPress={() => navigation.goBack()}
          color={colors.pureWhite}
        />
        <Appbar.Content
          title="Assigning Stocks"
          color={colors.pureWhite}
          titleStyle={styles.headerText}
        />
      </Appbar.Header>

      
    </View>
  )
}

export default AssignViewScreen

const styles = StyleSheet.create({
   headerContainer: {
      backgroundColor: colors.orange,
      height: dimensions.xl * 2.25,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerText: {
      fontFamily: fonts.bold,
      fontSize: dimensions.sm * 1.5,
    },
    container: {
      backgroundColor: colors.halfWhite,
      flex: 1,
    },
})