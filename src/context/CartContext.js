"use client";
// src/context/CartContext.js
//
// One shared "how many items are in my cart?" value for the whole site.
// <CartProvider> wraps the app once (in layout.js). Any component can then
// call useCart() to read the count or update it.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authFetch } from "@/lib/apiClient";

const CartContext = createContext({
  cartCount: 0,
  setCartCount: () => {},
  refreshCart: async () => {},
});

export function CartProvider({ children }) {
  const [cartCount, setCartCount] = useState(0);

  // Asks the backend for the cart and stores item_count.
  // Safe to call on any page, logged in or not.
  const refreshCart = useCallback(async () => {
    if (!localStorage.getItem("wfd_access")) {
      setCartCount(0);
      return;
    }
    try {
      // redirectOnFail: false -> a background count check must never
      // bounce a visitor away from a public page.
      const response = await authFetch(
        "/api/v1/orders/cart/",
        { method: "GET" },
        { redirectOnFail: false },
      );
      if (!response.ok) return;
      const data = await response.json();
      setCartCount(data.item_count || 0);
    } catch {
      // Session is dead or the server is unreachable: show no badge.
      setCartCount(0);
    }
  }, []);

  // On first load of the site: if the visitor is logged in, fetch the count.
  useEffect(() => {
    if (!localStorage.getItem("wfd_access")) return;
    refreshCart();
  }, [refreshCart]);

  // useMemo: only hand consumers a new object when something really changed.
  const value = useMemo(
    () => ({ cartCount, setCartCount, refreshCart }),
    [cartCount, refreshCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}