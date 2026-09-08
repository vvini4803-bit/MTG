import React, { useEffect, useRef } from 'react';

interface VoiceOrbProps {
  isListening: boolean;
  isSpeaking: boolean;
  size?: number;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({ isListening, isSpeaking, size = 180 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const particles: Array<{
      angle: number;
      speed: number;
      radius: number;
      size: number;
      color: string;
    }> = [];

    const colors = ['#10B981', '#34D399', '#F59E0B', '#FBBF24', '#047857'];
    for (let i = 0; i < 36; i++) {
      particles.push({
        angle: (Math.PI * 2 * i) / 36,
        speed: (Math.random() * 0.02 + 0.01) * (Math.random() > 0.5 ? 1 : -1),
        radius: 35 + Math.random() * 30,
        size: Math.random() * 3 + 1.5,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    const render = () => {
      time += 0.03;
      ctx.clearRect(0, 0, size, size);

      const center = size / 2;
      const baseRadius = size * 0.22;

      // Glow Intensity
      let pulse = 0;
      if (!prefersReducedMotion) {
        if (isListening) {
          pulse = Math.sin(time * 5) * 12;
        } else if (isSpeaking) {
          pulse = Math.sin(time * 3) * 8;
        } else {
          pulse = Math.sin(time * 1.5) * 4;
        }
      }

      // Outer Aura Gradient
      const aura = ctx.createRadialGradient(
        center,
        center,
        baseRadius * 0.5,
        center,
        center,
        baseRadius * 1.8 + pulse
      );
      if (isListening) {
        aura.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
        aura.addColorStop(0.5, 'rgba(245, 158, 11, 0.2)');
        aura.addColorStop(1, 'rgba(239, 68, 68, 0)');
      } else if (isSpeaking) {
        aura.addColorStop(0, 'rgba(16, 185, 129, 0.5)');
        aura.addColorStop(0.5, 'rgba(52, 211, 153, 0.2)');
        aura.addColorStop(1, 'rgba(16, 185, 129, 0)');
      } else {
        aura.addColorStop(0, 'rgba(15, 81, 50, 0.4)');
        aura.addColorStop(0.5, 'rgba(245, 158, 11, 0.15)');
        aura.addColorStop(1, 'rgba(15, 81, 50, 0)');
      }

      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(center, center, baseRadius * 1.8 + pulse, 0, Math.PI * 2);
      ctx.fill();

      // Core 3D Sphere Sphere Gradient
      const coreGrad = ctx.createRadialGradient(
        center - baseRadius * 0.3,
        center - baseRadius * 0.3,
        baseRadius * 0.1,
        center,
        center,
        baseRadius + pulse * 0.5
      );

      if (isListening) {
        coreGrad.addColorStop(0, '#FCA5A5');
        coreGrad.addColorStop(0.4, '#EF4444');
        coreGrad.addColorStop(1, '#991B1B');
      } else if (isSpeaking) {
        coreGrad.addColorStop(0, '#A7F3D0');
        coreGrad.addColorStop(0.4, '#10B981');
        coreGrad.addColorStop(1, '#064E3B');
      } else {
        coreGrad.addColorStop(0, '#FEF08A');
        coreGrad.addColorStop(0.4, '#15803D');
        coreGrad.addColorStop(1, '#0F5132');
      }

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(center, center, baseRadius + pulse * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Orbiting dynamic particles
      particles.forEach((p) => {
        if (!prefersReducedMotion) {
          p.angle += p.speed * (isListening ? 2.5 : isSpeaking ? 1.8 : 1);
        }
        const currentR = p.radius + (isListening ? pulse * 0.8 : 0);
        const x = center + Math.cos(p.angle) * currentR;
        const y = center + Math.sin(p.angle) * currentR;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Waveform rings
      ctx.strokeStyle = isListening ? 'rgba(239, 68, 68, 0.5)' : isSpeaking ? 'rgba(52, 211, 153, 0.6)' : 'rgba(245, 158, 11, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(center, center, baseRadius * 1.35 + pulse * 0.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isListening, isSpeaking, size]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%' }}
        aria-label="Village Voice Assistant Animated Orb"
      />
    </div>
  );
};
