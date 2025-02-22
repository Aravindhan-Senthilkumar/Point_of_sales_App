import React, { useState, useRef } from 'react';
import { View, TextInput, Button, StyleSheet, Image } from 'react-native';
import Barcode from '@kichiyaki/react-native-barcode-generator';
import { captureRef } from 'react-native-view-shot';
import { useNavigation } from '@react-navigation/native';

const BarcodeGenerator = () => {
  const navigation = useNavigation();
  const [inputValue, setInputValue] = useState('123456789012');
  const [barcodeUri, setBarcodeUri] = useState(null);
  const barcodeRef = useRef();
  const [user,setUser] = useState(null);
  console.log(user)
  
  const generateBarcodeImage = async () => {
    try {
      const uri = await captureRef(barcodeRef, {
        format: 'png',
        quality: 1,
      });
      setBarcodeUri(uri);
    } catch (error) {
      console.error('Error capturing barcode image:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter product code"
        value={inputValue}
        onChangeText={setInputValue}
      />
      <Button title="Generate Barcode Image" onPress={generateBarcodeImage} />

      <View ref={barcodeRef} collapsable={false} style={styles.barcodeContainer}>
        <Barcode 
        value={inputValue} 
        format="CODE128" 
        height={100}
        maxWidth={300}
        />
      </View>

      {barcodeUri && (
        <Image
          source={{ uri: barcodeUri }}
          style={{ width: 300, height: 150, marginTop: 20 }}
        />
      )}
      <Button title='FetchProduct'/>
      <Button title='Barcode Scanner'/>
    </View>
  );
};

export default BarcodeGenerator;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  input: {
    height: 40,
    width: 250,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  barcodeContainer: {
    backgroundColor: '#fff',
    padding: 10,
  },
});
