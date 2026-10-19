import React from 'react';

const TICKER_ITEMS = [
  { kanji: '伝統', text: 'Auténtico sushi japonés, preparado a mano al momento.' },
  { kanji: '鮮魚', text: 'Atún rojo Ricardo Fuentes y salmón noruego selecto.' },
  { kanji: '菓子', text: 'Mochis artesanos y postres tradicionales japoneses.' },
  { kanji: '配達', text: 'Recogida en tienda y reparto a domicilio (radio 5 km).' },
  { kanji: '新鮮', text: 'Ingredientes frescos de máxima calidad en cada pieza.' },
  { kanji: '歓迎', text: 'Miércoles a Domingo · Pedidos al 613 92 75 96.' },
];

export default function MarqueeTicker() {
  return (
    <div id="marquee" className="marquee-wrapper">
      <div className="marquee-track">
        <div className="marquee-group">
          {TICKER_ITEMS.map((item, i) => (
            <React.Fragment key={i}>
              <span className="marquee-item">
                <span className="marquee-kanji">{item.kanji}</span>
                <span className="marquee-text">{item.text}</span>
              </span>
              <span className="marquee-bullet">✦</span>
            </React.Fragment>
          ))}
        </div>
        {/* Duplicate group for continuous seamless infinite loop */}
        <div className="marquee-group" aria-hidden="true">
          {TICKER_ITEMS.map((item, i) => (
            <React.Fragment key={`dup-${i}`}>
              <span className="marquee-item">
                <span className="marquee-kanji">{item.kanji}</span>
                <span className="marquee-text">{item.text}</span>
              </span>
              <span className="marquee-bullet">✦</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
