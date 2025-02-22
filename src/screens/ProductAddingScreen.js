import {
  StyleSheet,
  View,
  Image,
  Pressable,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import React, {useState} from 'react';
import {colors} from '../constants/colors';
import {dimensions} from '../constants/dimensions';
import {fonts} from '../constants/fonts';
import {Appbar, Text, TextInput} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import DropDownPicker from 'react-native-dropdown-picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';

const ProductAddingScreen = () => {
  const navigation = useNavigation();

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
        <Appbar.Action
          icon="content-save"
          onPress={() => {}}
          color={colors.pureWhite}
        />
      </Appbar.Header>

      <ScrollView
        style={styles.scrollContainer}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled">
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
              mode="outlined"
              label="Product Name"
              cursorColor={colors.black}
              activeOutlineColor={colors.black}
              style={{backgroundColor: colors.pureWhite}}
            />
            <TextInput
              mode="outlined"
              label="Description"
              cursorColor={colors.black}
              activeOutlineColor={colors.black}
              style={{backgroundColor: colors.pureWhite}}
            />
            <View
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
            <View>
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
            </View>
          </View>
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
            <TouchableOpacity
              style={{flexDirection: 'row', gap: dimensions.sm}}>
              <MaterialCommunityIcons
                name="barcode-scan"
                size={dimensions.md}
              />
              <Text>Scan Code</Text>
            </TouchableOpacity>
          </View>

          <View
            style={{
              alignSelf: 'center',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Image
              source={require('../images/barcode.png')}
              style={{
                height: dimensions.width / 3,
                width: dimensions.width / 1.5,
              }}
            />
            <Text variant="titleMedium">123454567788</Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <TouchableOpacity
              style={{flexDirection: 'row', gap: dimensions.sm}}>
              <MaterialCommunityIcons
                name="content-save"
                size={dimensions.md}
              />
              <Text>Save Barcode</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Inventory Container */}
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
            Inventory
          </Text>
          <View>
            <Text variant="titleSmall">In Stock</Text>
            <TextInput
              style={{flex: 1, backgroundColor: colors.pureWhite}}
              mode="outlined"
              placeholder="0.0"
              cursorColor={colors.black}
              activeOutlineColor={colors.black}
            />
          </View>
          <View
            style={{
              flexDirection: 'row',
              flex: 1,
              gap: dimensions.sm / 2,
              flex: 1,
              marginVertical: dimensions.sm / 2,
            }}>
            <View style={{flex: 1}}>
              <Text variant="titleSmall">Weight</Text>
              <TextInput
                style={{backgroundColor: colors.pureWhite}}
                mode="outlined"
                placeholder="0"
                cursorColor={colors.black}
                activeOutlineColor={colors.black}
              />
            </View>
            <View style={{flex: 1}}>
              <Text variant="titleSmall">Low stock Quantity</Text>
              <TextInput
                style={{backgroundColor: colors.pureWhite}}
                mode="outlined"
                placeholder="0"
                cursorColor={colors.black}
                activeOutlineColor={colors.black}
              />
            </View>
          </View>
        </View>

        {/* Category Container */}
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
        </View>
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
});
