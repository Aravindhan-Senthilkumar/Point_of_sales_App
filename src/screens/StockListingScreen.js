import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useRoute } from '@react-navigation/native'

const StockListingScreen = () => {
    const data = useRoute().params.item.data;

    console.log('data: ', data);
  return (
    <View>
      <Text>StockListingScreen</Text>
    </View>
  )
}

export default StockListingScreen

const styles = StyleSheet.create({})