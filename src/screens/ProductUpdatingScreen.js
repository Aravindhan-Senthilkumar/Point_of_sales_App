import {
  StyleSheet,
  View,
  Image,
  Pressable,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import React, {useState} from 'react';
import {colors} from '../constants/colors';
import {dimensions} from '../constants/dimensions';
import {fonts} from '../constants/fonts';
import {Appbar, Button, Text, TextInput} from 'react-native-paper';
import {useNavigation, useRoute} from '@react-navigation/native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {getFirestore} from '@react-native-firebase/firestore';
import {firebase} from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import {Overlay} from '@rneui/themed';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Foundation from 'react-native-vector-icons/Foundation';
import useProductStore from '../store/useProductStore';
import {Dropdown} from 'react-native-element-dropdown';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';

const ProductUpdatingScreen = () => {
  const data = useRoute().params.item;
  const navigation = useNavigation();
  const [visible, setVisible] = useState(false);

  //State Updates
  const [imageUri, setImageUri] = useState(null);

  //Request camera permission
    const requestCameraPermission = async () => {
      try{
        if(Platform.OS !== 'android') return true;
  
        let permissionStatus = await check(PERMISSIONS.ANDROID.CAMERA)
        console.log('permissionStatus: ', permissionStatus);
  
        if(permissionStatus === RESULTS.BLOCKED || RESULTS.UNAVAILABLE || RESULTS.LIMITED){
          await request(PERMISSIONS.ANDROID.CAMERA)
        }
  
        if(permissionStatus === RESULTS.GRANTED){
          return true
        }else{
          return false
        }
      }catch(error){
        console.log("Error while requesting permission",error)
      } 
    }

  //Capture photo function
  const handleCapturePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    console.log('hasPermission: ', hasPermission);

    if(!hasPermission) return;

    const options = {
      mediaType: 'photo',
      quality: 1,
      saveToPhotos: true,
    };

    launchCamera(options, response => {
      if (response.didCancel) {
        console.log('User cancelled to capture image');
      } else if (response.errorMessage) {
        console.log('Error while capturing image', response.errorMessage);
      } else {
        setImageUri(response.assets[0].uri);
      }
    });
  };

  //Pick from gallery function
  const handlePickImage = () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
    };
    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled gallery selection');
      } else if (response.errorMessage) {
        console.log('Gallery Error: ', response.errorMessage);
      } else {
        setImageUri(response.assets[0].uri);
      }
    });
  };

  const [value, setValue] = useState(null);

  //Generating Product ID
  const [productId, setProductId] = useState('');

  console.log('ProductImage', data.ProductImage);
  //Errors
  const [errors, setErrors] = useState({
    productName: '',
    description: '',
    category: '',
    brandName: '',
    weight: '',
    stocks: '',
    price: '',
  });

  //HandleLogin
  const [productName, setProductName] = useState(data.ProductName);
  const [description, setDescription] = useState(data.Description);
  const [category, setCategory] = useState(data.Category);
  const [brandName, setBrandName] = useState(data.BrandName);
  const [productSaving, setProductSaving] = useState(false);

  const [changeModalVisible, setChangeModalVisible] = useState(false);
  const changeModalFunction = () => {
    setChangeModalVisible(true);
    setTimeout(() => {
      setChangeModalVisible(false);
    }, 800);
  };

  //Product updating Functions
  const {setIsProductUpdated} = useProductStore();

  const handleSavingProduct = async id => {
    let newErrors = {};

    if (!productName.trim())
      newErrors.productName = 'Product Name is required.';
    if (!description.trim())
      newErrors.description = 'Product Description is required.';
    if (!category.trim()) newErrors.category = 'Category is required.';
    if (!brandName.trim()) newErrors.brandName = 'Brand Name is required.';
    if (stocksList.length === 0) newErrors.stocks = 'All field required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setProductSaving(true);
    try {
      const fileName = `product_images/${id}/ProductImage.jpg`;
      const reference = await firebase.storage().ref(fileName);
      const currentData = data;
      const currentImageUrl = data.ProductImage;
      let productImageUrl = currentImageUrl;
      console.log('productImageUrl: ', productImageUrl);
      if (imageUri) {
        const responseBlob = await fetch(imageUri);
        const blob = await responseBlob.blob();
        await reference.put(blob);
        productImageUrl = await reference.getDownloadURL();
      }
      console.log('productImageUrl: ', productImageUrl);
      const newProductData = {
        ProductName: productName,
        Description: description,
        Category: category,
        BrandName: brandName,
        Stocks: stocksList,
        ProductImage: productImageUrl,
        UpdatedAt: firestore.FieldValue.serverTimestamp(),
      };

      const hasChanges = Object.keys(newProductData).some(key => {
        if (key === 'UpdatedAt') return false;
        const newValue = newProductData[key];
        const currentValue = currentData[key];
        return newValue !== currentValue;
      });
      console.log('hasChanges: ', hasChanges);
      if (hasChanges) {
        await getFirestore()
          .collection('products')
          .doc(id.toString())
          .update(newProductData);
        console.log('newProductData: ', newProductData);
        productUpdatedSuccess(id);
      } else {
        changeModalFunction();
        console.log('No changes detected, skipping update.');
      }
    } catch (error) {
      console.log(
        'Error in internal server while saving product in firestore',
        error,
      );
    } finally {
      setProductSaving(false);
    }
  };

  const productUpdatedSuccess = id => {
    setVisible(true);
    setProductId(id);
    setIsProductUpdated(true);
    setTimeout(() => {
      setVisible(false);
      navigation.goBack();
    }, 1500);
  };

  const [stocksList, setStocksList] = useState(data.Stocks);
  console.log('stocksList: ', stocksList);

  const [newStock, setNewStock] = useState({weight: '', stocks: '', price: ''});

  const handleAddStock = () => {
    const {weight, stocks, price} = newStock;

    let newErrors = {};

    if (!weight.trim()) newErrors.weight = 'Weight is required.';
    else if (isNaN(weight)) newErrors.weight = 'Weight must be a number.';

    if (!stocks.trim()) newErrors.stocks = 'Stocks is required.';
    else if (isNaN(stocks)) newErrors.stocks = 'Stocks must be a number.';

    if (!price.trim()) newErrors.price = 'Price is required.';
    else if (isNaN(price)) newErrors.price = 'Price must be a number.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({...prev, ...newErrors}));
      return;
    }

    setStocksList(prev => [
      ...prev,
      {
        weight: weight.concat(` ${dropdownValue}`),
        stocks: Number(stocks),
        price: Number(price),
      },
    ]);
    setNewStock({weight: '', stocks: '', price: ''});
    setErrors(prev => ({...prev, weight: '', stocks: '', price: ''}));
  };

  const handleDeleteStocks = index => {
    setStocksList(prev => prev.filter((_, i) => i !== index));
  };

  const dropdownData = [
    {label: 'gm', value: 'gm'},
    {label: 'lit', value: 'lit'},
    {label: 'kg', value: 'kg'},
  ];
  const [dropdownValue, setDropDownValue] = useState('lit');
  console.log('value: ', value);

  const onChangeProductName = text => {
    setProductName(text);
    setErrors(prev => ({...prev, productName: ''}));
  };
  const onChangeDescription = text => {
    setDescription(text);
    setErrors(prev => ({...prev, description: ''}));
  };
  const onChangeCategory = text => {
    setCategory(text);
    setErrors(prev => ({...prev, category: ''}));
  };
  const onChangeBrandName = text => {
    setBrandName(text);
    setErrors(prev => ({...prev, brandName: ''}));
  };
  const onChangeWeight = text => {
      setNewStock(prev => ({ ...prev, weight: text }));
      setErrors(prev => ({
        ...prev,
        weight: '',
        price: '',
        stocks: '',
      }));
  }
  const handleDropDown = (item) => {
      if (item.value !== value) {
        setDropDownValue(item.value);
      }
  }
  const onChangeStock = (text) => {
      setNewStock(prev => ({ ...prev, stocks: text }));
      setErrors(prev => ({
        ...prev,
        weight: '',
        price: '',
        stocks: '',
      }));
  }
  const onChangePrice = (text) => {
      setNewStock(prev => ({ ...prev, price: text }));
      setErrors(prev => ({
        ...prev,
        weight: '',
        price: '',
        stocks: '',
      }));
  }
  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.headerContainer}>
        <Appbar.BackAction
          onPress={() => navigation.goBack()}
          color={colors.pureWhite}
        />
        <Appbar.Content
          title="Update Product Details"
          color={colors.pureWhite}
          titleStyle={styles.headerText}
        />
      </Appbar.Header>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollContainer}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled">
        {/* Product ID Generation Container */}
        <View style={styles.productIdContainer}>
          <View style={styles.productIdTextWrapper}>
            <Text variant="titleMedium" style={styles.productIdLabel}>
              Product ID -
            </Text>
            <Text variant="bodyMedium"> {data.ProductId}</Text>
          </View>
        </View>

        {/* ImageContainer */}
        <View style={styles.imageContainer}>
          <Text variant="titleMedium" style={styles.imageLabel}>
            Product Image
          </Text>
          <View style={styles.imageWrapper}>
            <Image
              source={imageUri ? { uri: imageUri } : { uri: data.ProductImage }}
              style={styles.productImage}
            />
          </View>
          <View style={styles.imageButtonWrapper}>
            <Pressable style={styles.captureButton} onPress={handleCapturePhoto}>
              <Text>Capture from camera</Text>
            </Pressable>
            <Pressable style={styles.galleryButton} onPress={handlePickImage}>
              <Text>Pick from gallery</Text>
            </Pressable>
          </View>
        </View>

        {/* General information Container */}
        <View style={styles.generalInfoContainer}>
          <Text variant="titleMedium" style={styles.generalInfoLabel}>
            General information
          </Text>
          <View style={styles.inputWrapper}>
            <TextInput
              value={productName}
              onChangeText={text => onChangeProductName(text)}
              mode="outlined"
              label="Product Name"
              cursorColor={colors.black}
              activeOutlineColor={colors.black}
              style={styles.textInput}
            />
            {errors.productName ? (
              <Text style={styles.errorText}>Product Name Required</Text>
            ) : null}
            <TextInput
              value={description}
              onChangeText={text => onChangeDescription(text)}
              mode="outlined"
              label="Description"
              cursorColor={colors.black}
              activeOutlineColor={colors.black}
              style={styles.textInput}
            />
            {errors.description ? (
              <Text style={styles.errorText}>Description Required</Text>
            ) : null}
            <TextInput
              value={category}
              onChangeText={text => onChangeCategory(text)}
              mode="outlined"
              label="Category"
              cursorColor={colors.black}
              activeOutlineColor={colors.black}
              style={styles.textInput}
            />
            {errors.category ? (
              <Text style={styles.errorText}>Category Required</Text>
            ) : null}
            <TextInput
              value={brandName}
              onChangeText={text => onChangeBrandName(text)}
              mode="outlined"
              label="Brand Name"
              cursorColor={colors.black}
              activeOutlineColor={colors.black}
              style={styles.textInput}
            />
            {errors.brandName ? (
              <Text style={styles.errorText}>Brand Name Required</Text>
            ) : null}
          </View>
        </View>

        {/* Stock Quantity Container */}
        <View style={styles.stockContainer}>
          <View style={styles.stockHeader}>
            <Text variant="titleMedium">Stocks</Text>
          </View>
          <View style={styles.stockInputWrapper}>
            <View style={styles.stockInputField}>
              <TextInput
                value={newStock.weight}
                keyboardType='number-pad'
                onChangeText={text => onChangeWeight(text)}
                mode="outlined"
                label="Weight"
                cursorColor={colors.black}
                activeOutlineColor={colors.black}
                style={styles.stockTextInput}
              />
            </View>
            <View style={styles.stockInputField}>
              <Dropdown
                style={styles.dropdown}
                data={dropdownData}
                value={dropdownValue}
                placeholder={dropdownValue}
                labelField="label"
                valueField="value"
                selectedTextStyle={styles.dropdownSelectedText}
                onChange={item => handleDropDown(item)}
                placeholderStyle={styles.dropdownPlaceholder}
                renderItem={item => (
                  <View style={styles.dropdownItemContainer}>
                    <Text style={styles.dropdownItem}>{item.label}</Text>
                  </View>
                )}
              />
            </View>
            <View style={styles.stockInputField}>
              <TextInput
                keyboardType="numeric"
                value={newStock.stocks}
                onChangeText={text => onChangeStock(text)}
                mode="outlined"
                label="Stocks"
                cursorColor={colors.black}
                activeOutlineColor={colors.black}
                style={styles.stockTextInput}
              />
            </View>
            <View style={styles.stockInputField}>
              <TextInput
                keyboardType="numeric"
                value={newStock.price}
                onChangeText={text => onChangePrice(text)}
                mode="outlined"
                label="Price"
                cursorColor={colors.black}
                activeOutlineColor={colors.black}
                style={styles.stockTextInput}
              />
            </View>
            <Button
              textColor={colors.black}
              mode="text"
              onPress={handleAddStock}
            >
              Add
            </Button>
          </View>
          {errors.stocks || errors.weight || errors.price ? (
            <Text style={styles.errorText}>All fields required</Text>
          ) : null}
        </View>

        {/* Added Stocks Container */}
        <View style={styles.addedStocksContainer}>
          <View style={styles.addedStocksHeader}>
            <Text variant="titleMedium">Added Stocks</Text>
          </View>
          {/* Table Header */}
          <View style={styles.tableHeaderContainer}>
            <Text variant="titleMedium" style={styles.tableHeader}>
              S.No
            </Text>
            <Text variant="titleMedium" style={styles.tableHeader}>
              Weight
            </Text>
            <Text variant="titleMedium" style={styles.tableHeader}>
              Price
            </Text>
            <Text variant="titleMedium" style={styles.tableHeader}>
              Stocks
            </Text>
            <Text variant="titleMedium" style={styles.tableHeader}>
              Action
            </Text>
          </View>
          {/* Table Body */}
          {stocksList.length > 0 ? (
            stocksList.map((item, index) => (
              <View key={`${index}`} style={styles.tableRow}>
                <Text style={styles.tableCell}>{index + 1}</Text>
                <Text style={styles.tableCell}>{item.weight}</Text>
                <Text style={styles.tableCell}>₹ {item.price}</Text>
                <Text style={styles.tableCell}>{item.stocks}</Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteStocks(index)}
                >
                  <Text style={styles.deleteText}>❌</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.noStocksText}>No stocks added yet.</Text>
          )}
        </View>

        {/* BarCode Container */}
        <View style={styles.barcodeContainer}>
          <View style={styles.barcodeHeader}>
            <Text variant="titleMedium">Barcode</Text>
          </View>
          <View style={styles.barcodeWrapper}>
            <Image
              source={{ uri: data.BarcodeImageUri }}
              style={styles.barcodeImage}
            />
          </View>
        </View>

        {/* Save product Button */}
        <View style={styles.saveButtonContainer}>
          {productSaving ? (
            <Button
              style={styles.savingButton}
              textColor={colors.pureWhite}
            >
              Saving....
            </Button>
          ) : (
            <Button
              onPress={() => handleSavingProduct(data.ProductId)}
              style={styles.saveButton}
              textColor={colors.pureWhite}
            >
              Save Product
            </Button>
          )}
        </View>
        <Overlay isVisible={visible}>
          <View style={styles.overlayContent}>
            <AntDesign
              name="checkcircle"
              color="green"
              size={dimensions.width / 4}
            />
            <Text style={styles.overlayText}>
              Product - 101 updated successfully
            </Text>
          </View>
        </Overlay>
        <Overlay isVisible={changeModalVisible}>
          <View style={styles.overlayContent}>
            <Foundation
              name="alert"
              color={colors.red}
              size={dimensions.width / 4}
            />
            <Text style={styles.overlayText}>No Changes Detected</Text>
          </View>
        </Overlay>
      </ScrollView>
    </View>
  );
};

