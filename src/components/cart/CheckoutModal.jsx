import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { trackOrderCompleted } from '../../utils/analytics';
import { formatWhatsAppOrderMessage } from '../../utils/whatsappOrder';

function fmt(n) {
  return Number(n).toFixed(2).replace('.', ',') + '€';
}

export const ZONAS_REPARTO_PERMITIDAS = [
  { cp: '30830', nombre: 'La Ñora / UCAM' },
  { cp: '30107', nombre: 'Guadalupe' },
  { cp: '30831', nombre: 'Javalí Viejo' },
  { cp: '30832', nombre: 'Javalí Nuevo' },
  { cp: '30836', nombre: 'Puebla de Soto' },
  { cp: '30108', nombre: 'Rincón de Beniscornia' }
];

export const CODIGOS_REPARTO_MAP = Object.fromEntries(
  ZONAS_REPARTO_PERMITIDAS.map(z => [z.cp, z.nombre])
);

const HORAS_DISPONIBLES = [
  { label: 'Lo antes posible (~35-45 min)', val: 'Lo antes posible (~35-45 min)', icon: '⚡' },
  { label: 'En 1 hora', val: 'En 1 hora', icon: '🕒' },
  { label: 'En 1 hora y 30 minutos', val: 'En 1 hora y 30 minutos', icon: '🕒' },
  { label: 'Para cenar a las 21:00h', val: 'Para cenar a las 21:00h', icon: '🍣' },
  { label: 'Para cenar a las 21:30h', val: 'Para cenar a las 21:30h', icon: '🍣' },
  { label: 'Para cenar a las 22:00h', val: 'Para cenar a las 22:00h', icon: '🍣' },
  { label: 'Para cenar a las 22:30h', val: 'Para cenar a las 22:30h', icon: '🍣' }
];

