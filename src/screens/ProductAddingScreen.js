import {
  StyleSheet,
  View,
  Image,
  Pressable,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import React, { useRef, useState} from 'react';
import {colors} from '../constants/colors';
import {dimensions} from '../constants/dimensions';
import {fonts} from '../constants/fonts';
import {Appbar, Button, Text, TextInput} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import { getFirestore } from '@react-native-firebase/firestore';
import Barcode from '@kichiyaki/react-native-barcode-generator';
import { captureRef } from 'react-native-view-shot';
import { firebase } from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import { Overlay } from '@rneui/themed';
import AntDesign from 'react-native-vector-icons/AntDesign'
import useProductStore from '../store/useProductStore';

const ProductAddingScreen = () => {
  const navigation = useNavigation();
  const [visible, setVisible] = useState(false);
  //State Updates
  const [imageUri, setImageUri] = useState(null);
  
  //Capture photo function
  const handleCapturePhoto = () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
      saveToPhotos: true,
    };

    launchCamera(options, response => {
      if (response.didCancel) {
        console.log('User cancalled to capture image');
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

  // Tax DropDown state
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([
    {label: 'Option 1', value: 'option1'},
    {label: 'Option 2', value: 'option2'},
    {label: 'Option 3', value: 'option3'},
  ]);

  // Category dropdown state
  const [open1, setOpen1] = useState(false);
  const [value1, setValue1] = useState(null);
  const [items1, setItems1] = useState([
    {label: 'Option 1', value: 'option1'},
    {label: 'Option 2', value: 'option2'},
    {label: 'Option 3', value: 'option3'},
  ]);

  //Generating Product ID
  const [productIdLoading,setProductIdLoading] = useState(false);
  const [productId,setProductId] = useState('');

  const fetchLastProductId = async () => {
    setProductIdLoading(true)
      const counterRef = await getFirestore().collection('metadata').doc('product_counter');
      try{
        const counterDoc = await counterRef.get()
        if(counterDoc.exists){
          const lastId = await counterDoc.data().lastProductId + 1;
          setProductId(lastId);
        }else {
          await counterRef.set({ lastProductId:100 });
          setProductId(101)
        }
      }catch(error){
      console.log("Error in internal server while fetching Last product Id",error)
    }finally{
      setProductIdLoading(false)
    }
  }

  //Barcode Generation
  const barcodeRef = useRef();
  const [inputValue,setInputValue] = useState(null);
  const generateRandomBarcode = () => {
    const barCode = Math.floor(Math.random() * 90000000000000 + 10000000000000).toString()
    setInputValue(barCode);
  }

  //Errors
  const [errors,setErrors] = useState({
    productName: '',
    description: '',
    category:'',
    brandName:'',
    weight: '',
    stocks: '',
    price: '',
  });

  //HandleLogin
  const [productName,setProductName] = useState('');
  const [description,setDescription] = useState('');
  const [category,setCategory] = useState('');
  const [brandName,setBrandName] = useState('');
  const [productSaving,setProductSaving] = useState(false)

  const { setIsProductUpdated } = useProductStore();
  const handleSavingProduct = async () => {

    let newErrors = {};

    if(!productName.trim()) newErrors.productName = "Product Name is required.";
    if(!description.trim()) newErrors.description = "Product Description is required.";
    if(!category.trim()) newErrors.category = 'Category is required.';
    if(!brandName.trim()) newErrors.brandName = 'Brand Name is required.';
    if(stocksList.length === 0) newErrors.stocks = 'All field required' 
    if(Object.keys(newErrors).length > 0){
      setErrors(newErrors);
      return;
    }
    setProductSaving(true);
    const counterRef = await getFirestore().collection('metadata').doc('product_counter');
    try{
      const newId = await getFirestore().runTransaction(async(transaction) => {
        const counterDoc  = await transaction.get(counterRef)

        let currentId;
        if(!counterDoc.exists){
          transaction.set(counterRef, { lastProductId: 101 });
          return 101;
        }else{
          currentId = await counterDoc.data().lastProductId;
          if (currentId >= 999) {
            throw new Error('Product ID limit reached (999)');
          }
        }
        const nextId = currentId + 1;
        transaction.update(counterRef, { lastProductId: nextId });
        return nextId;
      }
      )
      let productImageUrl = null;
      if (imageUri) {
        const fileName = `product_images/${newId}/ProductImage.jpg`;
        const reference = firebase.storage().ref(fileName); 
  
        const responseBlob = await fetch(imageUri);
        const blob = await responseBlob.blob();
  
        await reference.put(blob);
        productImageUrl = await reference.getDownloadURL();
  
        console.log('Uploaded Product Image URL:', productImageUrl);
      }

      let barcodeImageUri = null;
      if(barcodeRef){
        const uri = await captureRef(barcodeRef, {
                format: 'png',
                quality: 1,
              });
        const fileName = `barcode_images/${newId}/BarcodeImageUri.jpg`;
        const reference = firebase.storage().ref(fileName);

        const responseBlob = await fetch(uri);
        const blob = await responseBlob.blob();

        await reference.put(blob)
        barcodeImageUri = await reference.getDownloadURL();
  
        console.log('Uploaded Barcode Image URL:', barcodeImageUri);
      }

      const productData = {
        ProductId:newId,
        ProductName: productName.trimEnd(),
        Description: description.trimEnd(),
        Category: category.trimEnd(),
        BrandName:brandName.trimEnd(),
        Stocks:stocksList,
        ProductImage:productImageUrl,
        Barcode:inputValue,
        BarcodeImageUri:barcodeImageUri,
        CreatedAt: firestore.FieldValue.serverTimestamp(),
      }
      console.log('productImageUrl: ', productImageUrl);
      await getFirestore().collection('products').doc(newId.toString()).set(productData);
      productAddedSuccess(newId);
    }catch(error){
      console.log("Error in internal server while saving product in firestore",error)
    }finally{
      setProductSaving(false)
    }
  }

  const productAddedSuccess = (id) => {
    setVisible(true)
    setProductId(id)
    setIsProductUpdated(true)
    setTimeout(() => {
      setVisible(false)
      navigation.goBack()
    },1500)
  }

  const [stocksList, setStocksList] = useState([]);
  console.log('stocksList: ', stocksList);

  const [newStock, setNewStock] = useState({ weight: '', stocks: '', price: '' });

  const handleAddStock = () => {
    const { weight,stocks,price } = newStock;

    let newErrors = {};

    if (!weight.trim()) newErrors.weight = 'Weight is required.';
    else if (isNaN(weight)) newErrors.weight = 'Weight must be a number.';
    
    if (!stocks.trim()) newErrors.stocks = 'Stocks is required.';
    else if (isNaN(stocks)) newErrors.stocks = 'Stocks must be a number.';
    
    if (!price.trim()) newErrors.price = 'Price is required.';
    else if (isNaN(price)) newErrors.price = 'Price must be a number.';

    if (Object.keys(newErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...newErrors }));
      return;
    }

    setStocksList((prev) => [ ...prev, { weight: Number(weight), stocks: Number(stocks), price: Number(price) }]);
    setNewStock({ weight: '', stocks: '', price: '' });
    setErrors((prev) => ({ ...prev, weight: '', stocks: '', price: '' }));
  };

  const handleDeleteStocks = (index) => {
    setStocksList((prev) => prev.filter((_,i) => i !== index));
  }
  return (
    <View style={styles.container}>
      
      <Appbar.Header style={styles.headerContainer}>
        <Appbar.BackAction
          onPress={() => navigation.goBack()}
          color={colors.pureWhite}
        />
        <Appbar.Content
          title="Add Product Details"
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
        <View
          style={{
            flex: 1,
            margin: dimensions.sm / 2,
            backgroundColor: colors.pureWhite,
            borderColor: colors.lightGray,
            borderWidth: 1,
            padding: dimensions.sm,
            flexDirection:'row',
            alignItems:'center',
            justifyContent:'space-between'
          }}>
          <View style={{ flexDirection:'row',
            alignItems:'center' }}>
          <Text variant="titleMedium" style={{alignSelf: 'flex-start'}}>
            Product ID
          </Text>
          {
            productIdLoading ? (
              <Text variant="bodyMedium"> - Loading...</Text>
            ) : productId 
            ? (
                <Text variant="bodyLarge"> - {productId}</Text>
              )
            : (
              <Text variant="bodyMedium"> - Not Generated</Text>
            )
          }
          </View>
          <View>
          <Button textColor={colors.black} onPress={() => fetchLastProductId()}>
           Generate
          </Button>
          </View>
        </View>

        {/* ImageContainer */}
        <View
          style={{
            margin: dimensions.sm / 2,
            backgroundColor: colors.pureWhite,
            borderColor: colors.lightGray,
            borderWidth: 1,
            padding: dimensions.sm,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Text variant="titleMedium" style={{alignSelf: 'flex-start'}}>
            Product Image
          </Text>
          <View style={styles.imageWrapper}>
            <Image
              source={
                imageUri ? {uri: imageUri} : require('../images/default.png')
              }
              style={styles.productImage}
            />
          </View>
          <View style={{flexDirection: 'row', gap: dimensions.sm}}>
            <Pressable
              style={{
                borderColor: colors.lightGray,
                borderWidth: 1,
                paddingHorizontal: dimensions.xl / 1.5,
                paddingVertical: dimensions.sm / 2,
                borderRadius: dimensions.sm / 2,
              }}
              onPress={() => handleCapturePhoto()}>
              <Text>Capture from camera</Text>
            </Pressable>
            <Pressable
              style={{
                borderColor: colors.lightGray,
                borderWidth: 1,
                paddingHorizontal: dimensions.xl / 1.5,
                paddingVertical: dimensions.sm / 2,
                borderRadius: dimensions.sm / 2,
              }}
              onPress={() => handlePickImage()}>
              <Text>Pick from gallery</Text>
            </Pressable>
          </View>
        </View>

        {/* General information Container */}
        <View
          style={{
            flex: 1,
            margin: dimensions.sm / 2,
            backgroundColor: colors.pureWhite,
            borderColor: colors.lightGray,
            borderWidth: 1,
            padding: dimensions.sm,
          }}>
          <Text variant="titleMedium" style={{alignSelf: 'flex-start'}}>
            General information
          </Text>
          <View style={{gap: dimensions.sm / 2}}>
            <TextInput
              value={productName}
              onChangeText={text => {
                setProductName(text)
                setErrors(prev => ({ ...prev,productName:'' }))
              }}
              mode="outlined"
              label="Product Name"
              cursorColor={colors.black}
              activeOutlineColor={colors.black}
              style={{backgroundColor: colors.pureWhite}}
            />  
           { errors.productName ? (<Text style={styles.errorText}>Product Name Required</Text>) : null }
            <TextInput
              value={description}
              onChangeText={text => {
                setDescription(text)
                setErrors(prev => ({ ...prev,description:'' }))
              }}
              mode="outlined"
              label="Description"
              cursorColor={colors.black}
              activeOutlineColor={colors.black}
              style={{backgroundColor: colors.pureWhite}}
            />
            { errors.description ? (<Text style={styles.errorText}>Description Required</Text>) : null }
            <TextInput
              value={category}
              onChangeText={text => {
                setCategory(text)
                setErrors(prev => ({ ...prev,category:'' }))
              }}              mode="outlined"
              label="Category"
              cursorColor={colors.black}
              activeOutlineColor={colors.black}
              style={{backgroundColor: colors.pureWhite}}
            />
            { errors.category ? (<Text style={styles.errorText}>Category Required</Text>) : null }
            <TextInput
              value={brandName}
              onChangeText={text => {
                setBrandName(text)
                setErrors(prev => ({ ...prev,brandName:'' }))
              }}
              mode="outlined"
              label="Brand Name"
              cursorColor={colors.black}
              activeOutlineColor={colors.black}
              style={{backgroundColor: colors.pureWhite}}
            />
            { errors.brandName ? (<Text style={styles.errorText}>Brand Name Required</Text>) : null }
          </View>
        </View>

        {/* Stock Quantity Container */}
        <View
          style={{
            flex: 1,
            margin: dimensions.sm / 2,
            backgroundColor: colors.pureWhite,
            borderColor: colors.lightGray,
            borderWidth: 1,
            padding: dimensions.sm,
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <Text variant="titleMedium">Stocks</Text>
          </View>
          <View style={{ flex:1,width:'100%',flexDirection:'row',alignItems:'center',gap:dimensions.sm / 2,justifyContent:'center' }}>
              <View style={{ flex:1 }}>
              <TextInput
                keyboardType='numeric'
                value={newStock.weight}
                onChangeText={text => {
                  setNewStock((prev) => ({ ...prev,weight:text }))
                  setErrors((prev) => ({ ...prev,weight:'',price:'',stocks:'' }))
                }}        
                mode="outlined"
                label="Weight"
                cursorColor={colors.black}
                activeOutlineColor={colors.black}
                style={{backgroundColor: colors.pureWhite,height:dimensions.md * 2,fontSize:dimensions.sm}}
              />
              </View>
              <View style={{ flex:1 }}>
              <TextInput
                keyboardType='numeric'
                value={newStock.stocks}
                onChangeText={text => {
                  setNewStock((prev) => ({ ...prev,stocks:text }))
                  setErrors((prev) => ({ ...prev,weight:'',price:'',stocks:'' }))
                }}     
                mode="outlined"
                label="Stocks"
                cursorColor={colors.black}
                activeOutlineColor={colors.black}
                style={{backgroundColor: colors.pureWhite,height:dimensions.md * 2,fontSize:dimensions.sm}}
              />
              </View>
              <View style={{ flex:1 }}>
            <TextInput
              keyboardType='numeric'
              value={newStock.price}
              onChangeText={text => {
                setNewStock((prev) => ({ ...prev,price:text }))
                setErrors((prev) => ({ ...prev,weight:'',price:'',stocks:'' }))
              }}      
              mode="outlined"
              label="Price"
              cursorColor={colors.black}
              activeOutlineColor={colors.black}
              style={{backgroundColor: colors.pureWhite,height:dimensions.md * 2,fontSize:dimensions.sm}}
            />
              </View>
            <Button icon='plus' textColor={colors.black} mode='contained' style={{ backgroundColor:colors.lightGray }} onPress={() => handleAddStock()}>Add</Button>
            </View>
            { errors.stocks || errors.weight || errors.price ? (<Text style={styles.errorText}>All fields required</Text>) : null }
        </View>

        {/* Added Stocks Container */}
        <View
  style={{
    flex: 1,
    margin: dimensions.sm / 2,
    backgroundColor: colors.pureWhite,
    borderColor: colors.lightGray,
    borderWidth: 1,
    padding: dimensions.sm,
  }}
>
  <View
    style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}
  >
    <Text variant="titleMedium">Added Stocks</Text>
  </View>

  {/* Table Header */}
  <View
    style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: dimensions.sm / 2,
      borderBottomWidth: 1,
      borderBottomColor: colors.lightGray,
      backgroundColor: colors.halfWhite,
    }}
  >
    <Text variant="titleMedium" style={styles.tableHeader}>S.No</Text>
    <Text variant="titleMedium" style={styles.tableHeader}>Weight</Text>
    <Text variant="titleMedium" style={styles.tableHeader}>Price</Text>
    <Text variant="titleMedium" style={styles.tableHeader}>Stocks</Text>
    <Text variant="titleMedium" style={styles.tableHeader}>Action</Text>
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
    <Text style={{ textAlign: 'center', padding: dimensions.sm }}>
      No stocks added yet.
    </Text>
  )}
</View>

        {/* BarCode Container */}
        <View
          style={{
            flex: 1,
            margin: dimensions.sm / 2,
            backgroundColor: colors.pureWhite,
            borderColor: colors.lightGray,
            borderWidth: 1,
            padding: dimensions.sm,
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <Text variant="titleMedium">Barcode</Text>
          </View>

          <View
            style={{
              alignSelf: 'center',
              justifyContent: 'center',
              alignItems: 'center',
              height: dimensions.width / 3,
              width: dimensions.width / 1.5,
              overflow:'hidden'
            }}>
              {
                inputValue !== null && (
                  <View ref={barcodeRef} collapsable={false}>
                  <Barcode 
                  value={inputValue} 
                  format="CODE128" 
                  height={dimensions.xl * 3}
                  maxWidth={dimensions.width/1.5}
                  text={inputValue}
                  />
                  </View>
                )
              }
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignSelf: 'center',
            }}>
              <Button mode='contained-tonal' style={{ backgroundColor: colors.lightGray }} onPress={() => generateRandomBarcode()} textColor={colors.black}>Generate Barcode</Button>
          </View>
        </View>
        

        {/* Save product Button */}
        <View
          style={{
            flex: 1,
            margin: dimensions.sm / 2,
            backgroundColor: colors.pureWhite,
            borderColor: colors.lightGray,
            borderWidth: 1,
            padding: dimensions.sm,
            justifyContent:'center',
            alignItems:'center'
          }}>{
            productSaving ? (
              <Button style={{ backgroundColor:colors.darkblue,width:dimensions.width / 1.5 }} textColor={colors.pureWhite}>Saving....</Button>
            )
            : (
              <Button onPress={() => handleSavingProduct()} style={{ backgroundColor:colors.darkblue,width:dimensions.width / 1.5 }} textColor={colors.pureWhite}>Save Product</Button>
            ) 
          }
        </View>
        <Overlay 
        isVisible={visible}>
          <View style={{ alignItems:'center',justifyContent:'center',padding:dimensions.xl,gap:dimensions.md}}>
          <AntDesign
          name="checkcircle"
          color="green"
          size={dimensions.width / 4}
          />
          <Text style={{ fontSize:dimensions.md }}>Product - {productId} added successfully</Text>
          </View>
        </Overlay>
      </ScrollView>
    </View>
  );
};