export default ProductUpdatingScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.halfWhite,
    flex: 1,
  },
  headerContainer: {
    backgroundColor: colors.orange,
    height: dimensions.xl * 2.25,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    color: colors.pureWhite,
    fontFamily: fonts.bold,
    fontSize: dimensions.md,
  },
  scrollContainer: {
    flex: 1,
    marginBottom: dimensions.sm,
  },
  productIdContainer: {
    flex: 1,
    margin: dimensions.sm / 2,
    backgroundColor: colors.pureWhite,
    borderColor: colors.lightGray,
    borderWidth: 1,
    padding: dimensions.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productIdTextWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productIdLabel: {
    alignSelf: 'flex-start',
  },
  imageContainer: {
    margin: dimensions.sm / 2,
    backgroundColor: colors.pureWhite,
    borderColor: colors.lightGray,
    borderWidth: 1,
    padding: dimensions.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageLabel: {
    alignSelf: 'flex-start',
  },
  imageWrapper: {
    height: dimensions.height / 5,
    width: dimensions.height / 5,
    overflow: 'hidden',
    borderRadius: dimensions.sm,
    margin: dimensions.sm,
  },
  productImage: {
    height: dimensions.height / 5,
    width: dimensions.height / 5,
    resizeMode: 'cover',
  },
  imageButtonWrapper: {
    flexDirection: 'row',
    gap: dimensions.sm,
  },
  captureButton: {
    borderColor: colors.lightGray,
    borderWidth: 1,
    paddingHorizontal: dimensions.xl / 1.5,
    paddingVertical: dimensions.sm / 2,
    borderRadius: dimensions.sm / 2,
  },
  galleryButton: {
    borderColor: colors.lightGray,
    borderWidth: 1,
    paddingHorizontal: dimensions.xl / 1.5,
    paddingVertical: dimensions.sm / 2,
    borderRadius: dimensions.sm / 2,
  },
  generalInfoContainer: {
    flex: 1,
    margin: dimensions.sm / 2,
    backgroundColor: colors.pureWhite,
    borderColor: colors.lightGray,
    borderWidth: 1,
    padding: dimensions.sm,
  },
  generalInfoLabel: {
    alignSelf: 'flex-start',
  },
  inputWrapper: {
    gap: dimensions.sm / 2,
  },
  textInput: {
    backgroundColor: colors.pureWhite,
  },
  errorText: {
    color: 'red',
    fontSize: dimensions.sm,
    marginLeft: dimensions.sm / 2,
  },
  stockContainer: {
    flex: 1,
    margin: dimensions.sm / 2,
    backgroundColor: colors.pureWhite,
    borderColor: colors.lightGray,
    borderWidth: 1,
    padding: dimensions.sm,
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockInputWrapper: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: dimensions.sm / 3,
    justifyContent: 'center',
  },
  stockInputField: {
    flex: 1,
  },
  stockTextInput: {
    backgroundColor: colors.pureWhite,
    height: dimensions.md * 2,
    fontSize: dimensions.sm,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: colors.grayText,
    height: dimensions.md * 2,
    marginTop: dimensions.sm / 2,
    width: '100%',
  },
  dropdownSelectedText: {
    textAlign: 'center',
  },
  dropdownPlaceholder: {
    fontSize: dimensions.sm,
  },
  dropdownItemContainer: {
    padding: dimensions.sm / 2,
    borderWidth: 0.5,
    borderBottomColor: colors.black,
  },
  dropdownItem: {
    // Assuming some default styling; adjust as needed
  },
  addedStocksContainer: {
    flex: 1,
    margin: dimensions.sm / 2,
    backgroundColor: colors.pureWhite,
    borderColor: colors.lightGray,
    borderWidth: 1,
    padding: dimensions.sm,
  },
  addedStocksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tableHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: dimensions.sm / 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    backgroundColor: colors.halfWhite,
  },
  tableHeader: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: dimensions.sm,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: dimensions.sm / 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: dimensions.sm,
  },
  deleteButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    fontSize: dimensions.sm,
    color: colors.red,
  },
  noStocksText: {
    textAlign: 'center',
    padding: dimensions.sm,
  },
  barcodeContainer: {
    flex: 1,
    margin: dimensions.sm / 2,
    backgroundColor: colors.pureWhite,
    borderColor: colors.lightGray,
    borderWidth: 1,
    padding: dimensions.sm,
  },
  barcodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barcodeWrapper: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    height: dimensions.width / 3,
    width: dimensions.width / 1.5,
    overflow: 'hidden',
  },
  barcodeImage: {
    height: dimensions.width / 3,
    width: dimensions.width / 1.5,
    resizeMode: 'cover',
  },
  saveButtonContainer: {
    flex: 1,
    margin: dimensions.sm / 2,
    backgroundColor: colors.pureWhite,
    borderColor: colors.lightGray,
    borderWidth: 1,
    padding: dimensions.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingButton: {
    backgroundColor: colors.darkblue,
    width: dimensions.width / 1.5,
  },
  saveButton: {
    backgroundColor: colors.darkblue,
    width: dimensions.width / 1.5,
  },
  overlayContent: {
    alignItems: 'center',
    justifyContent: 'center',
    height:dimensions.height/4,
    width:dimensions.width/1.5,
  },
  overlayText: {
    fontSize: dimensions.md,
    textAlign:'center'
  },
});
