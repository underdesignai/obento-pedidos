import React, { createContext, useContext, useState, useEffect } from 'react';
import { trackAddToCart, trackCartView, trackCheckoutOpen } from '../utils/analytics';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('obento_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Estado de la tienda (activo / pedidos desactivados)
  const [tiendaEstado, setTiendaEstado] = useState({
    activo: true,
    mensaje: 'Pedidos online desactivados temporalmente. Para realizar su pedido, por favor contacte directamente por WhatsApp o por teléfono al 613 927 596.',
    whatsapp: '34613927596'
  });

  useEffect(() => {
    const fetchEstado = () => {
      fetch('/api/tienda/estado')
        .then((r) => r.json())
        .then((data) => {
          if (data && typeof data.activo === 'boolean') {
            setTiendaEstado(data);
          }
        })
        .catch(() => {});
    };
    fetchEstado();
    const interval = setInterval(fetchEstado, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('obento_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Error saving cart', e);
    }
  }, [cart]);

  // Genera una clave única para cada variante de plato (mismo plato con distinta porción u opción)
  const getItemKey = (dishId, portionCant, opcionLabel) => {
    return `${dishId}_${portionCant || 'def'}_${opcionLabel || 'def'}`;
  };

  const addToCart = (dish, portion = null, opcion = null, cantidad = 1) => {
    const key = getItemKey(dish.id, portion?.cant, opcion?.label);
    const unitPrice = portion ? portion.precio : dish.precio;

    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.key === key);
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          cantidad: next[existingIdx].cantidad + cantidad,
          subtotal: (next[existingIdx].cantidad + cantidad) * unitPrice
        };
        return next;
      } else {
        return [
          ...prev,
          {
            key,
            id: dish.id,
            nombre: dish.nombre,
            cat: dish.cat,
            sub: dish.sub,
            imagen: dish.imagen,
            descripcion: dish.descripcion,
            porcion: portion ? portion.cant : null,
            opcion: opcion ? opcion.label : null,
            precio: unitPrice,
            cantidad: cantidad,
            subtotal: unitPrice * cantidad
          }
        ];
      }
    });

    // Disparar celebración temática si procede
    try {
      window.dispatchEvent(new CustomEvent('obento_cart_celebration', {
        detail: { x: window.innerWidth * 0.8, y: window.innerHeight * 0.9 }
      }));
    } catch (_) {}

    // Registrar evento de añadido al carrito
    setTimeout(() => {
      const itemsCount = cart.reduce((sum, item) => sum + item.cantidad, 0) + cantidad;
      const currentTot = cart.reduce((sum, item) => sum + item.subtotal, 0) + (unitPrice * cantidad);
      trackAddToCart(dish, cantidad, currentTot, itemsCount);
    }, 50);
  };

  const handleSetIsCartOpen = (val) => {
    setIsCartOpen(val);
    if (val) {
      trackCartView(totalPrice, totalCount);
    }
  };

  const handleSetIsCheckoutOpen = (val) => {
    setIsCheckoutOpen(val);
    if (val) {
      trackCheckoutOpen(totalPrice, totalCount);
    }
  };

  const updateQuantity = (key, delta) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.key === key) {
            const nuevaCantidad = item.cantidad + delta;
            if (nuevaCantidad <= 0) return null;
            return {
              ...item,
              cantidad: nuevaCantidad,
              subtotal: nuevaCantidad * item.precio
            };
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const removeFromCart = (key) => {
    setCart((prev) => prev.filter((item) => item.key !== key));
  };

  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    setCouponError('');
    try {
      localStorage.removeItem('obento_cart');
    } catch {}
  };

  const totalCount = cart.reduce((sum, item) => sum + item.cantidad, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.subtotal, 0);

  // Calcular descuento actual del cupón
  const couponDiscount = appliedCoupon
    ? appliedCoupon.tipo === 'porcentaje'
      ? Number(((totalPrice * appliedCoupon.descuento) / 100).toFixed(2))
      : Math.min(totalPrice, appliedCoupon.descuento)
    : 0;

  const finalPrice = Math.max(0, Number((totalPrice - couponDiscount).toFixed(2)));

  const applyCoupon = async (code) => {
    setCouponError('');
    if (!code || !code.trim()) {
      setCouponError('Introduce un código de cupón');
      return { ok: false, error: 'Código vacío' };
    }

    setIsApplyingCoupon(true);
    try {
      const res = await fetch('/api/cupones/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: code.trim(), subtotal: totalPrice })
      });
      const data = await res.json();
      if (res.ok && data.valido) {
        setAppliedCoupon(data.cupon);
        setIsApplyingCoupon(false);
        return { ok: true, cupon: data.cupon };
      } else {
        setCouponError(data.error || 'Cupón inválido');
        setIsApplyingCoupon(false);
        return { ok: false, error: data.error || 'Cupón inválido' };
      }
    } catch (err) {
      setCouponError('Error al validar cupón con el servidor');
      setIsApplyingCoupon(false);
      return { ok: false, error: 'Error de conexión' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalCount,
        totalPrice,
        finalPrice,
        appliedCoupon,
        couponDiscount,
        couponError,
        isApplyingCoupon,
        applyCoupon,
        removeCoupon,
        isCartOpen,
        setIsCartOpen: handleSetIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen: handleSetIsCheckoutOpen,
        tiendaEstado
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}
