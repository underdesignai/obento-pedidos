import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function FestiveBanner() {
  const { themeConfig } = useTheme();

  if (!themeConfig.active || themeConfig.theme === 'normal') {
    return null;
  }

  const THEMES_BANNER = {
    halloween: {
      tag: '🎃 ESPECIAL HALLOWEEN / YŌKAI',
      title: 'Noche Mística en Obento',
      desc: 'Disfruta de nuestros sabores de temporada en un ambiente otoñal único. ¡Pide online tus favoritos!',
      bg: 'linear-gradient(90deg, rgba(255, 117, 24, 0.15) 0%, rgba(138, 43, 226, 0.15) 50%, rgba(200, 30, 34, 0.1) 100%)',
      border: 'rgba(255, 117, 24, 0.35)',
      badgeBg: '#ff7518',
      badgeColor: '#080808',
      accentColor: '#ff9d42',
      icon: '👻',
    },
    navidad: {
      tag: '❄️ NAVIDAD EN OBENTO',
      title: 'Sabores Festivos de Invierno',
      desc: 'Celebra estas fiestas con la mejor cocina japonesa y mexicana recién hecha.',
      bg: 'linear-gradient(90deg, rgba(56, 239, 125, 0.12) 0%, rgba(200, 30, 34, 0.18) 100%)',
      border: 'rgba(56, 239, 125, 0.35)',
      badgeBg: '#38ef7d',
      badgeColor: '#080808',
      accentColor: '#6effa2',
      icon: '🎄',
    },
    ano_nuevo: {
      tag: '🎆 OSHŌGATSU · AÑO NUEVO',
      title: 'Prosperidad y Nuevos Sabores',
      desc: 'Celebramos el nuevo ciclo con exclusivas elaboraciones y detalles dorados.',
      bg: 'linear-gradient(90deg, rgba(255, 215, 0, 0.15) 0%, rgba(200, 30, 34, 0.15) 100%)',
      border: 'rgba(255, 215, 0, 0.4)',
      badgeBg: '#ffd700',
      badgeColor: '#080808',
      accentColor: '#ffe552',
      icon: '✨',
    },
    reyes: {
      tag: '👑 NOCHE DE REYES',
      title: 'La Magia de Oriente',
      desc: 'Comparte un banquete de reyes en casa con recogida rápida en local.',
      bg: 'linear-gradient(90deg, rgba(157, 78, 221, 0.15) 0%, rgba(30, 144, 255, 0.12) 100%)',
      border: 'rgba(157, 78, 221, 0.4)',
      badgeBg: '#9d4edd',
      badgeColor: '#ffffff',
      accentColor: '#c77dff',
      icon: '⭐',
    },
  };

  const current = THEMES_BANNER[themeConfig.theme] || THEMES_BANNER.halloween;

  return (
    <div
      style={{
        width: '100%',
        background: current.bg,
        borderBottom: `1px solid ${current.border}`,
        position: 'relative',
        zIndex: 50,
        boxShadow: `0 4px 20px rgba(0,0,0,0.35)`,
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '24px', lineHeight: 1 }}>{current.icon}</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  background: current.badgeBg,
                  color: current.badgeColor,
                  fontSize: '10px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  textTransform: 'uppercase',
                }}
              >
                {current.tag}
              </span>
              <strong style={{ color: '#fff', fontSize: '13px', letterSpacing: '0.02em' }}>
                {current.title}
              </strong>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
              {current.desc}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              fontSize: '11px',
              color: current.accentColor,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: current.accentColor,
                boxShadow: `0 0 8px ${current.accentColor}`,
                display: 'inline-block',
              }}
            />
            Ambiente Festivo Activo
          </span>
        </div>
      </div>
    </div>
  );
}
