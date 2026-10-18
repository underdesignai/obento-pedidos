import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import PedidosPage from './pages/PedidosPage';
import TrackingPage from './pages/TrackingPage';
import DeliveryPage from './pages/DeliveryPage';
import InstallPrompt from './components/InstallPrompt';
import CookieBanner from './components/legal/CookieBanner';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import FestiveCanvasOverlay from './components/FestiveCanvasOverlay';
import { trackPageView } from './utils/analytics';

function PageTracker() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  return null;
}

export default function App() {
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState('aviso-legal');

  const handleOpenLegal = (tab = 'aviso-legal') => {
    setLegalTab(tab);
    setIsLegalOpen(true);
  };

  useEffect(() => {
    const handleGlobalLegal = (e) => {
      const tab = e?.detail?.tab || 'aviso-legal';
      handleOpenLegal(tab);
    };
    window.addEventListener('open_legal_modal', handleGlobalLegal);
    return () => window.removeEventListener('open_legal_modal', handleGlobalLegal);
  }, []);

  return (
    <ThemeProvider>
      <CartProvider>
        <BrowserRouter>
          <FestiveCanvasOverlay />
          <InstallPrompt />
          <PageTracker />
          <Routes>
            {/* La raíz de esta aplicación es directamente la carta interactiva de pedidos */}
            <Route path="/" element={<PedidosPage />} />
            <Route path="/pedidos" element={<PedidosPage />} />
            <Route path="/seguimiento" element={<TrackingPage />} />
            <Route path="/tracking" element={<TrackingPage />} />
            <Route path="/delivery" element={<DeliveryPage />} />
            <Route path="/reparto" element={<DeliveryPage />} />
            {/* Fallback a pedidos */}
            <Route path="*" element={<PedidosPage />} />
          </Routes>
          <CookieBanner onOpenCookiesPolicy={() => handleOpenLegal('cookies')} />
          <LegalModal
            isOpen={isLegalOpen}
            initialTab={legalTab}
            onClose={() => setIsLegalOpen(false)}
          />
        </BrowserRouter>
      </CartProvider>
    </ThemeProvider>
  );
}
