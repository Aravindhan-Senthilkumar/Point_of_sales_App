import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Appbar, Button, Text, TextInput, Modal, Badge } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import useCartStore from '../store/useCartStore';
import {colors} from '../constants/colors';
import {dimensions} from '../constants/dimensions';
import {fonts} from '../constants/fonts';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Foundation from 'react-native-vector-icons/Foundation';
import { CheckBox, Dialog } from '@rneui/themed';

const ProductDetailsScreen = () => {
  const navigation = useNavigation();
  const product = useRoute().params.item;
  const { addToCart, cart, updateQuantity,setCartItemUpdated,cartItemUpdate } = useCartStore();
  const [selectedWeight, setSelectedWeight] = useState(product.Stocks[0]?.weight || null);
  const [quantity, setQuantity] = useState(1);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isVisible, setIsVisible] = useState();
  const [isOutofStockVisible,setisOutofStockVisible] = useState(false)
  const [isStockLimitModalVisible,setIsStockLimitModalVisible] = useState(false)
  const [isInvalidModalVisible,setIsInvalidModalVisible] = useState(false)

  const outOfStockModal = () => {
    setisOutofStockVisible(true)
    setTimeout(() => {
      setisOutofStockVisible(false)
    },700)
  }
  const stockLimitModal = () => {
    setIsStockLimitModalVisible(true)
    setTimeout(() => {
      setIsStockLimitModalVisible(false)
    },900)
  }

  const invalidModal = () => {
    setIsInvalidModalVisible(true)
    setTimeout(() => {
      setIsInvalidModalVisible(false)
    },700)
  }

  const handleSuccessAddition = () => {
    setIsVisible(true)
    setTimeout(() => {
      setIsVisible(false)
    },1000)
  }
  const handleAddToCart = () => {
    if (!selectedWeight) {
      Alert('Please select a weight');
      return;
    }

    
    const stock = product.Stocks.find((s) => s.weight === selectedWeight);
    if (quantity > stock.assignedValue) {
      outOfStockModal()
      return;
    }
    if(!stock || quantity <= 0){
      invalidModal()
      return;
    }
    const cartItem = cart.find((item) => item.productId === product.ProductId && item.weight === selectedWeight);

    try {
      if (cartItem) {
        if(Number(cartItem.quantity) - Number(selectedStock.assignedValue) === 0){
          stockLimitModal()
          return;
        }
        const newQuantity = cartItem.quantity + quantity
        updateQuantity(cartItem.productId, selectedWeight, newQuantity);
      } else {
        addToCart(product, selectedWeight, quantity);
      }
      setQuantity(1)
      handleSuccessAddition()
      setCartItemUpdated(true)
    } catch (error) {
      Alert.alert(error.message);
    }finally{
      setQuantity(1)
    }
  };
  
  const incrementQuantity = () => {
    const stock = product.Stocks.find((s) => s.weight === selectedWeight);
    if (stock) {
      setQuantity((prev) => Math.min(prev + 1, stock.assignedValue));
    }
  };

  const decrementQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleQuantityChange = (text) => {
    const newQuantity = parseInt(text) || 0;
    const stock = product.Stocks.find((s) => s.weight === selectedWeight);
    if (stock) {
      setQuantity(Math.max(0, Math.min(newQuantity, stock.assignedValue)));
    }
  };

  const selectedStock = product.Stocks.find((s) => s.weight === selectedWeight) || {};
  console.log('selectedStock: ', selectedStock);

  const toggleMenuVisibility = () => {
    setMenuVisible(!menuVisible)
  }

  const onChangeWeight = () => {
    setSelectedWeight(stock.weight);
    setTimeout(() => {
      setMenuVisible(false);
    }, 200);
  }
  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color={colors.pureWhite} />
        <Appbar.Content
          title="Product Details"
          color={colors.pureWhite}
          titleStyle={styles.headerTitle}
        />
        <View style={styles.badgeContainer}>
          {cart.length > 0 && (
            <Badge size={dimensions.md / 1.25} style={styles.badge}>
              {cart.length}
            </Badge>
          )}
          <Appbar.Action icon="cart" color={colors.pureWhite} onPress={() => navigation.navigate('CartScreen')} />
        </View>
      </Appbar.Header>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContainer}>
        {/* Product Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: product.ProductImage }} style={styles.productImage} resizeMode="cover" />
          </View>
          {/* Product ID */}
          <View style={styles.detailRow}>
            <Text style={styles.label}>Product ID :</Text>
            <Text style={styles.value}>{product.ProductId}</Text>
          </View>

          {/* Product Name */}
          <View style={styles.detailRow}>
            <Text style={styles.label}>Name :</Text>
            <Text style={styles.value}>{product.ProductName}</Text>
          </View>

          {/* Category Name */}
          <View style={styles.detailRow}>
            <Text style={styles.label}>Category :</Text>
            <Text style={styles.value}>{product.Category}</Text>
          </View>

          {/* Brand Name */}
          <View style={styles.detailRow}>
            <Text style={styles.label}>Brand :</Text>
            <Text style={styles.value}>{product.BrandName}</Text>
          </View>

          {/* Barcode Image */}
          <View style={styles.barcodeContainer}>
            <Text style={styles.label}>Barcode</Text>
            <Image
              source={{ uri: product.BarcodeImageUri }}
              style={styles.barcodeImage}
              resizeMode="contain"
            />
          </View>

          {/* Weight Selection with Menu */}
          <View style={styles.stockSelection}>
            <Dialog
              animationType="fade"
              isVisible={menuVisible}
              overlayStyle={styles.dialogOverlay}
              onDismiss={toggleMenuVisibility}
              onBackdropPress={toggleMenuVisibility}
            >
              <View style={styles.dialogContent}>
                <Dialog.Title title="Weight Selection" titleStyle={styles.dialogTitle} />
                <View style={styles.checkboxContainer}>
                  {product.Stocks.map((stock) => (
                    <CheckBox
                      title={stock.weight}
                      key={stock.weight}
                      checked={selectedWeight === stock.weight}
                      onPress={() => {
                        setSelectedWeight(stock.weight);
                        setTimeout(() => {
                          setMenuVisible(false);
                        }, 200);
                      }}
                    />
                  ))}
                </View>
              </View>
            </Dialog>
            <Text style={styles.label}>Select Weight</Text>
            <Button
              mode="outlined"
              onPress={toggleMenuVisibility}
              style={styles.menuButton}
              textColor={colors.black}
            >
              {selectedWeight ? `${selectedWeight}` : 'Select Weight'}
            </Button>
            {selectedWeight && (
              <View style={styles.stockDetails}>
                <Text style={styles.stockInfo}>
                  Price: <Text style={styles.boldText}>₹ {selectedStock.price}</Text> | Stocks Available:
                  {selectedStock.assignedValue === 0 ? (
                    <Text style={styles.outOfStockText}> Out of Stock</Text>
                  ) : (
                    <Text style={styles.boldText}> {selectedStock.assignedValue}</Text>
                  )}
                </Text>
              </View>
            )}
          </View>

          {/* Quantity Controls */}
          <View style={styles.quantityContainer}>
            <TouchableOpacity onPress={decrementQuantity} style={styles.quantityButton}>
              <Text style={styles.quantityText}>-</Text>
            </TouchableOpacity>
            <TextInput
              value={quantity.toString()}
              onChangeText={handleQuantityChange}
              keyboardType="numeric"
              style={styles.quantityInput}
              cursorColor={colors.black}
              activeOutlineColor={colors.black}
              mode="outlined"
            />
            <TouchableOpacity onPress={incrementQuantity} style={styles.quantityButton}>
              <Text style={styles.quantityText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Add to Cart Button */}
          {cartItemUpdate ? (
            <Button
              mode="contained"
              onPress={handleAddToCart}
              style={styles.addButton}
              textColor={colors.pureWhite}
            >
              Add More
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={handleAddToCart}
              style={styles.addButton}
              textColor={colors.pureWhite}
            >
              Add to Cart
            </Button>
          )}
        </View>
      </ScrollView>
      <Modal
        visible={isVisible}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <AntDesign
            name="checkcircle"
            color="green"
            size={dimensions.width / 4}
          />
          <Text style={styles.modalText}>
            Successfully Added to the Cart
          </Text>
        </View>
      </Modal>
      {/* Out of Stock Modal */}
      <Modal
        visible={isOutofStockVisible}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <Foundation
            name="alert"
            color={colors.red}
            size={dimensions.width / 4}
          />
          <Text style={styles.modalText}>
            Out of Stock
          </Text>
        </View>
      </Modal>
      <Modal
        visible={isStockLimitModalVisible}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <Foundation
            name="alert"
            color={colors.red}
            size={dimensions.width / 4}
          />
          <Text style={styles.modalText}>
          This item is already in your cart with the maximum available stock.
          </Text>
        </View>
      </Modal>
      <Modal
        visible={isInvalidModalVisible}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <Foundation
            name="alert"
            color={colors.red}
            size={dimensions.width / 4}
          />
          <Text style={styles.modalText}>
            Invalid Quantity
          </Text>
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
  badgeContainer: {
    position: 'relative',
    alignItems: 'flex-end',
  },
  badge: {
    position: 'absolute',
    top: dimensions.sm / 1.75,
    right: dimensions.sm / 1.25,
    zIndex: 1,
  },
  scrollContainer: {
    flex: 1,
    marginTop: dimensions.sm / 2,
  },
  detailsContainer: {
    marginHorizontal: dimensions.sm,
    backgroundColor: colors.pureWhite,
    borderRadius: dimensions.sm,
    padding: dimensions.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    alignItems: 'center',
  },
  productImage: {
    width: dimensions.width / 3,
    height: dimensions.width / 3,
    borderRadius: dimensions.sm,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: dimensions.sm / 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: dimensions.sm,
    color: colors.grayText,
  },
  value: {
    fontFamily: fonts.bold,
    fontSize: dimensions.sm,
    color: colors.black,
  },
  barcodeContainer: {
    marginVertical: dimensions.sm,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  barcodeImage: {
    width: dimensions.width / 2,
    height: dimensions.xl * 3,
    resizeMode: 'contain',
    marginBottom: dimensions.sm,
  },
  stockSelection: {
    // No inline styles were present here initially; added as a container style
  },
  dialogOverlay: {
    width: '90%',
    borderRadius: dimensions.sm,
  },
  dialogContent: {
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: dimensions.sm,
  },
  dialogTitle: {
    textAlign: 'center',
    marginTop: dimensions.sm,
    fontSize: dimensions.xl / 1.25,
  },
  checkboxContainer: {
    marginLeft: dimensions.xl * 3,
  },
  menuButton: {
    backgroundColor: colors.pureWhite,
    borderWidth: 1,
    borderColor: colors.lightGray,
    marginVertical: dimensions.sm,
  },
  stockDetails: {
    // No inline styles were present here initially; added as a container style
  },
  stockInfo: {
    fontFamily: fonts.regular,
    fontSize: dimensions.sm,
    color: colors.black,
  },
  boldText: {
    fontFamily: fonts.bold,
  },
  outOfStockText: {
    fontFamily: fonts.bold,
    color: 'red',
  },
  quantityContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: dimensions.xl,
    gap: dimensions.md,
  },
  quantityButton: {
    flex: 1,
    backgroundColor: colors.lightGray,
    padding: dimensions.sm / 6,
    borderRadius: dimensions.sm / 2,
    justifyContent: 'center',
    alignItems: 'center',
    height: dimensions.xl,
  },
  quantityText: {
    fontSize: dimensions.md,
    color: colors.black,
  },
  quantityInput: {
    flex: 2,
    backgroundColor: colors.pureWhite,
    height: dimensions.md * 2,
    fontSize: dimensions.sm,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: colors.darkblue,
    marginTop: dimensions.md,
  },
  modalContainer: {
    backgroundColor: colors.pureWhite,
    height: dimensions.height / 4,
    margin: dimensions.xl,
    borderRadius: dimensions.sm,
  },
  modalContent: {
    alignItems: 'center',
  },
  modalText: {
    fontFamily: fonts.semibold,
    marginTop: dimensions.sm,
    textAlign:'center'
  },
});

export default ProductDetailsScreen;