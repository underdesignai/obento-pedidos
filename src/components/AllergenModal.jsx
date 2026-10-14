import React from 'react';
import { ALLERGENS } from '../data/menuData';

export default function AllergenModal({ isOpen, onClose }) {
  return (
    <div
      className={`modal-overlay ${isOpen ? 'show' : ''}`}
      id="allergen-modal"
      onClick={(e) => {
        if (e.target.id === 'allergen-modal') onClose();
      }}
    >
      <div className="modal-sheet">
        <h3>Alérgenos</h3>
        <div id="legend-list">
          {Object.entries(ALLERGENS).map(([key, a]) => (
            <div className="legend-item" key={key}>
              <div
                className="allergen-badge"
                dangerouslySetInnerHTML={{
                  __html: a.icono && a.icono.trim() ? a.icono : a.short
                }}
              />
              <span>{a.label}</span>
            </div>
          ))}
        </div>
        <div className="allergen-warning-box">
          <p>
            ⚠️ <strong>Aviso legal sobre contaminación cruzada (Reglamento UE 1169/2011):</strong> En nuestras instalaciones de cocina se elaboran diariamente platos con pescado crudo, marisco, soja, sésamo, huevo y gluten. A pesar de aplicar estrictos protocolos de manipulación, no podemos garantizar la ausencia total de trazas por contacto cruzado.
          </p>
          <p style={{ marginTop: '6px', fontSize: '12px', opacity: 0.85 }}>
            Si tienes alguna alergia o intolerancia severa, por favor indícalo en el campo de notas al hacer el pedido o llámanos directamente al <strong>+34 613 927 596</strong>.
          </p>
        </div>

        <button
          type="button"
          className="btn-primary btn-block modal-close"
          id="btn-close-modal"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