export default ProductAddingScreen;

const styles = StyleSheet.create({
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
  container: {
    backgroundColor: colors.halfWhite,
    flex: 1,
  },
  productImage: {
    height: dimensions.height / 5,
    width: dimensions.height / 5,
    resizeMode: 'cover',
  },
  imageWrapper: {
    height: dimensions.height / 5,
    width: dimensions.height / 5,
    overflow: 'hidden',
    borderRadius: dimensions.sm,
    margin: dimensions.sm,
  },
  scrollContainer: {
    flex: 1,
    marginBottom: dimensions.sm,
  },
  errorText: {
    color: 'red',
    fontSize: dimensions.sm,
    marginLeft: dimensions.sm / 2,
  },
  tableHeader: {
    flex: 1, // Equal width for each column
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
    flex: 1, // Matches other columns
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    fontSize: dimensions.sm,
    color: colors.red, // Optional: make it stand out
  },
});




{/* <View
style={{flexDirection: 'row', flex: 1, gap: dimensions.sm / 2}}>
<TextInput
  mode="outlined"
  label="HSN CODE"
  cursorColor={colors.black}
  activeOutlineColor={colors.black}
  style={{flex: 1, backgroundColor: colors.pureWhite}}
/>
<TextInput
  style={{flex: 1, backgroundColor: colors.pureWhite}}
  mode="outlined"
  label="SKU"
  cursorColor={colors.black}
  activeOutlineColor={colors.black}
/>
</View>
<View
style={{flexDirection: 'row', flex: 1, gap: dimensions.sm / 2}}>
<TextInput
  mode="outlined"
  label="Unit"
  cursorColor={colors.black}
  activeOutlineColor={colors.black}
  style={{flex: 1, backgroundColor: colors.pureWhite}}
/>
<TextInput
  style={{flex: 1, backgroundColor: colors.pureWhite}}
  mode="outlined"
  label="Purchase Cost"
  cursorColor={colors.black}
  activeOutlineColor={colors.black}
/>
</View>
<View
style={{flexDirection: 'row', flex: 1, gap: dimensions.sm / 2}}>
<TextInput
  mode="outlined"
  label="Mrp"
  cursorColor={colors.black}
  activeOutlineColor={colors.black}
  style={{flex: 1, backgroundColor: colors.pureWhite}}
/>
<TextInput
  style={{flex: 1, backgroundColor: colors.pureWhite}}
  mode="outlined"
  label="Price"
  cursorColor={colors.black}
  activeOutlineColor={colors.black}
/>
</View>
<View
style={{flexDirection: 'row', flex: 1, gap: dimensions.sm / 2}}>
<TextInput
  mode="outlined"
  label="Special Price"
  cursorColor={colors.black}
  activeOutlineColor={colors.black}
  style={{flex: 1, backgroundColor: colors.pureWhite}}
/>
<TextInput
  style={{flex: 1, backgroundColor: colors.pureWhite}}
  mode="outlined"
  label="Sort Order"
  cursorColor={colors.black}
  activeOutlineColor={colors.black}
/>
</View>

{/* Menu Container */}
{/* <View>
<Text variant="titleSmall">Tax</Text>
<DropDownPicker
  open={open}
  value={value}
  items={items}
  setOpen={setOpen}
  setValue={setValue}
  setItems={setItems}
  placeholder="VAT"
  placeholderStyle={{
    color: colors.grayText,
  }}
  ArrowDownIconComponent={({style}) => (
    <MaterialIcons
      name="arrow-drop-down"
      style={style}
      size={dimensions.xl}
    />
  )}
  ArrowUpIconComponent={({style}) => (
    <MaterialIcons
      name="arrow-drop-up"
      style={style}
      size={dimensions.xl}
    />
  )}
  arrowIconStyle={{
    width: dimensions.md * 1.75,
    height: dimensions.md * 1.75,
  }}
/>
</View> */}

  {/* Inventory Container */}
