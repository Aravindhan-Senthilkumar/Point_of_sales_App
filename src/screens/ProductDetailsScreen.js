import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useRoute } from '@react-navigation/native'

const ProductDetailsScreen = () => {
  const data = useRoute().params.productData
  console.log(data)
  return (
    <View>
      <Text>ProductDetailsScreen</Text>
    </View>
  )
}

export default ProductDetailsScreen

const styles = StyleSheet.create({})