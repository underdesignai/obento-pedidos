import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

function fmt(n) {
  return Number(n).toFixed(2).replace('.', ',') + '€';
}

const PASOS = [
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

  // Polling automático cada 4 segundos para actualizar el estado en vivo cuando cocina cambie
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

  // Calcular índice del paso actual
  const getStepIndex = (estado) => {
    switch (estado) {
      case 'recibido':
      case 'nuevo':
      case 'pendiente':
        return 0;
      case 'preparando':
      case 'en_preparacion':
        return 1;
      case 'listo':
        return 2;
      case 'entregado':
        return 3;
      default:
        return 0;
    }
  };

  const currentIndex = pedido ? getStepIndex(pedido.estado_pedido) : 0;
  const isListo = pedido?.estado_pedido === 'listo';
  const isEntregado = pedido?.estado_pedido === 'entregado';

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
          <span className="tracking-eyebrow">SEGUIMIENTO EN DIRECTO</span>
          <h1 className="tracking-title">Estado de tu Pedido Takeaway</h1>
          <p className="tracking-desc">
            Introduce tu número de referencia para consultar el progreso de cocina en tiempo real.
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
                <span className="tracking-order-badge">PEDIDO CONFIRMADO</span>
                <h2 className="tracking-order-number">{pedido.numero_pedido}</h2>
                <div className="tracking-order-client">
                  Cliente: <strong>{pedido.cliente_nombre}</strong>
                </div>
              </div>
              <div className="tracking-top-right">
                <div className={`tracking-pago-pill ${pedido.estado_pago === 'pagado' ? 'pagado' : 'pendiente'}`}>
                  {pedido.estado_pago === 'pagado' ? '🟢 Pagado con tarjeta' : '🟠 Pago en local'}
                </div>
                <div className="tracking-sync-time">
                  Actualizado en directo · {lastCheck.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            </div>

            {/* Aviso destacado cuando está listo */}
            {isListo && (
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
                  style={{ width: `${(currentIndex / (PASOS.length - 1)) * 100}%` }}
                />
              </div>

              <div className="timeline-steps-grid">
                {PASOS.map((paso, idx) => {
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

            {/* Detalles de recogida y horario */}
            <div className="tracking-pickup-details">
              <div className="pickup-box">
                <div className="pickup-icon">📍</div>
                <div>
                  <strong>Punto de recogida:</strong>
                  <p>Calle Amargura, 3, 30830 La Ñora (Murcia)</p>
                </div>
              </div>

              <div className="pickup-box">
                <div className="pickup-icon">🕐</div>
                <div>
                  <strong>Hora estimada de recogida:</strong>
                  <p className="pickup-time-val">{pedido.hora_recogida || 'Lo antes posible (~35-45 min)'}</p>
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
                  <span>Importe Total</span>
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
