import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'; // Updated import path for Zustand >= 4.0

const useCartStore = create(
    (set) => ({
      cart: [], // Array of { productId, weight, quantity, price }
      addToCart: (product, weight, quantity) =>
        set((state) => {
          const stock = product.Stocks.find((s) => s.weight === weight);
          if (!stock) {
            console.error('Weight not found for product:', product.ProductId, weight);
            throw new Error('Weight not found');
          }
          if (quantity <= 0 || quantity > stock.stocks) {
            throw new Error('Invalid quantity or insufficient stock');
          }
          return {
            cart: [
              ...state.cart,
              { productId: product.ProductId, weight, quantity, price: stock.price, stocks: stock.stocks,productName:product.ProductName,productImage:product.ProductImage }, // Store available stocks for validation
            ],
          };
        }),
      updateQuantity: (productId, weight, newQuantity) =>
        set((state) => ({
          cart: state.cart.map((item) => {
            if (item.productId === productId && item.weight === weight) {
              const maxQuantity = item.stocks; // Use stored stocks for validation
              const updatedQuantity = Math.max(1, Math.min(newQuantity, maxQuantity));
              return { ...item, quantity: updatedQuantity };
            }
            return item;
          }),
        })),
      removeFromCart: (productId, weight) =>
        set((state) => ({
          cart: state.cart.filter((item) => !(item.productId === productId && item.weight === weight)),
        })),
      clearCart: () => set({ cart: [] }), // Renamed for consistency
      total: 0, // Calculate dynamically in components
      setTotal: (total) => set({ total:total }),
      cartItemUpdate:false,
      setCartItemUpdated: (boolean) => set({ cartItemUpdate:boolean }),
      paymentConfirmation:false,
      setPaymentConfirmation:(boolean) => set({ paymentConfirmation:boolean }),
      setCartFromBackup: (array) => set({ cart:[...array] })
    // }),
    // {
    //   name: 'cart-storage',
    //   storage: createJSONStorage(() => AsyncStorage),
    //   onRehydrateStorage: () => (state) => {
    //     console.log('Hydrating cart store:', state);
    //   },
    //   onError: (error) => {
    //     console.error('Persist error in cart store:', error);
    //   },
    // }
 }))

export default useCartStore;