import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from 'react';
import * as SecureStore from 'expo-secure-store';

import type { CartItem, Product, ProductVariant } from '@/types/database.types';

const CART_STORAGE_KEY = 'app_cart';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, variant?: ProductVariant | null, quantity?: number) => void;
  removeItem: (productId: string, variantId?: string | null) => void;
  updateQuantity: (
    productId: string,
    variantId: string | null | undefined,
    quantity: number,
  ) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from storage on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        const savedCart = await SecureStore.getItemAsync(CART_STORAGE_KEY);
        if (savedCart) {
          setItems(JSON.parse(savedCart));
        }
      } catch (error) {
        console.warn('Failed to load cart from storage:', error);
      }
    };
    loadCart();
  }, []);

  // Save cart to storage whenever it changes
  useEffect(() => {
    const saveCart = async () => {
      try {
        await SecureStore.setItemAsync(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (error) {
        console.warn('Failed to save cart to storage:', error);
      }
    };
    saveCart();
  }, [items]);

  const addItem = useCallback(
    (product: Product, variant?: ProductVariant | null, quantity: number = 1) => {
      setItems((currentItems) => {
        const existingIndex = currentItems.findIndex(
          (item) =>
            item.product.id === product.id && (item.variant?.id || null) === (variant?.id || null),
        );

        if (existingIndex >= 0) {
          // Update quantity if item exists
          const newItems = [...currentItems];
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: newItems[existingIndex].quantity + quantity,
          };
          return newItems;
        }

        // Add new item
        return [...currentItems, { product, variant: variant || null, quantity }];
      });
    },
    [],
  );

  const removeItem = useCallback((productId: string, variantId?: string | null) => {
    setItems((currentItems) =>
      currentItems.filter(
        (item) =>
          !(item.product.id === productId && (item.variant?.id || null) === (variantId || null)),
      ),
    );
  }, []);

  const updateQuantity = useCallback(
    (productId: string, variantId: string | null | undefined, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId, variantId);
        return;
      }

      setItems((currentItems) =>
        currentItems.map((item) => {
          if (item.product.id === productId && (item.variant?.id || null) === (variantId || null)) {
            return { ...item, quantity };
          }
          return item;
        }),
      );
    },
    [removeItem],
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getItemCount = useCallback(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const getSubtotal = useCallback(() => {
    return items.reduce((sum, item) => {
      const price = item.variant?.sale_price || item.variant?.price || item.product.price;
      return sum + price * item.quantity;
    }, 0);
  }, [items]);

  const value: CartContextType = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemCount,
    getSubtotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
