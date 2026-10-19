import React from 'react';
import { useTheme } from '../context/ThemeContext';

export const THEMES_BANNER = {
  halloween: {
    tag: '🎃 ESPECIAL HALLOWEEN / YŌKAI',
    title: 'Noche Mística en Obento',
    desc: 'Sabores de temporada en un ambiente otoñal único. ¡Pide online tus favoritos!',
    badgeBg: '#ff7518',
    badgeColor: '#080808',
    accentColor: '#ff9d42',
    icon: '👻',
  },
  navidad: {
    tag: '❄️ NAVIDAD EN OBENTO',
    title: 'Sabores Festivos de Invierno',
    desc: 'Celebra estas fiestas con la mejor cocina artesanal recién hecha.',
    badgeBg: '#38ef7d',
    badgeColor: '#080808',
    accentColor: '#6effa2',
    icon: '🎄',
  },
  ano_nuevo: {
    tag: '🎆 OSHŌGATSU · AÑO NUEVO',
    title: 'Prosperidad y Nuevos Sabores',
    desc: 'Celebramos el nuevo ciclo con exclusivas elaboraciones y detalles dorados.',
    badgeBg: '#ffd700',
    badgeColor: '#080808',
    accentColor: '#ffe552',
    icon: '✨',
  },
  reyes: {
    tag: '👑 NOCHE DE REYES',
    title: 'La Magia de Oriente',
    desc: 'Comparte un banquete de reyes en casa con recogida rápida en local.',
    badgeBg: '#9d4edd',
    badgeColor: '#ffffff',
    accentColor: '#c77dff',
    icon: '⭐',
  },
};

export default function FestiveBanner() {
  const { themeConfig } = useTheme();

  if (!themeConfig.active || themeConfig.theme === 'normal') {
    return null;
  }

  const current = THEMES_BANNER[themeConfig.theme] || THEMES_BANNER.halloween;

  return (
    <div className={`nav-festive-slot theme-${themeConfig.theme}`}>
      <span className="nav-festive-icon">{current.icon}</span>
      <div className="nav-festive-info">
        <div className="nav-festive-badge-row">
          <span
            className="nav-festive-badge"
            style={{
              background: current.badgeBg,
              color: current.badgeColor,
            }}
          >
            {current.tag}
          </span>
          <strong className="nav-festive-title">{current.title}</strong>
        </div>
        <span className="nav-festive-desc">{current.desc}</span>
      </div>
    </div>
  );
}
