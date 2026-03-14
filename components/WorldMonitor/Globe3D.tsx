import React, { useRef, useEffect, useCallback } from 'react';
import { LANDMASSES } from './landmasses';
import type { MarkerCategory } from '../../services/geopoliticalService';

export interface GlobeMarker {
  id: string;
  lat: number;
  lon: number;
  category: MarkerCategory;
  color: string;
  label: string;
  detail?: string;
  intensity?: number; // 0-1
  pulse?: boolean;
}

interface Props {
  markers: GlobeMarker[];
  onMarkerHover: (marker: GlobeMarker | null, x: number, y: number) => void;
  isDarkMode: boolean;
}

// ─── 3D projection ──────────────────────────────────────────
function latLonToXY(
  lat: number, lon: number, rotX: number, rotY: number,
  cx: number, cy: number, r: number
): { x: number; y: number; z: number } {
  const phi = (lat * Math.PI) / 180;
  const lam = (lon * Math.PI) / 180;
  let x0 = Math.cos(phi) * Math.sin(lam);
  let y0 = Math.sin(phi);
  let z0 = Math.cos(phi) * Math.cos(lam);
  const cy2 = Math.cos(rotY), sy2 = Math.sin(rotY);
  const x1 = x0 * cy2 + z0 * sy2;
  const z1 = -x0 * sy2 + z0 * cy2;
  const cx2 = Math.cos(rotX), sx2 = Math.sin(rotX);
  const y2 = y0 * cx2 - z1 * sx2;
  const z2 = y0 * sx2 + z1 * cx2;
  return { x: cx + x1 * r, y: cy - y2 * r, z: z2 };
}

// ─── Star field (generated once) ────────────────────────────
interface Star { x: number; y: number; r: number; a: number; }
let cachedStars: Star[] | null = null;
function makeStars(W: number, H: number): Star[] {
  if (cachedStars && cachedStars.length > 0) return cachedStars;
  const stars: Star[] = [];
  for (let i = 0; i < 350; i++) {
    stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.2 + 0.2, a: Math.random() * 0.7 + 0.3 });
  }
  cachedStars = stars;
  return stars;
}

// ─── Category shape drawer ───────────────────────────────────
function drawMarkerShape(ctx: CanvasRenderingContext2D, category: MarkerCategory, x: number, y: number, r: number, color: string, alpha: number) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1.2;

  switch (category) {
    case 'earthquake': {
      // Diamond
      ctx.beginPath();
      ctx.moveTo(x, y - r * 1.2);
      ctx.lineTo(x + r, y);
      ctx.lineTo(x, y + r * 1.2);
      ctx.lineTo(x - r, y);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      break;
    }
    case 'conflict': {
      // Circle with cross-hairs hint
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.moveTo(x - r * 1.1, y); ctx.lineTo(x + r * 1.1, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y - r * 1.1); ctx.lineTo(x, y + r * 1.1); ctx.stroke();
      break;
    }
    case 'military': {
      // Pentagon
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i * 2 * Math.PI / 5) - Math.PI / 2;
        i === 0 ? ctx.moveTo(x + r * Math.cos(a), y + r * Math.sin(a))
                : ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      break;
    }
    case 'nuclear': {
      // Triple-arc nuclear symbol simplified as ☢ shape (circle + 3 slices)
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      for (let i = 0; i < 3; i++) {
        const a0 = (i * 2 * Math.PI / 3) + Math.PI / 6;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.arc(x, y, r * 0.9, a0, a0 + Math.PI * 0.5);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fill();
        ctx.fillStyle = color;
      }
      break;
    }
    case 'ship': {
      // Triangle (bow facing up)
      ctx.beginPath();
      ctx.moveTo(x, y - r * 1.3);
      ctx.lineTo(x + r * 0.9, y + r * 0.7);
      ctx.lineTo(x - r * 0.9, y + r * 0.7);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      break;
    }
    case 'aircraft': {
      // Small cross / plus shape
      ctx.beginPath();
      ctx.roundRect(x - r * 0.3, y - r * 1.2, r * 0.6, r * 2.4, 1);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(x - r * 1.1, y - r * 0.3, r * 2.2, r * 0.6, 1);
      ctx.fill(); ctx.stroke();
      break;
    }
    case 'market':
    default: {
      // Circle
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      break;
    }
  }
  ctx.globalAlpha = 1;
}

