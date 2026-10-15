import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

function fmt(n) {
  return Number(n).toFixed(2).replace('.', ',') + '€';
}

const PASOS_RECOGIDA = [
  {
    key: 'recibido',
    title: 'Pedido Recibido',
    sub: 'Confirmado y registrado en nuestro sistema',
    icon: '📝',
  },
  {
    key: 'preparando',
    title: 'En Cocina',
    sub: 'Nuestro sushiman está preparando tus piezas',
    icon: '👨‍🍳',
  },
  {
    key: 'listo',
    title: 'Listo para Recoger',
    sub: 'Empaquetado y esperándote en mostrador',
    icon: '🍣',
  },
  {
    key: 'entregado',
    title: 'Entregado',
    sub: '¡Que disfrutes tu experiencia Obento!',
    icon: '🥢',
  }
];

const PASOS_DOMICILIO = [
  {
    key: 'recibido',
    title: 'Pedido Recibido',
    sub: 'Confirmado y registrado en cocina',
    icon: '📝',
  },
  {
    key: 'preparando',
    title: 'En Cocina',
    sub: 'Elaborando tus platos frescos al momento',
    icon: '👨‍🍳',
  },
  {
    key: 'en_camino',
    title: 'En Reparto',
    sub: 'El repartidor va de camino a tu domicilio',
    icon: '🛵',
  },
  {
    key: 'entregado',
    title: 'Entregado',
    sub: '¡Entregado en tu puerta! Buen provecho',
    icon: '🥢',
  }
];

