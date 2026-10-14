import React, { useState } from 'react';
import { ALLERGENS } from '../data/menuData';
import { useCart } from '../context/CartContext';

function fmt(n) {
  return Number(n).toFixed(2).replace('.', ',') + '€';
}

export default function DishCardOrder({ dish, onOpenAllergens }) {
  const { cart, addToCart } = useCart();

  const tienePorciones = Array.isArray(dish.porciones) && dish.porciones.length > 0;
  const tieneOpciones = !tienePorciones && Array.isArray(dish.opciones) && dish.opciones.length > 0;

  const [selectedPortion, setSelectedPortion] = useState(
    tienePorciones ? dish.porciones[0] : null
  );
  const [selectedOption, setSelectedOption] = useState(
    tieneOpciones ? dish.opciones[0] : null
  );
  const [cantidad, setCantidad] = useState(1);
  const [addedEffect, setAddedEffect] = useState(false);

  // Comprobar si el plato ya está en la cesta
  const cartItemsOfDish = (cart || []).filter((item) => String(item.id) === String(dish.id));
  const inCartQty = cartItemsOfDish.reduce((sum, item) => sum + (item.cantidad || 0), 0);
  const isInCart = inCartQty > 0;

  const currentPrice = tienePorciones ? selectedPortion.precio : dish.precio;

  const handleAdd = () => {
    addToCart(dish, selectedPortion, selectedOption, cantidad);
    setAddedEffect(true);
    setCantidad(1);
    setTimeout(() => setAddedEffect(false), 900);
  };

  return (
    <div className={`dish-order-card ${isInCart ? 'is-in-cart' : ''} ${addedEffect ? 'just-added' : ''}`}>
      {/* Imagen */}
      {dish.imagen && (
        <div className="dish-order-media">
          <img src={dish.imagen} alt={dish.nombre} loading="lazy" />
          <div className="dish-order-price-tag">
            {fmt(currentPrice)}
          </div>
        </div>
      )}

      {/* Contenido */}
      <div className="dish-order-content">
        <div className="dish-order-header">
          <h3 className="dish-order-name">{dish.nombre}</h3>
        </div>

        {dish.descripcion && (
          <p className="dish-order-desc">{dish.descripcion}</p>
        )}

        {/* Selector de Porciones */}
        {tienePorciones && (
          <div className="dish-order-options-group">
            <span className="order-options-title">Porción:</span>
            <div className="order-options-pills">
              {dish.porciones.map((p) => (
                <button
                  key={p.cant}
                  type="button"
                  className={`order-option-pill ${selectedPortion?.cant === p.cant ? 'active' : ''}`}
                  onClick={() => setSelectedPortion(p)}
                >
                  {p.cant} uds · {fmt(p.precio)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selector de Opciones */}
        {tieneOpciones && (
          <div className="dish-order-options-group">
            <span className="order-options-title">Sabor / Variedad:</span>
            <div className="order-options-pills">
              {dish.opciones.map((o) => (
                <button
                  key={o.label}
                  type="button"
                  className={`order-option-pill ${selectedOption?.label === o.label ? 'active' : ''}`}
                  onClick={() => setSelectedOption(o)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Alérgenos */}
        <div className="dish-order-allergens">
          {(!dish.alergenos || dish.alergenos.length === 0) ? (
            <span className="allergen-none-sm">Sin alérgenos comunes</span>
          ) : (
            dish.alergenos.map((key) => {
              const a = ALLERGENS[key];
              if (!a) return null;
              return (
                <span
                  key={key}
                  className="allergen-badge-sm"
                  title={a.label}
                  dangerouslySetInnerHTML={{
                    __html: a.icono && a.icono.trim() ? a.icono : a.short
                  }}
                />
              );
            })
          )}
        </div>

        {/* Controles de Compra */}
        <div className="dish-order-actions">
          <div className="order-qty-selector">
            <button
              type="button"
              className="qty-btn-sm"
              onClick={() => setCantidad(Math.max(1, cantidad - 1))}
              aria-label="Disminuir"
            >
              -
            </button>
            <span className="qty-number-sm">{cantidad}</span>
            <button
              type="button"
              className="qty-btn-sm"
              onClick={() => setCantidad(cantidad + 1)}
              aria-label="Aumentar"
            >
              +
            </button>
          </div>

          <button
            type="button"
            className={`btn-add-to-order ${isInCart ? 'btn-in-cart' : ''} ${addedEffect ? 'just-added-btn' : ''}`}
            onClick={handleAdd}
            title={isInCart ? `Ya en el pedido (${inCartQty}). Haz clic para añadir más.` : `Añadir al pedido`}
          >
            {isInCart ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="btn-ico-svg">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>✓ ¡Añadido!{inCartQty > 1 ? ` (${inCartQty})` : ''}</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-ico-svg">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Añadir {fmt(currentPrice * cantidad)}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