// ─── Component ───────────────────────────────────────────────
const Globe3D: React.FC<Props> = ({ markers, onMarkerHover, isDarkMode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotX = useRef(-0.2);
  const rotY = useRef(0.2); // center on Africa/Europe
  const dragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const animRef = useRef<number>(0);
  const autoSpin = useRef(true);
  const starsRef = useRef<Star[]>([]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    if (W === 0 || H === 0) return;
    const cx = W / 2, cy = H / 2;
    const r = Math.min(W, H) * 0.43;

    // ── Background
    ctx.fillStyle = '#040c18';
    ctx.fillRect(0, 0, W, H);

    // ── Stars
    if (starsRef.current.length === 0) starsRef.current = makeStars(W, H);
    for (const s of starsRef.current) {
      ctx.globalAlpha = s.a;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ── Outer atmosphere corona (2 layers)
    const atm2 = ctx.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 1.22);
    atm2.addColorStop(0, 'rgba(30,120,255,0.22)');
    atm2.addColorStop(0.5, 'rgba(20,80,200,0.08)');
    atm2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.22, 0, Math.PI * 2);
    ctx.fillStyle = atm2; ctx.fill();

    // ── Ocean
    const oceanGrad = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.3, 0, cx, cy, r);
    oceanGrad.addColorStop(0, '#1a4a8a');
    oceanGrad.addColorStop(0.55, '#0d2f5e');
    oceanGrad.addColorStop(1, '#061526');
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = oceanGrad; ctx.fill();

    // ── Clip to globe
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();

    // ── Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 0.5;
    for (let lat = -60; lat <= 60; lat += 30) {
      ctx.beginPath(); let f = true;
      for (let lon = -180; lon <= 181; lon += 2) {
        const p = latLonToXY(lat, lon, rotX.current, rotY.current, cx, cy, r);
        if (p.z > 0) { f ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); f = false; } else f = true;
      }
      ctx.stroke();
    }
    for (let lon = -180; lon < 180; lon += 30) {
      ctx.beginPath(); let f = true;
      for (let lat2 = -90; lat2 <= 90; lat2 += 2) {
        const p = latLonToXY(lat2, lon, rotX.current, rotY.current, cx, cy, r);
        if (p.z > 0) { f ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); f = false; } else f = true;
      }
      ctx.stroke();
    }

    // ── Continents
    for (const lm of LANDMASSES) {
      const pts = lm.coords.map(([lat, lon]) =>
        latLonToXY(lat, lon, rotX.current, rotY.current, cx, cy, r)
      );
      const visible = pts.filter(p => p.z > 0);
      if (visible.length < 2) continue;
      ctx.beginPath();
      let started = false;
      for (const p of pts) {
        if (p.z > 0) { if (!started) { ctx.moveTo(p.x, p.y); started = true; } else ctx.lineTo(p.x, p.y); }
        else { if (started) ctx.closePath(); started = false; }
      }
      ctx.closePath();
      ctx.fillStyle = '#1d3a1a';
      ctx.fill();
      ctx.strokeStyle = '#2a5225';
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }

    // ── Specular highlight
    const specGrad = ctx.createRadialGradient(cx - r * 0.38, cy - r * 0.38, 0, cx - r * 0.15, cy - r * 0.15, r * 0.65);
    specGrad.addColorStop(0, 'rgba(255,255,255,0.11)');
    specGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = specGrad; ctx.fillRect(0, 0, W, H);

    // ── Dark-side shadow
    const shadowGrad = ctx.createRadialGradient(cx + r * 0.38, cy + r * 0.1, 0, cx + r * 0.38, cy + r * 0.1, r * 1.1);
    shadowGrad.addColorStop(0, 'rgba(0,0,0,0)');
    shadowGrad.addColorStop(0.65, 'rgba(0,0,0,0.12)');
    shadowGrad.addColorStop(1, 'rgba(0,0,0,0.52)');
    ctx.fillStyle = shadowGrad; ctx.fillRect(0, 0, W, H);

    ctx.restore(); // end globe clip

    // ── Globe border
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(80,140,255,0.28)'; ctx.lineWidth = 1.2; ctx.stroke();

    // ── Markers
    const t = Date.now();
    // Sort back-to-front by z so front markers draw on top
    const sorted = markers
      .map(m => ({ m, p: latLonToXY(m.lat, m.lon, rotX.current, rotY.current, cx, cy, r) }))
      .filter(({ p }) => p.z > 0.04)
      .sort((a, b) => a.p.z - b.p.z);

    for (const { m, p } of sorted) {
      const alpha = Math.min(1, p.z * 2.5);
      const intensity = m.intensity ?? 0.5;

      // Severity pulsing rings for high-intensity events
      if (m.pulse && intensity >= 0.55) {
        const rings = intensity >= 0.85 ? 3 : 2;
        for (let ring = 0; ring < rings; ring++) {
          const phase = ((t + ring * 700) % 2200) / 2200;
          const pr = 5 + phase * (14 + intensity * 10);
          const pa = (1 - phase) * 0.55 * alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, pr, 0, Math.PI * 2);
          ctx.strokeStyle = m.color + Math.round(pa * 255).toString(16).padStart(2, '0');
          ctx.lineWidth = intensity >= 0.85 ? 2 : 1.5;
          ctx.stroke();
        }
      }

      // Marker shape
      const markerR = 4 + intensity * 3;
      drawMarkerShape(ctx, m.category, p.x, p.y, markerR, m.color, alpha);

      // Label
      ctx.globalAlpha = alpha * 0.9;
      ctx.fillStyle = 'rgba(210,225,255,0.92)';
      ctx.font = `bold 8px monospace`;
      ctx.fillText(m.label, p.x + markerR + 3, p.y + 3);
      ctx.globalAlpha = 1;
    }
  }, [markers, isDarkMode]);

  // Animation loop
  useEffect(() => {
    let last = 0;
    const loop = (t: number) => {
      if (autoSpin.current && !dragging.current) rotY.current -= 0.0025;
      if (t - last > 16) { draw(); last = t; }
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      cachedStars = null; // regenerate stars for new size
      starsRef.current = [];
      draw();
    });
    ro.observe(canvas);
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    return () => ro.disconnect();
  }, [draw]);

  const getMarker = useCallback((mx: number, my: number): GlobeMarker | null => {
    const canvas = canvasRef.current; if (!canvas) return null;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2, r = Math.min(W, H) * 0.43;
    for (const m of markers) {
      const p = latLonToXY(m.lat, m.lon, rotX.current, rotY.current, cx, cy, r);
      if (p.z < 0.04) continue;
      const dx = mx - p.x, dy = my - p.y;
      if (Math.sqrt(dx * dx + dy * dy) < 12) return m;
    }
    return null;
  }, [markers]);

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true; autoSpin.current = false;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (dragging.current) {
      const dx = e.clientX - lastMouse.current.x, dy = e.clientY - lastMouse.current.y;
      rotY.current -= dx * 0.005;
      rotX.current = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotX.current + dy * 0.005));
      lastMouse.current = { x: e.clientX, y: e.clientY };
      onMarkerHover(null, 0, 0);
    } else {
      const m = getMarker(e.clientX - rect.left, e.clientY - rect.top);
      m ? onMarkerHover(m, e.clientX, e.clientY) : onMarkerHover(null, 0, 0);
    }
  };
  const onMouseUp = () => { dragging.current = false; };
  const onMouseLeave = () => { dragging.current = false; onMarkerHover(null, 0, 0); };
  const onDblClick = () => { autoSpin.current = !autoSpin.current; };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ cursor: 'grab', display: 'block', borderRadius: '0.75rem' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onDoubleClick={onDblClick}
      title="Drag to rotate · Double-click to toggle auto-spin"
    />
  );
};

export default Globe3D;
