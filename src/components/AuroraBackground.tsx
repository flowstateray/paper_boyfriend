'use client';

import { useEffect, useRef } from 'react';

interface AuroraBand {
  points: { x: number; y: number; amp: number; phase: number; speed: number }[];
  colorStart: string;
  colorEnd: string;
  colorMid: string;
  opacity: number;
  blur: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
}

export default function AuroraBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bandsRef = useRef<AuroraBand[]>([]);
  const starsRef = useRef<Star[]>([]);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initBands();
      initStars();
    };

    const initBands = () => {
      bandsRef.current = [
        createBand(0, '#00ffcc', '#00f0ff', '#00d4ff', 0.75, 70),
        createBand(1, '#8b5cf6', '#00f0ff', '#00ffcc', 0.68, 75),
        createBand(0, '#00d4ff', '#8b5cf6', '#a855f7', 0.6, 65),
        createBand(1, '#f472b6', '#a855f7', '#00d4ff', 0.52, 60),
        createBand(0, '#fff0f5', '#f472b6', '#8b5cf6', 0.45, 55),
      ];
    };

    const createBand = (side: number, startColor: string, midColor: string, endColor: string, opacity: number, blur: number): AuroraBand => {
      const points = [];
      const count = 12;
      const startX = side === 0 ? 0 : canvas.width;
      const heightRange = canvas.height * 0.45;
      
      for (let i = 0; i < count; i++) {
        points.push({
          x: startX + (i / (count - 1)) * canvas.width * (side === 0 ? 1 : -1),
          y: canvas.height * (0.3 + (i / (count - 1)) * 0.4),
          amp: heightRange * 0.35 + Math.random() * heightRange * 0.15,
          phase: Math.random() * Math.PI * 2,
          speed: 0.0008 + Math.random() * 0.0012,
        });
      }
      
      return { points, colorStart: startColor, colorEnd: endColor, colorMid: midColor, opacity, blur };
    };

    const initStars = () => {
      starsRef.current = [];
      const colors = ['rgba(255, 255, 255, ', 'rgba(200, 230, 255, ', 'rgba(150, 200, 255, ', 'rgba(0, 240, 255, ', 'rgba(139, 92, 246, '];
      
      for (let i = 0; i < 250; i++) {
        starsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          brightness: Math.random() * 0.4 + 0.6,
          twinkleSpeed: Math.random() * 0.024 + 0.0064,
          twinklePhase: Math.random() * Math.PI * 2,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    const drawStars = (time: number) => {
      starsRef.current.forEach(star => {
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase) * 0.1 + 0.9;
        const opacity = star.brightness * twinkle;
        
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `${star.color}${opacity})`;
        ctx.fill();
        
        if (star.size > 1.2) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `${star.color}${opacity * 0.25})`;
          ctx.fill();
        }
      });
    };

    const drawGrid = () => {
      const gridColors = [
        'rgba(0, 240, 255, 0.08)',
        'rgba(139, 92, 246, 0.06)',
        'rgba(244, 114, 182, 0.04)',
        'rgba(255, 255, 255, 0.03)',
      ];
      
      for (let layer = 0; layer < 4; layer++) {
        const spacing = 25 * Math.pow(2, layer);
        const color = gridColors[layer];
        
        for (let x = 0; x < canvas.width; x += spacing) {
          for (let y = 0; y < canvas.height; y += spacing) {
            const offsetX = Math.sin(x * 0.012 + layer + time * 0.0001) * 2;
            const offsetY = Math.cos(y * 0.012 + layer + time * 0.0001) * 2;
            
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x + offsetX, y + offsetY, 1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    };

    const drawAurora = (band: AuroraBand, time: number) => {
      ctx.save();
      ctx.filter = `blur(${band.blur}px)`;

      const gradient = ctx.createLinearGradient(0, canvas.height, canvas.width, canvas.height * 0.05);
      gradient.addColorStop(0, band.colorStart);
      gradient.addColorStop(0.3, band.colorMid);
      gradient.addColorStop(0.7, band.colorEnd);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.globalAlpha = band.opacity;

      ctx.beginPath();
      ctx.moveTo(band.points[0].x, canvas.height);

      for (let i = 0; i < band.points.length - 1; i++) {
        const p1 = band.points[i];
        const p2 = band.points[i + 1];
        
        const waveOffset1 = Math.sin(time * p1.speed + p1.phase) * p1.amp;
        const waveOffset2 = Math.sin(time * p2.speed + p2.phase) * p2.amp;
        
        const x1 = p1.x + waveOffset1 * 0.4;
        const y1 = p1.y + waveOffset1;
        const x2 = p2.x + waveOffset2 * 0.4;
        const y2 = p2.y + waveOffset2;

        const cpX = (x1 + x2) / 2 + Math.sin(time * 0.0015 + i * 0.5) * 30;
        const cpY = (y1 + y2) / 2 + Math.cos(time * 0.0015 + i * 0.5) * 30;

        ctx.bezierCurveTo(x1, y1, cpX, cpY, x2, y2);
      }

      ctx.lineTo(band.points[band.points.length - 1].x, canvas.height);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      ctx.save();
      ctx.filter = `blur(${band.blur * 0.25}px)`;

      for (let i = 0; i < band.points.length - 1; i++) {
        const p1 = band.points[i];
        const p2 = band.points[i + 1];
        
        const waveOffset1 = Math.sin(time * p1.speed + p1.phase) * p1.amp;
        const waveOffset2 = Math.sin(time * p2.speed + p2.phase) * p2.amp;
        
        const x1 = p1.x + waveOffset1 * 0.4;
        const y1 = p1.y + waveOffset1;
        const x2 = p2.x + waveOffset2 * 0.4;
        const y2 = p2.y + waveOffset2;

        const edgeFactor = Math.abs(waveOffset1) / p1.amp;
        const edgeBrightness = 0.5 + edgeFactor * 0.5;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${edgeBrightness * band.opacity * 0.7})`;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `rgba(0, 240, 255, ${edgeBrightness * band.opacity * 0.5})`;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      ctx.restore();
    };

    let time = 0;
    const animate = () => {
      time += 35;

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawGrid();
      drawStars(time);

      bandsRef.current.forEach(band => {
        drawAurora(band, time);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener('resize', resize);
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
