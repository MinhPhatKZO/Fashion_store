import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartState, CartItem, Product } from '../../types';

const initialState: CartState = {
  items: JSON.parse(localStorage.getItem('cart') || '[]'),
  total: 0,
  itemCount: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<{ product: Product; variant?: any; quantity?: number }>) => {
      const { product, variant, quantity = 1 } = action.payload;
      
      const existingItemIndex = state.items.findIndex(
        item => 
          item.product._id === product._id &&
          JSON.stringify(item.variant) === JSON.stringify(variant)
      );

      if (existingItemIndex > -1) {
        state.items[existingItemIndex].quantity += quantity;
      } else {
        state.items.push({
          product,
          variant,
          quantity,
        });
      }

      // Update localStorage
      localStorage.setItem('cart', JSON.stringify(state.items));
      
      // Recalculate totals
      cartSlice.caseReducers.calculateTotals(state);
    },

    removeFromCart: (state, action: PayloadAction<{ productId: string; variant?: any }>) => {
      const { productId, variant } = action.payload;
      
      state.items = state.items.filter(
        item => 
          !(item.product._id === productId && 
            JSON.stringify(item.variant) === JSON.stringify(variant))
      );

      // Update localStorage
      localStorage.setItem('cart', JSON.stringify(state.items));
      
      // Recalculate totals
      cartSlice.caseReducers.calculateTotals(state);
    },

    updateQuantity: (state, action: PayloadAction<{ productId: string; variant?: any; quantity: number }>) => {
      const { productId, variant, quantity } = action.payload;
      
      const itemIndex = state.items.findIndex(
        item => 
          item.product._id === productId &&
          JSON.stringify(item.variant) === JSON.stringify(variant)
      );

      if (itemIndex > -1) {
        if (quantity <= 0) {
          state.items.splice(itemIndex, 1);
        } else {
          state.items[itemIndex].quantity = quantity;
        }
      }

      // Update localStorage
      localStorage.setItem('cart', JSON.stringify(state.items));
      
      // Recalculate totals
      cartSlice.caseReducers.calculateTotals(state);
    },

    clearCart: (state) => {
      state.items = [];
      state.total = 0;
      state.itemCount = 0;
      localStorage.removeItem('cart');
    },

    calculateTotals: (state) => {
      state.itemCount = state.items.reduce((total, item) => total + item.quantity, 0);
      state.total = state.items.reduce((total, item) => {
        const price = item.variant?.price || item.product.price;
        return total + (price * item.quantity);
      }, 0);
    },

    loadCartFromStorage: (state) => {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        state.items = JSON.parse(savedCart);
        cartSlice.caseReducers.calculateTotals(state);
      }
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  calculateTotals,
  loadCartFromStorage,
} = cartSlice.actions;

export default cartSlice.reducer;


