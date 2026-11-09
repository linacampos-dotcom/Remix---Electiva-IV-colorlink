import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem } from '../types';

export interface ShippingState {
  modalidad: 'domicilio' | 'retiro_tienda';
  deliveryMode: 'delivery' | 'pickup';
  deliveryAddress: string;
  shippingAddress: string;
  pickupStore: string;
  sede: string;
  city: string;
  shippingCity: string;
  department: string;
  shippingDepartment: string;
  costoFlete?: number;
  hubDespacho?: string;
  isDefined?: boolean;
}

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
  deliveryMode: 'delivery' | 'pickup';
  modalidad: 'domicilio' | 'retiro_tienda';
  setDeliveryMode: (mode: 'delivery' | 'pickup' | 'domicilio' | 'retiro_tienda') => void;
  deliveryAddress: string;
  setDeliveryAddress: (addr: string) => void;
  pickupStore: string;
  setPickupStore: (store: string) => void;
  shippingState: ShippingState;
  setShippingState: (state: Partial<ShippingState>) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'colorlink_cart';
const SHIPPING_ADDRESS_KEY = 'shippingAddress';
const COLORLINK_SHIPPING_KEY = 'colorlink_shipping_address';
const COLORLINK_QUOTE_DELIVERY_KEY = 'colorlink_quote_delivery';
const COLORLINK_SHIPPING_STATE_KEY = 'colorlink_shipping_state';

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

  // Helper para leer estado inicial de despacho
  const readInitialShipping = (): ShippingState => {
    let modalidad: 'domicilio' | 'retiro_tienda' = 'domicilio';
    let deliveryMode: 'delivery' | 'pickup' = 'delivery';
    let deliveryAddress = '';
    let pickupStore = '';
    let city = 'Bogotá D.C.';
    let department = 'Bogotá D.C.';
    let isDefined = false;
    let costoFlete = 0;
    let hubDespacho = '';

    try {
      const raw = localStorage.getItem(COLORLINK_QUOTE_DELIVERY_KEY) || localStorage.getItem(COLORLINK_SHIPPING_STATE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.modalidad === 'retiro_tienda' || parsed.deliveryMode === 'pickup') {
          modalidad = 'retiro_tienda';
          deliveryMode = 'pickup';
        }
        if (parsed.departamento || parsed.department) {
          department = parsed.departamento || parsed.department;
        }
        if (parsed.ciudad || parsed.city) {
          city = parsed.ciudad || parsed.city;
        }
        if (parsed.sede || parsed.pickupStore) {
          pickupStore = parsed.sede || parsed.pickupStore;
        }
        if (parsed.direccion || parsed.deliveryAddress) {
          deliveryAddress = parsed.direccion || parsed.deliveryAddress;
        }
        if (parsed.costoFlete !== undefined) {
          costoFlete = Number(parsed.costoFlete) || 0;
        }
        if (parsed.hubDespacho) {
          hubDespacho = parsed.hubDespacho;
        }
        isDefined = Boolean(parsed.isDefined || parsed.departamento || parsed.ciudad);
      }
    } catch {}

    if (!deliveryAddress) {
      try {
        deliveryAddress = localStorage.getItem(SHIPPING_ADDRESS_KEY) || localStorage.getItem(COLORLINK_SHIPPING_KEY) || '';
      } catch {}
    }

    return {
      modalidad,
      deliveryMode,
      deliveryAddress,
      shippingAddress: deliveryAddress,
      pickupStore,
      sede: pickupStore,
      city,
      shippingCity: city,
      department,
      shippingDepartment: department,
      costoFlete,
      hubDespacho,
      isDefined,
    };
  };

  const [shippingState, setShippingStateInternal] = useState<ShippingState>(readInitialShipping);

  const [shippingAddress, setShippingAddressState] = useState<string>(() => shippingState.shippingAddress);
  const [shippingCity, setShippingCityState] = useState<string>(() => shippingState.city);
  const [shippingDepartment, setShippingDepartmentState] = useState<string>(() => shippingState.department);

  const persistShippingObject = (next: ShippingState) => {
    try {
      localStorage.setItem(COLORLINK_QUOTE_DELIVERY_KEY, JSON.stringify(next));
      localStorage.setItem(COLORLINK_SHIPPING_STATE_KEY, JSON.stringify(next));
      if (next.deliveryAddress) {
        localStorage.setItem(SHIPPING_ADDRESS_KEY, next.deliveryAddress);
        localStorage.setItem(COLORLINK_SHIPPING_KEY, next.deliveryAddress);
      }
      if (next.city) {
        localStorage.setItem('colorlink_shipping_city', next.city);
      }
      if (next.department) {
        localStorage.setItem('colorlink_shipping_depto', next.department);
      }
      if (next.modalidad) {
        localStorage.setItem('colorlink_shipping_modalidad', next.modalidad);
      }
      window.dispatchEvent(new CustomEvent('colorlink_quote_delivery_updated', { detail: next }));
      window.dispatchEvent(new CustomEvent('colorlink_shipping_state_updated', { detail: next }));
      window.dispatchEvent(new Event('storage'));
    } catch {}
  };

  const setShippingState = (partial: Partial<ShippingState>) => {
    setShippingStateInternal((prev) => {
      const next: ShippingState = {
        ...prev,
        ...partial,
        modalidad: (partial.modalidad || (partial.deliveryMode === 'pickup' ? 'retiro_tienda' : partial.deliveryMode === 'delivery' ? 'domicilio' : prev.modalidad)),
        deliveryMode: (partial.deliveryMode || (partial.modalidad === 'retiro_tienda' ? 'pickup' : partial.modalidad === 'domicilio' ? 'delivery' : prev.deliveryMode)),
        deliveryAddress: partial.deliveryAddress ?? partial.shippingAddress ?? prev.deliveryAddress,
        shippingAddress: partial.shippingAddress ?? partial.deliveryAddress ?? prev.shippingAddress,
        pickupStore: partial.pickupStore ?? partial.sede ?? prev.pickupStore,
        sede: partial.sede ?? partial.pickupStore ?? prev.sede,
        city: partial.city ?? partial.shippingCity ?? prev.city,
        shippingCity: partial.shippingCity ?? partial.city ?? prev.shippingCity,
        department: partial.department ?? partial.shippingDepartment ?? prev.department,
        shippingDepartment: partial.shippingDepartment ?? partial.department ?? prev.shippingDepartment,
        isDefined: true,
      };

      setShippingAddressState(next.deliveryAddress);
      setShippingCityState(next.city);
      setShippingDepartmentState(next.department);

      persistShippingObject(next);
      return next;
    });
  };

  const setDeliveryMode = (mode: 'delivery' | 'pickup' | 'domicilio' | 'retiro_tienda') => {
    const isPickup = mode === 'pickup' || mode === 'retiro_tienda';
    setShippingState({
      modalidad: isPickup ? 'retiro_tienda' : 'domicilio',
      deliveryMode: isPickup ? 'pickup' : 'delivery',
      costoFlete: isPickup ? 0 : shippingState.costoFlete,
    });
  };

  const setDeliveryAddress = (addr: string) => {
    const clean = addr.trim();
    setShippingAddressState(clean);
    setShippingState({ deliveryAddress: clean, shippingAddress: clean });
  };

  const setPickupStore = (store: string) => {
    const clean = store.trim();
    setShippingState({ pickupStore: clean, sede: clean });
  };

  const setShippingAddress = (addr: string) => {
    setDeliveryAddress(addr);
  };

  const setShippingCity = (city: string) => {
    const clean = city.trim();
    setShippingCityState(clean);
    setShippingState({ city: clean, shippingCity: clean });
  };

  const setShippingDepartment = (dept: string) => {
    const clean = dept.trim();
    setShippingDepartmentState(clean);
    setShippingState({ department: clean, shippingDepartment: clean });
  };

  // Escuchar cambios externos de despacho (desde Cotizador Inteligente o Checkout)
  useEffect(() => {
    const handleDeliverySync = (e: any) => {
      const data = e?.detail;
      if (data) {
        setShippingStateInternal((prev) => {
          const isPickup = data.modalidad === 'retiro_tienda' || data.deliveryMode === 'pickup';
          const next: ShippingState = {
            ...prev,
            modalidad: isPickup ? 'retiro_tienda' : 'domicilio',
            deliveryMode: isPickup ? 'pickup' : 'delivery',
            deliveryAddress: data.direccion || data.deliveryAddress || prev.deliveryAddress,
            shippingAddress: data.direccion || data.deliveryAddress || prev.shippingAddress,
            pickupStore: data.sede || data.pickupStore || prev.pickupStore,
            sede: data.sede || data.pickupStore || prev.sede,
            city: data.ciudad || data.city || prev.city,
            shippingCity: data.ciudad || data.city || prev.shippingCity,
            department: data.departamento || data.department || prev.department,
            shippingDepartment: data.departamento || data.department || prev.shippingDepartment,
            costoFlete: isPickup ? 0 : (data.costoFlete !== undefined ? Number(data.costoFlete) : prev.costoFlete),
            hubDespacho: data.hubDespacho || prev.hubDespacho,
            isDefined: true,
          };
          setShippingAddressState(next.deliveryAddress);
          setShippingCityState(next.city);
          setShippingDepartmentState(next.department);
          return next;
        });
      }
    };

    window.addEventListener('colorlink_quote_delivery_updated', handleDeliverySync);
    window.addEventListener('colorlink_shipping_state_updated', handleDeliverySync);

    return () => {
      window.removeEventListener('colorlink_quote_delivery_updated', handleDeliverySync);
      window.removeEventListener('colorlink_shipping_state_updated', handleDeliverySync);
    };
  }, []);


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
        deliveryMode: shippingState.deliveryMode,
        modalidad: shippingState.modalidad,
        setDeliveryMode,
        deliveryAddress: shippingState.deliveryAddress,
        setDeliveryAddress,
        pickupStore: shippingState.pickupStore,
        setPickupStore,
        shippingState,
        setShippingState,
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
