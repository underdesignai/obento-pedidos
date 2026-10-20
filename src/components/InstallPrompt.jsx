import React, { useState, useEffect } from 'react';
import { trackAppInstall } from '../utils/analytics';
import { useCart } from '../context/CartContext';

export default function InstallPrompt() {
  const { totalCount } = useCart();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(() => {
    return (
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true)
    );
  });
  const [dismissed, setDismissed] = useState(() => {
    return (
      typeof window !== 'undefined' &&
      sessionStorage.getItem('obento_install_dismissed') === 'true'
    );
  });

  useEffect(() => {
    // Si ya está ejecutándose como PWA instalada en pantalla de inicio
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isStandalone) {
      setIsInstalled(true);
      try {
        localStorage.setItem('obento_app_installed', 'true');
        // Registrar en estadísticas si es la primera vez que se detecta en modo app
        if (!localStorage.getItem('obento_install_reported')) {
          localStorage.setItem('obento_install_reported', 'true');
          trackAppInstall({
            platform: isIosDevice ? 'iOS' : 'Android',
            method: 'standalone_launch'
          });
        }
      } catch (_) {}
      return;
    } else {
      // Si está en el navegador web estándar, limpiar bloqueo previo para asegurar que se muestre
      try {
        localStorage.removeItem('obento_app_installed');
      } catch (_) {}
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleOpenInstall = () => {
      setDismissed(false);
      setShowIOSModal(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('open_install_prompt', handleOpenInstall);

    // Evento oficial del navegador cuando la app se instala con éxito
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      try {
        localStorage.setItem('obento_app_installed', 'true');
        localStorage.setItem('obento_install_reported', 'true');
        trackAppInstall({
          platform: isIosDevice ? 'iOS' : 'Android',
          method: 'appinstalled_event'
        });
      } catch (_) {}
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('open_install_prompt', handleOpenInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      // En iOS Safari no hay evento prompt nativo, el usuario abre el modal con las instrucciones
      try {
        trackAppInstall({ platform: 'iOS', method: 'ios_instructions_view' });
      } catch (_) {}
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        try {
          localStorage.setItem('obento_app_installed', 'true');
          localStorage.setItem('obento_install_reported', 'true');
          trackAppInstall({ platform: 'Android', method: 'prompt_accepted' });
        } catch (_) {}
      }
      setDeferredPrompt(null);
    } else {
      setShowIOSModal(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('obento_install_dismissed', 'true');
    } catch (_) {}
  };

  if (isInstalled || dismissed) return null;

  return (
    <>
      {/* Píldora flotante fija al final de la página */}
      <aside className={`obento-install-pill ${totalCount > 0 ? 'has-floating-cart' : ''}`} aria-label="Instalar aplicación de Obento">
        <div className="obento-install-left">
          <div className="obento-install-logo-wrap">
            <img
              src="/images/logo-obento.webp"
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/logo-obento.png'; }}
              alt="Obento Logo"
              className="obento-install-logo"
            />
          </div>
          <div className="obento-install-info">
            <h4 className="obento-install-title">Instala la App de OBENTO</h4>
            <p className="obento-install-sub">
              Accede a tus pedidos y carta con un solo toque.
            </p>
          </div>
        </div>

        <div className="obento-install-right">
          <button
            type="button"
            className="obento-install-cta"
            onClick={handleInstallClick}
          >
            INSTALAR
          </button>
          <button
            type="button"
            className="obento-install-close"
            onClick={handleDismiss}
            aria-label="Cerrar aviso de instalación"
          >
            ✕
          </button>
        </div>
      </aside>

      {/* Modal instructivo para iOS Safari / Navegadores sin prompt automático */}
      {showIOSModal && (
        <div className="modal-backdrop" onClick={() => setShowIOSModal(false)}>
          <div className="modal-card ios-install-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Instalar Obento en tu Móvil</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowIOSModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body ios-install-body">
              <div className="ios-step">
                <span className="step-num">1</span>
                <div>
                  Pulsa el botón de <strong>Compartir</strong> en la barra inferior de Safari{' '}
                  <span className="ios-share-icon">⎋</span>
                </div>
              </div>
              <div className="ios-step">
                <span className="step-num">2</span>
                <div>
                  Baja y selecciona <strong>«Añadir a la pantalla de inicio»</strong>{' '}
                  <span className="ios-add-icon">➕</span>
                </div>
              </div>
              <div className="ios-step">
                <span className="step-num">3</span>
                <div>
                  Pulsa <strong>«Añadir»</strong> arriba a la derecha. ¡Listo para pedir!
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-primary w-full"
                onClick={() => setShowIOSModal(false)}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
