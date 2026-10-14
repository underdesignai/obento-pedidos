// Utilidad de Analíticas y Seguimiento de Conversión para Obento Takeaway
// Cumple con la normativa AEPD y LSSI-CE Art. 22.2 (Bloqueo previo al consentimiento)

function hasAnalyticsConsent() {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem('obento_cookie_consent');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed && parsed.analytics === true);
  } catch {
    return false;
  }
}

function getSessionId() {
  if (typeof window === 'undefined') return 'server_session';
  try {
    let sid = localStorage.getItem('obento_analytics_sid');
    if (!sid) {
      sid = 'sid_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      localStorage.setItem('obento_analytics_sid', sid);
    }
    return sid;
  } catch {
    return 'anon_session';
  }
}

export function trackEvent(tipo, data = {}) {
  if (typeof window === 'undefined') return;

  // VERIFICACIÓN ESTRICTA DE CONSENTIMIENTO (LSSI-CE Art. 22.2 / AEPD)
  if (!hasAnalyticsConsent()) {
    // Si el usuario no ha otorgado consentimiento expreso para analítica, abortar de forma silenciosa
    return;
  }

  const payload = {
    sessionId: getSessionId(),
    tipo,
    pagina: data.pagina || window.location.pathname,
    dishId: data.dishId ? String(data.dishId) : null,
    dishNombre: data.dishNombre || null,
    cantidadItems: typeof data.cantidadItems === 'number' ? data.cantidadItems : 0,
    totalCarrito: typeof data.totalCarrito === 'number' ? data.totalCarrito : 0,
    metadata: data.metadata ? JSON.stringify(data.metadata) : null
  };

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics/track', blob);
    } else {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(() => {});
    }
  } catch (err) {
    // Silencioso para no interferir con la navegación del usuario
  }
}

export function trackPageView(pagina = window.location.pathname) {
  trackEvent('page_view', { pagina });
}

export function trackAddToCart(dish, cantidad = 1, totalCarrito = 0, totalCount = 0) {
  trackEvent('add_to_cart', {
    pagina: window.location.pathname,
    dishId: dish.id,
    dishNombre: dish.nombre,
    cantidadItems: totalCount,
    totalCarrito: totalCarrito,
    metadata: {
      precio: dish.precio,
      cantidad: cantidad
    }
  });
}

export function trackCartView(totalCount = 0, totalCarrito = 0) {
  trackEvent('view_cart', {
    pagina: window.location.pathname,
    cantidadItems: totalCount,
    totalCarrito: totalCarrito
  });
}

export function trackCheckoutOpen(totalCount = 0, totalCarrito = 0) {
  trackEvent('checkout_open', {
    pagina: window.location.pathname,
    cantidadItems: totalCount,
    totalCarrito: totalCarrito
  });
}

export function trackOrderCompleted(pedido) {
  trackEvent('order_completed', {
    pagina: window.location.pathname,
    cantidadItems: Array.isArray(pedido?.items) ? pedido.items.length : 0,
    totalCarrito: typeof pedido?.total === 'number' ? pedido.total : 0,
    metadata: {
      numeroPedido: pedido?.numero_pedido,
      tipoEntrega: pedido?.tipo_entrega,
      metodoPago: pedido?.metodo_pago
    }
  });
}
