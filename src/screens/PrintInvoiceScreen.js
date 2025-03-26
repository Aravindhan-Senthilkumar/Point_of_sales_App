import { Image, Platform, StyleSheet, Text, Touchable, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import {
  USBPrinter,
  NetPrinter,
  BLEPrinter,
} from "react-native-thermal-receipt-printer";
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import { BluetoothEscposPrinter, BluetoothTscPrinter,BluetoothManager, BARCODETYPE, DIRECTION } from 'tp-react-native-bluetooth-printer';
import RNFS from 'react-native-fs'
import { Button } from 'react-native-paper';
import { Image as RNImage } from "react-native";

const PrintInvoiceScreen = () => {
  const [printers, setPrinters] = useState([]);
  console.log('printers: ', printers);
  const [currentPrinter, setCurrentPrinter] = useState();
  console.log('currentPrinter: ', currentPrinter);

  useEffect(() => {
    requestBluetoothPermission().then((granted) => {
      if(granted){
        BLEPrinter.init().then(() => {
          BLEPrinter.getDeviceList().then(setPrinters)
        })
      }else{
        console.warn("Bluetooth permissions not granted")
      }
    }) 
  },[])

  const requestBluetoothPermission = async () => {
    if (Platform.OS === "android" && Platform.Version >= 31) {
      try {
        let bluetoothConnectPermission = await check(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT);
        console.log("Bluetooth Connect Permission:", bluetoothConnectPermission);
        if (bluetoothConnectPermission === RESULTS.DENIED) {
          await request(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT);
          bluetoothConnectPermission = await check(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT);
        }
        let bluetoothScanPermission = await check(PERMISSIONS.ANDROID.BLUETOOTH_SCAN);
        console.log("Bluetooth Scan Permission:", bluetoothScanPermission);
  
        if (bluetoothScanPermission === RESULTS.DENIED) {
          await request(PERMISSIONS.ANDROID.BLUETOOTH_SCAN);
          bluetoothScanPermission = await check(PERMISSIONS.ANDROID.BLUETOOTH_SCAN);
        }
        if (
          bluetoothConnectPermission === RESULTS.GRANTED &&
          bluetoothScanPermission === RESULTS.GRANTED
        ) {
          return true;
        }
        return false;
      } catch (error) {
        console.log("Error in requesting Bluetooth permission:", error);
        return false;
      }
    } else {
      return true;
    }
  };
  
  // const printBarcode = async () => {
  //   try {
  //     await BluetoothEscposPrinter.printBarCode('47191299538509','CODE128');
  //     console.log("Image printed successfully!");
  //   } catch (error) {
  //     console.error("Error printing image:", error);
  //   }
  // };


  // const connectPrinter = (printer) => {
  //   BLEPrinter.connectPrinter(printer.inner_mac_address).then(
  //     setCurrentPrinter,
  //     error => console.warn(error))
  // }
  // const printTextTest = () => {
  //   currentPrinter && BLEPrinter.printText("<C>sample text</C>\n");
  // }
  // const printBillTest = () => {
  //   currentPrinter && BLEPrinter.printBill("<C>sample bill</C>");
  // }


  const [image64URI, setImage64URI] = useState();
  console.log('image64URI: ', image64URI);

  const printBarcodeImage = async (firestoreImageUrl) => {
    try {
        if (!currentPrinter) {
            console.warn("No printer connected!");
            return;
        }

        if (!firestoreImageUrl) {
            console.error("No image URL provided from Firestore.");
            return;
        }

        // Define local storage path
        const localFilePath = `${RNFS.DocumentDirectoryPath}/barcode_image.jpg`;
        console.log('localFilePath: ', localFilePath);

        // Download the image from Firestore URL to local storage
        const downloadResult = await RNFS.downloadFile({
          fromUrl: firestoreImageUrl,
          toFile: localFilePath,
        }).promise;
        
        console.log('downloadResult: ', downloadResult);

        if (downloadResult.statusCode !== 200) {
            console.error("Failed to download image from Firestore.");
            return;
        }

        console.log("Image downloaded successfully:", localFilePath);

        // Convert local image to Base64
        const base64Image = await RNFS.readFile(localFilePath, "base64");
        console.log('base64Image: ', base64Image);


        await BluetoothEscposPrinter.printPic(base64Image, {
          width: 300, 
          left: 40,
          height:200
        })
        
        console.log("Barcode image printed successfully!");
    } catch (error) {
        console.error("Error printing barcode image:", error);
    }
};


  const connectPrinter = async (printer) => {
    try {
      await BluetoothManager.connect(printer.inner_mac_address);
      setCurrentPrinter(printer);
      console.log("Connected to printer:", printer.device_name);
    } catch (error) {
      console.error("Failed to connect to printer:", error);
    }
  };

  const firestoreImageUrl = "https://firebasestorage.googleapis.com/v0/b/posapp-a0d4a.firebasestorage.app/o/barcode_images%2F102%2FBarcodeImageUri.jpg?alt=media&token=1fbe4f14-6e97-40b5-961c-6f66438c510d";

  return (
    <View>
      <Text>PrintInvoiceScreen</Text>
      {
        printers &&
        printers.map((item,index) => {
          return (
            <TouchableOpacity key={index} onPress={() => connectPrinter(item)}>
              <Text>{item.device_name}</Text>
              <Text>{item.inner_mac_address}</Text>
              </TouchableOpacity>
          )
        })
      }
      <TouchableOpacity onPress={() => printBarcodeImage(firestoreImageUrl)}>
        <Text>Print Bill Text</Text> 
      </TouchableOpacity>


      <TouchableOpacity onPress={connectPrinter}>
        <Text>Connect printer</Text> 
      </TouchableOpacity>
      
    </View>
  )
}

export default PrintInvoiceScreen

const styles = StyleSheet.create({})