export default function TrackingPage() {
  const [searchParams] = useSearchParams();
  const idFromUrl = searchParams.get('id') || searchParams.get('order');

  const [pedidoId, setPedidoId] = useState(idFromUrl || '');
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(Boolean(idFromUrl));
  const [error, setError] = useState(null);
  const [lastCheck, setLastCheck] = useState(new Date());

  const fetchPedido = async (ref) => {
    if (!ref) return;
    try {
      const res = await fetch(`/api/pedidos/${ref.trim()}`);
      if (!res.ok) {
        throw new Error('Pedido no encontrado');
      }
      const data = await res.json();
      setPedido(data);
      setError(null);
      setLastCheck(new Date());
    } catch (err) {
      setError('No encontramos ningún pedido con esa referencia. Verifica el código (ej: OB-1234).');
      setPedido(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (idFromUrl) {
      setPedidoId(idFromUrl);
      fetchPedido(idFromUrl);
    }
  }, [idFromUrl]);

  // Polling automático cada 4 segundos para actualizar el estado en vivo cuando cocina o repartidor cambie
  useEffect(() => {
    if (!pedidoId || !pedido) return;
    if (pedido.estado_pedido === 'entregado') return; // ya completado

    const interval = setInterval(() => {
      fetchPedido(pedidoId);
    }, 4000);

    return () => clearInterval(interval);
  }, [pedidoId, pedido?.estado_pedido]);

  const handleBuscar = (e) => {
    e.preventDefault();
    if (pedidoId.trim()) {
      setLoading(true);
      fetchPedido(pedidoId.trim());
    }
  };

  const isDelivery = pedido ? (pedido.tipo_entrega === 'domicilio' || pedido.tipo_entrega === 'delivery') : false;
  const pasos = isDelivery ? PASOS_DOMICILIO : PASOS_RECOGIDA;

  // Calcular índice del paso actual
  const getStepIndex = (estado) => {
    if (isDelivery) {
      switch (estado) {
        case 'recibido':
        case 'nuevo':
        case 'pendiente':
          return 0;
        case 'preparando':
        case 'en_preparacion':
        case 'listo':
        case 'listo_reparto':
          return 1;
        case 'en_camino':
          return 2;
        case 'entregado':
          return 3;
        default:
          return 0;
      }
    } else {
      switch (estado) {
        case 'recibido':
        case 'nuevo':
        case 'pendiente':
          return 0;
        case 'preparando':
        case 'en_preparacion':
          return 1;
        case 'listo':
        case 'listo_reparto':
          return 2;
        case 'entregado':
          return 3;
        default:
          return 0;
      }
    }
  };

  const currentIndex = pedido ? getStepIndex(pedido.estado_pedido) : 0;
  const isEnCamino = isDelivery && pedido?.estado_pedido === 'en_camino';
  const isListoReparto = isDelivery && (pedido?.estado_pedido === 'listo' || pedido?.estado_pedido === 'listo_reparto');
  const isListoRecogida = !isDelivery && (pedido?.estado_pedido === 'listo' || pedido?.estado_pedido === 'listo_reparto');

  return (
    <div className="tracking-page-wrapper">
      {/* Barra superior con navegación a carta */}
      <header className="tracking-header">
        <Link to="/" className="tracking-logo">
          <span className="logo-name">OBENTO</span>
          <span className="logo-tag">JAPANESE FOOD</span>
        </Link>
        <Link to="/pedidos" className="btn-secondary-outline tracking-back-btn">
          ← Volver a la Carta
        </Link>
      </header>

      <main className="tracking-main-container">
        {/* Buscador de pedido si entra directo */}
        <div className="tracking-search-card">
          <span className="tracking-eyebrow">
            {isDelivery ? 'SEGUIMIENTO DE ENTREGA A DOMICILIO' : 'SEGUIMIENTO EN DIRECTO'}
          </span>
          <h1 className="tracking-title">
            {isDelivery ? 'Estado de tu Pedido a Domicilio' : 'Estado de tu Pedido'}
          </h1>
          <p className="tracking-desc">
            Introduce tu número de referencia para consultar el progreso en tiempo real.
          </p>

          <form onSubmit={handleBuscar} className="tracking-input-group">
            <input
              type="text"
              placeholder="Ej: OB-5821"
              value={pedidoId}
              onChange={(e) => setPedidoId(e.target.value.toUpperCase())}
              className="tracking-input"
            />
            <button type="submit" className="btn-primary tracking-search-button">
              {loading ? 'Consultando...' : 'Consultar'}
            </button>
          </form>

          {error && <div className="tracking-error-alert">{error}</div>}
        </div>

        {/* Tarjeta de estado en vivo */}
        {pedido && (
          <div className="tracking-card-box">
            {/* Cabecera del pedido */}
            <div className="tracking-card-top">
              <div>
                <span className="tracking-order-badge" style={{ background: isDelivery ? 'rgba(168, 85, 247, 0.2)' : 'rgba(200, 30, 34, 0.2)', color: isDelivery ? '#c084fc' : '#c81e22', border: isDelivery ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(200, 30, 34, 0.4)' }}>
                  {isDelivery ? '🛵 ENTREGA A DOMICILIO' : '🥡 RECOGIDA EN LOCAL'}
                </span>
                <h2 className="tracking-order-number">{pedido.numero_pedido}</h2>
                <div className="tracking-order-client">
                  Cliente: <strong>{pedido.cliente_nombre}</strong>
                </div>
              </div>
              <div className="tracking-top-right">
                <div className={`tracking-pago-pill ${pedido.estado_pago === 'pagado' ? 'pagado' : 'pendiente'}`}>
                  {pedido.estado_pago === 'pagado'
                    ? '🟢 Pagado con tarjeta'
                    : (isDelivery ? '🟠 Pago al repartidor (efectivo/tarjeta)' : '🟠 Pago en local')}
                </div>
                <div className="tracking-sync-time">
                  Actualizado en directo · {lastCheck.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            </div>

            {/* Aviso destacado cuando el repartidor VA DE CAMINO */}
            {isEnCamino && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.22) 0%, rgba(200, 30, 34, 0.15) 100%)',
                border: '1.5px solid rgba(168, 85, 247, 0.6)',
                borderRadius: '12px',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                boxShadow: '0 8px 24px rgba(168, 85, 247, 0.25)',
                margin: '1.5rem 0'
              }}>
                <div style={{ fontSize: '2.5rem' }}>🛵</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#c084fc', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    ¡TU PEDIDO VA EN CAMINO A TU DOMICILIO!
                  </h3>
                  <p style={{ margin: '4px 0 0', color: '#e5e7eb', fontSize: '0.92rem', lineHeight: 1.4 }}>
                    {pedido.repartidor_nombre ? <strong>{pedido.repartidor_nombre}</strong> : 'Nuestro repartidor'} acaba de salir con tu comida recién hecha en bolsa térmica. Estará en tu puerta en unos 15 - 25 minutos.
                  </p>
                </div>
              </div>
            )}

            {/* Aviso cuando está empaquetado para salir a reparto */}
            {isListoReparto && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.18) 0%, rgba(200, 30, 34, 0.1) 100%)',
                border: '1.5px solid rgba(234, 179, 8, 0.5)',
                borderRadius: '12px',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                margin: '1.5rem 0'
              }}>
                <div style={{ fontSize: '2.5rem' }}>🍱</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fbbf24', fontWeight: 900, textTransform: 'uppercase' }}>
                    ¡PLATOS LISTOS Y EMPAQUETADOS!
                  </h3>
                  <p style={{ margin: '4px 0 0', color: '#e5e7eb', fontSize: '0.92rem' }}>
                    Tus platos están recién preparados en bolsa térmica esperando la salida inmediata del repartidor.
                  </p>
                </div>
              </div>
            )}

            {/* Aviso destacado cuando está listo para recoger en local */}
            {isListoRecogida && (
              <div className="tracking-ready-banner">
                <div className="ready-banner-icon">🍣</div>
                <div>
                  <h3 className="ready-banner-title">¡TU PEDIDO YA ESTÁ LISTO PARA RECOGER!</h3>
                  <p className="ready-banner-text">
                    Ya puedes acudir al mostrador y recoger tu comida recién hecha. ¡Buen provecho!
                  </p>
                </div>
              </div>
            )}

            {/* Barra de progreso de estados */}
            <div className="tracking-timeline-container">
              <div className="timeline-track">
                <div
                  className="timeline-progress-bar"
                  style={{ width: `${(currentIndex / (pasos.length - 1)) * 100}%` }}
                />
              </div>

              <div className="timeline-steps-grid">
                {pasos.map((paso, idx) => {
                  const done = idx < currentIndex;
                  const active = idx === currentIndex;
                  return (
                    <div
                      key={paso.key}
                      className={`timeline-step-item ${active ? 'active' : ''} ${done ? 'done' : ''}`}
                    >
                      <div className="step-circle">
                        {done ? '✓' : paso.icon}
                      </div>
                      <div className="step-text-title">{paso.title}</div>
                      <div className="step-text-sub">{paso.sub}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cuadro destacado de Pago al Repartidor si está pendiente */}
            {isDelivery && pedido.estado_pago !== 'pagado' && (
              <div style={{
                background: 'rgba(251, 191, 36, 0.1)',
                border: '2px solid rgba(251, 191, 36, 0.4)',
                borderRadius: '12px',
                padding: '16px 20px',
                margin: '20px 0',
                textAlign: 'center'
              }}>
                <div style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '12px', background: '#fbbf24', color: '#0d0d12', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
                  💵 Pago pendiente al repartidor
                </div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: '#fbbf24', fontFamily: 'monospace' }}>
                  {fmt(pedido.total)}
                </div>
                <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#f3ede0', fontWeight: 600 }}>
                  Puedes abonar en <span style={{ color: '#fbbf24' }}>EFECTIVO</span> o con <span style={{ color: '#fbbf24' }}>TARJETA</span> (datáfono) directamente al repartidor al recibir tu pedido.
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#9ca3af' }}>
                  Por favor ten preparado el importe exacto o tu tarjeta para agilizar la entrega en tu puerta.
                </p>
              </div>
            )}

            {/* Detalles de entrega o recogida */}
            <div className="tracking-pickup-details">
              <div className="pickup-box">
                <div className="pickup-icon">{isDelivery ? '🛵' : '📍'}</div>
                <div>
                  <strong>{isDelivery ? 'Dirección de entrega:' : 'Punto de recogida:'}</strong>
                  {isDelivery ? (
                    <p>
                      <span style={{ fontWeight: 600, color: '#f3ede0' }}>{pedido.direccion_entrega || 'Dirección indicada en el pedido'}</span>
                      {pedido.direccion_detalles && <span style={{ display: 'block', fontSize: '0.85em', color: '#9ca3af' }}>({pedido.direccion_detalles})</span>}
                      {pedido.codigo_postal && <span style={{ display: 'block', fontSize: '0.85em', color: '#9ca3af' }}>C.P. {pedido.codigo_postal}</span>}
                    </p>
                  ) : (
                    <p>Calle Amargura, 3, 30830 La Ñora (Murcia)</p>
                  )}
                </div>
              </div>

              <div className="pickup-box">
                <div className="pickup-icon">{isDelivery ? '⏱️' : '🕐'}</div>
                <div>
                  <strong>{isDelivery ? 'Tiempo estimado de entrega:' : 'Hora estimada de recogida:'}</strong>
                  <p className="pickup-time-val">
                    {isDelivery
                      ? (pedido.estado_pedido === 'en_camino' ? '15 - 25 min (Repartidor en camino)' : (pedido.hora_recogida || 'Lo antes posible (~35-45 min)'))
                      : (pedido.hora_recogida || 'Lo antes posible (~25-35 min)')}
                  </p>
                </div>
              </div>
            </div>

            {/* Lista de platos pedidos */}
            {Array.isArray(pedido.items) && pedido.items.length > 0 && (
              <div className="tracking-items-section">
                <h4 className="tracking-items-title">Platos de tu pedido:</h4>
                <div className="tracking-items-list">
                  {pedido.items.map((it, idx) => (
                    <div key={idx} className="tracking-item-row">
                      <div className="tracking-item-name">
                        <strong className="tracking-item-qty">{it.cantidad || 1}x</strong>
                        <span>{it.nombre}</span>
                        {it.porcion && <span className="tracking-item-extra">({it.porcion} uds)</span>}
                        {it.opcion && <span className="tracking-item-extra">- {it.opcion}</span>}
                      </div>
                      <div className="tracking-item-price">
                        {fmt(it.subtotal || (it.precio_unitario * (it.cantidad || 1)) || 0)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="tracking-total-row">
                  <span>{isDelivery && pedido.estado_pago !== 'pagado' ? 'Total a abonar al repartidor' : 'Importe Total'}</span>
                  <span className="tracking-total-amount">{fmt(pedido.total)}</span>
                </div>
              </div>
            )}

            {/* Mensaje de contacto */}
            <div className="tracking-footer-help">
              <p>
                ¿Necesitas cambiar algo de tu comanda? Llámanos directamente al <strong>613 927 596</strong>.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
