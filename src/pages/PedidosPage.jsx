import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MENU, ABOUT_INFO } from '../data/menuData';
import DishCardOrder from '../components/DishCardOrder';
import CartDrawer from '../components/cart/CartDrawer';
import CheckoutModal from '../components/cart/CheckoutModal';
import OrderSuccessModal from '../components/cart/OrderSuccessModal';
import AllergenModal from '../components/AllergenModal';
import FestiveBanner from '../components/FestiveBanner';
import MarqueeTicker from '../components/MarqueeTicker';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';

function fmt(n) {
  return Number(n).toFixed(2).replace('.', ',') + '€';
}

const MENU_SECTIONS = [
  {
    id: 'entrantes',
    label: 'Entrantes',
    icon: '🥟',
    desc: 'Empanadillas artesanas, ensaladas y bocados para comenzar.',
    filter: (d) => d.cat === 'entrantes'
  },
  {
    id: 'nigiri',
    label: 'Nigiris',
    icon: '🍣',
    desc: 'Bocados de arroz sazonado con los cortes más selectos.',
    filter: (d) => d.cat === 'sushi' && d.sub === 'nigiri'
  },
  {
    id: 'uramaki',
    label: 'Uramakis',
    icon: '🍱',
    desc: 'Rollos invertidos de autor con coberturas y texturas únicas.',
    filter: (d) => d.cat === 'sushi' && d.sub === 'uramaki'
  },
  {
    id: 'futomaki',
    label: 'Futomakis',
    icon: '🍙',
    desc: 'Rollos gruesos con combinaciones generosas.',
    filter: (d) => d.cat === 'sushi' && d.sub === 'futomaki'
  },
  {
    id: 'maki',
    label: 'Makis',
    icon: '🥢',
    desc: 'Rollos clásicos envueltos en alga nori fresca y crujiente.',
    filter: (d) => d.cat === 'sushi' && d.sub === 'maki'
  },
  {
    id: 'calientes',
    label: 'Calientes',
    icon: '🍜',
    desc: 'Noodles al wok y arroces aromáticos al momento.',
    filter: (d) => d.cat === 'calientes'
  },
  {
    id: 'postres',
    label: 'Postres',
    icon: '🍰',
    desc: 'Mochis artesanos y dulces japoneses.',
    filter: (d) => d.cat === 'postres'
  },
  {
    id: 'bebidas',
    label: 'Bebidas',
    icon: '🥤',
    desc: 'Cervezas japonesas, refrescos y agua.',
    filter: (d) => d.cat === 'bebidas'
  }
];

