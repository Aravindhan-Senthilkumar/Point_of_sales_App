import { StyleSheet, Text, View,Image } from 'react-native'
import React from 'react'
import { useRoute } from '@react-navigation/native'

const ProductInfoScreen = () => {
  const data = useRoute().params.item;
  return (
    <View style={{ justifyContent:'center',alignItems:'center',flex:1 }}>
      <Image
      source={{ uri:data.BarcodeImageUri }}
      style={{ height:100,width:200,resizeMode:'cover' }} 
      />
    </View>
  )
}

export default ProductInfoScreen

const styles = StyleSheet.create({})