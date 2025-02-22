import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useRoute } from '@react-navigation/native'

const ProductInfoScreen = () => {
  const data = useRoute().params;
  console.log('data: ', data);
  return (
    <View>
      <Text>ProductInfoScreen</Text>
    </View>
  )
}

export default ProductInfoScreen

const styles = StyleSheet.create({})