import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {Appbar, Button, Text, Modal} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {colors} from '../constants/colors';
import {dimensions} from '../constants/dimensions';
import {fonts} from '../constants/fonts';
import AntDesign from 'react-native-vector-icons/AntDesign';
import useCartStore from '../store/useCartStore';
import useAgentStore from '../store/useAgentStore';
import firestore from '@react-native-firebase/firestore';
import {getFirestore} from '@react-native-firebase/firestore';
import {CheckBox, Dialog, Input} from '@rneui/themed';
import Foundation from 'react-native-vector-icons/Foundation';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Clipboard from '@react-native-clipboard/clipboard';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import RNFS from 'react-native-fs';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import notifee, {AndroidImportance} from '@notifee/react-native';
import {
  checkManagePermission,
  requestManagePermission,
} from 'manage-external-storage';

const PaymentScreen = () => {
  const navigation = useNavigation();
  const {cart, total, clearCart, setPaymentConfirmation} = useCartStore();
  const {agent} = useAgentStore();
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  console.log('menuVisible: ', menuVisible);
  const [paymentGatewayVisible, setPaymentGatewayVisible] = useState(false);
  const [orderSuccessVisible, setOrderSuccessVisible] = useState(false);
  const [creditPayValue, setCreditPayValue] = useState('FullPayCredit');
  const [partialPayMode, setPartialPayMode] = useState('Cash');
  const [creditGateWayModal, setCreditGateWayModal] = useState(false);
  const [cashAmount, setCashAmount] = useState(Math.max(total - 1).toString());
  console.log('cashAmount: ', cashAmount);
  const [upiAmount, setUpiAmount] = useState(Math.max(total - 1).toString());
  const [transactionId, setTransactionId] = useState('');
  const [remainingAmount, setRemainingAmount] = useState(1);
  console.log('remainingAmount: ', remainingAmount);
  const [disableInput, setDisableInput] = useState(false);
  const [disableCreditInput, setDisableCreditInput] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [upiGateWayModal, setUpiGateWayModal] = useState(false);
  const upiId = 'Ukinfotech@okicici';
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
          {item.weight}
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
    } else if (paymentMethod === 'UPI') {
      setUpiGateWayModal(true);
    } else {
      setPaymentGatewayVisible(true);
    }
  };

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    transactionId: '',
  });
  console.log('errors: ', errors);

  const [invoiceData, setInvoiceData] = useState({});
  console.log('invoiceData: ', invoiceData);

  const handlePaymentSuccess = async () => {
    setLoading(true);
    try {
      const orderRef = getFirestore().collection('orders').doc(agent.AgentID);
      let orderData = {
        products: cart,
      };
      let newErrors = {};
      if (paymentMethod === 'Credit') {
        if (creditPayValue === 'FullPayCredit') {
          orderData.PaymentMethod = 'Credit';
          orderData.AmountPaid = {
            CreditAmount: Number(total),
            Total: Number(total),
            CashPaid: Number(total),
          };
        } else {
          if (partialPayMode === 'Cash') {
            orderData.PaymentMethod = 'Partial Credit - Cash';
            orderData.AmountPaid = {
              Total: Number(total),
              CashPaid: Number(cashAmount),
              CreditAmount: Number(remainingAmount),
            };
          } else {
            if (!transactionId.trim())
              newErrors.transactionId = 'Please enter transaction id';
            orderData.PaymentMethod = 'Partial Credit - UPI';
            orderData.AmountPaid = {
              Total: Number(total),
              CashPaid: Number(upiAmount),
              TransactionId: transactionId,
              CreditAmount: Number(remainingAmount),
            };
          }
        }
      } else if (paymentMethod === 'UPI') {
        if (!transactionId.trim())
          newErrors.transactionId = 'Please enter transaction id';
        orderData.PaymentMethod = 'UPI';
        orderData.AmountPaid = {
          Total: Number(total),
          TransactionId: transactionId,
          CashPaid: Number(total),
        };
      } else {
        orderData.PaymentMethod = 'Cash';
        orderData.AmountPaid = {Total: Number(total), CashPaid: Number(total)};
      }
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      setInvoiceData({
        AgentID: agent.AgentID,
        AgentName: agent.AgentName,
        MobileNumber: agent.MobileNumber,
        AgentAddress: agent.Address,
        OrdersPending: {
          AmountPaid: orderData.AmountPaid,
          PaymentMethod: orderData.PaymentMethod,
          products: orderData.products,
          orderedAt: Date.now().toString(),
        },
      });
      await orderRef.set(
        {
          AgentID: agent.AgentID,
          AgentName: agent.AgentName,
          MobileNumber: agent.MobileNumber,
          AgentAddress: agent.Address,
          OrdersPending: firestore.FieldValue.arrayUnion({
            AmountPaid: orderData.AmountPaid,
            orderedAt: Date.now().toString(),
            PaymentMethod: orderData.PaymentMethod,
            products: orderData.products,
          }),
        },
        {merge: true},
      );
      setPaymentGatewayVisible(false);
      setCreditGateWayModal(false);
      setUpiGateWayModal(false);
      setOrderSuccessVisible(true);
      return;
    } catch (error) {
      console.log('Error in internal server while payment processing:', error);
      alert('Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccess = async () => {
    try {
      setpdfGenerationLoading(true);
      await generatePdf();
      setPaymentConfirmation(true);
      // clearCart();
      setOrderSuccessVisible(false);
      navigation.goBack();
    } catch (error) {
      console.log('Error while making order', error);
    }
  };

  const handleDisableInput = text => {
    if (Number(text) < total) {
      setDisableInput(false);
    } else {
      setDisableInput(true);
      setTimeout(() => {
        setDisableInput(false);
      }, 700);
    }
  };

  const handleDisableCreditInput = text => {
    if (Number(text) < total) {
      setDisableCreditInput(false);
    } else {
      setDisableCreditInput(true);
      setTimeout(() => {
        setDisableCreditInput(false);
      }, 700);
    }
  };

  const handleAlertVisibleFunction = () => {
    setAlertVisible(true);
    setTimeout(() => {
      setAlertVisible(false);
    }, 1000);
  };

  const copyToClipboard = async () => {
    Clipboard.setString(upiId);
    await Clipboard.getString();
  };

  const data = invoiceData;
  console.log('data: ', data);
  const requestStoragePermission = async () => {
    if (Platform.OS !== 'android') return true;

    if (Platform.Version < 35) {
      return requestLegacyStoragePermission();
    } else {
      return requestAndroid15StoragePermission();
    }
  };

  const requestLegacyStoragePermission = async () => {
    let permissionStatus = await check(
      PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
    );
    console.log('Initial permission status:', permissionStatus);

    if (permissionStatus === RESULTS.DENIED) {
      // Request permission if it's denied
      permissionStatus = await request(
        PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
      );
      console.log('Permission after request:', permissionStatus);
    }

    if (permissionStatus === RESULTS.GRANTED) {
      console.log('Storage permission granted');
      return true;
    } else if (permissionStatus === RESULTS.BLOCKED) {
      console.log(
        'Storage permission blocked. Ask user to enable it manually.',
      );
      // You may want to open the settings page here
    } else if (permissionStatus === RESULTS.UNAVAILABLE) {
      console.log('Storage permission unavailable on this device.');
    }
    console.log('Storage permission denied');
    return false;
  };

  const requestAndroid15StoragePermission = async () => {
    let permissionStatus = await checkManagePermission();
    console.log('permissionStatus1: ', permissionStatus);
    if (permissionStatus === true) {
      console.log('Storage permission already granted');
      return true;
    }
    permissionStatus = await requestManagePermission();
    console.log(`The permission status is after request ${permissionStatus}`);
    if (permissionStatus === true) {
      console.log('Storage permission granted after request');
      return true;
    } else {
      console.log('Storage permission denied');
      return false;
    }
  };

  const {adminLogoUri} = useAgentStore();
  console.log('adminLogoUri: ', adminLogoUri);

  const [pdfGenerationLoading, setpdfGenerationLoading] = useState(false);

  const generatePdf = async () => {
    const today = new Date();
    const formattedDate =
      today.getDate().toString().padStart(2, '0') +
      '/' +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      '/' +
      today.getFullYear();
    console.log(formattedDate);
    const uid = Math.floor(Math.random() * 90000 + 10000).toString();
    const safeFormattedDate = formattedDate.replace(/\//g, '-');
    const ordersHtml = cart
      .map(
        item => `<tr style="border-bottom: 1px solid #ddd;">
    <td style="padding: 10px;">${item.productName}</td>
    <td style="padding: 10px;">₹ ${item.price}</td>
    <td style="padding: 10px;">${item.quantity}</td>
    <td style="padding: 10px;">₹ ${item.price * item.quantity}</td>
    </tr>`,
      )
      .join('');
    const htmlContent = `<html>
      <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 900px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #ddd; padding-bottom: 20px;">
          <div>
              <img src=${adminLogoUri} width="150px" height="150px" alt="Logo">
          </div>
          <div style="text-align: right;">
              <h1 style="margin: 0; color: #333;">UK Info Tech</h1>
              <p style="margin: 5px 0; font-size: 16px;">5681, Santhanathapuram 7th Street,Pudukkottai-622001.</p>
              <p style="margin: 5px 0; font-size: 16px;"><strong>GSTIN:</strong> ......................</p>
              <p style="margin: 5px 0; font-size: 16px;"><strong>MSME No:</strong> ......................</p>
          </div>
      </div>
      <div style="background-color: #eee; padding: 15px; margin-top: 10px; border-radius: 5px;">
          <h2 style="margin: 0; color: #333;">Tax Invoice #UK/2025/${uid}</h2>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Invoice Date:</strong> ${formattedDate}</p>
      </div>
      <div style="display: flex; justify-content: space-between; margin-top: 10px;">
          <div>
              <h3 style="margin-bottom: 10px; color: #333;">Invoiced To *</h3>
              <p style="margin: 5px 0; font-size: 18px;"><strong>Agent ID:</strong> ${
                data.AgentID
              }</p>
              <p style="margin: 5px 0; font-size: 18px;"><strong>Agent Name:</strong> ${
                data.AgentName
              }</p>
              <p style="margin: 5px 0; font-size: 18px;"><strong>Address:</strong> ${
                data.AgentAddress
              }</p>
              <p style="margin: 5px 0; font-size: 18px;"><strong>GSTIN Number:</strong> -</p>
          </div>
          <div>
              <h1 style="font-size: 40px; color: green; opacity: 0.8;">PAID</h1>
          </div>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 18px;">
          <thead>
              <tr style="background-color: #222; color: white; text-align: left;">
                  <th style="padding: 10px; width: 40%;">Description</th>
                  <th style="padding: 10px; width: 20%;">Price</th>
                  <th style="padding: 10px; width: 20%;">Quantity</th>
                  <th style="padding: 10px; width: 20%;">Total</th>
              </tr>
          </thead>
          <tbody>
              ${ordersHtml}
          </tbody>
          <tfoot>
              <tr style="background-color: #f4f4f4;">
                  <td colspan="3" style="text-align: right; padding: 10px;"><strong>Amount paid:</strong></td>
                  <td style="padding: 10px;"><strong>₹ ${
                    data.OrdersPending.AmountPaid.CashPaid
                  }</strong></td>
              </tr>
              <tr style="background-color: #f4f4f4;">
                  <td colspan="3" style="text-align: right; padding: 10px;"><strong>Tax</strong></td>
                  <td style="padding: 10px;"><strong>₹ ${0}</strong></td>
              </tr>
              ${
                data.OrdersPending.AmountPaid.CreditAmount
                  ? `
                  <tr style="background-color: #f4f4f4;">
                  <td colspan="3" style="text-align: right; padding: 10px;"><strong>Credit</strong></td>
                  <td style="padding: 10px;"><strong>₹ ${data.OrdersPending.AmountPaid.CreditAmount}</strong></td>
                  </tr>`
                  : ''
              }
             
                  
                  
              <tr style="background-color: #222; color: white;">
                  <td colspan="3" style="text-align: right; padding: 10px;"><strong>Total</strong></td>
                  <td style="padding: 10px;"><strong>₹ ${
                    data.OrdersPending.AmountPaid.Total
                  }</strong></td>
              </tr
          </tfoot>
      </table>

      <div>
      <p style="margin: 5px 0; font-size: 18px;"><strong>Transactions</strong></p>
      <table style="width: 100%; margin-top: 5px; border-collapse: collapse; font-size: 18px;">
       <thead>
              <tr style="background-color: #222; color: white; text-align: left;">
                  <th style="padding: 10px; width: 25%;">Transaction Date</th>
                  <th style="padding: 10px; width: 25%;">Payment Method</th>
                  <th style="padding: 10px; width: 25%;">Transaction ID</th>
                  <th style="padding: 10px; width: 25%;">Amount</th>
              </tr>
        </thead>
        <tbody>
            <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 10px;">${formattedDate}</td>
            ${
              data.OrdersPending.PaymentMethod === 'Partial Credit - Cash' ||
              data.OrdersPending.PaymentMethod === 'Partial Credit - UPI'
                ? `
              <td style="padding: 10px;">${
                data.OrdersPending.PaymentMethod === 'Partial Credit - Cash'
                  ? 'Cash Paid'
                  : 'UPI'
              }</td>`
                : `<td style="padding: 10px;">${data.OrdersPending.PaymentMethod}</td>`
            }
            
            <td style="padding: 10px;">${
              data.OrdersPending.AmountPaid.TransactionId
                ? data.OrdersPending.AmountPaid.TransactionId
                : '-'
            }</td>
            <td style="padding: 10px;">₹ ${
              data.OrdersPending.AmountPaid.CashPaid
            }</td>
            </tr>
            
            ${
              data.OrdersPending.PaymentMethod === 'Partial Credit - Cash' ||
              data.OrdersPending.PaymentMethod === 'Partial Credit - UPI'
                ? `
              <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px;">${formattedDate}</td>
             <td style="padding: 10px;">Credit</td>
             <td style="padding: 10px;">-</td>
              <td style="padding: 10px;">₹ ${data.OrdersPending.AmountPaid.CreditAmount}</td>
              </tr>`
                : ''
            }

        </tbody>
      </table>
      </div>
      <div style="text-align: center; margin-top: 10px; padding: 10px; background-color: #f4f4f4; border-radius: 5px;">
          <h3 style="margin: 0;">*By accepting this invoice, you agree to our Terms of Service and Privacy Policy.</h3>
      </div>
      </div>
      </body>
      </html>`;

    const permissionGranted = await requestStoragePermission();
    console.log('permissionGranted: ', permissionGranted);

    const options = {
      html: htmlContent,
      fileName: `invoice_${uid}_${data.OrdersPending.PaymentMethod}-${safeFormattedDate}`,
      directory: 'Documents',
    };
    try {
      const file = await RNHTMLtoPDF.convert(options);
      console.log(file.filePath);
      const invoiceName = `invoice_${uid}_${data.OrdersPending.PaymentMethod}-${safeFormattedDate}.pdf`;
      const newPath = `${RNFS.DownloadDirectoryPath}/${invoiceName}`;
      console.log('newPath: ', newPath);
      await RNFS.moveFile(file.filePath, newPath);
      await showNotification(newPath, invoiceName);
    } catch (error) {
      console.log('Error while generating Invoice PDF', error);
    } finally {
      setpdfGenerationLoading(false);
    }
  };

  const showNotification = async (filePath, invoiceName) => {
    await notifee.requestPermission();

    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
    });

    await notifee.displayNotification({
      title: 'Invoice Downloaded....Click to Open',
      body: invoiceName,
      android: {
        channelId,
        pressAction: {
          id: 'open-invoice',
        },
      },
      data: {filePath},
    });
  };

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
          <Button
            mode="text"
            onPress={() => setMenuVisible(true)}
            style={styles.paymentButton}
            textColor={colors.black}>
            {paymentMethod || 'Select Payment Method'}
          </Button>
          <Dialog
            onBackdropPress={() => setMenuVisible(false)}
            overlayStyle={{
              borderRadius: dimensions.sm / 2,
              justifyContent: 'center',
              alignItems: 'center',
              width: '90%',
              height: dimensions.height / 4,
            }}
            isVisible={menuVisible}
            animationType="fade">
            <Dialog.Title
              title="Choose Payment Options"
              titleStyle={{fontSize: dimensions.md, fontWeight: '600'}}
            />
            <View
              style={{
                borderColor: colors.lightGray,
                borderWidth: 1,
                width: dimensions.width / 1.5,
                paddingVertical: dimensions.sm,
                borderRadius: dimensions.sm / 2,
              }}>
              <View style={{marginLeft: dimensions.sm * 6}}>
                <CheckBox
                  textStyle={{fontSize: dimensions.md / 1.25}}
                  containerStyle={{padding: 0}}
                  checked={paymentMethod === 'Cash'}
                  size={dimensions.md}
                  title="Cash"
                  onPress={() => {
                    setPaymentMethod('Cash');
                    setTimeout(() => {
                      setMenuVisible(false);
                    }, 200);
                  }}
                />
                <CheckBox
                  textStyle={{fontSize: dimensions.md / 1.25}}
                  containerStyle={{padding: 0}}
                  checked={paymentMethod === 'UPI'}
                  size={dimensions.md}
                  title="UPI"
                  onPress={() => {
                    setPaymentMethod('UPI');
                    setTimeout(() => {
                      setMenuVisible(false);
                    }, 200);
                  }}
                />
                <CheckBox
                  textStyle={{fontSize: dimensions.md / 1.25}}
                  containerStyle={{padding: 0}}
                  checked={paymentMethod === 'Credit'}
                  size={dimensions.md}
                  title="Credit"
                  onPress={() => {
                    setPaymentMethod('Credit');
                    setTimeout(() => {
                      setMenuVisible(false);
                    }, 200);
                  }}
                />
              </View>
            </View>
          </Dialog>
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
      <Modal
        visible={alertVisible}
        contentContainerStyle={{
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
          <Text style={{fontFamily: fonts.semibold}}>
            Please select payment method
          </Text>
        </View>
      </Modal>

      {/* UPI GateWay Modal */}
      <Modal
        visible={upiGateWayModal}
        onDismiss={() => setUpiGateWayModal(false)}>
        <View style={styles.modalContent1}>
          <Text style={styles.modalTitle}>UPI Payment Gateway</Text>
          <>
            <Text style={styles.modalText}>
              Amount to be paid:{' '}
              <Text style={{fontFamily: fonts.semibold}}>₹ {total}</Text>
            </Text>
            <View>
              <View>
                <Image source={require('../images/qrsample.png')} />
              </View>
              <TouchableOpacity
                style={{
                  alignSelf: 'center',
                  borderColor: colors.lightGray,
                  borderWidth: 1,
                  paddingHorizontal: dimensions.md / 2,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: dimensions.sm / 2,
                }}
                onPress={() => copyToClipboard()}>
                <Text style={{fontSize: dimensions.sm}}>{upiId}</Text>
                <MaterialCommunityIcons
                  name="content-copy"
                  size={dimensions.sm}
                />
              </TouchableOpacity>
            </View>
            <View
              style={{width: dimensions.width / 2, marginTop: dimensions.sm}}>
              <Input
                value={transactionId}
                onChangeText={text => {
                  setTransactionId(text);
                  setErrors({transactionId: ''});
                }}
                style={{height: dimensions.md, fontSize: dimensions.sm}}
                placeholder="Enter transaction ID"
                containerStyle={{marginBottom: -dimensions.md}}
              />
              {errors.transactionId && (
                <Text style={{color: 'red', marginBottom: dimensions.sm / 2}}>
                  {errors.transactionId}
                </Text>
              )}
            </View>
          </>
          <Button
            mode="contained"
            onPress={handlePaymentSuccess}
            style={styles.modalButton}
            disabled={loading}>
            {loading ? (
              <Text style={{color: colors.pureWhite}}>{'Confirming....'}</Text>
            ) : (
              <Text style={{color: colors.pureWhite}}>Confirm Payment</Text>
            )}
          </Button>
          <Button
            mode="outlined"
            onPress={() => {
              setUpiGateWayModal(false);
              setErrors({transactionId: ''});
            }}
            style={styles.modalCancelButton}
            textColor={colors.black}>
            Cancel
          </Button>
        </View>
      </Modal>

      {/* Credit Gateway Modal */}
      <Modal
        visible={creditGateWayModal}
        onDismiss={() => setCreditGateWayModal(false)}>
        <View style={styles.modalContent1}>
          <Text style={styles.modalTitle1}>Credit Payment Options</Text>
          <Text style={styles.modalText1}>Choose any one of the options</Text>
          <View style={{flexDirection: 'row'}}>
            <Text style={{fontFamily: fonts.regular, fontSize: dimensions.sm}}>
              Amount to be paid:{' '}
            </Text>
            <Text style={{fontFamily: fonts.bold, fontSize: dimensions.sm}}>
              ₹ {total}
            </Text>
          </View>
          <View style={{width: '100%'}}>
            <View
              style={{
                alignSelf: 'center',
                borderColor: colors.lightGray,
                borderWidth: 1,
                marginVertical: dimensions.sm,
                paddingHorizontal: dimensions.md,
                paddingVertical: dimensions.sm / 2,
                borderRadius: dimensions.sm,
              }}>
              <CheckBox
                checkedColor={colors.darkblue}
                size={dimensions.md}
                checked={creditPayValue === 'FullPayCredit'}
                onPress={() => {
                  setCreditPayValue('FullPayCredit');
                  setErrors({transactionId: ''});
                }}
                title="Full Pay Credit"
                checkedIcon="dot-circle-o"
                uncheckedIcon="circle-o"
                containerStyle={{padding: dimensions.sm / 4}}
              />
              <CheckBox
                containerStyle={{padding: dimensions.sm / 4}}
                size={dimensions.md}
                checked={creditPayValue === 'PartialPayValue'}
                onPress={() => {
                  setCreditPayValue('PartialPayValue');
                  setErrors({transactionId: ''});
                }}
                title="Partial Pay Credit"
                checkedIcon="dot-circle-o"
                uncheckedIcon="circle-o"
                checkedColor={colors.darkblue}
              />
            </View>

            {creditPayValue === 'PartialPayValue' && (
              <View style={{alignSelf: 'center'}}>
                <View>
                  <View
                    style={{flexDirection: 'row', marginLeft: dimensions.md}}>
                    <CheckBox
                      checked={partialPayMode === 'Cash'}
                      onPress={() => {
                        setPartialPayMode('Cash');
                        setCashAmount(Math.max(total - 1).toString());
                        setRemainingAmount(1);
                        setErrors({transactionId: ''});
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
                        setPartialPayMode('UPI');
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
                </View>

                {partialPayMode === 'Cash' && (
                  <View style={{marginVertical: dimensions.md}}>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderColor: colors.lightGray,
                        borderWidth: 1,
                        paddingHorizontal: dimensions.md / 2,
                        paddingVertical: dimensions.sm / 2,
                        borderRadius: dimensions.sm / 2,
                      }}>
                      <View style={{gap: dimensions.xl}}>
                        <Text
                          style={{
                            fontSize: dimensions.sm,
                            fontFamily: fonts.regular,
                          }}>
                          Pay Amount:
                        </Text>
                        <Text
                          style={{
                            fontSize: dimensions.sm,
                            fontFamily: fonts.regular,
                          }}>
                          Credit:
                        </Text>
                      </View>

                      <View
                        style={{
                          width: dimensions.width / 3,
                        }}>
                        <Input
                          keyboardType="number-pad"
                          disabled={disableInput}
                          value={cashAmount.toString()}
                          onChangeText={text => {
                            handleDisableInput(text);
                            if (Number(text) > total) {
                              setCashAmount(Math.max(total - 1).toString());
                              setRemainingAmount(1);
                              return;
                            }
                            setCashAmount(text);
                            setRemainingAmount(total - Number(text));
                          }}
                          placeholder="Cash"
                          containerStyle={{height: dimensions.xl * 1.5}}
                          style={{fontSize: dimensions.sm}}
                        />
                        <Input
                          keyboardType="number-pad"
                          disabled={disableCreditInput}
                          onChangeText={text => {
                            handleDisableCreditInput(text);
                            if (Number(text) > total) {
                              setRemainingAmount(
                                Math.max(total - 1).toString(),
                              );
                              setCashAmount(1);
                              return;
                            }
                            setRemainingAmount(text);
                            setCashAmount(total - Number(text));
                          }}
                          value={remainingAmount}
                          placeholder={remainingAmount.toString()}
                          containerStyle={{height: dimensions.xl * 1.5}}
                          style={{fontSize: dimensions.sm}}
                        />
                      </View>
                    </View>
                  </View>
                )}

                {partialPayMode === 'UPI' && (
                  <View style={{marginVertical: dimensions.md}}>
                    {/* Qr code Container */}
                    <View style={{alignSelf: 'center'}}>
                      <Image
                        source={require('../images/qrsample.png')}
                        style={{
                          height: dimensions.xl * 4,
                          width: dimensions.xl * 4,
                          resizeMode: 'cover',
                          alignSelf: 'center',
                        }}
                      />
                      <TouchableOpacity
                        onPress={() => copyToClipboard()}
                        style={{
                          borderColor: colors.lightGray,
                          borderWidth: 1,
                          paddingHorizontal: dimensions.md / 2,
                          paddingVertical: dimensions.sm / 2,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: dimensions.sm / 2,
                          marginBottom: dimensions.sm,
                        }}>
                        <Text style={{fontSize: dimensions.sm}}>{upiId}</Text>
                        <MaterialCommunityIcons
                          name="content-copy"
                          size={dimensions.sm}
                        />
                      </TouchableOpacity>
                    </View>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderColor: colors.lightGray,
                        borderWidth: 1,
                        paddingHorizontal: dimensions.md / 2,
                        paddingVertical: dimensions.sm / 2,
                        borderRadius: dimensions.sm / 2,
                      }}>
                      <View style={{gap: dimensions.md * 1.25}}>
                        <Text
                          style={{
                            fontSize: dimensions.sm,
                            fontFamily: fonts.regular,
                          }}>
                          UTR Id:
                        </Text>
                        <Text
                          style={{
                            fontSize: dimensions.sm,
                            fontFamily: fonts.regular,
                          }}>
                          Pay Amount:
                        </Text>
                        <Text
                          style={{
                            fontSize: dimensions.sm,
                            fontFamily: fonts.regular,
                          }}>
                          Credit:
                        </Text>
                      </View>

                      <View
                        style={{
                          width: dimensions.width / 3,
                        }}>
                        <Input
                          value={transactionId}
                          onChangeText={text => {
                            setTransactionId(text);
                            setErrors({transactionId: ''});
                          }}
                          placeholder="Transaction ID"
                          containerStyle={{height: dimensions.xl * 1.5}}
                          style={{fontSize: dimensions.sm}}
                        />
                        <Input
                          keyboardType="number-pad"
                          disabled={disableInput}
                          value={upiAmount.toString()}
                          onChangeText={text => {
                            handleDisableInput(text);
                            if (Number(text) > total) {
                              setUpiAmount(Math.max(total - 1).toString());
                              setRemainingAmount(1);
                              return;
                            }
                            setUpiAmount(text);
                            setRemainingAmount(total - Number(text));
                          }}
                          placeholder="Amount Sent"
                          containerStyle={{height: dimensions.xl * 1.5}}
                          style={{fontSize: dimensions.sm}}
                        />
                        <Input
                          keyboardType="number-pad"
                          disabled={disableCreditInput}
                          onChangeText={text => {
                            handleDisableCreditInput(text);
                            if (Number(text) > total) {
                              setRemainingAmount(
                                Math.max(total - 1).toString(),
                              );
                              setUpiAmount(1);
                              return;
                            }
                            setRemainingAmount(text);
                            setUpiAmount(total - Number(text));
                          }}
                          value={remainingAmount}
                          placeholder={remainingAmount.toString()}
                          containerStyle={{height: dimensions.xl * 1.5}}
                          style={{fontSize: dimensions.sm}}
                        />
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
          {errors.transactionId && (
            <Text style={{color: 'red', marginBottom: dimensions.sm / 2}}>
              {errors.transactionId}
            </Text>
          )}
          <View style={{marginBottom: dimensions.md}}>
            <Button
              mode="contained"
              onPress={handlePaymentSuccess}
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
              onPress={() => {
                setCreditGateWayModal(false);
                setErrors({transactionId: ''});
              }}
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
          <Text style={[styles.modalTitle, {marginBottom: dimensions.sm}]}>
            Payment Gateway
          </Text>
          <Text style={[styles.modalText, {marginBottom: dimensions.sm}]}>
            Processing payment of{' '}
            <Text style={[styles.modalText, {fontFamily: fonts.bold}]}>
              ₹{total}
            </Text>{' '}
            via {paymentMethod}...
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
          <Text
            style={[styles.modalTitle, {marginVertical: dimensions.sm / 2}]}>
            Order Successful!
          </Text>
          <Text style={[styles.modalText, {marginBottom: dimensions.sm / 2}]}>
            Your order has been placed successfully.
          </Text>
          <Button
            loading={pdfGenerationLoading}
            mode="contained"
            onPress={pdfGenerationLoading ? null : handleCloseSuccess}
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
  },
  modalText: {
    fontFamily: fonts.regular,
    fontSize: dimensions.sm,
    color: colors.black,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: colors.darkblue,
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
    paddingVertical: dimensions.xl,
  },
  modalTitle1: {
    fontFamily: fonts.bold,
    fontSize: dimensions.md,
    color: colors.black,
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
