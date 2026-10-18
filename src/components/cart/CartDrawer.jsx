import React from 'react';
import { useCart } from '../../context/CartContext';

function fmt(n) {
  return Number(n).toFixed(2).replace('.', ',') + '€';
}

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
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
    setIsCheckoutOpen
  } = useCart();

  const [couponCode, setCouponCode] = React.useState('');
  const [tiendaEstado, setTiendaEstado] = React.useState({
    activo: true,
    mensaje: 'Pedidos online desactivados temporalmente. Para realizar su pedido, por favor contacte por WhatsApp.',
    whatsapp: '34613927596'
  });

  React.useEffect(() => {
    fetch('/api/tienda/estado')
      .then(r => r.json())
      .then(data => {
        if (data && typeof data.activo === 'boolean') {
          setTiendaEstado(data);
        }
      })
      .catch(() => {});
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  const handleProceedToCheckout = () => {
    if (!tiendaEstado.activo) return;
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="cart-backdrop" onClick={() => setIsCartOpen(false)}>
      <aside className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Cabecera del Carrito */}
        <div className="cart-header">
          <div className="cart-header-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="cart-ico-svg">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
            </svg>
            <h2>Tu Pedido Takeaway</h2>
            <span className="cart-count-pill">{totalCount} {totalCount === 1 ? 'ítem' : 'ítems'}</span>
          </div>
          <button
            type="button"
            className="cart-close-btn"
            onClick={() => setIsCartOpen(false)}
            aria-label="Cerrar carrito"
          >
            &times;
          </button>
        </div>

        {/* Lista de platos en el carrito */}
        <div className="cart-body">
          {cart.length === 0 ? (
            <div className="cart-empty-state">
              <div className="cart-empty-icon">🍣</div>
              <p className="cart-empty-title">Tu cesta está vacía</p>
              <p className="cart-empty-desc">
                Explora nuestra carta tradicional y añade tus piezas favoritas de sushi o platos calientes.
              </p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setIsCartOpen(false)}
                style={{ marginTop: '16px' }}
              >
                Explorar Carta
              </button>
            </div>
          ) : (
            <div className="cart-items-list">
              {cart.map((item) => (
                <div key={item.key} className="cart-item-row">
                  {item.imagen && (
                    <img src={item.imagen} alt={item.nombre} className="cart-item-img" />
                  )}
                  <div className="cart-item-details">
                    <div className="cart-item-head">
                      <h4 className="cart-item-name">{item.nombre}</h4>
                      <button
                        type="button"
                        className="cart-item-del-btn"
                        title="Eliminar plato"
                        onClick={() => removeFromCart(item.key)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>

                    {(item.porcion || item.opcion) && (
                      <div className="cart-item-meta">
                        {item.porcion && <span className="cart-meta-pill">{item.porcion} uds</span>}
                        {item.opcion && <span className="cart-meta-pill">{item.opcion}</span>}
                      </div>
                    )}

                    <div className="cart-item-footer">
                      <div className="cart-qty-controls">
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() => updateQuantity(item.key, -1)}
                          aria-label="Restar uno"
                        >
                          -
                        </button>
                        <span className="qty-number">{item.cantidad}</span>
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() => updateQuantity(item.key, 1)}
                          aria-label="Añadir uno"
                        >
                          +
                        </button>
                      </div>
                      <div className="cart-item-price-sum">
                        {fmt(item.subtotal)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="cart-clear-wrap">
                <button type="button" className="cart-clear-btn" onClick={clearCart}>
                  Vaciar cesta
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer del Carrito con Subtotal, Cupón y CTA */}
        {cart.length > 0 && (
          <div className="cart-footer">
            {/* Sección Cupón de Descuento */}
            <div style={{ marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {appliedCoupon ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: 6, padding: '8px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#4ade80' }}>🏷️ {appliedCoupon.codigo}</span>
                    <span style={{ fontSize: 11, color: '#86efac' }}>
                      (-{appliedCoupon.tipo === 'porcentaje' ? `${appliedCoupon.descuento}%` : `${appliedCoupon.descuento}€`})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    style={{ background: 'none', border: 'none', color: '#f87171', fontSize: 12, cursor: 'pointer', fontWeight: 600, padding: 0 }}
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="text"
                      placeholder="CODIGO CUPON"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          applyCoupon(couponCode).then((r) => { if (r.ok) setCouponCode(''); });
                        }
                      }}
                      style={{
                        flex: 1,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 6,
                        padding: '7px 10px',
                        color: '#fff',
                        fontSize: 12.5,
                        textTransform: 'uppercase',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      disabled={isApplyingCoupon || !couponCode.trim()}
                      onClick={() => applyCoupon(couponCode).then((r) => { if (r.ok) setCouponCode(''); })}
                      style={{
                        background: '#c81e22',
                        border: 'none',
                        borderRadius: 6,
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 700,
                        padding: '0 12px',
                        cursor: isApplyingCoupon || !couponCode.trim() ? 'not-allowed' : 'pointer',
                        opacity: isApplyingCoupon || !couponCode.trim() ? 0.6 : 1
                      }}
                    >
                      {isApplyingCoupon ? '...' : 'Aplicar'}
                    </button>
                  </div>
                  {couponError && (
                    <p style={{ margin: '6px 0 0 2px', fontSize: 11, color: '#f87171' }}>{couponError}</p>
                  )}
                </div>
              )}
            </div>


            {couponDiscount > 0 && (
              <>
                <div className="cart-summary-line" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  <span>Subtotal:</span>
                  <span>{fmt(totalPrice)}</span>
                </div>
                <div className="cart-summary-line" style={{ color: '#4ade80' }}>
                  <span>Descuento cupón:</span>
                  <span>-{fmt(couponDiscount)}</span>
                </div>
              </>
            )}

            <div className="cart-total-line">
              <span className="cart-total-label">Total Pedido:</span>
              <div style={{ textAlign: 'right' }}>
                {couponDiscount > 0 && (
                  <span style={{ textDecoration: 'line-through', color: 'rgba(255,255,255,0.4)', fontSize: 13, marginRight: 8 }}>
                    {fmt(totalPrice)}
                  </span>
                )}
                <span className="cart-total-amount" style={{ color: couponDiscount > 0 ? '#4ade80' : undefined }}>
                  {fmt(finalPrice)}
                </span>
              </div>
            </div>

            <p className="cart-terms-note">
              Preparación artesanal al momento en nuestro local de La Ñora.
            </p>
            {!tiendaEstado.activo ? (
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '12px',
                padding: '14px 16px',
                marginTop: '10px',
                textAlign: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '15px' }}>⚠️</span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Pedidos Web Pausados
                  </span>
                </div>
                <p style={{ margin: '0 0 12px', fontSize: '12.5px', color: '#fca5a5', lineHeight: 1.4, fontWeight: 500 }}>
                  {tiendaEstado.mensaje || 'Pedidos online desactivados temporalmente. Para realizar su pedido, contacte por WhatsApp.'}
                </p>
                <a
                  href={`https://wa.me/${tiendaEstado.whatsapp || '34613927596'}?text=${encodeURIComponent(
                    `¡Hola Obento! 🍣 Me gustaría realizar un pedido:\n\n` +
                    cart.map(it => `• ${it.quantity}x ${it.name} (${fmt(it.price * it.quantity)})`).join('\n') +
                    `\n\nTotal estimado: ${fmt(finalPrice)}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: '#22c55e',
                    color: '#ffffff',
                    padding: '11px 18px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: '800',
                    fontSize: '13.5px',
                    boxShadow: '0 4px 12px rgba(34,197,94,0.3)',
                    transition: 'all 0.2s'
                  }}
                >
                  <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.072.043.419-.101.824z" />
                  </svg>
                  <span>Pedir por WhatsApp</span>
                </a>
              </div>
            ) : (
              <button
                type="button"
                className="btn-primary btn-block cart-checkout-btn"
                onClick={handleProceedToCheckout}
              >
                <span>Finaliza Pedido</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-ico-svg">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
