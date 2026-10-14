import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#ffffff',
      fontFamily: "'Zen Kaku Gothic New', -apple-system, sans-serif",
      fontSmoothing: 'antialiased',
      fontSize: '15px',
      '::placeholder': {
        color: '#736d66'
      },
      iconColor: '#c81e22'
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444'
    }
  }
};

export function StripeCardFields({
  onCardChange,
  disabled
}) {
  return (
    <div className="stripe-real-card-box">
      <div className="card-fields-header-centered">
        <span className="card-fields-title">Introduce los datos de tu tarjeta</span>
        <div className="card-brands-icons">
          <span className="card-brand-pill visa">VISA</span>
          <span className="card-brand-pill mc">Mastercard</span>
        </div>
      </div>

      <div className="form-field" style={{ marginBottom: '12px' }}>
        <label>Número de Tarjeta *</label>
        <div className="stripe-input-wrapper">
          <CardNumberElement
            options={CARD_ELEMENT_OPTIONS}
            onChange={onCardChange}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="card-inputs-row-2" style={{ marginBottom: '12px' }}>
        <div className="form-field" style={{ marginBottom: 0 }}>
          <label>Caducidad *</label>
          <div className="stripe-input-wrapper">
            <CardExpiryElement
              options={CARD_ELEMENT_OPTIONS}
              onChange={onCardChange}
              disabled={disabled}
            />
          </div>
        </div>
        <div className="form-field" style={{ marginBottom: 0 }}>
          <label>CVC / CVV *</label>
          <div className="stripe-input-wrapper">
            <CardCvcElement
              options={CARD_ELEMENT_OPTIONS}
              onChange={onCardChange}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      <div className="card-security-note-centered">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
        <span>Pasarela oficial Stripe · Conexión bancaria cifrada SSL 256-bit</span>
      </div>
    </div>
  );
}

export default function StripeWrapper({ children, onStripeReady }) {
  const [stripePromise, setStripePromise] = useState(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stripe-config')
      .then((res) => res.json())
      .then((data) => {
        if (data.configured && data.publishableKey) {
          const promise = loadStripe(data.publishableKey);
          setStripePromise(promise);
          setIsConfigured(true);
          if (onStripeReady) onStripeReady(true);
        } else {
          setIsConfigured(false);
          if (onStripeReady) onStripeReady(false);
        }
      })
      .catch((err) => {
        console.error('Error al comprobar configuración de Stripe:', err);
        setIsConfigured(false);
        if (onStripeReady) onStripeReady(false);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="stripe-loading-box">
        <span className="spinner-sm" /> Cargando pasarela de pago segura...
      </div>
    );
  }

  if (!isConfigured || !stripePromise) {
    return (
      <div className="stripe-unconfigured-box">
        <div className="stripe-unconfigured-header">
          <span className="stripe-badge-warning">Stripe en Espera de Claves</span>
        </div>
        <p className="stripe-unconfigured-desc">
          Para aceptar cobros reales con tarjeta, añade tus claves de Stripe en el archivo <code>.env</code>:
        </p>
        <pre className="stripe-unconfigured-code">
          STRIPE_PUBLISHABLE_KEY=pk_test_...&#10;STRIPE_SECRET_KEY=sk_test_...
        </pre>
        <div className="card-security-note-centered" style={{ marginTop: '10px' }}>
          <span>Las pasarelas Stripe Elements y Stripe Checkout están 100% integradas.</span>
        </div>
      </div>
    );
  }

  return <Elements stripe={stripePromise}>{children}</Elements>;
}