//   <View
//   style={{
//     flex: 1,
//     margin: dimensions.sm / 2,
//     backgroundColor: colors.pureWhite,
//     borderColor: colors.lightGray,
//     borderWidth: 1,
//     padding: dimensions.sm,
//   }}>
//   <Text variant="titleMedium" style={{alignSelf: 'flex-start'}}>
//     Inventory
//   </Text>
//   <View>
//     <Text variant="titleSmall">In Stock</Text>
//     <TextInput
//       style={{flex: 1, backgroundColor: colors.pureWhite}}
//       mode="outlined"
//       placeholder="0.0"
//       cursorColor={colors.black}
//       activeOutlineColor={colors.black}
//     />
//   </View>
//   <View
//     style={{
//       flexDirection: 'row',
//       flex: 1,
//       gap: dimensions.sm / 2,
//       flex: 1,
//       marginVertical: dimensions.sm / 2,
//     }}>
//     <View style={{flex: 1}}>
//       <Text variant="titleSmall">Weight</Text>
//       <TextInput
//         style={{backgroundColor: colors.pureWhite}}
//         mode="outlined"
//         placeholder="0"
//         cursorColor={colors.black}
//         activeOutlineColor={colors.black}
//       />
//     </View>
//     <View style={{flex: 1}}>
//       <Text variant="titleSmall">Low stock Quantity</Text>
//       <TextInput
//         style={{backgroundColor: colors.pureWhite}}
//         mode="outlined"
//         placeholder="0"
//         cursorColor={colors.black}
//         activeOutlineColor={colors.black}
//       />
//     </View>
//   </View>
// </View>

{/* Category Container */}
{/* <View
style={{
  flex: 1,
  margin: dimensions.sm / 2,
  backgroundColor: colors.pureWhite,
  borderColor: colors.lightGray,
  borderWidth: 1,
  padding: dimensions.sm,
}}>
<Text variant="titleMedium" style={{alignSelf: 'flex-start'}}>
  Category
</Text>

<DropDownPicker
  open={open1}
  value={value1}
  items={items1}
  setOpen={setOpen1}
  setValue={setValue1}
  setItems={setItems1}
  placeholder="Select Category"
  placeholderStyle={{
    color: colors.grayText,
  }}
  ArrowDownIconComponent={({style}) => (
    <MaterialIcons
      name="arrow-drop-down"
      style={style}
      size={dimensions.xl}
    />
  )}
  ArrowUpIconComponent={({style}) => (
    <MaterialIcons
      name="arrow-drop-up"
      style={style}
      size={dimensions.xl}
    />
  )}
  arrowIconStyle={{
    width: dimensions.md * 1.75,
    height: dimensions.md * 1.75,
  }}
/>
</View> */}