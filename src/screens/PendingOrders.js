import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import { colors } from '../constants/colors';
import { dimensions } from '../constants/dimensions';
import { fonts } from '../constants/fonts';
import AntDesign from 'react-native-vector-icons/AntDesign'
import { useRoute } from '@react-navigation/native';
import { Button } from '@rneui/themed';

const PendingOrders = () => {
  const data = useRoute().params.item
  console.log(data)
    // Sample state for pending orders
    const [pendingOrders, setPendingOrders] = useState([
        { id: '1', agentId: 'A001', product: 'Product 1' },
        { id: '2', agentId: 'A002', product: 'Product 2' },
        { id: '3', agentId: 'A003', product: 'Product 3' },
    ]);

    return (
        <View style={styles.container}>
            <FlatList
                data={data}
                renderItem={({ item }) => {
                  console.log(item)
                  return (
                    <View style={styles.cartItem}>
                      <Image source={{ uri: item.productImage }} style={styles.productImage} resizeMode="cover" />
                      <View style={styles.itemDetails}>
                        <Text style={styles.itemName}>
                          <Text style={[styles.itemName, { fontFamily: fonts.semibold }]}>Product ID: </Text>
                          {item.PaymentMethod}
                        </Text>
                        <Text style={styles.itemName}>
                          <Text style={[styles.itemName, { fontFamily: fonts.semibold }]}>Product Name: </Text>
                          {item.AmountPaid}
                        </Text>
                        <Text style={styles.itemName}>
                          <Text style={[styles.itemName, { fontFamily: fonts.semibold }]}>Weight: </Text>
                          {item.weight}g (₹ {item.price})
                        </Text>
                        <View style={styles.quantityContainer}>
                        </View>
                      </View>
                      <View style={styles.priceDeleteContainer}>
                        <Button 
                        title='View'
                        
                        />
                      </View>
                    </View>
                  );
                }}
                keyExtractor={item => item.id}
            />
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    item: {
        backgroundColor: colors.grayText,
        padding: 20,
        marginVertical: 8,
        marginHorizontal: 16,
    },
      cartItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: colors.pureWhite,
        padding: dimensions.sm,
        borderRadius: dimensions.sm,
        marginBottom: dimensions.sm,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      productImage: {
        width: dimensions.width / 4,
        height: dimensions.width / 4,
        borderRadius: dimensions.sm,
        marginRight: dimensions.sm,
        borderWidth: 1,
        borderColor: colors.lightGray,
      },
      itemDetails: {
        flex: 2,
        flexShrink: 1,
      },
      itemName: {
        fontFamily: fonts.regular,
        fontSize: dimensions.sm,
        color: colors.black,
        marginBottom: dimensions.sm / 2, // Space between lines
      },
      quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: dimensions.sm / 2,
        marginTop: dimensions.sm / 2,
      },
      quantityButton: {
        backgroundColor: colors.lightGray,
        padding: dimensions.sm / 2,
        borderRadius: dimensions.sm / 2,
        justifyContent: 'center',
        alignItems: 'center',
      },
      quantityText: {
        fontFamily: fonts.regular,
        fontSize: dimensions.sm,
        color: colors.black,
        marginHorizontal: dimensions.sm,
      },
      priceDeleteContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: 'column',
        marginLeft: dimensions.sm,
        marginTop:dimensions.md
      },
      itemPrice: {
        fontFamily: fonts.regular,
        fontSize: dimensions.sm,
        color: colors.black,
        textAlign: 'center',
        marginBottom: dimensions.sm / 2,
      },
      deleteButton: {
        padding: dimensions.sm / 2,
      },
      deleteIcon: {
        fontSize: dimensions.md,
        color: colors.red,
      },
      emptyCart: {
        fontFamily: fonts.regular,
        fontSize: dimensions.sm,
        color: colors.grayText,
        textAlign: 'center',
        paddingVertical: dimensions.sm,
      },
      footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.pureWhite,
        padding: dimensions.sm,
        borderTopWidth: 1,
        borderTopColor: colors.lightGray,
        elevation: 4,
      },
      totalText: {
        fontFamily: fonts.bold,
        fontSize: dimensions.md,
        color: colors.black,
        marginBottom: dimensions.sm,
        textAlign: 'center',
      },
      proceedButton: {
        backgroundColor: colors.darkblue,
      },
});

export default PendingOrders;
