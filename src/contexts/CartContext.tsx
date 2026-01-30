import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

import { supabase } from '@/services/supabase/client';
import { useAuth } from '@/services/auth';
import type { CartItem, Product, ProductVariant } from '@/types/database.types';

const CART_SESSION_ID_KEY = 'cart_session_id';

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
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Initialize Session ID
  useEffect(() => {
    const initSession = async () => {
      try {
        let sid = await SecureStore.getItemAsync(CART_SESSION_ID_KEY);
        if (!sid) {
          sid = Crypto.randomUUID();
          await SecureStore.setItemAsync(CART_SESSION_ID_KEY, sid);
        }
        setSessionId(sid);
      } catch (error) {
        console.warn('Failed to init session id, using fallback', error);
        // Fallback random ID if SecureStore/Crypto fails
        const fallbackId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        setSessionId(fallbackId);
      }
    };
    initSession();
  }, []);

  // Fetch or Create Cart in DB
  const fetchCartAndItems = useCallback(async () => {
    if (!sessionId) return;

    try {
      // 1. Find existing cart
      let query = supabase.from('carts').select('id');

      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        query = query.eq('session_id', sessionId).is('user_id', null);
      }

      let { data: cartData, error: cartError } = await query.maybeSingle();

      // 2. Create if not found
      if (!cartData) {
        const { data: newCart, error: createError } = await supabase
          .from('carts')
          .insert({
            user_id: user ? user.id : null,
            session_id: sessionId,
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating cart:', createError);
          return;
        }
        cartData = newCart;
      }

      if (cartData) {
        setCartId(cartData.id);

        // 3. Fetch Items
        const { data: itemsData, error: itemsError } = await supabase
          .from('cart_items')
          .select(`
            id,
            quantity,
            product:products(*),
            variant:product_variants(*)
          `)
          .eq('cart_id', cartData.id)
          .order('created_at', { ascending: true });

        if (itemsError) {
          console.error('Error fetching cart items:', itemsError);
        } else {
          // Map DB response to CartItem type
          const mappedItems: CartItem[] = (itemsData || []).map((item: any) => ({
            id: item.id,
            quantity: item.quantity,
            product: item.product,
            variant: item.variant,
            cart_id: cartData.id,
            product_id: item.product.id,
            variant_id: item.variant?.id || null,
          })).filter(i => i.product); // Ensure product exists

          setItems(mappedItems);
        }
      }
    } catch (err) {
      console.error('Cart operation failed:', err);
    }
  }, [user, sessionId]);

  useEffect(() => {
    fetchCartAndItems();
  }, [fetchCartAndItems]);

  const addItem = useCallback(
    async (product: Product, variant?: ProductVariant | null, quantity: number = 1) => {
      // Optimistic update
      setItems((prev) => {
        const existingIdx = prev.findIndex(
          (i) => i.product.id === product.id && i.variant?.id === variant?.id
        );
        if (existingIdx >= 0) {
          const newItems = [...prev];
          newItems[existingIdx].quantity += quantity;
          return newItems;
        }
        return [...prev, { product, variant: variant || null, quantity }];
      });

      if (!cartId) return;

      try {
        const variantId = variant?.id || null;

        // Check if item exists
        let query = supabase
          .from('cart_items')
          .select('id, quantity')
          .eq('cart_id', cartId)
          .eq('product_id', product.id);

        if (variantId) {
          query = query.eq('variant_id', variantId);
        } else {
          query = query.is('variant_id', null);
        }

        const { data: existing } = await query.maybeSingle();

        if (existing) {
          // Update
          await supabase.from('cart_items').update({ quantity: existing.quantity + quantity }).eq('id', existing.id);
        } else {
          // Insert
          await supabase.from('cart_items').insert({
            cart_id: cartId,
            product_id: product.id,
            variant_id: variantId,
            quantity: quantity
          });
        }
      } catch (error) {
        console.error('Failed to add item to DB:', error);
      }
    },
    [cartId]
  );

  const removeItem = useCallback(
    async (productId: string, variantId?: string | null) => {
      setItems((prev) =>
        prev.filter(
          (item) => !(item.product.id === productId && (item.variant?.id || null) === (variantId || null))
        )
      );

      if (!cartId) return;

      try {
        let query = supabase.from('cart_items').delete().eq('cart_id', cartId).eq('product_id', productId);
        if (variantId) query = query.eq('variant_id', variantId);
        else query = query.is('variant_id', null);

        await query;
      } catch (e) {
        console.error('Error removing item from DB:', e);
      }
    },
    [cartId]
  );

  const updateQuantity = useCallback(
    async (productId: string, variantId: string | null | undefined, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId, variantId);
        return;
      }

      setItems((prev) =>
        prev.map((item) => {
          if (item.product.id === productId && (item.variant?.id || null) === (variantId || null)) {
            return { ...item, quantity };
          }
          return item;
        })
      );

      if (!cartId) return;

      try {
        let query = supabase.from('cart_items').update({ quantity }).eq('cart_id', cartId).eq('product_id', productId);
        if (variantId) query = query.eq('variant_id', variantId);
        else query = query.is('variant_id', null);

        await query;
      } catch (e) {
        console.error('Error updating quantity in DB:', e);
      }
    },
    [cartId, removeItem]
  );

  const clearCart = useCallback(async () => {
    setItems([]);
    if (!cartId) return;
    try {
      await supabase.from('cart_items').delete().eq('cart_id', cartId);
    } catch (e) {
      console.error('Error clearing cart in DB:', e);
    }
  }, [cartId]);

  const getItemCount = useCallback(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const getSubtotal = useCallback(() => {
    return items.reduce((sum, item) => {
      const price = item.variant ? item.variant.price : (item.product.sale_price || item.product.base_price || 0);
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