export default function CheckoutModal({ onOrderSuccess }) {
  const {
    cart,
    totalPrice,
    finalPrice,
    appliedCoupon,
    couponDiscount,
    isCheckoutOpen,
    setIsCheckoutOpen,
    clearCart,
    tiendaEstado
  } = useCart();

  const [tipoEntrega, setTipoEntrega] = useState('recogida_local'); // 'recogida_local' | 'domicilio'
  const [direccionEntrega, setDireccionEntrega] = useState('');
  const [direccionDetalles, setDireccionDetalles] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('30830'); // Default La Ñora / Murcia
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [horaRecogida, setHoraRecogida] = useState('Lo antes posible (~35-45 min)');
  const [isHoraDropdownOpen, setIsHoraDropdownOpen] = useState(false);
  const [notas, setNotas] = useState('');
  const [metodoPago, setMetodoPago] = useState('stripe'); // 'stripe' | 'restaurante'
  const [necesitaCubiertos, setNecesitaCubiertos] = useState(true);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  // Estados de la tarjeta bancaria (Simulación interactiva)
  const [numeroTarjeta, setNumeroTarjeta] = useState('');
  const [caducidad, setCaducidad] = useState('');
  const [cvc, setCvc] = useState('');
  const [titularTarjeta, setTitularTarjeta] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const cpLimpio = String(codigoPostal || '').trim();
  const zonaRepartoDetectada = CODIGOS_REPARTO_MAP[cpLimpio];
  const isCpValidoDomicilio = tipoEntrega !== 'domicilio' || Boolean(zonaRepartoDetectada);
  const isBajoMinimoDomicilio = tipoEntrega === 'domicilio' && finalPrice < 25;

  // Bloquear el scroll de la página de fondo mientras el modal de checkout está abierto
  // y resetear estados de carga y error al abrir el modal
  useEffect(() => {
    if (!isCheckoutOpen) return;
    
    // Al abrir el modal, asegurar que no quede ningún bloqueo residual
    setLoading(false);
    setErrorMsg('');

    const originalOverflow = document.body.style.overflow;
    const originalOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';

    const handlePageShow = () => setLoading(false);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overscrollBehavior = originalOverscroll;
      window.removeEventListener('pageshow', handlePageShow);
      setLoading(false);
    };
  }, [isCheckoutOpen]);

  if (!isCheckoutOpen) return null;

  // Formateadores automáticos de tarjeta
  const handleNumeroTarjetaChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 16);
    let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    setNumeroTarjeta(formatted);
  };

  const handleCaducidadChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 2) {
      val = val.substring(0, 2) + '/' + val.substring(2);
    }
    setCaducidad(val);
  };

  const handleCvcChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    setCvc(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (tipoEntrega === 'domicilio') {
      if (finalPrice < 25) {
        setErrorMsg('El pedido mínimo para entrega a domicilio es de 25,00 €.');
        return;
      }
      if (!direccionEntrega.trim()) {
        setErrorMsg('Por favor introduce la dirección completa para el reparto a domicilio.');
        return;
      }
      if (!isCpValidoDomicilio) {
        setErrorMsg(`El código postal indicado (${cpLimpio || 'no indicado'}) está fuera de nuestro radio de entrega a domicilio (5 km). Cobertura disponible: 30830 (La Ñora/UCAM), 30107 (Guadalupe), 30831 (Javalí Viejo), 30832 (Javalí Nuevo), 30836 (Puebla de Soto) y 30108 (Rincón de Beniscornia).`);
        return;
      }
    }

    if (!nombre.trim() || !telefono.trim()) {
      setErrorMsg('Por favor introduce tu nombre y un teléfono de contacto.');
      return;
    }

    if (cart.length === 0) {
      setErrorMsg('Tu cesta está vacía.');
      return;
    }

    setLoading(true);

    const pedidoPayload = {
      cliente_nombre: nombre.trim(),
      cliente_telefono: telefono.trim(),
      cliente_email: email.trim() || null,
      tipo_entrega: tipoEntrega,
      direccion_entrega: tipoEntrega === 'domicilio' ? direccionEntrega.trim() : null,
      direccion_detalles: tipoEntrega === 'domicilio' ? direccionDetalles.trim() : null,
      codigo_postal: tipoEntrega === 'domicilio' ? codigoPostal.trim() : null,
      hora_recogida: horaRecogida,
      notas: `${necesitaCubiertos ? 'Incluir palillos y soja. ' : 'Sin palillos. '}${notas}`.trim(),
      metodo_pago: metodoPago,
      estado_pago: 'pendiente_local',
      items: cart,
      cupon_codigo: appliedCoupon ? appliedCoupon.codigo : null,
      total: finalPrice
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      if (metodoPago === 'stripe') {
        const res = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            cliente_nombre: nombre.trim(),
            cliente_telefono: telefono.trim(),
            cliente_email: email.trim() || undefined,
            tipo_entrega: tipoEntrega,
            direccion_entrega: tipoEntrega === 'domicilio' ? direccionEntrega.trim() : null,
            direccion_detalles: tipoEntrega === 'domicilio' ? direccionDetalles.trim() : null,
            codigo_postal: tipoEntrega === 'domicilio' ? codigoPostal.trim() : null,
            hora_recogida: horaRecogida,
            notas: `${necesitaCubiertos ? 'Incluir palillos y soja. ' : 'Sin palillos. '}${notas}`.trim(),
            items: cart,
            total: finalPrice
          })
        });

        clearTimeout(timeoutId);

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Error al conectar con la pasarela Stripe.');
        }

        if (data.url) {
          // Timeout de seguridad por si el navegador cancela o demora la redirección
          setTimeout(() => setLoading(false), 8000);
          window.location.href = data.url;
          return;
        }
        throw new Error('No se recibió la URL de pago de Stripe.');
      } else {
        // Pago en Restaurante (Efectivo / Tarjeta al recoger)
        const res = await fetch('/api/pedidos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify(pedidoPayload)
        });

        clearTimeout(timeoutId);

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Error al registrar el pedido.');
        }

        clearCart();
        setIsCheckoutOpen(false);
        try {
          localStorage.setItem('obento_last_customer', JSON.stringify({ nombre, telefono, email }));
        } catch (_) {}
        trackOrderCompleted({
          ...data.pedido,
          metodo_pago: 'restaurante'
        });
        if (onOrderSuccess) {
          onOrderSuccess(data.pedido);
        }
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Error en checkout:', err);
      if (err.name === 'AbortError') {
        setErrorMsg('La conexión tardó demasiado en responder. Por favor, compruébalo e inténtalo de nuevo.');
      } else {
        setErrorMsg(err.message || 'Hubo un problema al procesar tu pedido. Inténtalo de nuevo.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="checkout-backdrop" onClick={() => !loading && setIsCheckoutOpen(false)}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="checkout-modal-header">
          <div>
            <span className="checkout-badge" style={{
              background: tipoEntrega === 'domicilio' ? 'rgba(59,130,246,0.15)' : 'rgba(200,30,34,0.15)',
              color: tipoEntrega === 'domicilio' ? '#60a5fa' : '#c81e22',
              borderColor: tipoEntrega === 'domicilio' ? 'rgba(59,130,246,0.3)' : 'rgba(200,30,34,0.3)'
            }}>
              {tipoEntrega === 'domicilio' ? '🛵 Reparto · Entrega a Domicilio' : '🥡 Takeaway · Recogida en Local'}
            </span>
            <h3 className="checkout-title">Finalizar Pedido</h3>
          </div>
          <button
            type="button"
            className="cart-close-btn"
            onClick={() => !loading && setIsCheckoutOpen(false)}
            aria-label="Cerrar modal"
          >
            &times;
          </button>
        </div>

        {errorMsg && (
          <div className="checkout-alert-error" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ flexShrink: 0, marginTop: '2px' }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorMsg}</span>
            </div>
            {(errorMsg.toLowerCase().includes('desactivad') || !tiendaEstado?.activo) && (
              <a
                href={`https://wa.me/${tiendaEstado?.whatsapp || '34613927596'}?text=${encodeURIComponent(
                  formatWhatsAppOrderMessage(cart, finalPrice)
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#22c55e',
                  color: '#ffffff',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 800,
                  fontSize: '13px',
                  width: 'fit-content',
                  marginLeft: '24px',
                  boxShadow: '0 2px 8px rgba(34,197,94,0.35)'
                }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.072.043.419-.101.824z" />
                </svg>
                <span>WhatsApp</span>
              </a>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="checkout-form">
          <div className="checkout-grid-2col">
            {/* COLUMNA 1: Modalidad, Horario y Cocina */}
            <div className="checkout-col">
              <div>
                {/* 1. Modalidad de Pedido */}
                <div className="form-section-title">1. Modalidad de Pedido</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setTipoEntrega('recogida_local');
                      setLoading(false);
                      setErrorMsg('');
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      padding: '10px 8px',
                      borderRadius: '10px',
                      border: tipoEntrega === 'recogida_local' ? '2px solid #c81e22' : '1px solid rgba(255,255,255,0.12)',
                      background: tipoEntrega === 'recogida_local' ? 'rgba(200,30,34,0.12)' : 'rgba(255,255,255,0.03)',
                      color: '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span style={{ fontSize: '20px', lineHeight: 1 }}>🥡</span>
                    <span style={{ fontWeight: 700, fontSize: '13px' }}>Recogida en local</span>
                    <span style={{ fontSize: '11px', color: '#a0998f' }}>Calle Amargura 3, La Ñora</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTipoEntrega('domicilio');
                      setLoading(false);
                      setErrorMsg('');
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      padding: '10px 8px',
                      borderRadius: '10px',
                      border: tipoEntrega === 'domicilio' ? '2px solid #c81e22' : '1px solid rgba(255,255,255,0.12)',
                      background: tipoEntrega === 'domicilio' ? 'rgba(200,30,34,0.12)' : 'rgba(255,255,255,0.03)',
                      color: '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span style={{ fontSize: '20px', lineHeight: 1 }}>🛵</span>
                    <span style={{ fontWeight: 700, fontSize: '13px' }}>Entrega a Domicilio</span>
                    <span style={{ fontSize: '11px', color: '#4ade80' }}>Reparto oficial Obento</span>
                  </button>
                </div>

                {/* Slot de Dirección / Información de Recogida */}
                {tipoEntrega === 'domicilio' ? (
                  <div className="modalidad-slot-box domicilio">
                    <div className="modalidad-slot-header">
                      <span>📍 Dirección de Entrega a Domicilio</span>
                      <span className="modalidad-slot-tag domicilio">Radio 5 km Obento</span>
                    </div>
                    <div className="form-field-compact">
                      <label>Calle, Avenida o Plaza y Número *</label>
                      <input
                        type="text"
                        required={tipoEntrega === 'domicilio'}
                        placeholder="Ej. Calle Amargura, 3"
                        value={direccionEntrega}
                        onChange={(e) => setDireccionEntrega(e.target.value)}
                        autoComplete="street-address"
                        disabled={loading}
                      />
                    </div>
                    <div className="form-grid-2-compact">
                      <div className="form-field-compact">
                        <label>Piso, Puerta, Bloque</label>
                        <input
                          type="text"
                          placeholder="Ej. 2º B"
                          value={direccionDetalles}
                          onChange={(e) => setDireccionDetalles(e.target.value)}
                          autoComplete="address-line2"
                          disabled={loading}
                        />
                      </div>
                      <div className="form-field-compact">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label>Código Postal (Radio 5 km) *</label>
                          {zonaRepartoDetectada && (
                            <span style={{ fontSize: '10.5px', color: '#4ade80', fontWeight: 700 }}>
                              ✓ {zonaRepartoDetectada}
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="30830"
                          maxLength={5}
                          value={codigoPostal}
                          onChange={(e) => setCodigoPostal(e.target.value.replace(/\D/g, '').slice(0, 5))}
                          autoComplete="postal-code"
                          disabled={loading}
                          style={{
                            borderColor: !isCpValidoDomicilio && cpLimpio.length >= 5 ? '#ef4444' : undefined
                          }}
                        />
                      </div>
                    </div>

                    {/* Selector interactivo de poblaciones autorizadas en el radio */}
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ fontSize: '11px', color: '#a0998f', marginBottom: '6px', fontWeight: 600 }}>
                        Zonas con entrega a domicilio (radio 5 km):
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {ZONAS_REPARTO_PERMITIDAS.map((z) => {
                          const isActivo = cpLimpio === z.cp;
                          return (
                            <button
                              key={z.cp}
                              type="button"
                              onClick={() => setCodigoPostal(z.cp)}
                              style={{
                                fontSize: '11px',
                                padding: '4px 8px',
                                borderRadius: '7px',
                                border: isActivo ? '1px solid #4ade80' : '1px solid rgba(255,255,255,0.12)',
                                background: isActivo ? 'rgba(74, 222, 128, 0.18)' : 'rgba(255,255,255,0.04)',
                                color: isActivo ? '#4ade80' : '#d1d5db',
                                fontWeight: isActivo ? 700 : 500,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {z.cp} · {z.nombre}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Alerta visible si el CP no está en la zona de cobertura */}
                    {!isCpValidoDomicilio && (
                      <div style={{
                        marginTop: '10px',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#fca5a5',
                        fontSize: '11.5px',
                        lineHeight: 1.4
                      }}>
                        ⚠️ <strong>Código postal fuera de zona de reparto:</strong> El código postal {cpLimpio || 'indicado'} está a más de 5 km de nuestro local en La Ñora. Solo repartimos a: 30830 (La Ñora/UCAM), 30107 (Guadalupe), 30831 (Javalí Viejo), 30832 (Javalí Nuevo), 30836 (Puebla de Soto) y 30108 (Rincón de Beniscornia). Para otras zonas selecciona <strong>🥡 Recogida en local</strong>.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="modalidad-slot-box takeaway">
                    <div className="modalidad-slot-header">
                      <span>🥡 Punto de Recogida Oficial Takeaway</span>
                      <span className="modalidad-slot-tag takeaway">En Local</span>
                    </div>
                    <p className="pickup-info-address">
                      <strong>Obento Sushi:</strong> Calle Amargura 3, 30830 La Ñora, Murcia
                    </p>
                    <div className="pickup-badges-row">
                      <span className="pickup-badge-item">⏱️ Preparación ~35-45 min</span>
                      <span className="pickup-badge-item">🚗 Parada fácil frente al local</span>
                    </div>
                    <p className="pickup-info-hint">
                      Tu pedido se preparará y envasará para tenerlo listo a tu llegada.
                    </p>
                  </div>
                )}

                {/* 2. Horario Deseado */}
                <div className="form-section-title" style={{ marginTop: '14px' }}>
                  {tipoEntrega === 'domicilio' ? '2. Horario de Entrega Deseado' : '2. Horario de Recogida en Local'}
                </div>
                <div className="form-field" style={{ marginBottom: '12px' }}>
                  <label>
                    {tipoEntrega === 'domicilio' ? '¿A qué hora deseas recibir tu pedido en tu domicilio?' : '¿A qué hora recogerás tu pedido en La Ñora?'}
                  </label>

                  <div className="custom-dropdown-wrap">
                    <button
                      type="button"
                      className={`custom-dropdown-trigger ${isHoraDropdownOpen ? 'open' : ''}`}
                      onClick={() => setIsHoraDropdownOpen(!isHoraDropdownOpen)}
                      disabled={loading}
                    >
                      <div className="dropdown-trigger-left">
                        <span className="dropdown-trigger-ico">
                          {HORAS_DISPONIBLES.find((h) => h.val === horaRecogida)?.icon || '🕒'}
                        </span>
                        <span className="dropdown-trigger-text">{horaRecogida}</span>
                      </div>
                      <div className={`dropdown-trigger-chevron ${isHoraDropdownOpen ? 'rotated' : ''}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </button>

                    {isHoraDropdownOpen && (
                      <div className="custom-dropdown-menu">
                        {HORAS_DISPONIBLES.map((h) => {
                          const isSelected = horaRecogida === h.val;
                          return (
                            <button
                              key={h.val}
                              type="button"
                              className={`custom-dropdown-item ${isSelected ? 'selected' : ''}`}
                              onClick={() => {
                                setHoraRecogida(h.val);
                                setIsHoraDropdownOpen(false);
                              }}
                            >
                              <div className="dropdown-item-left">
                                <span className="dropdown-item-ico">{h.icon}</span>
                                <span className="dropdown-item-text">{h.label}</span>
                              </div>
                              {isSelected && (
                                <span className="dropdown-item-check">✓</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Preferencias de Cocina */}
                <div className="form-checkbox-row" style={{ margin: '8px 0 10px' }}>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={necesitaCubiertos}
                      onChange={(e) => setNecesitaCubiertos(e.target.checked)}
                      disabled={loading}
                    />
                    <span>Deseo palillos japoneses, servilletas y soja</span>
                  </label>
                </div>

                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label>Instrucciones o notas para cocina (alergias...)</label>
                  <textarea
                    rows="2"
                    style={{ resize: 'none', height: '58px' }}
                    placeholder="Ej. Sin sésamo en el nigiri, salsa picante aparte..."
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    disabled={loading}
                  />
                </div>

                {/* Aviso Legal sobre Alimentos Perecederos (Art. 103 d TRLGDCU) - Al final de la columna izquierda */}
                <div className="checkout-food-notice" style={{ marginTop: '14px', marginBottom: 0, padding: '8px 12px', fontSize: '11px' }}>
                  <span>⚠️ <strong>Aviso al consumidor:</strong> Elaboración artesanal perecedera para consumo inmediato (Art. 103 d TRLGDCU). Sin desistimiento tras inicio del cocinado.</span>
                </div>
              </div>
            </div>

            {/* COLUMNA 2: Contacto, Método de Pago, Resumen y Confirmación */}
            <div className="checkout-col">
              <div>
                {/* 4. Datos de Contacto */}
                <div className="form-section-title">3. Datos de Contacto</div>
                <div className="form-grid-2" style={{ marginBottom: '10px' }}>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label>Nombre y Apellidos *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Carmen Navarro"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label>Teléfono móvil *</label>
                    <input
                      type="tel"
                      required
                      placeholder="Ej. 654 321 098"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="form-field" style={{ marginBottom: '14px' }}>
                  <label>Correo Electrónico {metodoPago === 'stripe' ? '* (Para confirmación del pago)' : '(Para confirmación)'}</label>
                  <input
                    type="email"
                    required={metodoPago === 'stripe'}
                    placeholder="tuemail@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>

                {/* 5. Método de Pago */}
                <div className="form-section-title">4. Método de Pago</div>
                <div className="payment-options-grid" style={{ marginBottom: '14px' }}>
                  <div
                    className={`payment-card-option payment-card-option-stripe ${metodoPago === 'stripe' ? 'selected' : ''}`}
                    onClick={() => {
                      setMetodoPago('stripe');
                      setLoading(false);
                      setErrorMsg('');
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="payment-option-header-row">
                      <input
                        type="radio"
                        name="metodo_pago"
                        value="stripe"
                        checked={metodoPago === 'stripe'}
                        onChange={() => {
                          setMetodoPago('stripe');
                          setLoading(false);
                          setErrorMsg('');
                        }}
                        disabled={loading}
                      />
                      <div className="payment-card-content">
                        <div className="payment-card-top">
                          <span className="payment-title">Pagar Online con Tarjeta</span>
                          <span className="payment-badge-secure">Stripe 100% Seguro</span>
                        </div>
                        <p className="payment-desc">
                          Paga con Visa, Mastercard, Apple Pay o Google Pay antes de recoger. Tu pedido pasa directo a preparación en cocina.
                        </p>
                      </div>
                    </div>
                  </div>

                  <label className={`payment-card-option ${metodoPago === 'restaurante' ? 'selected' : ''}`}>
                    <div className="payment-option-header-row">
                      <input
                        type="radio"
                        name="metodo_pago"
                        value="restaurante"
                        checked={metodoPago === 'restaurante'}
                        onChange={() => {
                          setMetodoPago('restaurante');
                          setLoading(false);
                          setErrorMsg('');
                        }}
                        disabled={loading}
                      />
                      <div className="payment-card-content">
                        <div className="payment-card-top">
                          <span className="payment-title">
                            {tipoEntrega === 'domicilio' ? 'Pagar al repartidor' : 'Pagar en local'}
                          </span>
                          <span className="payment-badge-local">
                            {tipoEntrega === 'domicilio' ? 'En la Entrega' : 'Al Recoger'}
                          </span>
                        </div>
                        <p className="payment-desc">
                          {tipoEntrega === 'domicilio'
                            ? 'Paga al repartidor de Obento cuando llegue a tu puerta con el pedido.'
                            : 'Paga en el mostrador de Obento cuando vengas a por tu pedido.'}
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Bloque Inferior: Resumen, Aviso, Checkbox y Botón */}
              <div>
                {/* Resumen Total y Botón de Pago */}
                <div className="checkout-summary-box" style={{ marginBottom: '12px', padding: '12px 16px' }}>
                  <div className="checkout-summary-row">
                    <span>{cart.length} platos en el pedido</span>
                    <span className="checkout-summary-total">{fmt(totalPrice)}</span>
                  </div>
                  <div className="checkout-summary-row" style={{ color: '#4ade80', fontSize: '13px', marginTop: 3 }}>
                    <span>{tipoEntrega === 'domicilio' ? 'Gastos de envío:' : 'Coste del servicio:'}</span>
                    <span>Gratis</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="checkout-summary-row" style={{ color: '#4ade80', marginTop: 4 }}>
                      <span>Cupón ({appliedCoupon.codigo}):</span>
                      <span>-{fmt(couponDiscount)}</span>
                    </div>
                  )}
                  <div className="checkout-summary-row" style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.08)', fontWeight: 700 }}>
                    <span style={{ color: '#fff' }}>Total a pagar:</span>
                    <span className="checkout-summary-total" style={{ color: couponDiscount > 0 ? '#4ade80' : undefined, fontSize: 16 }}>
                      {fmt(finalPrice)}
                    </span>
                  </div>
                  <p className="checkout-location-info" style={{ margin: '6px 0 0' }}>
                    {tipoEntrega === 'domicilio'
                      ? `🛵 Reparto a: ${direccionEntrega || 'Dirección indicada'} (${codigoPostal || '30830'}${zonaRepartoDetectada ? ` · ${zonaRepartoDetectada}` : ''})`
                      : '📍 Recogida en: Calle Amargura 3, 30830 La Ñora, Murcia'}
                  </p>
                </div>

                {/* Aviso Pedido Mínimo a Domicilio (25€) */}
                {tipoEntrega === 'domicilio' && (
                  <div
                    style={{
                      marginBottom: '10px',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: isBajoMinimoDomicilio ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.12)',
                      border: isBajoMinimoDomicilio ? '1px solid rgba(239, 68, 68, 0.45)' : '1px solid rgba(34, 197, 94, 0.35)',
                      color: isBajoMinimoDomicilio ? '#fca5a5' : '#86efac',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                      <span>{isBajoMinimoDomicilio ? '⚠️' : '✓'}</span>
                      <span>Pedido mínimo a domicilio: 25,00 €</span>
                    </span>
                    <span style={{ fontWeight: 700 }}>
                      {isBajoMinimoDomicilio
                        ? `Faltan ${(25 - finalPrice).toFixed(2).replace('.', ',')} €`
                        : '¡Alcanzado!'}
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  className={`btn-primary btn-block checkout-submit-btn ${isBajoMinimoDomicilio || !isCpValidoDomicilio ? 'disabled' : ''}`}
                  disabled={loading || isBajoMinimoDomicilio || !isCpValidoDomicilio}
                  style={{
                    padding: '14px',
                    width: '100%',
                    marginBottom: '6px',
                    opacity: (isBajoMinimoDomicilio || !isCpValidoDomicilio) ? 0.45 : 1,
                    cursor: (isBajoMinimoDomicilio || !isCpValidoDomicilio) ? 'not-allowed' : 'pointer',
                    filter: (isBajoMinimoDomicilio || !isCpValidoDomicilio) ? 'grayscale(0.6)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  {loading ? (
                    <span className="btn-loading-state">
                      <svg className="spinner-svg" viewBox="0 0 24 24">
                        <circle className="spinner-bg" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                      </svg>
                      <span>{metodoPago === 'stripe' ? 'Conectando con Stripe...' : 'Registrando pedido...'}</span>
                    </span>
                  ) : !isCpValidoDomicilio ? (
                    <span style={{ color: '#ffffff', fontWeight: 'bold', letterSpacing: '0.03em' }}>CP FUERA DE RADIO DE REPARTO (5 KM)</span>
                  ) : isBajoMinimoDomicilio ? (
                    <span style={{ color: '#ffffff', fontWeight: 'bold', letterSpacing: '0.03em' }}>MÍNIMO A DOMICILIO: 25,00 €</span>
                  ) : metodoPago === 'stripe' ? (
                    <span style={{ color: '#ffffff', fontWeight: 'bold', letterSpacing: '0.04em' }}>PAGAR CON TARJETA</span>
                  ) : (
                    <span style={{ color: '#ffffff', fontWeight: 'bold', letterSpacing: '0.04em' }}>
                      {tipoEntrega === 'domicilio' ? 'PAGAR AL REPARTIDOR' : 'PAGAR EN LOCAL'}
                    </span>
                  )}
                </button>

                <p style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center', margin: '4px 0 0', lineHeight: 1.4 }}>
                  Al pulsar para confirmar o pagar, declaras haber leído y aceptas la{' '}
                  <button
                    type="button"
                    className="legal-inline-link"
                    onClick={(e) => {
                      e.preventDefault();
                      window.dispatchEvent(new CustomEvent('open_legal_modal', { detail: { tab: 'privacidad' } }));
                    }}
                    style={{ color: '#c81e22', textDecoration: 'underline', background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}
                  >
                    Política de Privacidad
                  </button>{' '}
                  y las{' '}
                  <button
                    type="button"
                    className="legal-inline-link"
                    onClick={(e) => {
                      e.preventDefault();
                      window.dispatchEvent(new CustomEvent('open_legal_modal', { detail: { tab: 'condiciones' } }));
                    }}
                    style={{ color: '#c81e22', textDecoration: 'underline', background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}
                  >
                    Condiciones Generales
                  </button>
                  .
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