export default function PedidosPage() {
  const {
    cart,
    totalCount,
    totalPrice,
    finalPrice,
    setIsCartOpen,
    setIsCheckoutOpen,
    clearCart,
    tiendaEstado
  } = useCart();
  const { themeConfig } = useTheme();
  const isHalloween = themeConfig.active && themeConfig.theme === 'halloween';

  const [activeSectionId, setActiveSectionId] = useState('entrantes');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAllergenOpen, setIsAllergenOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [platosLista, setPlatosLista] = useState(MENU);
  const stickyNavRef = useRef(null);

  // Sincronización en vivo con la carta oficial
  useEffect(() => {
    fetch('/api/carta')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const cleaned = data.map((d) => ({
            ...d,
            nombre: (d.nombre || '')
              .replace(/salm\?n/gi, 'salmón')
              .replace(/at\?n/gi, 'atún')
              .replace(/lim\?n/gi, 'limón')
              .replace(/J\?netsu/g, 'Jōnetsu'),
            descripcion: (d.descripcion || '')
              .replace(/salm\?n/gi, 'salmón')
              .replace(/at\?n/gi, 'atún')
              .replace(/az\?car/gi, 'azúcar')
              .replace(/esp\?rrago/gi, 'espárrago')
              .replace(/s\?samo/gi, 'sésamo')
              .replace(/holand\?s/gi, 'holandés')
              .replace(/acompa\?ado/gi, 'acompañado')
          }));
          setPlatosLista(cleaned);
        }
      })
      .catch(() => {});
  }, []);

  // Escuchar si el cliente regresa de Stripe con ?status=success
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const sessionId = urlParams.get('session_id');
    const numeroPedido = urlParams.get('numero_pedido');
    const simulated = urlParams.get('simulated');
    const pedidoId = urlParams.get('pedido_id');

    if (status === 'success') {
      clearCart();
      const verifyUrl = sessionId
        ? `/api/pedidos/verify-session/${sessionId}?numero_pedido=${numeroPedido || ''}`
        : `/api/pedidos/verify-session/simulated?simulated=${simulated || 'true'}&numero_pedido=${numeroPedido || ''}&pedido_id=${pedidoId || ''}`;

      fetch(verifyUrl)
        .then((res) => res.json())
        .then((data) => {
          if (data.pedido) {
            setConfirmedOrder(data.pedido);
          } else {
            setConfirmedOrder({
              numero_pedido: numeroPedido || 'OB-CONFIRMADO',
              cliente_nombre: 'Cliente Web',
              cliente_telefono: 'Confirmado',
              hora_recogida: 'Lo antes posible (~35-45 min)',
              estado_pago: 'pagado',
              total: totalPrice > 0 ? totalPrice : 0,
              items: []
            });
          }
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch((err) => {
          console.error('Error al verificar sesión:', err);
          setConfirmedOrder({
            numero_pedido: numeroPedido || 'OB-CONFIRMADO',
            cliente_nombre: 'Cliente',
            cliente_telefono: '',
            hora_recogida: 'Lo antes posible (~35-45 min)',
            estado_pago: 'pagado',
            total: totalPrice,
            items: []
          });
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    }
  }, []);

  // Agrupar platos en secciones continuas hacia abajo
  const sectionsWithDishes = useMemo(() => {
    const isSearching = searchQuery.trim().length > 0;
    const q = searchQuery.toLowerCase().trim();

    const sections = MENU_SECTIONS.map((sec) => {
      let list = platosLista.filter(sec.filter);
      if (isSearching) {
        list = list.filter(
          (dish) =>
            dish.nombre.toLowerCase().includes(q) ||
            (dish.descripcion && dish.descripcion.toLowerCase().includes(q))
        );
      }
      return {
        ...sec,
        dishes: list
      };
    });

    // Soporte para platos no categorizados si los hubiera
    let uncategorized = platosLista.filter((dish) => !MENU_SECTIONS.some((sec) => sec.filter(dish)));
    if (isSearching) {
      uncategorized = uncategorized.filter(
        (dish) =>
          dish.nombre.toLowerCase().includes(q) ||
          (dish.descripcion && dish.descripcion.toLowerCase().includes(q))
      );
    }
    if (uncategorized.length > 0) {
      sections.push({
        id: 'especiales',
        label: 'Especiales',
        icon: '✨',
        desc: 'Platos sugeridos y novedades.',
        dishes: uncategorized
      });
    }

    return sections;
  }, [platosLista, searchQuery]);

  const totalFilteredCount = useMemo(() => {
    return sectionsWithDishes.reduce((acc, sec) => acc + sec.dishes.length, 0);
  }, [sectionsWithDishes]);

  // Desplazamiento suave tipo ancla hacia la sección seleccionada
  const handleScrollToCategory = (id) => {
    setActiveSectionId(id);
    const element = document.getElementById(`sec-${id}`);
    if (element) {
      const isMobile = window.innerWidth <= 768;
      const yOffset = isMobile ? -130 : -118;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // ScrollSpy para iluminar la categoría activa automáticamente al hacer scroll
  useEffect(() => {
    if (searchQuery.trim()) return;

    const handleScroll = () => {
      const isMobile = window.innerWidth <= 768;
      const threshold = window.pageYOffset + (isMobile ? 135 : 130);

      for (let i = MENU_SECTIONS.length - 1; i >= 0; i--) {
        const sec = MENU_SECTIONS[i];
        const el = document.getElementById(`sec-${sec.id}`);
        if (el && el.offsetTop <= threshold) {
          setActiveSectionId(sec.id);

          const tabBtn = document.getElementById(`tab-btn-${sec.id}`);
          if (tabBtn && stickyNavRef.current) {
            const container = stickyNavRef.current.querySelector('.pedidos-sticky-nav-inner');
            if (container) {
              const btnLeft = tabBtn.offsetLeft;
              const btnRight = btnLeft + tabBtn.offsetWidth;
              if (btnLeft < container.scrollLeft || btnRight > container.scrollLeft + container.offsetWidth) {
                tabBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
              }
            }
          }
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [searchQuery, platosLista]);

  return (
    <div className="pedidos-page">
      {/* Barra de Navegación de Pedidos Unificada */}
      <header className={`site-header pedidos-header ${themeConfig.active && themeConfig.theme !== 'normal' ? `theme-header-${themeConfig.theme}` : ''}`}>
        <div className="header-container">
          <div className="brand-group" onClick={() => (window.location.href = '/')} style={{ cursor: 'pointer' }}>
            <img
              src="/images/logo-obento.webp"
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/logo-obento.png'; }}
              alt="Obento"
              className="nav-logo"
            />
            <div className="nav-brand-text">
              <span className="brand-title small">OBENTO</span>
              <span className="nav-brand-sub hide-on-mobile">Takeaway · Pedidos Online</span>
            </div>
          </div>

          {/* Bloque temático estacional integrado directamente en la barra de menú */}
          <FestiveBanner />

          <div className="nav-actions">
            <button
              type="button"
              className="icon-btn nav-allergen-btn hide-on-mobile"
              title="Guía de Alérgenos"
              aria-label="Alérgenos"
              onClick={() => setIsAllergenOpen(true)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 11v6M12 7.5v.01" />
              </svg>
            </button>

            {/* Botón Carrito */}
            <button
              type="button"
              className="btn-primary nav-cart-btn"
              onClick={() => setIsCartOpen(true)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-ico-svg">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
              </svg>
              <span className="nav-cart-label">PEDIDO</span>
              {totalCount > 0 && (
                <span className="cart-badge-counter">{totalCount} · {fmt(totalPrice)}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner de Pedidos - 100% IDÉNTICO A LA WEB PRINCIPAL */}
      <section id="hero" className="pedidos-hero-banner hero-section seigaiha">
        <div className="hero-glow"></div>
        <div className="hero-container">
          <div className="hero-content">
            {/* Badge de Servicio */}
            <div className="hero-badge">
              <span className="badge-icon-dot"></span>
              <span className="badge-text-primary">100% Take Away & Recogida</span>
              <span className="badge-divider">·</span>
              <span className="badge-text-sub">Miércoles a Domingo · 18:00 - 23:30</span>
            </div>

            {/* Logo visual centrado o de marca */}
            <div className="hero-logo-wrap">
              <img
                src="/images/logo-obento.webp"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/logo-obento.png'; }}
                alt="OBENTO Japanese Food"
                className="hero-logo"
              />
            </div>

            {/* H1 Principal con salto de línea idéntico a la web */}
            <h1 className="hero-title">
              {isHalloween ? (
                <>
                  El Sushi más <span className="text-gold" style={{ color: '#ff7518', textShadow: '0 0 20px rgba(255,117,24,0.45)' }}>Tenebroso</span> de<br />Murcia
                </>
              ) : (
                <>
                  Descubre el Sabor Auténtico de <span className="text-gold">Japón</span><br />en La Ñora
                </>
              )}
            </h1>

            {/* Subtítulo */}
            <p className="hero-lead">
              {isHalloween ? (
                <>
                  Edición especial de Halloween en Obento: delicias japonesas con el toque más oscuro, artesanal y exquisito. ¿Te atreves a probarlo?
                </>
              ) : (
                ABOUT_INFO.lead
              )}
            </p>

            {/* CTA con scroll a la carta */}
            <div className="hero-cta-group">
              <a
                href="#pedidos-menu-root"
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById('pedidos-menu-root');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="btn-secondary-outline hero-btn hero-btn-outline"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-ico-svg">
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
                <span>Ver Carta Informativa</span>
              </a>
            </div>

            {/* Sellos de Calidad idénticos a la web principal */}
            <div className="hero-seals">
              <div className="seal-item">
                <div className="seal-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <span>Atún Ricardo Fuentes & Salmón Noruego</span>
              </div>
              <div className="seal-item">
                <div className="seal-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <span>Elaborado a Mano, al Momento</span>
              </div>
            </div>
          </div>
        </div>

        {/* Marquesina ticker integrada en la base del Hero */}
        <MarqueeTicker />
      </section>

      {/* Menú de Categorías SIEMPRE FIJO (Sticky Nav Bar) tipo Ancla */}
      <nav id="pedidos-menu-root" className="pedidos-sticky-nav-bar" ref={stickyNavRef} aria-label="Categorías de la carta">
        <div className="pedidos-sticky-nav-inner">
          {MENU_SECTIONS.map((sec) => {
            const isActive = activeSectionId === sec.id;
            return (
              <button
                key={sec.id}
                id={`tab-btn-${sec.id}`}
                type="button"
                className={`sticky-cat-btn ${isActive ? 'active' : ''}`}
                onClick={() => handleScrollToCategory(sec.id)}
              >
                <span className="sticky-cat-icon">{sec.icon}</span>
                <span className="sticky-cat-name">{sec.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Sección Principal con Buscador y Lista de Platos hacia abajo */}
      <section className="pedidos-menu-section">
        <div className="section-container">
          {/* Barra de Búsqueda */}
          <div className="pedidos-controls-bar" style={{ marginBottom: '32px' }}>
            <div className="search-input-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-ico-svg">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Buscar plato o ingrediente (ej. Salmón, Gyozas, Atún...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pedidos-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                >
                  &times;
                </button>
              )}
            </div>
          </div>

          {/* Información alérgenos flotante / acceso rápido */}
          <div className="category-meta-header" style={{ marginBottom: '28px' }}>
            <div>
              <h2 className="category-meta-title" style={{ fontSize: '18px' }}>
                {searchQuery ? `Resultados de búsqueda: "${searchQuery}" (${totalFilteredCount})` : 'Carta Completa Obento'}
              </h2>
              <p className="category-meta-desc">
                {searchQuery
                  ? `Se muestran los platos coincidentes con tu búsqueda.`
                  : 'Desplázate hacia abajo para ver todos los platos o pulsa en cualquier categoría superior para saltar a ella.'}
              </p>
            </div>
            <button
              type="button"
              className="btn-secondary-outline allergen-info-btn"
              onClick={() => setIsAllergenOpen(true)}
              style={{ padding: '6px 14px', fontSize: '11px', whiteSpace: 'nowrap' }}
            >
              Guía de Alérgenos
            </button>
          </div>

          {/* Lista de Platos hacia abajo por secciones */}
          {totalFilteredCount === 0 ? (
            <div className="empty-search-state">
              <p>No se encontraron platos que coincidan con "{searchQuery}".</p>
              <button
                type="button"
                className="btn-secondary-outline"
                onClick={() => setSearchQuery('')}
                style={{ marginTop: '12px' }}
              >
                Limpiar búsqueda
              </button>
            </div>
          ) : (
            <div className="pedidos-sections-flow">
              {sectionsWithDishes.map((section) => {
                if (section.dishes.length === 0) return null;
                return (
                  <section
                    key={section.id}
                    id={`sec-${section.id}`}
                    className="pedidos-section-anchor"
                  >
                    <div className="pedidos-section-header">
                      <div className="pedidos-section-title-wrap">
                        <span className="pedidos-section-ico">{section.icon}</span>
                        <div>
                          <h2 className="pedidos-section-title">{section.label}</h2>
                          {section.desc && (
                            <p className="pedidos-section-desc">{section.desc}</p>
                          )}
                        </div>
                      </div>
                      <span className="pedidos-section-count-badge">
                        {section.dishes.length} {section.dishes.length === 1 ? 'plato' : 'platos'}
                      </span>
                    </div>

                    <div className="dishes-order-grid">
                      {section.dishes.map((dish) => (
                        <DishCardOrder
                          key={dish.id}
                          dish={dish}
                          onOpenAllergens={() => setIsAllergenOpen(true)}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Barra Fija Inferior Permanente con Botón 'PAGAR' */}
      <aside className="bottom-pay-bar">
        <div className="bottom-pay-inner">
          <div
            className="bottom-pay-info"
            onClick={() => setIsCartOpen(true)}
            title="Ver cesta y platos añadidos"
          >
            <div className="bottom-pay-cart-ico">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
              </svg>
              {totalCount > 0 && <span className="bottom-pay-bubble">{totalCount}</span>}
            </div>
            <div className="bottom-pay-texts">
              <span className="bottom-pay-count">
                {totalCount === 0 ? 'Añade tus platos preferidos' : `${totalCount} ${totalCount === 1 ? 'plato' : 'platos'}`}
              </span>
              <span className="bottom-pay-total">
                {totalCount === 0 ? '0,00€' : fmt(totalPrice)}
              </span>
            </div>
          </div>

          <button
            type="button"
            className={`bottom-pay-btn ${totalCount === 0 ? 'is-disabled' : ''}`}
            onClick={() => {
              if (totalCount > 0) {
                setIsCheckoutOpen(true);
              } else {
                setIsCartOpen(true);
              }
            }}
            aria-label="Pagar pedido"
          >
            <span className="pay-btn-text">Pagar</span>
            {totalCount > 0 && <span className="pay-btn-subtotal">· {fmt(totalPrice)}</span>}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="btn-ico-svg">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Cajón Lateral del Carrito */}
      <CartDrawer />

      {/* Modal de Checkout / Pago */}
      <CheckoutModal
        onOrderSuccess={(pedido) => {
          setConfirmedOrder(pedido);
        }}
      />

      {/* Modal de Confirmación de Pedido */}
      {confirmedOrder && (
        <OrderSuccessModal
          order={confirmedOrder}
          onClose={() => setConfirmedOrder(null)}
        />
      )}

      {/* Modal de Alérgenos */}
      <AllergenModal
        isOpen={isAllergenOpen}
        onClose={() => setIsAllergenOpen(false)}
      />
    </div>
  );
}
