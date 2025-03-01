import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Appbar, Button, Text, TextInput, Menu, Modal, Badge } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import useCartStore from '../store/useCartStore';
import {colors} from '../constants/colors';
import {dimensions} from '../constants/dimensions';
import {fonts} from '../constants/fonts';
import AntDesign from 'react-native-vector-icons/AntDesign';

const ProductDetailsScreen = () => {
  const navigation = useNavigation();
  const product = useRoute().params.item;
  const { addToCart, cart, updateQuantity,setCartItemUpdated,cartItemUpdate } = useCartStore();
  const [selectedWeight, setSelectedWeight] = useState(product.Stocks[0]?.weight || null);
  const [quantity, setQuantity] = useState(1);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isVisible, setIsVisible] = useState();

  const handleSuccessAddition = () => {
    setIsVisible(true)
    setTimeout(() => {
      setIsVisible(false)
    },1000)
  }
  const handleAddToCart = () => {
    if (!selectedWeight) {
      alert('Please select a weight');
      return;
    }
    const stock = product.Stocks.find((s) => s.weight === selectedWeight);
    if (!stock || quantity <= 0 || quantity > stock.stocks) {
      alert('Invalid quantity or insufficient stock for selected weight');
      return;
    }
    const cartItem = cart.find((item) => item.productId === product.ProductId && item.weight === selectedWeight);
    try {
      if (cartItem) {
        const newQuantity = cartItem.quantity + quantity
        updateQuantity(cartItem.productId, selectedWeight, newQuantity);
      } else {
        addToCart(product, selectedWeight, quantity);
      }
      setQuantity(1)
      handleSuccessAddition()
      setCartItemUpdated(true)
    } catch (error) {
      alert(error.message);
    }finally{
      setQuantity(1)
    }
  };
  
  const incrementQuantity = () => {
    const stock = product.Stocks.find((s) => s.weight === selectedWeight);
    if (stock) {
      setQuantity((prev) => Math.min(prev + 1, stock.stocks));
    }
  };

  const decrementQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleQuantityChange = (text) => {
    const newQuantity = parseInt(text) || 0;
    const stock = product.Stocks.find((s) => s.weight === selectedWeight);
    if (stock) {
      setQuantity(Math.max(0, Math.min(newQuantity, stock.stocks)));
    }
  };

  const selectedStock = product.Stocks.find((s) => s.weight === selectedWeight) || {};

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
        {
          cart.length > 0 && (
        <Badge size={dimensions.md / 1.25} style={styles.badge}>
          {cart.length}
        </Badge>
          )
        }
        <Appbar.Action icon="cart" color={colors.pureWhite} onPress={() => navigation.navigate('CartScreen')} />
      </View>
      </Appbar.Header>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContainer}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.ProductImage }} style={styles.productImage} resizeMode="cover" />
        </View>

        {/* Product Details */}
        <View style={styles.detailsContainer}>
          {/* Product ID */}
          <View style={styles.detailRow}>
            <Text style={styles.label}>Product ID:</Text>
            <Text style={styles.value}>{product.ProductId}</Text>
          </View>

          {/* Product Name */}
          <View style={styles.detailRow}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{product.ProductName}</Text>
          </View>

          {/* Brand Name */}
          <View style={styles.detailRow}>
            <Text style={styles.label}>Brand:</Text>
            <Text style={styles.value}>{product.BrandName}</Text>
          </View>

          {/* Barcode Image */}
          <View style={styles.barcodeContainer}>
            <Text style={styles.label}>Barcode</Text>
            <Image
              source={{ uri: product.BarcodeImageUri }}
              style={styles.barcodeImage}
              resizeStyle="contain"
            />
          </View>

          {/* Weight Selection with Menu */}
          <View style={styles.stockSelection}>
            <Text style={styles.label}>Select Weight</Text>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setMenuVisible(true)}
                  style={styles.menuButton}
                  textColor={colors.black}
                >
                  {selectedWeight ? `${selectedWeight} g` : 'Select Weight'}
                </Button>
              }
            >
              {product.Stocks.map((stock) => (
                <Menu.Item
                  key={stock.weight}
                  onPress={() => {
                    setSelectedWeight(stock.weight);
                    setQuantity(1); // Reset quantity when weight changes
                    setMenuVisible(false);
                  }}
                  title={`${stock.weight} g`}
                />
              ))}
            </Menu>
            {selectedWeight && (
              <View style={styles.stockDetails}>
                <Text style={styles.stockInfo}>
                  Price: ₹ {selectedStock.price} | Available: {selectedStock.stocks}
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
          {
            cartItemUpdate 
            ? (
              <Button
            mode="contained"
            onPress={handleAddToCart}
            style={styles.addButton}
            textColor={colors.pureWhite}
          >
            Add More
          </Button>
            )
            : (
              <Button
            mode="contained"
            onPress={handleAddToCart}
            style={styles.addButton}
            textColor={colors.pureWhite}
          >
            Add to Cart
          </Button>
            ) 
          }
        </View>
        <Modal
          visible={isVisible}
          contentContainerStyle={{
            backgroundColor: colors.pureWhite,
            height: dimensions.height / 4,
            margin: dimensions.xl,
            borderRadius: dimensions.sm,
          }}>
          <View style={{alignItems: 'center'}}>
            <AntDesign
              name="checkcircle"
              color="green"
              size={dimensions.width / 4}
            />
            <Text
              style={{fontFamily: fonts.semibold, marginTop: dimensions.sm}}>
                Successfully Added to the Cart
            </Text>
          </View>
        </Modal>
      </ScrollView>
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
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: dimensions.sm,
  },
  productImage: {
    width: dimensions.width * 0.93,
    height: dimensions.height * 0.4,
    borderRadius: dimensions.sm,
    borderWidth: 1,
    borderColor: colors.lightGray,
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
    fontFamily: fonts.regular,
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
    marginBottom:dimensions.sm
  },
  menuButton: {
    backgroundColor: colors.pureWhite,
    borderWidth: 1,
    borderColor: colors.lightGray,
    paddingVertical: dimensions.sm / 2,
    marginBottom: dimensions.sm,
  },
  stockDetails: {
    paddingVertical: dimensions.sm / 2,
  },
  stockInfo: {
    fontFamily: fonts.regular,
    fontSize: dimensions.sm,
    color: colors.black,
  },
  quantityContainer: {
    flex:1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: dimensions.sm,
    marginHorizontal:dimensions.xl,
    gap:dimensions.md
  },
  quantityButton: {
    flex:1,
    backgroundColor: colors.lightGray,
    padding: dimensions.sm / 2,
    borderRadius: dimensions.sm / 2,
    justifyContent:'center',
    alignItems:'center'
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
    marginTop: dimensions.sm,
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.orange,
    paddingVertical: dimensions.sm / 2,
    paddingHorizontal: dimensions.sm,
    borderRadius: dimensions.sm / 2,
  },
  stockHeaderText: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: dimensions.sm,
    color: colors.pureWhite,
    textAlign: 'center',
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: dimensions.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  stockCell: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: dimensions.sm,
    color: colors.black,
    textAlign: 'center',
  },
  noStocksText: {
    fontFamily: fonts.regular,
    fontSize: dimensions.sm,
    color: colors.grayText,
    textAlign: 'center',
    paddingVertical: dimensions.sm,
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
});

export default ProductDetailsScreen;