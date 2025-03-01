import React, {useState} from 'react';
import {StyleSheet, View, ScrollView, Image} from 'react-native';
import {Appbar, Button, Text, Menu, Modal} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {colors} from '../constants/colors';
import {dimensions} from '../constants/dimensions';
import {fonts} from '../constants/fonts';
import AntDesign from 'react-native-vector-icons/AntDesign';
import useCartStore from '../store/useCartStore';
import useAgentStore from '../store/useAgentStore';
import firestore from '@react-native-firebase/firestore';
import {getFirestore} from '@react-native-firebase/firestore';
import {CheckBox, Input} from '@rneui/themed';
import Foundation from 'react-native-vector-icons/Foundation'

const PaymentScreen = () => {
  const navigation = useNavigation();
  const {cart, total, clearCart, setPaymentConfirmation} = useCartStore();
  const {agent} = useAgentStore();
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [paymentGatewayVisible, setPaymentGatewayVisible] = useState(false);
  const [orderSuccessVisible, setOrderSuccessVisible] = useState(false);

  const renderCartItem = (item, index) => (
    <View key={`${item.productId}-${index}`} style={styles.cartItem}>
      <Image
        source={{uri: item.productImage}}
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>
          <Text style={[styles.itemName, {fontFamily: fonts.semibold}]}>
            Product Id:{' '}
          </Text>
          {item.productId}
        </Text>
        <Text style={styles.itemName}>
          <Text style={[styles.itemName, {fontFamily: fonts.semibold}]}>
            Name:{' '}
          </Text>
          {item.productName}
        </Text>
        <Text style={styles.itemName}>
          <Text style={[styles.itemName, {fontFamily: fonts.semibold}]}>
            Weight:{' '}
          </Text>
          {item.weight} g
        </Text>
        <Text style={styles.itemName}>
          <Text style={[styles.itemName, {fontFamily: fonts.semibold}]}>
            Quantity:{' '}
          </Text>
          {item.quantity}
        </Text>
      </View>
      <Text style={styles.itemPrice}>₹ {item.price * item.quantity}</Text>
    </View>
  );
  const handlePayment = () => {
    if (!paymentMethod) {
      handleAlertVisibleFunction();
      return;
    } else if (paymentMethod === 'Credit') {
      setCreditGateWayModal(true);
    } else if(paymentMethod === 'UPI')
    {
      setUpiGateWayModal(true)
    }else {
      setPaymentGatewayVisible(true);
    }
  };

  const [loading, setLoading] = useState(false);

  const handlePaymentSuccess = async () => {
    setLoading(true);
    try {
      const orderRef = getFirestore().collection('orders').doc(agent.AgentID);
      await orderRef.set(
        {
          AgentID: agent.AgentID,
          AgentName: agent.AgentName,
          MobileNumber: agent.MobileNumber,
          AgentAddress: agent.Address,
          OrdersPending: firestore.FieldValue.arrayUnion({
            AmountPaid: total,
            PaymentMethod: paymentMethod,
            products: cart,
            orderedAt: firestore.Timestamp.now(),
          }),
        },
        {merge: true},
      );
      clearCart();
    } catch (error) {
      console.log('Error in internal server while payment processing:', error);
      alert('Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
      setOrderSuccessVisible(true);
      setPaymentGatewayVisible(false);
    }
  };

  const handleCloseSuccess = () => {
    setPaymentConfirmation(true);
    setOrderSuccessVisible(false);
    navigation.goBack();
  };

  const [creditPayValue, setCreditPayValue] = useState('FullPayCredit');
  const [partialPayMode, setPartialPayMode] = useState('Cash');
  const [creditGateWayModal, setCreditGateWayModal] = useState(false);
  const [cashAmount, setCashAmount] = useState(Math.max(total - 1).toString());
  console.log('cashAmount: ', cashAmount);
  const [upiAmount, setUpiAmount] = useState(Math.max(total - 1).toString());
  const [transactionId, setTransactionId] = useState(null);
  const [remainingAmount,setRemainingAmount] = useState(1);
  console.log('remainingAmount: ', remainingAmount);

  const handleCreditPayment = () => {
    try{
      if(creditPayValue === 'FullPayCredit'){
        console.log('creditPayValue: ', creditPayValue);
      }else{
        console.log('creditPayValue: ', creditPayValue);
        if(partialPayMode === 'Cash'){
          console.log('partialPayMode: ', partialPayMode);
          console.log('cashAmount: ', cashAmount);
        }else{
          console.log('partialPayMode: ', partialPayMode);
          console.log('upiAmount: ', upiAmount);
          console.log('transactionId: ', transactionId);
        }
      }
    }catch(error){
      console.log("Error in internal server while handling credit payment",error)
    }
  }

  const [disableInput, setDisableInput] = useState(false);

  const handleDisableInput = (text) => {
    if(Number(text) < total){
      setDisableInput(false)
    }else{
      setDisableInput(true);
      setTimeout(() => {
        setDisableInput(false)
      },700);
    }
  }

  const [disableCreditInput, setDisableCreditInput] = useState(false);

  const handleDisableCreditInput = (text) => {
    if(Number(text) < total){
      setDisableCreditInput(false)
    }else{
      setDisableCreditInput(true);
      setTimeout(() => {
        setDisableCreditInput(false)
      },700);
    }
  }

  const [alertVisible, setAlertVisible] = useState(false);

  const handleAlertVisibleFunction = () => {
    setAlertVisible(true);
    setTimeout(() => {
    setAlertVisible(false);
    },1000)
  }

  const [verified, setVerified] = useState(false);

  const [upiGateWayModal, setUpiGateWayModal] = useState(false);

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction
          onPress={() => navigation.goBack()}
          color={colors.pureWhite}
        />
        <Appbar.Content
          title="Payment"
          color={colors.pureWhite}
          titleStyle={styles.headerTitle}
        />
      </Appbar.Header>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollContainer}>
        {/* Address Option */}
        <View style={styles.section}>
          <Text style={styles.label}>Address</Text>
          <View>
            <Text>{agent.Address}</Text>
          </View>
        </View>

        {/* Payment Option */}
        <View style={styles.section}>
          <Text style={styles.label}>Payment Method</Text>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setMenuVisible(true)}
                style={styles.paymentButton}
                textColor={colors.black}>
                {paymentMethod || 'Select Payment Method'}
              </Button>
            }>
            <Menu.Item
              onPress={() => {
                setPaymentMethod('Cash');
                setMenuVisible(false);
              }}
              title="Cash"
            />
            <Menu.Item
              onPress={() => {
                setPaymentMethod('Credit');
                setMenuVisible(false);
              }}
              title="Credit"
            />
            <Menu.Item
              onPress={() => {
                setPaymentMethod('UPI');
                setMenuVisible(false);
              }}
              title="UPI"
            />
          </Menu>
        </View>

        {/* Products List from Cart */}
        <View style={styles.section}>
          <Text style={styles.label}>Order Summary</Text>
          {cart.length > 0 ? (
            cart.map((item, index) => renderCartItem(item, index))
          ) : (
            <Text style={styles.emptyCart}>No items in cart</Text>
          )}
          <Text style={styles.totalText}>Total: ₹ {total}</Text>
        </View>

        {/* Pay Button */}
        <Button
          mode="contained"
          onPress={handlePayment}
          style={styles.payButton}
          textColor={colors.pureWhite}>
          Pay Now
        </Button>
      </ScrollView>

      {/* Payment Method Modal Alert */}
      <Modal visible={alertVisible} contentContainerStyle={{
                  backgroundColor: colors.pureWhite,
                  height: dimensions.height / 4,
                  margin: dimensions.xl,
                  borderRadius: dimensions.sm,
                }}>
        <View style={{alignItems: 'center'}}>
         <Foundation
          name="alert"
          color={colors.red}
          size={dimensions.width / 4}
         />
         <Text style={{fontFamily: fonts.semibold}}>Please select payment method</Text>
        </View>
      </Modal>
      
      {/* UPI GateWay Modal */}
      <Modal
        visible={upiGateWayModal}
        onDismiss={() => setUpiGateWayModal(false)}
        contentContainerStyle={styles.modalContent}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>UPI Payment Gateway</Text>
          {
            verified 
            ? (
            <>
            <Text style={styles.modalText}>
            Amount to be paid: <Text style={{ fontFamily:fonts.semibold }}>₹ {total}</Text>
          </Text>
          <View style={{ width:dimensions.width/2 }}>
          <Input 
          style={{ height:dimensions.md,fontSize:dimensions.sm }}
          placeholder='Enter your UPI ID'
          />
          </View>
          </>
            ) 
            : (
            <>
            <Text style={styles.modalText}>
            Amount to be paid: <Text style={{ fontFamily:fonts.semibold }}>₹ {total}</Text>
          </Text>
          <View style={{ width:dimensions.width/2 }}>
          <Input 
          style={{ height:dimensions.md,fontSize:dimensions.sm }}
          placeholder='Enter your UPI ID'
          />
          </View>
          </>
            )
          }

          <Button
            mode="contained"
            onPress={handlePaymentSuccess}
            style={styles.modalButton}
            disabled={loading}>
            {loading ? (
              <Text style={{color: colors.pureWhite}}>
                {
                  verified 
                  ? 'Confirming....'
                  : 'Verifying...'
                }
                </Text>
            ) : (
              verified ? (
                <Text style={{color: colors.pureWhite}}>Confirm Payment</Text>
              ) 
              : (
                <Text style={{color: colors.pureWhite}}>Verify</Text>
              )
            )}
          </Button>
          <Button
            mode="outlined"
            onPress={() => setUpiGateWayModal(false)}
            style={styles.modalCancelButton}
            textColor={colors.black}>
            Cancel
          </Button>
        </View>
      </Modal>

      {/* Credit Gateway Modal */}
      <Modal visible={creditGateWayModal} onDismiss={() => setCreditGateWayModal(false)}>
        <View style={styles.modalContent1}>
          <Text style={styles.modalTitle1}>Credit Payment Options</Text>
          <Text style={styles.modalText1}>Choose any one of the options</Text>
          <View style={{ flexDirection:'row',margin:dimensions.sm }}>
          <Text style={{fontFamily: fonts.regular,
    fontSize: dimensions.sm,}}>Amount to be paid: </Text>
          <Text style={{fontFamily: fonts.bold,
    fontSize: dimensions.sm}}>₹ {total}</Text>
          </View>
          <View style={{width: '100%'}}>
            <View style={{alignSelf: 'center'}}>
              <CheckBox
                checkedColor={colors.darkblue}
                size={dimensions.md}
                checked={creditPayValue === 'FullPayCredit'}
                onPress={() => setCreditPayValue('FullPayCredit')}
                title="Full Pay Credit"
                checkedIcon="dot-circle-o"
                uncheckedIcon="circle-o"
                containerStyle={{padding: dimensions.sm / 4}}
              />
              <CheckBox
                containerStyle={{padding: dimensions.sm / 4}}
                size={dimensions.md}
                checked={creditPayValue === 'PartialPayValue'}
                onPress={() => setCreditPayValue('PartialPayValue')}
                title="Partial Pay Credit"
                checkedIcon="dot-circle-o"
                uncheckedIcon="circle-o"
                checkedColor={colors.darkblue}
              />
            </View>

            {creditPayValue === 'PartialPayValue' && (
              <View style={{alignSelf: 'center'}}>
                <View style={{flexDirection: 'row'}}>
                  <CheckBox
                    checked={partialPayMode === 'Cash'}
                    onPress={() => {
                      setPartialPayMode('Cash');
                      setCashAmount(Math.max(total - 1).toString());
                      setRemainingAmount(1);
                    }}
                    checkedColor={colors.orange}
                    size={dimensions.md}
                    containerStyle={{paddingVertical: 0}}
                    title="Cash"
                    checkedIcon="dot-circle-o"
                    uncheckedIcon="circle-o"
                  />
                  <CheckBox
                    checked={partialPayMode === 'UPI'}
                    onPress={() => {
                      setPartialPayMode('UPI')
                      setUpiAmount(Math.max(total - 1).toString());
                      setRemainingAmount(1);
                    }}
                    checkedColor={colors.orange}
                    size={dimensions.md}
                    containerStyle={{paddingVertical: 0}}
                    title="UPI"
                    checkedIcon="dot-circle-o"
                    uncheckedIcon="circle-o"
                  />
                </View>

                {
                  partialPayMode === 'Cash' && (
                    <View style={{ marginVertical:dimensions.md }}>
                <View style={{ flexDirection:'row',width:dimensions.width / 3,alignItems:"center" }}>
                <Text style={{ fontFamily:fonts.semibold,fontSize:dimensions.sm * 1.25 }}>Pay Amount:</Text>  
                <Input
                keyboardType='number-pad'
                disabled={disableInput}
                value={cashAmount.toString()}
                onChangeText={(text) => {
                  handleDisableInput(text);
                  if(Number(text) > total){
                    setCashAmount(Math.max(total - 1).toString());
                    setRemainingAmount(1);
                    return;
                  }
                  setCashAmount(text);
                  setRemainingAmount(total - Number(text))
                }
                }
                placeholder='Cash'
                containerStyle={{ height:dimensions.xl * 1.5 }}
                style={{ fontSize:dimensions.sm }}
                />
                </View>
                <View style={{ flexDirection:'row',width:dimensions.width / 3,alignItems:"center" }}>
                <Text style={{ fontFamily:fonts.semibold,fontSize:dimensions.sm * 1.25 }}>Credit:</Text>  
                <Input
                keyboardType='number-pad'
                disabled={disableCreditInput}
                onChangeText={(text) => {
                  handleDisableCreditInput(text);
                  if(Number(text) > total){
                    setRemainingAmount(Math.max(total - 1).toString());
                    setCashAmount(1);
                    return;
                  }
                  setRemainingAmount(text);
                  setCashAmount(total - Number(text))
                }
                }
                value={remainingAmount}
                placeholder={remainingAmount.toString()}
                containerStyle={{ height:dimensions.xl * 1.5 }}
                style={{ fontSize:dimensions.sm }}
                />
                </View>
                </View>
                  )
                }
                
              {
                partialPayMode === 'UPI' && (
                  <View style={{ marginVertical:dimensions.md }}>
                <View style={{ flexDirection:'row',width:dimensions.width / 3,alignItems:"center" }}>
                <Text style={{ fontFamily:fonts.semibold,fontSize:dimensions.sm * 1.25 }}>Pay Amount:</Text>  
                <Input
                keyboardType='number-pad'
                disabled={disableInput}
                value={upiAmount.toString()}
                onChangeText={(text) => {
                  handleDisableInput(text);
                  if(Number(text) > total){
                    setUpiAmount(Math.max(total - 1).toString());
                    setRemainingAmount(1);
                    return;
                  }
                  setUpiAmount(text);
                  setRemainingAmount(total - Number(text))
                }
                }
                placeholder='Amount Sent'
                containerStyle={{ height:dimensions.xl * 1.5 }}
                style={{ fontSize:dimensions.sm }}
                />
                </View>
                <View style={{ flexDirection:'row',width:dimensions.width / 3,alignItems:"center" }}>
                <Text style={{ fontFamily:fonts.semibold,fontSize:dimensions.sm * 1.25 }}>UTR Id:</Text>  
                <Input
                keyboardType='number-pad'
                value={transactionId}
                onChangeText={setTransactionId}
                placeholder='Transaction ID'
                containerStyle={{ height:dimensions.xl * 1.5 }}
                style={{ fontSize:dimensions.sm }}
                />
                </View>
                <View style={{ flexDirection:'row',width:dimensions.width / 3,alignItems:"center" }}>
                <Text style={{ fontFamily:fonts.semibold,fontSize:dimensions.sm * 1.25 }}>Credit:</Text>  
                <Input
                keyboardType='number-pad'
                disabled={disableCreditInput}
                onChangeText={(text) => {
                  handleDisableCreditInput(text);
                  if(Number(text) > total){
                    setRemainingAmount(Math.max(total - 1).toString());
                    setUpiAmount(1);
                    return;
                  }
                  setRemainingAmount(text);
                  setUpiAmount(total - Number(text))
                }
                }
                value={remainingAmount}
                placeholder={remainingAmount.toString()}
                containerStyle={{ height:dimensions.xl * 1.5 }}
                style={{ fontSize:dimensions.sm }}
                />
                </View>
                </View>
                )
              }
              </View>
            )}
          </View>

          <View style={{flex: 1}}>
            <Button
              mode="contained"
              onPress={handleCreditPayment}
              style={styles.modalButton1}
              disabled={loading}>
              {loading ? (
                <Text style={{color: colors.pureWhite}}>Confirming....</Text>
              ) : (
                <Text style={{color: colors.pureWhite}}>Confirm Payment</Text>
              )}
            </Button>
            <Button
              mode="outlined"
              onPress={() => setCreditGateWayModal(false)}
              style={styles.modalCancelButton1}
              textColor={colors.black}>
              Cancel
            </Button>
          </View>
        </View>
      </Modal>
      {/* Payment Gateway Modal */}
      <Modal
        visible={paymentGatewayVisible}
        onDismiss={() => setPaymentGatewayVisible(false)}
        contentContainerStyle={styles.modalContent}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Payment Gateway</Text>
          <Text style={styles.modalText}>
            Processing payment of ₹ {total} via {paymentMethod}...
          </Text>
          <Button
            mode="contained"
            onPress={handlePaymentSuccess}
            style={styles.modalButton}
            disabled={loading}>
            {loading ? (
              <Text style={{color: colors.pureWhite}}>Confirming....</Text>
            ) : (
              <Text style={{color: colors.pureWhite}}>Confirm Payment</Text>
            )}
          </Button>
          <Button
            mode="outlined"
            onPress={() => setPaymentGatewayVisible(false)}
            style={styles.modalCancelButton}
            textColor={colors.black}>
            Cancel
          </Button>
        </View>
      </Modal>

      {/* Order Successful Modal */}
      <Modal
        visible={orderSuccessVisible}
        onDismiss={handleCloseSuccess}
        contentContainerStyle={styles.modalContent}>
        <View style={styles.modalContent}>
          <AntDesign
            name="checkcircle"
            size={dimensions.width / 4}
            color="green"
          />
          <Text style={styles.modalTitle}>Order Successful!</Text>
          <Text style={styles.modalText}>
            Your order has been placed successfully.
          </Text>
          <Button
            mode="contained"
            onPress={handleCloseSuccess}
            style={styles.modalButton}
            textColor={colors.pureWhite}>
            OK
          </Button>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.halfWhite,
  },
  header: {
    backgroundColor: colors.orange,
    height: dimensions.xl * 2.25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: dimensions.md,
    color: colors.pureWhite,
  },
  scrollContainer: {
    flex: 1,
    padding: dimensions.sm,
  },
  section: {
    backgroundColor: colors.pureWhite,
    borderRadius: dimensions.sm,
    padding: dimensions.sm,
    marginBottom: dimensions.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: dimensions.sm,
    color: colors.black,
    marginBottom: dimensions.sm / 2,
  },
  addressInput: {
    backgroundColor: colors.pureWhite,
    marginBottom: dimensions.sm,
  },
  paymentButton: {
    backgroundColor: colors.pureWhite,
    borderWidth: 1,
    borderColor: colors.lightGray,
    paddingVertical: dimensions.sm / 2,
    marginBottom: dimensions.sm,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: dimensions.sm / 2,
    marginBottom: dimensions.sm / 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  productImage: {
    width: dimensions.width / 6,
    height: dimensions.width / 6,
    borderRadius: dimensions.sm,
    marginRight: dimensions.sm,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  itemDetails: {
    flex: 2,
  },
  itemName: {
    fontFamily: fonts.regular,
    fontSize: dimensions.sm,
    color: colors.black,
  },
  itemPrice: {
    fontFamily: fonts.regular,
    fontSize: dimensions.sm,
    color: colors.black,
    textAlign: 'right',
    flex: 1,
  },
  emptyCart: {
    fontFamily: fonts.regular,
    fontSize: dimensions.sm,
    color: colors.grayText,
    textAlign: 'center',
    paddingVertical: dimensions.sm,
  },
  totalText: {
    fontFamily: fonts.bold,
    fontSize: dimensions.md,
    color: colors.black,
    textAlign: 'right',
    marginTop: dimensions.sm,
  },
  payButton: {
    backgroundColor: colors.darkblue,
    marginTop: dimensions.sm,
    marginBottom: dimensions.md,
  },
  modalContent: {
    backgroundColor: colors.pureWhite,
    borderRadius: dimensions.sm,
    padding: dimensions.md,
    alignItems: 'center',
    margin: dimensions.md,
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: dimensions.md,
    color: colors.black,
    marginBottom: dimensions.sm,
  },
  modalText: {
    fontFamily: fonts.regular,
    fontSize: dimensions.sm,
    color: colors.black,
    textAlign: 'center',
    marginBottom: dimensions.sm,
  },
  modalButton: {
    backgroundColor: colors.darkblue,
    marginTop: dimensions.sm,
    borderRadius: dimensions.sm / 2,
    width: dimensions.width / 2,
  },
  modalCancelButton: {
    backgroundColor: colors.pureWhite,
    borderWidth: 1,
    borderColor: colors.lightGray,
    marginTop: dimensions.sm,
    borderRadius: dimensions.sm / 2,
    width: dimensions.width / 2,
  },
  modalContent1: {
    backgroundColor: colors.pureWhite,
    borderRadius: dimensions.sm,
    alignItems: 'center',
    margin: dimensions.md,
    height: dimensions.height / 1.5,
    paddingTop: dimensions.xl,
  },
  modalTitle1: {
    fontFamily: fonts.bold,
    fontSize: dimensions.md,
    color: colors.black,
    marginBottom: dimensions.sm,
  },
  modalText1: {
    fontFamily: fonts.regular,
    fontSize: dimensions.sm,
    color: colors.black,
    textAlign: 'center',
  },
  modalButton1: {
    backgroundColor: colors.darkblue,
    borderRadius: dimensions.sm / 2,
    width: dimensions.width / 2,
  },
  modalCancelButton1: {
    backgroundColor: colors.pureWhite,
    borderWidth: 1,
    borderColor: colors.lightGray,
    marginTop: dimensions.sm,
    borderRadius: dimensions.sm / 2,
    width: dimensions.width / 2,
  },
});

export default PaymentScreen;
