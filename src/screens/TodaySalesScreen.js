import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../constants/colors';
import { ActivityIndicator, Appbar } from 'react-native-paper';
import { dimensions } from '../constants/dimensions';
import { fonts } from '../constants/fonts';
import { Button } from '@rneui/themed';
import { getFirestore } from '@react-native-firebase/firestore';
import useAgentStore from '../store/useAgentStore';
import { useNavigation } from '@react-navigation/native';

export default function TodaySalesScreen() {
  const navigation = useNavigation();
  const [verificationToken, setVerificationToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchedOrders, setFetchedOrders] = useState([]);
  const [mapArray,setMapArray] = useState([]);
  console.log('fetchedOrders: ', fetchedOrders);
  const { agent } = useAgentStore();
  const [emptySales,setEmptySales] = useState(false);

  const [totalSoldStock, setTotalSoldStock] = useState(0);
  console.log('totalSoldStock: ', totalSoldStock);
  const [totalAvailableStock, setTotalAvailableStock] = useState(0);
  console.log('totalAvailableStock: ', totalAvailableStock);

  useEffect(useCallback(() => {
    fetchOrdersfromFirestore()
  },[fetchOrdersfromFirestore]),[]);

  const fetchOrdersfromFirestore = async () => {
    setLoading(true)
    try{
      const orderRef = await getFirestore().collection('productsales').doc(agent.AgentID)
      console.log('orderRef: ', orderRef);
      const orderSnap = await orderRef.get()
      console.log('orderSnap: ', orderSnap);
      if(!orderSnap.exists){
        console.log("Order not found");
        setEmptySales(true)
        return;
      }
      const orderData = orderSnap.data()
      console.log('orderData: ', orderData);
      setFetchedOrders(orderData)
      setMapArray(orderData.sales)
      fetchTotalStock(orderData.sales)
    }catch(error){
      console.log("Error while fetching orders from firestore",error)
    }finally{
      setLoading(false)
    }
  }

  const currentDate = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const fetchTotalStock = (item) => {
    const totalSoldStock = item.reduce((prev,curr) => prev + curr.soldStock,0);
    setTotalSoldStock(totalSoldStock)
    const totalAvailableStock = item.reduce((prev,curr) => prev + curr.remainingStock,0);
    setTotalAvailableStock(totalAvailableStock)
  }
  
  return (
    <>
      <Appbar.Header style={styles.headerContainer}>
        <Appbar.BackAction
          onPress={() => navigation.goBack()}
          color={colors.pureWhite}
        />
        <Appbar.Content
          title="Today Sales Report"
          color={colors.pureWhite}
          titleStyle={styles.headerText}
        />
      </Appbar.Header>
      {emptySales === false ? (
        loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.darkblue} />
          </View>
        ) : (
          <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.date}>{currentDate}</Text>
              <View style={styles.agentContainer}>
                <Text style={styles.agentId}>Agent ID: {agent.AgentID}</Text>
              </View>
            </View>

            <View style={styles.tableContainer}>
              <View style={styles.tableHeader}>
                <Text style={[styles.columnHeader, styles.productIdHeader]}>Product ID</Text>
                <Text style={[styles.columnHeader, styles.weightHeader]}>Weight</Text>
                <Text style={[styles.columnHeader, styles.soldHeader]}>Sold</Text>
                <Text style={[styles.columnHeader, styles.availableHeader]}>Available</Text>
                <Text style={[styles.columnHeader, styles.totalHeader]}>Total (₹)</Text>
              </View>
              {mapArray.map((item, index) => (
                <View style={styles.tableRow} key={index}>
                  <Text style={[styles.cellText, styles.productIdCell]}>{item.productId}</Text>
                  <Text style={[styles.cellText, styles.weightCell]}>{item.weight}</Text>
                  <Text style={[styles.cellText, styles.soldCell]}>{item.soldStock}</Text>
                  <Text style={[styles.cellText, styles.availableCell]}>
                    {item.totalStock - item.soldStock}
                  </Text>
                  <Text style={[styles.cellText, styles.totalCell]}>
                    ₹{item.price * item.soldStock}
                  </Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={[styles.totalText, styles.totalLabel]}>Total</Text>
                <Text style={[styles.totalText, styles.totalSold]}>{totalSoldStock}</Text>
                <Text style={[styles.totalText, styles.totalAvailable]}>{totalAvailableStock}</Text>
                <Text style={[styles.totalText, styles.totalAmount]}>
                  ₹{fetchedOrders.UPITotal + fetchedOrders.CashTotal + fetchedOrders.CreditTotal}
                </Text>
              </View>
            </View>

            <View style={styles.paymentBreakdown}>
              <Text style={styles.sectionTitle}>Payment Breakdown</Text>
              <View style={styles.paymentMethod}>
                <MaterialIcons name="phone-android" size={24} color="#4CAF50" />
                <Text style={styles.paymentText}>
                  <Text style={styles.innerPaymentText}>UPI:</Text> ₹{fetchedOrders.UPITotal}
                </Text>
              </View>
              <View style={styles.paymentMethod}>
                <MaterialIcons name="money" size={24} color="#2196F3" />
                <Text style={styles.paymentText}>
                  <Text style={styles.innerPaymentText}>Cash:</Text> ₹{fetchedOrders.CashTotal}
                </Text>
              </View>
              <View style={styles.paymentMethod}>
                <MaterialIcons name="credit-card" size={24} color="#FF9800" />
                <Text style={styles.paymentText}>
                  <Text style={styles.innerPaymentText}>Credit:</Text> ₹{fetchedOrders.CreditTotal}
                </Text>
              </View>
            </View>

            <View style={styles.verificationSection}>
              <Text style={styles.sectionTitle}>Verification</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter verification token"
                value={verificationToken}
                onChangeText={setVerificationToken}
                secureTextEntry
              />
              <Button
                onPress={fetchOrdersfromFirestore}
                color={colors.darkblue}
                buttonStyle={styles.verifyButton}
              >
                Verify Report
              </Button>
            </View>
          </ScrollView>
        )
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No sales have been recorded yet...</Text>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.halfWhite,
    padding: dimensions.sm,
  },
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: dimensions.sm / 2,
  },
  date: {
    fontSize: dimensions.md,
    fontFamily: fonts.bold,
  },
  agentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentId: {
    fontFamily: fonts.regular,
    fontSize: dimensions.xl / 2,
  },
  tableContainer: {
    backgroundColor: colors.pureWhite,
    borderRadius: dimensions.sm / 2,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    padding: dimensions.sm,
    backgroundColor: colors.darkblue,
  },
  columnHeader: {
    color: colors.pureWhite,
    fontSize: dimensions.sm,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  productIdHeader: {
    flex: 1.5,
  },
  weightHeader: {
    flex: 1,
  },
  soldHeader: {
    flex: 1,
  },
  availableHeader: {
    flex: 1.5,
  },
  totalHeader: {
    flex: 1.5,
  },
  tableRow: {
    flexDirection: 'row',
    padding: dimensions.md / 2,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cellText: {
    fontSize: dimensions.sm,
    color: '#333',
    textAlign: 'center',
  },
  productIdCell: {
    flex: 1.5,
  },
  weightCell: {
    flex: 1,
  },
  soldCell: {
    flex: 1,
  },
  availableCell: {
    flex: 1.5,
  },
  totalCell: {
    flex: 1.5,
  },
  totalRow: {
    padding: dimensions.sm,
    backgroundColor: '#D0E1FF',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  totalText: {
    fontSize: dimensions.sm,
    fontWeight: 'bold',
    color: '#375BB5',
    textAlign: 'center',
  },
  totalLabel: {
    flex: 2.5,
  },
  totalSold: {
    flex: 1,
  },
  totalAvailable: {
    flex: 1.5,
  },
  totalAmount: {
    flex: 1.5,
  },
  paymentBreakdown: {
    backgroundColor: colors.pureWhite,
    borderRadius: dimensions.sm / 2,
    padding: dimensions.sm,
    borderColor: colors.pureWhite,
    borderWidth: 1,
    marginTop: dimensions.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: dimensions.xl / 2.5,
    marginBottom: dimensions.sm / 2,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: dimensions.sm / 2,
  },
  paymentText: {
    fontFamily: fonts.semibold,
    fontSize: dimensions.sm,
    marginLeft: dimensions.sm,
  },
  innerPaymentText: {
    fontFamily: fonts.medium,
  },
  verificationSection: {
    backgroundColor: colors.pureWhite,
    borderRadius: dimensions.sm / 2,
    padding: dimensions.sm,
    borderColor: colors.pureWhite,
    borderWidth: 1,
    marginTop: dimensions.sm,
    marginBottom: dimensions.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: dimensions.sm,
    padding: dimensions.sm,
    fontSize: dimensions.xl / 2,
    marginBottom: dimensions.sm,
    height: dimensions.sm * 4,
  },
  verifyButton: {
    borderRadius: dimensions.xl,
    paddingVertical: dimensions.sm / 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: dimensions.xl,
  },
  emptyText: {
    fontFamily: fonts.light,
    fontSize: dimensions.sm,
  },
});
