import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  themeConfig: {
    theme: 'normal',
    intensity: 'subtle',
    active: false,
    cartCelebration: true,
    floatingBadges: true,
    seasonalSpecials: false,
  },
  triggerCartCelebration: () => {},
});

export function ThemeProvider({ children }) {
  const [themeConfig, setThemeConfig] = useState({
    theme: 'normal',
    intensity: 'subtle',
    active: false,
    cartCelebration: true,
    floatingBadges: true,
    seasonalSpecials: false,
  });

  const fetchTheme = async () => {
    try {
      const res = await fetch('/api/config/theme');
      if (res.ok) {
        const data = await res.json();
        setThemeConfig(data);
      }
    } catch {
      // Fallback silencioso a normal
    }
  };

  useEffect(() => {
    fetchTheme();
    // Poll cada 30s para sincronización instantánea si el admin cambia de tema
    const interval = setInterval(fetchTheme, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (themeConfig.active && themeConfig.theme && themeConfig.theme !== 'normal') {
      document.body.classList.add(`theme-${themeConfig.theme}`);
      document.documentElement.setAttribute('data-theme', themeConfig.theme);
    } else {
      document.body.classList.remove('theme-halloween', 'theme-navidad', 'theme-primavera', 'theme-verano');
      document.documentElement.removeAttribute('data-theme');
    }
    return () => {
      document.body.classList.remove('theme-halloween', 'theme-navidad', 'theme-primavera', 'theme-verano');
      document.documentElement.removeAttribute('data-theme');
    };
  }, [themeConfig]);

  const triggerCartCelebration = (x, y) => {
    if (!themeConfig.active || !themeConfig.cartCelebration || themeConfig.theme === 'normal') {
      return;
    }
    window.dispatchEvent(
      new CustomEvent('obento_cart_celebration', {
        detail: { x: x || window.innerWidth / 2, y: y || window.innerHeight / 2, theme: themeConfig.theme },
      })
    );
  };

  return (
    <ThemeContext.Provider value={{ themeConfig, triggerCartCelebration }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
