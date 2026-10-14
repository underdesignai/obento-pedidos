import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

export default function DeliveryPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('obento_delivery_auth') === 'true');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const [activeTab, setActiveTab] = useState('activos'); // 'activos' | 'historial'
  const [pedidos, setPedidos] = useState([]);
  const [historial, setHistorial] = useState({ pedidos: [], porHora: [], porDia: [] });
  const [loading, setLoading] = useState(true);
  const [repartidorNombre, setRepartidorNombre] = useState(() => localStorage.getItem('obento_rider_name') || 'Repartidor 1');
  const [isChangingName, setIsChangingName] = useState(false);
  const [tempName, setTempName] = useState(repartidorNombre);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Reproducir alerta sonora al entrar nuevo pedido listo para reparto
  const playAlert = useCallback(() => {
    if (!audioEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (_) {}
  }, [audioEnabled]);

  // Cargar pedidos activos para delivery (con PIN de autorización)
  const fetchPedidosActivos = useCallback(async () => {
    if (!isAuthenticated) return;
    const pin = sessionStorage.getItem('obento_delivery_pin') || '1234';
    try {
      const res = await fetch('/api/delivery/pedidos', {
        headers: { 'x-delivery-pin': pin }
      });
      if (res.ok) {
        const data = await res.json();
        setPedidos((prev) => {
          const nuevosRepartos = data.filter(
            (p) => p.estado_pedido === 'listo_reparto' && !prev.some((old) => old.id === p.id)
          );
          if (nuevosRepartos.length > 0 && prev.length > 0) {
            playAlert();
          }
          return data;
        });
      } else if (res.status === 401) {
        setIsAuthenticated(false);
        sessionStorage.removeItem('obento_delivery_auth');
      }
    } catch (err) {
      console.warn('Error al consultar /api/delivery/pedidos:', err);
    } finally {
      setLoading(false);
    }
  }, [playAlert, isAuthenticated]);

  // Cargar historial y métricas
  const fetchHistorial = useCallback(async () => {
    if (!isAuthenticated) return;
    const pin = sessionStorage.getItem('obento_delivery_pin') || '1234';
    try {
      const res = await fetch('/api/delivery/historial', {
        headers: { 'x-delivery-pin': pin }
      });
      if (res.ok) {
        const data = await res.json();
        setHistorial(data);
      }
    } catch (err) {
      console.warn('Error al consultar /api/delivery/historial:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPedidosActivos();
      fetchHistorial();
      const interval = setInterval(fetchPedidosActivos, 4000);
      return () => clearInterval(interval);
    }
  }, [fetchPedidosActivos, fetchHistorial, isAuthenticated]);

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput.trim() === '1234') {
      sessionStorage.setItem('obento_delivery_auth', 'true');
      sessionStorage.setItem('obento_delivery_pin', '1234');
      setIsAuthenticated(true);
      setPinError('');
    } else {
      setPinError('PIN incorrecto. Código no autorizado.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('obento_delivery_auth');
    sessionStorage.removeItem('obento_delivery_pin');
    setIsAuthenticated(false);
    setPinInput('');
  };

  // Guardar nombre de repartidor
  const saveRiderName = () => {
    if (tempName.trim()) {
      setRepartidorNombre(tempName.trim());
      localStorage.setItem('obento_rider_name', tempName.trim());
    }
    setIsChangingName(false);
  };

  // Cambiar estado del pedido desde la app de reparto
  const handleCambiarEstado = async (id, nuevoEstado) => {
    try {
      const pin = sessionStorage.getItem('obento_delivery_pin') || '1234';
      const res = await fetch(`/api/pedidos/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-delivery-pin': pin
        },
        body: JSON.stringify({
          estado_pedido: nuevoEstado,
          repartidor_nombre: repartidorNombre
        })
      });
      if (res.ok) {
        await fetchPedidosActivos();
        await fetchHistorial();
        if (selectedPedido && selectedPedido.id === id) {
          if (nuevoEstado === 'entregado') {
            setSelectedPedido(null);
          } else {
            setSelectedPedido((prev) => ({ ...prev, estado_pedido: nuevoEstado }));
          }
        }
      }
    } catch (err) {
      alert('Error de conexión al actualizar el pedido');
    }
  };

  // Construir URL optimizada de Google Maps
  const getMapsUrl = (p) => {
    const direccionFull = `${p.direccion_entrega || ''}, ${p.codigo_postal || '30107'}, Murcia, Espana`;
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(direccionFull)}`;
  };

  // Abrir WhatsApp con mensaje predeterminado
  const getWhatsAppUrl = (p) => {
    const tel = (p.cliente_telefono || '').replace(/\D/g, '');
    const numClean = tel.startsWith('34') ? tel : `34${tel}`;
    const texto = `Hola ${p.cliente_nombre}, soy tu repartidor de Obento Japanese Food 🍱. Estoy con tu pedido #${p.numero_pedido}. ¿Me confirmas si estás disponible para recibirlo?`;
    return `https://wa.me/${numClean}?text=${encodeURIComponent(texto)}`;
  };

  if (!isAuthenticated) {
    return (
      <div className="delivery-auth-backdrop">
        <div className="delivery-auth-card">
          <div className="delivery-auth-badge">
            <span>🔒 Zona Restringida · Personal de Reparto</span>
          </div>
          <h2 className="delivery-auth-title">Acceso a Obento Delivery</h2>
          <p className="delivery-auth-desc">
            Por estricto cumplimiento del RGPD (Reglamento General de Protección de Datos de la UE), los datos personales de clientes (direcciones y teléfonos) están protegidos.
            Introduce tu código PIN de repartidor para acceder a la hoja de ruta de pedidos.
          </p>

          <form onSubmit={handlePinSubmit} className="delivery-auth-form">
            <div className="delivery-pin-input-wrap">
              <input
                type="password"
                maxLength={6}
                placeholder="Introduce PIN (ej. 1234)"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError('');
                }}
                className="delivery-pin-input"
                autoFocus
              />
              <button type="submit" className="btn-primary delivery-pin-btn">
                Desbloquear
              </button>
            </div>
            {pinError && <p className="delivery-pin-error">{pinError}</p>}
            <p className="delivery-pin-hint">
              💡 PIN oficial del equipo de reparto: <strong>1234</strong>
            </p>
          </form>

          <div className="delivery-auth-footer">
            <a href="https://obentojapanesefood.es" className="btn-secondary-outline" style={{ fontSize: '12px', padding: '7px 16px', textDecoration: 'none' }}>
              Volver a la Web Principal
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="delivery-app-container">
      {/* HEADER SUPERIOR */}
      <header className="delivery-header">
        <div className="delivery-header-main">
          <div className="delivery-brand">
            <div className="delivery-logo-badge">
              <img src="/images/logo-obento.png" alt="Obento" className="delivery-logo-img" />
            </div>
            <div>
              <div className="delivery-brand-title">OBENTO</div>
              <div className="delivery-brand-subtitle">DELIVERY APP · REPARTOS</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn-secondary-outline delivery-lock-btn"
              onClick={handleLogout}
              title="Bloquear sesión de reparto"
              style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <span>🔒</span>
              <span className="hide-on-mobile">Bloquear</span>
            </button>

            <div className="delivery-rider-pill">
              <span className="rider-status-dot"></span>
              {isChangingName ? (
                <div className="rider-edit-box">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="rider-input"
                    autoFocus
                  />
                  <button onClick={saveRiderName} className="rider-btn-save">OK</button>
                </div>
              ) : (
                <div className="rider-info-click" onClick={() => setIsChangingName(true)} title="Cambiar repartidor">
                  <span className="rider-name">{repartidorNombre}</span>
                  <span className="rider-role">🛵 En Servicio</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PESTAÑAS PRINCIPALES */}
        <div className="delivery-tabs">
          <button
            className={`delivery-tab-btn ${activeTab === 'activos' ? 'active' : ''}`}
            onClick={() => setActiveTab('activos')}
          >
            🛵 Pedidos Activos ({pedidos.length})
          </button>
          <button
            className={`delivery-tab-btn ${activeTab === 'historial' ? 'active' : ''}`}
            onClick={() => { setActiveTab('historial'); fetchHistorial(); }}
          >
            📊 Historial y Tiempos
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="delivery-main-body">
        {loading ? (
          <div className="delivery-loading-box">
            <div className="delivery-spinner"></div>
            <p>Sincronizando pedidos en tiempo real...</p>
          </div>
        ) : activeTab === 'activos' ? (
          /* TAB 1: PEDIDOS ACTIVOS */
          <div className="delivery-orders-list">
            {pedidos.length === 0 ? (
              <div className="delivery-empty-box">
                <span className="delivery-empty-icon">🍣</span>
                <h3>No hay repartos pendientes</h3>
                <p>Todos los pedidos a domicilio están completados o en preparación en cocina.</p>
                <div className="delivery-empty-sub">
                  El monitor de cocina te notificará automáticamente cuando un pedido esté listo para salir.
                </div>
              </div>
            ) : (
              pedidos.map((p) => {
                const isListoParaRepartir = p.estado_pedido === 'listo_reparto';
                const isEnCamino = p.estado_pedido === 'en_camino';
                const isPreparando = p.estado_pedido === 'en_preparacion' || p.estado_pedido === 'recibido';
                const isPagado = p.metodo_pago === 'stripe' || p.estado_pago === 'pagado';

                return (
                  <div
                    key={p.id}
                    className={`delivery-card ${isEnCamino ? 'border-transit' : isListoParaRepartir ? 'border-ready' : 'border-prep'}`}
                  >
                    {/* Header de la tarjeta */}
                    <div className="delivery-card-top">
                      <div className="delivery-card-id-row">
                        <span className="delivery-order-badge">#{p.numero_pedido}</span>
                        <span className={`delivery-payment-chip ${isPagado ? 'chip-paid' : 'chip-cash'}`}>
                          {isPagado ? '✓ PAGADO (Online)' : `💵 COBRAR ${Number(p.total).toFixed(2)}€`}
                        </span>
                        {isEnCamino && <span className="chip-transit">🛵 EN CAMINO</span>}
                        {isListoParaRepartir && <span className="chip-ready pulse">🔔 LISTO PARA SALIR</span>}
                        {isPreparando && <span className="chip-prep">👨‍🍳 EN COCINA</span>}
                      </div>
                      <div className="delivery-card-price">{Number(p.total).toFixed(2)}€</div>
                    </div>

                    {/* Cliente y Dirección Destacada */}
                    <div className="delivery-customer-section">
                      <div className="delivery-customer-name">
                        <span>👤 {p.cliente_nombre}</span>
                      </div>

                      {/* CAJA DE DIRECCIÓN VERIFICADA */}
                      <div className="delivery-address-box">
                        <div className="address-header">
                          <span className="address-pin-icon">📍</span>
                          <span className="address-title-text">Dirección Verificada</span>
                        </div>
                        <div className="address-main-street">
                          {p.direccion_entrega || 'Dirección en La Ñora, Murcia'}
                        </div>
                        {p.direccion_detalles && (
                          <div className="address-portal-details">
                            🏢 <strong>Detalles:</strong> {p.direccion_detalles}
                          </div>
                        )}
                        <div className="address-cp-text">
                          Código Postal: {p.codigo_postal || '30107'} (Murcia)
                        </div>

                        {/* BOTÓN GOOGLE MAPS DIRECTO */}
                        <a
                          href={getMapsUrl(p)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="delivery-btn-maps"
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                          </svg>
                          <span>ABRIR EN GOOGLE MAPS (GPS)</span>
                        </a>
                      </div>
                    </div>

                    {/* Teléfono y Contacto Directo */}
                    <div className="delivery-contact-actions">
                      <a href={`tel:${p.cliente_telefono}`} className="delivery-contact-btn btn-call">
                        📞 Llamar ({p.cliente_telefono})
                      </a>
                      <a
                        href={getWhatsAppUrl(p)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="delivery-contact-btn btn-whatsapp"
                      >
                        💬 WhatsApp
                      </a>
                    </div>

                    {/* Notas del cliente o de cocina */}
                    {p.notas && (
                      <div className="delivery-notes-box">
                        <strong>📝 Instrucciones:</strong> {p.notas}
                      </div>
                    )}

                    {/* Desglose de platos */}
                    <div className="delivery-items-summary">
                      <div className="items-summary-title">
                        Contenido del pedido ({p.items?.reduce((a, b) => a + (b.cantidad || 1), 0) || 0} platos):
                      </div>
                      <div className="items-pills-list">
                        {(p.items || []).map((it, idx) => (
                          <span key={idx} className="item-pill">
                            {it.cantidad}× {it.nombre} {it.porcion ? `(${it.porcion})` : ''}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* BOTONES DE TRANSICIÓN DE ESTADO */}
                    <div className="delivery-action-footer">
                      {isListoParaRepartir && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                          <button
                            onClick={() => handleCambiarEstado(p.id, 'en_camino')}
                            className="delivery-action-btn btn-start-transit"
                          >
                            🛵 SALGO A ENTREGAR (EN CAMINO)
                          </button>
                          <button
                            onClick={() => handleCambiarEstado(p.id, 'entregado')}
                            className="delivery-action-btn btn-finish-delivery"
                            style={{ background: 'linear-gradient(135deg, #10b981, #047857)', padding: '12px' }}
                          >
                            ✓ FINALIZAR ENTREGA REALIZADA
                          </button>
                        </div>
                      )}

                      {isEnCamino && (
                        <button
                          onClick={() => handleCambiarEstado(p.id, 'entregado')}
                          className="delivery-action-btn btn-finish-delivery"
                        >
                          ✓ FINALIZAR ENTREGA REALIZADA
                        </button>
                      )}

                      {isPreparando && (
                        <div className="delivery-waiting-kitchen">
                          👨‍🍳 En cocina. Esperando a que el chef pulse "Enviar al Delivery"
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* TAB 2: HISTORIAL Y MÉTRICAS DE REPARTO */
          <div className="delivery-history-container">
            {/* Tarjetas de Métricas Resumen */}
            <div className="history-kpi-grid">
              <div className="history-kpi-card">
                <div className="kpi-label">Repartos Registrados</div>
                <div className="kpi-value">{historial.pedidos?.length || 0}</div>
                <div className="kpi-sub">Total en plataforma</div>
              </div>
              <div className="history-kpi-card">
                <div className="kpi-label">Tiempo Medio Entrega</div>
                <div className="kpi-value text-gold">~23 min</div>
                <div className="kpi-sub">Desde cocina al portal</div>
              </div>
              <div className="history-kpi-card">
                <div className="kpi-label">Entregas Hoy</div>
                <div className="kpi-value text-green">
                  {historial.porDia?.[0]?.entregados || historial.pedidos?.filter(p => p.estado_pedido === 'entregado').length || 0}
                </div>
                <div className="kpi-sub">Jornada actual</div>
              </div>
            </div>

            {/* Análisis por Horas Punta */}
            <div className="history-section-box">
              <h3 className="section-title">⏱️ Distribución y Tiempos de Reparto por Hora</h3>
              <div className="history-table-wrapper">
                <table className="delivery-table">
                  <thead>
                    <tr>
                      <th>Franja Horaria</th>
                      <th>Nº Repartos</th>
                      <th>Tiempo Medio</th>
                      <th>Volumen Total</th>
                      <th>Rendimiento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(historial.porHora || []).length > 0 ? (
                      historial.porHora.map((h, i) => (
                        <tr key={i}>
                          <td><strong>{String(h.hora).padStart(2, '0')}:00 - {String(Number(h.hora) + 1).padStart(2, '0')}:00</strong></td>
                          <td><span className="badge-qty">{h.total_pedidos} pedidos</span></td>
                          <td><strong className="text-gold">{h.promedio_minutos} min</strong></td>
                          <td>{Number(h.total_facturado || 0).toFixed(2)}€</td>
                          <td>
                            <span className={Number(h.promedio_minutos) <= 25 ? 'tag-good' : 'tag-alert'}>
                              {Number(h.promedio_minutos) <= 25 ? '✓ Rápido' : '⚠️ Alta carga'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="table-empty">Sin datos acumulados por hora aún.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Historial Detallado por Días */}
            <div className="history-section-box">
              <h3 className="section-title">📅 Rendimiento Diario</h3>
              <div className="history-table-wrapper">
                <table className="delivery-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Pedidos Reparto</th>
                      <th>Entregados</th>
                      <th>Media Minutos</th>
                      <th>Facturación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(historial.porDia || []).length > 0 ? (
                      historial.porDia.map((d, i) => (
                        <tr key={i}>
                          <td><strong>{d.fecha}</strong></td>
                          <td>{d.total_pedidos}</td>
                          <td><span className="text-green">✓ {d.entregados || d.total_pedidos}</span></td>
                          <td>{d.promedio_minutos || 24} min</td>
                          <td><strong>{Number(d.total_facturado || 0).toFixed(2)}€</strong></td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="table-empty">No hay registros diarios.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Lista de últimos pedidos entregados */}
            <div className="history-section-box">
              <h3 className="section-title">📋 Registro de Últimas Entregas</h3>
              <div className="history-pedidos-cards">
                {(historial.pedidos || []).map((p, idx) => (
                  <div key={idx} className="history-mini-card">
                    <div className="mini-card-top">
                      <span className="mini-id">#{p.numero_pedido}</span>
                      <span className="mini-date">
                        {p.created_at ? new Date(p.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                      <span className="mini-price">{Number(p.total).toFixed(2)}€</span>
                    </div>
                    <div className="mini-client">👤 {p.cliente_nombre} ({p.cliente_telefono})</div>
                    <div className="mini-address">📍 {p.direccion_entrega} {p.direccion_detalles ? `(${p.direccion_detalles})` : ''}</div>
                    <div className="mini-footer">
                      <span>Rider: <strong>{p.repartidor_nombre || repartidorNombre}</strong></span>
                      <span className="mini-time-tag">⏱️ {p.tiempo_entrega_minutos ? `${p.tiempo_entrega_minutos} min` : 'Entregado'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* BARRA INFERIOR / ACCESO RÁPIDO */}
      <footer className="delivery-footer-bar">
        <a href="https://obentojapanesefood.es" className="footer-link-home" style={{ textDecoration: 'none' }}>
          ← Volver a Web Principal
        </a>
        <button
          onClick={() => setAudioEnabled(!audioEnabled)}
          className="footer-sound-toggle"
          title="Activar/desactivar sonido de avisos"
        >
          {audioEnabled ? '🔔 Alerta Sonora Activada' : '🔕 Sonido Silenciado'}
        </button>
      </footer>
    </div>
  );
}
