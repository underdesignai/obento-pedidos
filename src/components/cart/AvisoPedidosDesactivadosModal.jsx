import React from 'react';
import { formatWhatsAppOrderMessage } from '../../utils/whatsappOrder';

export default function AvisoPedidosDesactivadosModal({
  tiendaEstado,
  platoIntentado,
  cart = [],
  finalPrice = 0,
  onClose
}) {
  const whatsappNumber = tiendaEstado?.whatsapp || '34613927596';
  const mensajeWa = formatWhatsAppOrderMessage(cart, finalPrice, platoIntentado);
  const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(mensajeWa)}`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(6px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#16151a',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '16px',
          maxWidth: '460px',
          width: '100%',
          padding: '24px 22px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 25px rgba(239, 68, 68, 0.15)',
          color: '#ffffff',
          textAlign: 'center',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar X */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '22px',
            cursor: 'pointer',
            padding: '4px 8px',
            lineHeight: 1
          }}
          aria-label="Cerrar"
        >
          &times;
        </button>

        {/* Icono de advertencia */}
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: '#f87171'
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        {/* Título */}
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 800,
            color: '#ffffff',
            margin: '0 0 10px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}
        >
          Pedidos Online Desactivados
        </h3>

        {/* Mensaje explicativo */}
        <p
          style={{
            fontSize: '13.5px',
            color: '#fca5a5',
            lineHeight: 1.5,
            margin: '0 0 16px',
            fontWeight: 500
          }}
        >
          {tiendaEstado?.mensaje ||
            'Pedidos online desactivados temporalmente. Para realizar su pedido, por favor contacte directamente por WhatsApp o por teléfono al 613 927 596.'}
        </p>

        {/* Detalle de los productos a pedir */}
        {cart?.length > 0 ? (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.85)',
              marginBottom: '18px',
              textAlign: 'left',
              maxHeight: '120px',
              overflowY: 'auto'
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: '6px', color: '#c9a84c' }}>
              Productos en el pedido ({cart.length}):
            </div>
            {cart.map((it, idx) => (
              <div key={idx} style={{ lineHeight: 1.4 }}>
                • {it.cantidad || 1}x {it.nombre || it.name}
                {it.porcion ? ` (${it.porcion} uds)` : ''}
                {it.opcion ? ` [${it.opcion}]` : ''}
              </div>
            ))}
          </div>
        ) : platoIntentado?.dish ? (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '18px',
              display: 'inline-block'
            }}
          >
            Plato seleccionado: <strong>{platoIntentado.cantidad || 1}x {platoIntentado.dish.nombre}</strong>
          </div>
        ) : null}

        {/* Botón WhatsApp */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            background: '#22c55e',
            color: '#ffffff',
            padding: '13px 20px',
            borderRadius: '10px',
            textDecoration: 'none',
            fontWeight: 800,
            fontSize: '15px',
            boxShadow: '0 4px 16px rgba(34, 197, 94, 0.4)',
            transition: 'transform 0.15s, background-color 0.15s',
            marginBottom: '10px',
            cursor: 'pointer'
          }}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.072.043.419-.101.824z" />
          </svg>
          <span>WhatsApp</span>
        </a>

        {/* Botón Volver / Cerrar */}
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: 'rgba(255, 255, 255, 0.65)',
            padding: '9px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            width: '100%'
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
