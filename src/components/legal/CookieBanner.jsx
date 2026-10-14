import React, { useState, useEffect } from 'react';

const CONSENT_KEY = 'obento_cookie_consent';

export function getCookieConsent() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAnalyticsAllowed() {
  const consent = getCookieConsent();
  return Boolean(consent && consent.analytics === true);
}

export default function CookieBanner({ onOpenCookiesPolicy }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    // Escuchar eventos globales para reabrir el panel de configuración desde el footer
    const handleReopen = () => {
      const existing = getCookieConsent();
      if (existing) {
        setAnalyticsEnabled(Boolean(existing.analytics));
      }
      setIsConfigOpen(true);
      setIsVisible(true);
    };

    window.addEventListener('open_cookie_settings', handleReopen);
    window.openCookieSettings = handleReopen;

    // Verificar si ya existe consentimiento guardado
    const existing = getCookieConsent();
    if (!existing) {
      // Mostrar con leve delay para suavidad visual
      const t = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(t);
    } else {
      setAnalyticsEnabled(Boolean(existing.analytics));
    }

    return () => {
      window.removeEventListener('open_cookie_settings', handleReopen);
    };
  }, []);

  const saveConsent = (choice, allowAnalytics) => {
    const payload = {
      choice,
      technical: true,
      analytics: allowAnalytics,
      timestamp: new Date().toISOString()
    };
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('obento_consent_updated', { detail: payload }));
    } catch (e) {
      console.warn('Error saving cookie consent:', e);
    }
    setIsVisible(false);
    setIsConfigOpen(false);
  };

  const handleAcceptAll = () => {
    saveConsent('all', true);
  };

  const handleRejectAll = () => {
    saveConsent('rejected', false);
    // Limpiar identificador analítico si existiera
    try {
      localStorage.removeItem('obento_analytics_sid');
    } catch (_) {}
  };

  const handleSaveCustom = () => {
    saveConsent('custom', analyticsEnabled);
    if (!analyticsEnabled) {
      try {
        localStorage.removeItem('obento_analytics_sid');
      } catch (_) {}
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Banner Principal de Consentimiento (AEPD 2024 Compliant) */}
      <div className="cookie-banner-wrap" role="region" aria-label="Aviso de Cookies y Privacidad">
        <div className="cookie-banner-container">
          <div className="cookie-banner-content">
            <div className="cookie-banner-badge">
              <span className="cookie-ico">🍪</span>
              <span className="cookie-badge-text">Privacidad y Gestión de Cookies · Obento</span>
            </div>
            <p className="cookie-banner-text">
              Utilizamos cookies técnicas necesarias para permitir la navegación y recordar tu cesta de sushi.
              Asimismo, solicitamos tu autorización para utilizar herramientas analíticas anónimas que nos ayudan a optimizar la carta online y medir el rendimiento del servicio conforme al Art. 22.2 de la LSSI-CE y la Guía de la AEPD.
              Puedes consultar todos los detalles en nuestra{' '}
              <button
                type="button"
                className="cookie-link-btn"
                onClick={() => onOpenCookiesPolicy && onOpenCookiesPolicy()}
              >
                Política de Cookies
              </button>.
            </p>
          </div>

          {/* Tres botones de idéntica jerarquía visual exigidos por la AEPD */}
          <div className="cookie-banner-actions">
            <button
              type="button"
              className="cookie-btn cookie-btn-reject"
              onClick={handleRejectAll}
            >
              Rechazar no esenciales
            </button>
            <button
              type="button"
              className="cookie-btn cookie-btn-config"
              onClick={() => setIsConfigOpen(true)}
            >
              Configurar preferencias
            </button>
            <button
              type="button"
              className="cookie-btn cookie-btn-accept"
              onClick={handleAcceptAll}
            >
              Aceptar todas
            </button>
          </div>
        </div>
      </div>

      {/* Modal Granular de Configuración de Cookies */}
      {isConfigOpen && (
        <div className="cookie-config-backdrop" onClick={() => setIsConfigOpen(false)}>
          <div className="cookie-config-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cookie-config-header">
              <div className="cookie-config-header-title">
                <span className="cookie-ico-lg">⚙️</span>
                <div>
                  <h3>Centro de Preferencias de Cookies</h3>
                  <p>Configura individualmente los dispositivos de almacenamiento</p>
                </div>
              </div>
              <button
                type="button"
                className="cookie-close-btn"
                onClick={() => setIsConfigOpen(false)}
                aria-label="Cerrar configuración de cookies"
              >
                &times;
              </button>
            </div>

            <div className="cookie-config-body">
              {/* Categoría 1: Técnicas */}
              <div className="cookie-pref-card">
                <div className="cookie-pref-header">
                  <div>
                    <span className="cookie-pref-title">Cookies Técnicas y del Carrito</span>
                    <span className="cookie-pref-status-always">Siempre activas (Obligatorias)</span>
                  </div>
                  <input type="checkbox" checked disabled className="cookie-pref-toggle disabled" />
                </div>
                <p className="cookie-pref-desc">
                  Imprescindibles para que la web funcione correctamente, guardar tus platos en la cesta de compra mientras navegas y recordar tu elección sobre las cookies. No recogen datos de perfilado ni publicitarios.
                </p>
              </div>

              {/* Categoría 2: Analítica */}
              <div className="cookie-pref-card">
                <div className="cookie-pref-header">
                  <div>
                    <span className="cookie-pref-title">Cookies Analíticas y de Medición</span>
                    <span className="cookie-pref-status-opt">Opcionales</span>
                  </div>
                  <label className="cookie-toggle-switch">
                    <input
                      type="checkbox"
                      checked={analyticsEnabled}
                      onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                    />
                    <span className="cookie-toggle-slider"></span>
                  </label>
                </div>
                <p className="cookie-pref-desc">
                  Nos permiten analizar el tráfico de visitas y los platos más vistos de forma completamente anónima y agregada. Nos ayudan a mejorar la velocidad y la experiencia de nuestra cocina online.
                </p>
              </div>
            </div>

            <div className="cookie-config-footer">
              <button
                type="button"
                className="cookie-btn cookie-btn-reject"
                onClick={handleRejectAll}
              >
                Rechazar todas
              </button>
              <button
                type="button"
                className="cookie-btn cookie-btn-accept"
                onClick={handleSaveCustom}
              >
                Guardar mis preferencias
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
