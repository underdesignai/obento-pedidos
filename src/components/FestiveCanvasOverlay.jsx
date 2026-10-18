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
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      const spiderPositions = width < 768 ? [width * 0.10] : [width * 0.11, width * 0.89];
      let spIdx = 0;
      particles.forEach((p) => {
        if (p.type === 'hanging_spider') {
          if (spIdx < spiderPositions.length) {
            p.anchorX = spiderPositions[spIdx++];
          }
        }
      });
    };
    window.addEventListener('resize', handleResize);

    // Ajuste de densidad según intensidad (reducido a la mitad para mayor limpieza visual)
    const multiplier =
      themeConfig.intensity === 'subtle' ? 0.3 : themeConfig.intensity === 'festive' ? 0.8 : 0.5;

    // ─── GENERACIÓN DE PARTÍCULAS SEGÚN TEMA ─────────────────────────────
    const particles = [];
    const count = Math.floor((width < 768 ? 8 : 14) * multiplier);

    if (themeConfig.theme === 'halloween') {
      // 1. Llamas Hitodama espectrales (fuego fatuo japonés) - Reducidas
      for (let i = 0; i < count; i++) {
        particles.push({
          type: 'hitodama',
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 2.5 + 1.2,
          color: Math.random() > 0.4 ? 'rgba(255, 120, 30,' : 'rgba(80, 210, 255,',
          alpha: Math.random() * 0.4 + 0.2,
          speedX: (Math.random() - 0.5) * 0.6,
          speedY: -Math.random() * 0.35 - 0.08,
          oscillation: Math.random() * Math.PI * 2,
          oscSpeed: 0.02 + Math.random() * 0.03,
        });
      }

      // 2. Murciélagos de gran vuelo (solo 2-3 en pantalla)
      const batCount = width < 768 ? 2 : 3;
      for (let i = 0; i < batCount; i++) {
        const flyRight = Math.random() > 0.5;
        const speed = (Math.random() * 1.5 + 1.0) * (flyRight ? 1 : -1);
        particles.push({
          type: 'flying_bat',
          x: flyRight ? -50 - Math.random() * 200 : width + 50 + Math.random() * 200,
          y: Math.random() * (height * 0.6) + 30,
          speedX: speed,
          speedY: (Math.random() - 0.5) * 0.4,
          scale: Math.random() * 0.5 + 0.65,
          wingPhase: Math.random() * Math.PI * 2,
          wingSpeed: 0.2 + Math.random() * 0.08,
          alpha: Math.random() * 0.25 + 0.6,
        });
      }

      // 3. Arañas colgantes (desplazadas hacia los laterales para no interferir con logo ni texto central)
      const spiderCount = width < 768 ? 1 : 2;
      const spiderPositions = width < 768
        ? [width * 0.10]
        : [width * 0.11, width * 0.89];

      for (let i = 0; i < spiderCount; i++) {
        particles.push({
          type: 'hanging_spider',
          anchorX: spiderPositions[i],
          currentLength: Math.random() * 80 + 40,
          targetLength: Math.random() * (height * 0.38) + 80,
          minLength: 35,
          maxLength: Math.random() * (height * 0.48) + 100,
          descending: true,
          speed: Math.random() * 0.35 + 0.15,
          swingAngle: 0,
          swingSpeed: 0.015 + Math.random() * 0.01,
          size: (Math.random() * 1.5 + 4.5) * 3, // +300% de tamaño
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

    // Helper: Dibujar telaraña idéntica al diseño con radios, curvas colgantes y nudos
    const drawCornerWeb = (originX, originY, radX, radY) => {
      ctx.save();
      const spokes = 8;
      const rings = 6;
      const webRadius = width < 768 ? Math.min(width * 0.36, 160) : Math.min(width * 0.24, 230);

      // 1. Líneas radiales principales (radios)
      ctx.strokeStyle = 'rgba(245, 245, 255, 0.7)';
      ctx.lineWidth = 1.4;
      for (let i = 0; i <= spokes; i++) {
        const angle = (Math.PI / 2 / spokes) * i;
        const targetX = originX + Math.cos(angle) * webRadius * radX;
        const targetY = originY + Math.sin(angle) * webRadius * radY;
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();
      }

      // 2. Anillos transversales curvados hacia el centro (hilos colgantes) con nudos
      ctx.strokeStyle = 'rgba(240, 240, 255, 0.58)';
      ctx.lineWidth = 1.15;

      for (let r = 1; r <= rings; r++) {
        const progress = Math.pow(r / rings, 0.88);
        const currentDist = webRadius * progress;

        for (let i = 0; i < spokes; i++) {
          const a1 = (Math.PI / 2 / spokes) * i;
          const a2 = (Math.PI / 2 / spokes) * (i + 1);
          const p1x = originX + Math.cos(a1) * currentDist * radX;
          const p1y = originY + Math.sin(a1) * currentDist * radY;
          const p2x = originX + Math.cos(a2) * currentDist * radX;
          const p2y = originY + Math.sin(a2) * currentDist * radY;

          const midAngle = (a1 + a2) / 2;
          const sagDist = currentDist * 0.82;
          const cx = originX + Math.cos(midAngle) * sagDist * radX;
          const cy = originY + Math.sin(midAngle) * sagDist * radY;

          ctx.beginPath();
          ctx.moveTo(p1x, p1y);
          ctx.quadraticCurveTo(cx, cy, p2x, p2y);
          ctx.stroke();

          // Nudos en las intersecciones como en la foto
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.beginPath();
          ctx.arc(p1x, p1y, 1.8, 0, Math.PI * 2);
          ctx.fill();
          if (i === spokes - 1) {
            ctx.beginPath();
            ctx.arc(p2x, p2y, 1.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      ctx.restore();
    };

    // Helper: Dibujar silueta detallada de murciélago
    const drawBat = (x, y, scale, wingPhase, flyRight, alpha) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(flyRight ? scale : -scale, scale);
      ctx.fillStyle = `rgba(18, 14, 22, ${alpha})`;
      ctx.beginPath();

      // Cabeza y orejas
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.moveTo(-2, -2);
      ctx.lineTo(-4, -6);
      ctx.lineTo(0, -3);
      ctx.lineTo(4, -6);
      ctx.lineTo(2, -2);

      // Alas con aleteo fluido
      const flap = Math.sin(wingPhase) * 7;
      ctx.moveTo(0, 1);
      // Ala derecha
      ctx.quadraticCurveTo(8, -8 + flap, 18, -4 + flap * 1.3);
      ctx.quadraticCurveTo(13, 2 + flap * 0.5, 9, 3);
      ctx.quadraticCurveTo(5, 5, 0, 4);
      // Ala izquierda
      ctx.quadraticCurveTo(-5, 5, -9, 3);
      ctx.quadraticCurveTo(-13, 2 + flap * 0.5, -18, -4 + flap * 1.3);
      ctx.quadraticCurveTo(-8, -8 + flap, 0, 1);

      ctx.closePath();
      ctx.fill();

      // Pequeños ojos rojos/amarillos sutiles
      ctx.fillStyle = 'rgba(255, 75, 40, 0.85)';
      ctx.fillRect(-1.5, -1, 1, 1);
      ctx.fillRect(0.5, -1, 1, 1);

      ctx.restore();
    };

    // Helper: Dibujar araña colgante blanca
    const drawSpider = (anchorX, currentLength, swingAngle, size) => {
      const spiderX = anchorX + Math.sin(swingAngle) * 15;
      const spiderY = currentLength;

      ctx.save();
      // Hilo de seda blanco/plata brillante
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(anchorX, 0);
      ctx.lineTo(spiderX, spiderY);
      ctx.stroke();

      // Cuerpo de araña blanca / espectral (+300% de tamaño)
      ctx.translate(spiderX, spiderY);
      // Abdomen blanco aperlado con sombra suave
      ctx.fillStyle = 'rgba(245, 245, 250, 0.96)';
      ctx.beginPath();
      ctx.arc(0, size * 0.4, size * 0.6, 0, Math.PI * 2);
      ctx.fill();
      // Cefalotórax blanco
      ctx.beginPath();
      ctx.arc(0, -size * 0.2, size * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // 8 Patas arqueadas blancas bien visibles
      ctx.strokeStyle = 'rgba(240, 240, 248, 0.95)';
      ctx.lineWidth = 2.4;
      const legOffsets = [-0.4, -0.1, 0.2, 0.5];
      legOffsets.forEach((off, idx) => {
        // Pata izquierda
        ctx.beginPath();
        ctx.moveTo(-size * 0.2, off * size);
        ctx.quadraticCurveTo(-size * 1.4, off * size - size * 0.6, -size * 1.8, off * size + (idx % 2 === 0 ? size : -size * 0.3));
        ctx.stroke();
        // Pata derecha
        ctx.beginPath();
        ctx.moveTo(size * 0.2, off * size);
        ctx.quadraticCurveTo(size * 1.4, off * size - size * 0.6, size * 1.8, off * size + (idx % 2 === 0 ? size : -size * 0.3));
        ctx.stroke();
      });

      // Marca en la espalda: detalle naranja / rojo calabaza
      ctx.fillStyle = 'rgba(255, 117, 24, 0.95)';
      ctx.beginPath();
      ctx.arc(0, size * 0.38, size * 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Ojos diminutos rojos intimidantes
      ctx.fillStyle = 'rgba(255, 30, 30, 0.95)';
      ctx.fillRect(-3, -size * 0.28, 2.5, 2.5);
      ctx.fillRect(1, -size * 0.28, 2.5, 2.5);

      ctx.restore();
    };

    // ─── BUCLE DE RENDERIZADO ───────────────────────────────────────────
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Telarañas estacionales SOLO en esquina superior izquierda e inferior derecha (Halloween)
      if (themeConfig.theme === 'halloween') {
        drawCornerWeb(0, 0, 1, 1); // Esquina superior izquierda
        drawCornerWeb(width, height, -1, -1); // Esquina inferior derecha
      }

      // Dibujar partículas normales de fondo
      for (let p of particles) {
        if (p.type === 'hitodama') {
          p.oscillation += p.oscSpeed;
          p.x += p.speedX + Math.sin(p.oscillation) * 0.5;
          p.y += p.speedY;
          if (p.y < -20) p.y = height + 20;
          if (p.x < -20) p.x = width + 20;
          if (p.x > width + 20) p.x = -20;

          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
          grad.addColorStop(0, `${p.color} ${p.alpha})`);
          grad.addColorStop(0.5, `${p.color} ${p.alpha * 0.3})`);
          grad.addColorStop(1, `${p.color} 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'flying_bat') {
          // Vuelo dinámico de un lado a otro
          p.x += p.speedX;
          p.y += p.speedY + Math.sin(p.wingPhase * 0.4) * 0.7;
          p.wingPhase += p.wingSpeed;

          const flyRight = p.speedX > 0;
          if (flyRight && p.x > width + 80) {
            p.x = -60;
            p.y = Math.random() * (height * 0.7) + 20;
          } else if (!flyRight && p.x < -80) {
            p.x = width + 60;
            p.y = Math.random() * (height * 0.7) + 20;
          }

          drawBat(p.x, p.y, p.scale, p.wingPhase, flyRight, p.alpha);
        } else if (p.type === 'hanging_spider') {
          // Subir y bajar suavemente
          if (p.descending) {
            p.currentLength += p.speed;
            if (p.currentLength >= p.maxLength) {
              p.descending = false;
              p.maxLength = Math.random() * (height * 0.5) + 80;
            }
          } else {
            p.currentLength -= p.speed;
            if (p.currentLength <= p.minLength) {
              p.descending = true;
              p.minLength = Math.random() * 40 + 20;
            }
          }
          p.swingAngle += p.swingSpeed;
          drawSpider(p.anchorX, p.currentLength, p.swingAngle, p.size);
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
        zIndex: 9999,
      }}
    />
  );
}
