import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { user, token, guestCartKey } = useAuth();
  const [items, setItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [hasStockIssue, setHasStockIssue] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [shippingMethod, setShippingMethod] = useState('cyber_express');

  // Build headers with Auth or Guest Key
  const getHeaders = useCallback(() => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else if (guestCartKey) {
      headers['x-guest-cart-key'] = guestCartKey;
    }
    return headers;
  }, [token, guestCartKey]);

  // Fetch cart from backend
  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cart', {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setSubtotal(data.subtotal || 0);
        setTotalItems(data.totalItems || 0);
        setHasStockIssue(data.hasStockIssue || false);
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  // Refresh cart when auth or guest token changes
  useEffect(() => {
    fetchCart();
  }, [fetchCart, user]);

  const addToCart = async (productId, quantity = 1) => {
    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ productId, quantity })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add item to cart');
      }
      setItems(data.items || []);
      setSubtotal(data.subtotal || 0);
      setTotalItems(data.totalItems || 0);
      setIsDrawerOpen(true);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      const res = await fetch('/api/cart/update', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ productId, quantity })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update quantity');
      }
      setItems(data.items || []);
      setSubtotal(data.subtotal || 0);
      setTotalItems(data.totalItems || 0);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const res = await fetch(`/api/cart/item/${productId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setItems(data.items || []);
        setSubtotal(data.subtotal || 0);
        setTotalItems(data.totalItems || 0);
      }
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  const clearCart = async () => {
    try {
      const res = await fetch('/api/cart/clear', {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setItems([]);
        setSubtotal(0);
        setTotalItems(0);
        setAppliedCoupon(null);
      }
    } catch (err) {
      console.error('Failed to clear cart:', err);
    }
  };

  const applyCoupon = async (code) => {
    try {
      const res = await fetch('/api/checkout/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid promotional code');
      }
      setAppliedCoupon(data);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  // Shipping Rates
  const shippingRates = {
    'drone_orbital': 35.00,
    'cyber_express': 18.00,
    'ground_standard': 8.00,
    'free': 0.00
  };

  const currentShippingCost = shippingRates[shippingMethod] !== undefined ? shippingRates[shippingMethod] : 18.00;
  const currentDiscountAmount = appliedCoupon?.discountAmount || 0;
  const taxableAmount = Math.max(0, subtotal - currentDiscountAmount);
  const tax = Math.round(taxableAmount * 0.0825 * 100) / 100;
  const grandTotal = Math.max(0, Math.round((taxableAmount + currentShippingCost + tax) * 100) / 100);

  return (
    <CartContext.Provider value={{
      items,
      subtotal,
      totalItems,
      hasStockIssue,
      loading,
      isDrawerOpen,
      setIsDrawerOpen,
      appliedCoupon,
      shippingMethod,
      setShippingMethod,
      shippingCost: currentShippingCost,
      discountAmount: currentDiscountAmount,
      tax,
      grandTotal,
      fetchCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      applyCoupon,
      removeCoupon
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
