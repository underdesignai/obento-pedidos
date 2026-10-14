import React, { useEffect, useState } from 'react';
import { LEGAL_DOCS } from './legalTexts';

export default function LegalModal({ isOpen, onClose, initialTab = 'aviso-legal' }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentDoc = LEGAL_DOCS[activeTab] || LEGAL_DOCS['aviso-legal'];

  const tabs = [
    { id: 'aviso-legal', label: 'Aviso Legal', icon: '⚖️' },
    { id: 'privacidad', label: 'Privacidad (RGPD)', icon: '🛡️' },
    { id: 'condiciones', label: 'Condiciones de Venta', icon: '📜' },
    { id: 'cookies', label: 'Política de Cookies', icon: '🍪' }
  ];

  return (
    <div className="legal-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="legal-title">
      <div className="legal-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Cabecera del Modal */}
        <div className="legal-modal-header">
          <div className="legal-header-info">
            <div className="legal-badge">
              <span>🏛️ Documentación Legal Oficial</span>
              <span>·</span>
              <span>España & Unión Europea</span>
            </div>
            <h2 id="legal-title" className="legal-main-title">{currentDoc.title}</h2>
            <p className="legal-subtitle">{currentDoc.subtitle}</p>
          </div>
          <button
            type="button"
            className="legal-close-btn"
            onClick={onClose}
            aria-label="Cerrar modal legal"
          >
            &times;
          </button>
        </div>

        {/* Barra de Pestañas */}
        <div className="legal-tabs-bar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`legal-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="legal-tab-icon">{tab.icon}</span>
              <span className="legal-tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Contenido del Documento */}
        <div className="legal-modal-body">
          <div className="legal-meta-bar">
            <span>📅 Última revisión: <strong>{currentDoc.lastUpdated}</strong></span>
            <span>📍 Establecimiento: <strong>Obento · C/ Amargura 3, La Ñora (Murcia)</strong></span>
          </div>

          <div className="legal-sections-flow">
            {currentDoc.sections.map((sec, idx) => (
              <section key={idx} className="legal-section-block">
                <h3 className="legal-section-heading">{sec.heading}</h3>
                <div className="legal-section-text">
                  {sec.content.split('\n\n').map((paragraph, pIdx) => {
                    // Si el párrafo contiene viñetas o formato de tabla o aviso
                    if (paragraph.startsWith('• ') || paragraph.includes('\n• ')) {
                      const items = paragraph.split('\n').filter(line => line.trim().startsWith('• '));
                      return (
                        <ul key={pIdx} className="legal-bullet-list">
                          {items.map((item, iIdx) => (
                            <li key={iIdx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(item.replace('• ', '')) }} />
                          ))}
                        </ul>
                      );
                    }
                    if (paragraph.startsWith('|')) {
                      // Render tabla markdown
                      return <div key={pIdx} className="legal-table-wrap" dangerouslySetInnerHTML={{ __html: renderMarkdownTable(paragraph) }} />;
                    }
                    return (
                      <p key={pIdx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(paragraph) }} />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>

        {/* Pie del Modal */}
        <div className="legal-modal-footer">
          <div className="legal-footer-note">
            <span>🛡️ Conforme a LSSI-CE, RGPD 2016/679, LOPDGDD 3/2018 y TRLGDCU RDL 1/2007.</span>
          </div>
          <div className="legal-footer-actions">
            <button
              type="button"
              className="btn-secondary-outline legal-print-btn"
              onClick={() => window.print()}
            >
              Imprimir / Guardar PDF
            </button>
            <button
              type="button"
              className="btn-primary legal-done-btn"
              onClick={onClose}
            >
              Entendido y Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helpers sencillos para formato seguro
function formatInlineMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\n/g, '<br />');
}

function renderMarkdownTable(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return '';
  const headers = lines[0].split('|').map(c => c.trim()).filter(Boolean);
  const rows = lines.slice(2).map(line => line.split('|').map(c => c.trim()).filter(Boolean));

  let html = '<table class="legal-data-table"><thead><tr>';
  headers.forEach(h => { html += `<th>${formatInlineMarkdown(h)}</th>`; });
  html += '</tr></thead><tbody>';
  rows.forEach(r => {
    html += '<tr>';
    r.forEach(cell => { html += `<td>${formatInlineMarkdown(cell)}</td>`; });
    html += '</tr>';
  });
  html += '</tbody></table>';
  return html;
}
