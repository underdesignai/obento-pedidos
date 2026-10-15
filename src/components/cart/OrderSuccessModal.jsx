import React from 'react';

function fmt(n) {
  return Number(n || 0).toFixed(2).replace('.', ',') + '€';
}

export default function OrderSuccessModal({ order, onClose }) {
  if (!order) return null;

  const isPagado = order.estado_pago === 'pagado';
  const isDomicilio = order.tipo_entrega === 'domicilio';

  return (
    <div className="checkout-backdrop" onClick={onClose}>
      <div className="order-success-modal" onClick={(e) => e.stopPropagation()}>
        <div className="success-icon-wrap">
          <div className="success-icon-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="success-check-svg">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        <span className="success-eyebrow">
          {isPagado ? '¡PAGO COMPLETADO CON ÉXITO!' : '¡PEDIDO REGISTRADO!'}
        </span>
        <h3 className="success-title">Tu pedido se está preparando 🍣🔥</h3>

        <div className="success-prep-banner" style={{
          background: 'rgba(200,30,34,0.12)',
          border: '1px solid rgba(200,30,34,0.3)',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '18px',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '24px' }}>👨‍🍳</span>
          <div style={{ fontSize: '13px', color: '#e5e7eb', lineHeight: '1.4' }}>
            <strong style={{ color: '#fff', display: 'block', marginBottom: '2px' }}>
              En lista de preparación en cocina
            </strong>
            {isPagado ? (
              'Hemos verificado tu pago online. La comanda ya está en marcha en los fogones de Obento.'
            ) : (
              <>
                Tu comanda ya está en marcha en cocina. El importe total de{' '}
                <strong style={{ color: '#fbbf24', fontWeight: 800 }}>{fmt(order.total)}</strong> se abonará al recoger tu pedido en el local (en efectivo o con tarjeta).
              </>
            )}
          </div>
        </div>

        {order.cliente_email && (
          <div style={{
            background: 'rgba(59,178,115,0.08)',
            border: '1px solid rgba(59,178,115,0.25)',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '18px',
            textAlign: 'left',
            fontSize: '12.5px',
            color: '#d1fae5',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '16px' }}>✉️</span>
            <div>
              {isPagado ? (
                <>Te hemos enviado un correo a <strong style={{ color: '#fff' }}>{order.cliente_email}</strong> confirmando que tu pedido ha sido pagado y está en preparación.</>
              ) : (
                <>Te hemos enviado un correo a <strong style={{ color: '#fff' }}>{order.cliente_email}</strong> con los detalles de tu comanda y recogida en el local.</>
              )}
            </div>
          </div>
        )}

        <div className="order-ticket-box">
          <div className="order-ticket-top">
            <div className="ticket-label">NÚMERO DE PEDIDO</div>
            <div className="ticket-number">{order.numero_pedido}</div>
            <div className="ticket-badge-state">
              {isPagado ? '🟢 Pagado con tarjeta' : isDomicilio ? '🟠 Pagar al repartidor' : '🟠 Pagar en el local'}
            </div>
          </div>

          <div className="ticket-details-grid">
            <div className="ticket-detail-item">
              <span className="detail-label">Cliente:</span>
              <span className="detail-val">{order.cliente_nombre}</span>
            </div>
            <div className="ticket-detail-item">
              <span className="detail-label">Teléfono:</span>
              <span className="detail-val">{order.cliente_telefono}</span>
            </div>
            <div className="ticket-detail-item">
              <span className="detail-label">Hora {isDomicilio ? 'entrega' : 'recogida'}:</span>
              <span className="detail-val highlight">{order.hora_recogida || 'Lo antes posible (~35-45 min)'}</span>
            </div>
            <div className="ticket-detail-item">
              <span className="detail-label">Total:</span>
              <span className="detail-val total">{fmt(order.total)}</span>
            </div>
          </div>

          <div className="ticket-instructions">
            <div className="instruction-icon">{isDomicilio ? '🛵' : '📍'}</div>
            <div className="instruction-text">
              {isDomicilio ? (
                <>
                  <strong>Entrega a Domicilio:</strong>
                  <p>
                    {order.direccion_entrega || 'Dirección indicada'}{' '}
                    {order.direccion_detalles ? `(${order.direccion_detalles})` : ''} · CP {order.codigo_postal || '30830'}.
                    El repartidor saldrá hacia tu puerta en cuanto cocina termine tus platos.
                  </p>
                </>
              ) : (
                <>
                  <strong>Punto de recogida Takeaway:</strong>
                  <p>Calle Amargura 3, 30830 La Ñora, Murcia. Presenta tu número de pedido <strong>{order.numero_pedido}</strong> en el mostrador.</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="success-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
          <a
            href={`/seguimiento?id=${order.numero_pedido}`}
            className="btn-primary btn-block"
            style={{ textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <span>🔴</span> Seguir Estado en Vivo
          </a>
          <button
            type="button"
            className="btn-secondary-outline btn-block"
            onClick={onClose}
          >
            Aceptar y Volver a la Carta
          </button>
        </div>
      </div>
    </div>
  );
}
