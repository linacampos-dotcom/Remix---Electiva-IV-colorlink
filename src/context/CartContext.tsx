import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem } from '../types';

interface CartContextType {
  cart: CartItem[];
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  updateQuantity: (id: string, newQty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotalCOP: number;
  shippingAddress: string;
  setShippingAddress: (addr: string) => void;
  shippingCity: string;
  setShippingCity: (city: string) => void;
  shippingDepartment: string;
  setShippingDepartment: (dept: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'colorlink_cart';
const SHIPPING_ADDRESS_KEY = 'shippingAddress';
const COLORLINK_SHIPPING_KEY = 'colorlink_shipping_address';

// Helper para normalizar código o identificador de color
function extractColorKey(colorStr?: string): string {
  if (!colorStr) return '';
  const trimmed = colorStr.trim().toLowerCase();
  // Detectar patrón entre paréntesis ej. "Gris Grafito (#7024)" o "(#7024)"
  const parenMatch = trimmed.match(/\((?:#)?([a-z0-9]+)\)/i);
  if (parenMatch) return parenMatch[1].toLowerCase();
  // Detectar código hexadecimal o numérico ej. "#7024" o "#e5e7eb"
  const hexMatch = trimmed.match(/#([a-z0-9]+)/i);
  if (hexMatch) return hexMatch[1].toLowerCase();
  // Normalizar removiendo caracteres especiales
  return trimmed.replace(/[^a-z0-9áéíóúüñ]/gi, '').toLowerCase();
}

// Helper para normalizar la presentación
function normalizePresentation(pres?: string): string {
  if (!pres) return 'galon';
  const p = pres.trim().toLowerCase();
  if (p.includes('cuñete') || p.includes('cunete') || p.includes('5 gal')) return 'cunete';
  if (p.includes('cuarto') || p.includes('1/4')) return 'cuarto';
  if (p.includes('gal')) return 'galon';
  return p;
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error leyendo carrito inicial:', e);
    }
    return [];
  });

  const [shippingAddress, setShippingAddressState] = useState<string>(() => {
    try {
      return localStorage.getItem(SHIPPING_ADDRESS_KEY) || localStorage.getItem(COLORLINK_SHIPPING_KEY) || '';
    } catch {
      return '';
    }
  });

  const [shippingCity, setShippingCityState] = useState<string>(() => {
    try {
      return localStorage.getItem('colorlink_shipping_city') || 'Bogotá D.C.';
    } catch {
      return 'Bogotá D.C.';
    }
  });

  const [shippingDepartment, setShippingDepartmentState] = useState<string>(() => {
    try {
      return localStorage.getItem('colorlink_shipping_depto') || 'Bogotá D.C.';
    } catch {
      return 'Bogotá D.C.';
    }
  });

  const setShippingAddress = (addr: string) => {
    const clean = addr.trim();
    setShippingAddressState(clean);
    try {
      localStorage.setItem(SHIPPING_ADDRESS_KEY, clean);
      localStorage.setItem(COLORLINK_SHIPPING_KEY, clean);
      const savedUser = localStorage.getItem('colorlink_user_session');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        parsed.direccion = clean;
        parsed.address = clean;
        localStorage.setItem('colorlink_user_session', JSON.stringify(parsed));
      }
      window.dispatchEvent(new Event('storage'));
    } catch {}
  };

  const setShippingCity = (city: string) => {
    const clean = city.trim();
    setShippingCityState(clean);
    try {
      localStorage.setItem('colorlink_shipping_city', clean);
      window.dispatchEvent(new Event('storage'));
    } catch {}
  };

  const setShippingDepartment = (dept: string) => {
    const clean = dept.trim();
    setShippingDepartmentState(clean);
    try {
      localStorage.setItem('colorlink_shipping_depto', clean);
      window.dispatchEvent(new Event('storage'));
    } catch {}
  };

  // Guardar en localStorage ante cualquier cambio
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.warn('Error guardando carrito:', e);
    }
  }, [cart]);

  /**
   * Agrega un ítem al carrito evitando duplicaciones y multiplicaciones accidentales:
   * Verifica si ya existe un ítem con el mismo SKU, código de color y presentación.
   * Si existe, actualiza la cantidad en lugar de duplicar la línea del pedido.
   */
  const addToCart = (newItem: CartItem) => {
    setCart((prev) => {
      const newSku = (newItem.sku || '').trim().toLowerCase();
      const newColor = extractColorKey(newItem.colorSeleccionado);
      const newPres = normalizePresentation(newItem.presentacion);
      const newName = (newItem.nombre || '').trim().toLowerCase();

      const existingIndex = prev.findIndex((item) => {
        const itemSku = (item.sku || '').trim().toLowerCase();
        const itemColor = extractColorKey(item.colorSeleccionado);
        const itemPres = normalizePresentation(item.presentacion);
        const itemName = (item.nombre || '').trim().toLowerCase();

        // 1. Si ambos tienen SKU definido, comparar SKU + Color + Presentación
        if (newSku && itemSku && newSku === itemSku) {
          return itemColor === newColor && itemPres === newPres;
        }

        // 2. Si el SKU no coincide o está ausente, comparar por Nombre + Color + Presentación
        return itemName === newName && itemColor === newColor && itemPres === newPres;
      });

      if (existingIndex > -1) {
        const updated = [...prev];
        const existing = updated[existingIndex];
        const newQty = existing.cantidad + (newItem.cantidad || 1);
        updated[existingIndex] = {
          ...existing,
          cantidad: newQty,
          subtotal: newQty * existing.precioUnitario,
        };
        return updated;
      }

      const calculatedSubtotal = (newItem.cantidad || 1) * (newItem.precioUnitario || 0);
      return [...prev, { ...newItem, subtotal: newItem.subtotal || calculatedSubtotal }];
    });
  };

  const updateQuantity = (id: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, cantidad: newQty, subtotal: newQty * item.precioUnitario }
          : item
      )
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0);
  const subtotalCOP = cart.reduce((sum, item) => sum + item.cantidad * item.precioUnitario, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartItems: cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItems,
        subtotalCOP,
        shippingAddress,
        setShippingAddress,
        shippingCity,
        setShippingCity,
        shippingDepartment,
        setShippingDepartment,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser utilizado dentro de un CartProvider');
  }
  return context;
};

export default CartContext;
