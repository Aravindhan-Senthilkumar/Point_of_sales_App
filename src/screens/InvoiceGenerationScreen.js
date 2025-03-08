import {Platform, StyleSheet, Text, View} from 'react-native';
import React, { useEffect } from 'react';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import {Button} from 'react-native-paper';
import {useRoute} from '@react-navigation/native';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import RNFS from 'react-native-fs';
import notifee, {AndroidImportance, EventType} from '@notifee/react-native';
import FileViewer from 'react-native-file-viewer';

const InvoiceGenerationScreen = () => {
  const data = useRoute().params.data;
  console.log('data: ', data);
  const arrayOrders = data.OrdersPending.products;
  console.log('arrayOrders: ', arrayOrders);

  const requestStoragePermission = async () => {
    if (Platform.OS !== 'android') return true; // Only request for Android devices

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

  useEffect(() => {
    // Listen for notification interactions
    const unsubscribe = notifee.onForegroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS) {
        const filePath = detail.notification?.data?.filePath;
        const displayName = detail.notification?.body;
        if (filePath) {
          openInvoice(filePath,displayName);
        }
      }
    });
    
    return () => unsubscribe();
  }, []);

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
    const ordersHtml = arrayOrders
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
              <img src="../images/avatar.png" width="150px" alt="Logo">
          </div>
          <div style="text-align: right;">
              <h1 style="margin: 0; color: #333;">UK Info Tech</h1>
              <p style="margin: 5px 0; font-size: 16px;">5681, Santhanathapuram 7th Street,</p>
              <p style="margin: 5px 0; font-size: 16px;">Pudukkottai-622001</p>
              <p style="margin: 5px 0; font-size: 16px;"><strong>GSTIN:</strong> ......................</p>
              <p style="margin: 5px 0; font-size: 16px;"><strong>MSME No:</strong> ......................</p>
          </div>
      </div>
      <div style="background-color: #eee; padding: 15px; margin-top: 20px; border-radius: 5px;">
          <h2 style="margin: 0; color: #333;">Tax Invoice #UK/2025/${uid}</h2>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Invoice Date:</strong> ${formattedDate}</p>
      </div>
      <div style="display: flex; justify-content: space-between; margin-top: 30px;">
          <div>
              <h3 style="margin-bottom: 10px; color: #333;">Invoiced To *</h3>
              <p style="margin: 5px 0; font-size: 18px;"><strong>Agent Name:</strong> ${
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
              <h1 style="font-size: 80px; color: green; opacity: 0.8;">PAID</h1>
          </div>
      </div>
      <table style="width: 100%; margin-top: 30px; border-collapse: collapse; font-size: 18px;">
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
              <tr style="background-color: #f4f4f4;">
                  <td colspan="3" style="text-align: right; padding: 10px;"><strong>Credit</strong></td>
                  <td style="padding: 10px;"><strong>₹ ${
                    data.OrdersPending.AmountPaid.CreditAmount
                      ? data.OrdersPending.AmountPaid.CreditAmount
                      : 0
                  }</strong></td>
              </tr>
              <tr3 style="background-color: #322; color: white;">
                  <td colspan="3" style="text-align: right; padding: 10px;"><strong>Total</strong></td>
                  <td style="padding: 10px;"><strong>₹ ${
                    data.OrdersPending.AmountPaid.Total
                  }</strong></td>
              </tr3
          </tfoot>
      </table>
      <div style="text-align: center; margin-top: 30px; padding: 10px; background-color: #f4f4f4; border-radius: 5px;">
          <h3 style="margin: 0;">*By accepting this invoice, you agree to our Terms of Service and Privacy Policy.</h3>
      </div>
      </div>
      </body>
      </html>`;

    const permissionGranted = await requestStoragePermission();
    console.log('permissionGranted: ', permissionGranted);
    if (!permissionGranted) {
      console.log('Permission denied');
      return;
    }

    const options = {
      html: htmlContent,
      fileName: `invoice_${uid}_${data.OrdersPending.PaymentMethod}-${safeFormattedDate}`,
      directory: 'Documents',
    };
    try {
      const file = await RNHTMLtoPDF.convert(options);
      console.log(file.filePath);
      const name = `invoice_${uid}_${data.OrdersPending.PaymentMethod}-${safeFormattedDate}.pdf`
      const newPath = `${RNFS.DownloadDirectoryPath}/${name}`;
      console.log('newPath: ', newPath);
      await RNFS.moveFile(file.filePath, newPath);

      showNotification(newPath,name);  
      // await Share.open({
      //   title:'Share Invoice',
      //   message:'Here is your invoice',
      //   url:`file://${newPath}`,
      //   type:'application/pdf'
      // })
    } catch (error) {
      console.log('Error while generating Invoice PDF', error);
    }
  };

  const showNotification = async (filePath,displayName) => {
    await notifee.requestPermission();
    
    const channelId = await notifee.createChannel({
      id: 'invoice_channel',
      name: 'Invoice Notifications',
      importance: AndroidImportance.HIGH,
    });

    await notifee.displayNotification({
      title: 'Invoice Downloaded',
      body: displayName,
      android: {
        channelId,
        pressAction: {
          id: 'open-invoice',
        },
      },
      data: { filePath }, // Pass file path
    });
  };

  const openInvoice = async (filePath,displayName) => {
    try {
      await FileViewer.open(filePath, { displayName: displayName, showOpenWithDialog: true, mimeType: 'application/pdf'});
      console.log('Invoice opened successfully');
    } catch (error) {
      console.error('Error opening file:', error);
    }
  };

  return (
    <View>
      <Text>InvoiceGenerationScreen</Text>
      <Button onPress={generatePdf}>Click to generate</Button>
    </View>
  );
};

export default InvoiceGenerationScreen;

const styles = StyleSheet.create({});
