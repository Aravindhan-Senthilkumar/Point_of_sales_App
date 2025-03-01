import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Appbar, Button, Modal, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import {colors} from '../constants/colors';
import {dimensions} from '../constants/dimensions';
import {fonts} from '../constants/fonts';
import useCartStore from '../store/useCartStore';
import AntDesign from 'react-native-vector-icons/AntDesign';

const CartScreen = () => {
  const navigation = useNavigation();
  const { cart, removeFromCart, clearCart, setTotal, setCartItemUpdated, total,paymentConfirmation,setPaymentConfirmation } = useCartStore();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if ((cart?.length > 0 && !loading) || paymentConfirmation) { 
      setLoading(true);
      try {
        const totalAmount = cart.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        setTotal(totalAmount);
      } catch (error) {
        console.log('Error while calculating total price:', error);
      } finally {
        setCartItemUpdated(false);
        setPaymentConfirmation(false);
        setLoading(false);
      }
    } else {
      setTotal(0);
    }
  }, [cart, setCartItemUpdated, setTotal, loading,setPaymentConfirmation]);

  const renderItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.productImage }} style={styles.productImage} resizeMode="cover" />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>
          <Text style={[styles.itemName, { fontFamily: fonts.semibold }]}>Product ID: </Text>
          {item.productId}
        </Text>
        <Text style={styles.itemName}>
          <Text style={[styles.itemName, { fontFamily: fonts.semibold }]}>Product Name: </Text>
          {item.productName}
        </Text>
        <Text style={styles.itemName}>
          <Text style={[styles.itemName, { fontFamily: fonts.semibold }]}>Weight: </Text>
          {item.weight}g (₹ {item.price})
        </Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            onPress={() => updateQuantity(item.productId, item.weight, item.quantity - 1)}
            style={styles.quantityButton}
          >
            <AntDesign name="minus" size={dimensions.md} color={colors.black} />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity
            onPress={() => updateQuantity(item.productId, item.weight, item.quantity + 1)}
            style={styles.quantityButton}
          >
            <AntDesign name="plus" size={dimensions.md} color={colors.black} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.priceDeleteContainer}>
        <Text style={styles.itemPrice}>₹ {item.price * item.quantity}</Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => removeFromCart(item.productId, item.weight)}
        >
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const updateQuantity = (productId, weight, newQuantity) => {
    const stock = cart.find(item => item.productId === productId && item.weight === weight)?.stocks || 0;
    const validatedQuantity = Math.max(0, Math.min(newQuantity, stock));
    useCartStore.getState().updateQuantity(productId, weight, validatedQuantity);
  };

  const handleProceed = () => {
    navigation.navigate('PaymentScreen')
  };

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color={colors.pureWhite} />
        <Appbar.Content
          title="Cart"
          color={colors.pureWhite}
          titleStyle={styles.headerTitle}
        />
        {cart.length !== 0 && (
          <Appbar.Action
            icon="delete"
            color={colors.pureWhite}
            onPress={() => setVisible(true)}
          />
        )}
      </Appbar.Header>

      <FlatList
        showsVerticalScrollIndicator={false}
        data={cart || []}
        keyExtractor={(item) => `${item.productId}-${item.weight}`}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyCart}>Your cart is empty</Text>
        }
      />

      {/* Bottom Section with Total and Proceed Button */}
      {
        cart.length !== 0 && (
          <View style={styles.footer}>
          <Text style={styles.totalText}>
            Total: {loading ? <Text>Loading...</Text> : `₹ ${total || 0}`}
          </Text>
          <Button
            mode="contained"
            onPress={handleProceed}
            style={styles.proceedButton}
            textColor={colors.pureWhite}
          >
            Proceed to Payment
          </Button>
        </View>
        )
      }
      <Modal
        onDismiss={() => setVisible(false)}
        visible={visible}
        contentContainerStyle={styles.modalContent}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Deleting all items from cart</Text>
          <View style={styles.buttonContainer}>
            <Button
              onPress={() => {
                clearCart();
                setVisible(false);
              }}
              mode="contained"
              buttonColor="green"
              style={styles.confirmButton}
            >
              Are you sure?
            </Button>
            <Button
              onPress={() => setVisible(false)}
              mode="contained"
              buttonColor={colors.red}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
          </View>
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
  listContent: {
    padding: dimensions.sm,
    paddingBottom: dimensions.xl * 3.5, // Ensure space for footer
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.pureWhite,
    padding: dimensions.sm,
    borderRadius: dimensions.sm,
    marginBottom: dimensions.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productImage: {
    width: dimensions.width / 4,
    height: dimensions.width / 4,
    borderRadius: dimensions.sm,
    marginRight: dimensions.sm,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  itemDetails: {
    flex: 2,
    flexShrink: 1,
  },
  itemName: {
    fontFamily: fonts.regular,
    fontSize: dimensions.sm,
    color: colors.black,
    marginBottom: dimensions.sm / 2, // Space between lines
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: dimensions.sm / 2,
    marginTop: dimensions.sm / 2,
  },
  quantityButton: {
    backgroundColor: colors.lightGray,
    padding: dimensions.sm / 2,
    borderRadius: dimensions.sm / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontFamily: fonts.regular,
    fontSize: dimensions.sm,
    color: colors.black,
    marginHorizontal: dimensions.sm,
  },
  priceDeleteContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'column',
    marginLeft: dimensions.sm,
  },
  itemPrice: {
    fontFamily: fonts.regular,
    fontSize: dimensions.sm,
    color: colors.black,
    textAlign: 'center',
    marginBottom: dimensions.sm / 2,
  },
  deleteButton: {
    padding: dimensions.sm / 2,
  },
  deleteIcon: {
    fontSize: dimensions.md,
    color: colors.red,
  },
  emptyCart: {
    fontFamily: fonts.regular,
    fontSize: dimensions.sm,
    color: colors.grayText,
    textAlign: 'center',
    paddingVertical: dimensions.sm,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.pureWhite,
    padding: dimensions.sm,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    elevation: 4,
  },
  totalText: {
    fontFamily: fonts.bold,
    fontSize: dimensions.md,
    color: colors.black,
    marginBottom: dimensions.sm,
    textAlign: 'center',
  },
  proceedButton: {
    backgroundColor: colors.darkblue,
  },
  modalContent: {
    backgroundColor: colors.pureWhite,
    borderRadius: dimensions.sm,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    marginHorizontal: dimensions.sm,
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: dimensions.xl,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: dimensions.md,
    color: colors.black,
    textAlign: 'center',
    marginBottom: dimensions.sm,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: dimensions.md,
    width: '100%',
    justifyContent: 'center',
  },
  confirmButton: {
    borderRadius: dimensions.sm / 2,
  },
  cancelButton: {
    borderRadius: dimensions.sm / 2,
  },
});

export default CartScreen;