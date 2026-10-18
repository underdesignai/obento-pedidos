import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function FestiveCanvasOverlay() {
  const { themeConfig } = useTheme();
  const canvasRef = useRef(null);

  useEffect(() => {
    // Si no está activo o es normal, o el usuario prefiere movimiento reducido, no ejecutar
    if (!themeConfig.active || themeConfig.theme === 'normal') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Ajuste de densidad según intensidad
    const multiplier =
      themeConfig.intensity === 'subtle' ? 0.6 : themeConfig.intensity === 'festive' ? 1.6 : 1.0;

    // ─── GENERACIÓN DE PARTÍCULAS SEGÚN TEMA ─────────────────────────────
    const particles = [];
    const count = Math.floor((width < 768 ? 18 : 36) * multiplier);

    if (themeConfig.theme === 'halloween') {
      // 1. Hitodama (fuegos fatuos espectrales azulados y naranjas) & Murciélagos origami
      for (let i = 0; i < count; i++) {
        const isBat = Math.random() > 0.75;
        particles.push({
          type: isBat ? 'bat' : 'hitodama',
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 2.8 + 1.5,
          color: Math.random() > 0.4 ? 'rgba(255, 120, 30,' : 'rgba(80, 210, 255,',
          alpha: Math.random() * 0.5 + 0.2,
          speedX: (Math.random() - 0.5) * 0.8,
          speedY: isBat ? Math.random() * 0.5 - 0.8 : -Math.random() * 0.4 - 0.1,
          oscillation: Math.random() * Math.PI * 2,
          oscSpeed: 0.02 + Math.random() * 0.03,
          wings: 0,
        });
      }
    } else if (themeConfig.theme === 'navidad') {
      // 2. Copos de nieve sutiles y cálidos
      for (let i = 0; i < count * 1.5; i++) {
        particles.push({
          type: 'snow',
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 2.5 + 1,
          speedY: Math.random() * 0.8 + 0.4,
          speedX: Math.random() * 0.4 - 0.2,
          alpha: Math.random() * 0.6 + 0.3,
          swing: Math.random() * Math.PI * 2,
        });
      }
    } else if (themeConfig.theme === 'ano_nuevo') {
      // 3. Destellos Kira-kira de oro líquido
      for (let i = 0; i < count * 1.2; i++) {
        particles.push({
          type: 'kirakira',
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 2 + 1,
          speedY: -Math.random() * 0.3 - 0.1,
          alpha: Math.random() * 0.7 + 0.2,
          pulse: Math.random() * Math.PI * 2,
        });
      }
    } else if (themeConfig.theme === 'reyes') {
      // 4. Polvo de estrellas y cometas
      for (let i = 0; i < count; i++) {
        particles.push({
          type: 'star',
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 2 + 0.8,
          color: Math.random() > 0.5 ? '#ffd700' : '#c084fc',
          speedX: 0.5 + Math.random() * 0.8,
          speedY: 0.2 + Math.random() * 0.4,
          alpha: Math.random() * 0.5 + 0.3,
        });
      }
    }

    // ─── EXPLOSIÓN DE CONFETI EN AÑADIR AL CARRITO ──────────────────────
    let celebrationBursts = [];
    const handleCelebration = (e) => {
      const { x, y, theme } = e.detail;
      const burstCount = 24;
      for (let i = 0; i < burstCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 4 + 2;
        celebrationBursts.push({
          x,
          y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity - 2,
          theme,
          alpha: 1,
          decay: 0.02 + Math.random() * 0.02,
          size: Math.random() * 5 + 3,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.2,
        });
      }
    };
    window.addEventListener('obento_cart_celebration', handleCelebration);

    // ─── BUCLE DE RENDERIZADO ───────────────────────────────────────────
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Dibujar partículas normales de fondo
      for (let p of particles) {
        if (p.type === 'hitodama') {
          p.oscillation += p.oscSpeed;
          p.x += p.speedX + Math.sin(p.oscillation) * 0.5;
          p.y += p.speedY;
          if (p.y < -20) p.y = height + 20;
          if (p.x < -20) p.x = width + 20;
          if (p.x > width + 20) p.x = -20;

          // Halo místico (Glow)
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
          grad.addColorStop(0, `${p.color} ${p.alpha})`);
          grad.addColorStop(0.5, `${p.color} ${p.alpha * 0.3})`);
          grad.addColorStop(1, `${p.color} 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'bat') {
          p.x += p.speedX;
          p.y += p.speedY;
          p.wings += 0.15;
          if (p.y < -30) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.fillStyle = `rgba(20, 15, 25, ${p.alpha * 0.8})`;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-6, -4 * Math.sin(p.wings));
          ctx.lineTo(-2, 2);
          ctx.lineTo(0, 1);
          ctx.lineTo(2, 2);
          ctx.lineTo(6, -4 * Math.sin(p.wings));
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        } else if (p.type === 'snow') {
          p.swing += 0.02;
          p.x += p.speedX + Math.sin(p.swing) * 0.3;
          p.y += p.speedY;
          if (p.y > height + 10) {
            p.y = -10;
            p.x = Math.random() * width;
          }
          ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'kirakira') {
          p.pulse += 0.04;
          p.y += p.speedY;
          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
          const currentAlpha = Math.abs(Math.sin(p.pulse)) * p.alpha;
          ctx.fillStyle = `rgba(255, 215, 0, ${currentAlpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'star') {
          p.x += p.speedX;
          p.y += p.speedY;
          if (p.x > width + 20 || p.y > height + 20) {
            p.x = Math.random() * width * 0.5;
            p.y = -10;
          }
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      // Dibujar ráfagas de celebración
      celebrationBursts = celebrationBursts.filter((b) => b.alpha > 0.01);
      for (let b of celebrationBursts) {
        b.x += b.vx;
        b.y += b.vy;
        b.vy += 0.12;
        b.rotation += b.vRot;
        b.alpha -= b.decay;

        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rotation);
        ctx.globalAlpha = Math.max(0, b.alpha);

        if (b.theme === 'halloween') {
          ctx.fillStyle = '#ff7518';
          ctx.fillRect(-b.size / 2, -b.size / 2, b.size, b.size);
        } else {
          ctx.fillStyle = '#ffd700';
          ctx.fillRect(-b.size / 2, -b.size / 2, b.size, b.size);
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('obento_cart_celebration', handleCelebration);
      cancelAnimationFrame(animationFrameId);
    };
  }, [themeConfig]);

  if (!themeConfig.active || themeConfig.theme === 'normal') {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 40,
      }}
    />
  );
}
