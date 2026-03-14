import React, { useRef, useEffect, useCallback } from 'react';
import { LANDMASSES } from './landmasses';

export interface GlobeMarker {
  id: string; lat: number; lon: number;
  color: string; label: string; pulse?: boolean;
}

interface Props {
  markers: GlobeMarker[];
  onMarkerHover: (marker: GlobeMarker | null, x: number, y: number) => void;
  isDarkMode: boolean;
}

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

const Globe3D: React.FC<Props> = ({ markers, onMarkerHover, isDarkMode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotX = useRef(-0.25);
  const rotY = useRef(0);
  const dragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const animRef = useRef<number>(0);
  const autoSpin = useRef(true);
  const fpsT = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const r = Math.min(W, H) * 0.44;

    ctx.clearRect(0, 0, W, H);

    // ── Atmosphere glow ──────────────────────────────────
    const atmGrad = ctx.createRadialGradient(cx, cy, r * 0.92, cx, cy, r * 1.12);
    atmGrad.addColorStop(0, isDarkMode ? 'rgba(56,144,255,0.18)' : 'rgba(56,144,255,0.22)');
    atmGrad.addColorStop(1, 'rgba(56,144,255,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.12, 0, Math.PI * 2);
    ctx.fillStyle = atmGrad;
    ctx.fill();

    // ── Ocean ────────────────────────────────────────────
    const oceanGrad = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, 0, cx, cy, r);
    oceanGrad.addColorStop(0, '#1a4a8a');
    oceanGrad.addColorStop(0.6, '#0d2f5e');
    oceanGrad.addColorStop(1, '#061526');
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = oceanGrad;
    ctx.fill();

    // Clip to globe for all land/grid drawing
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // ── Lat/lon grid ─────────────────────────────────────
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    for (let lat = -60; lat <= 60; lat += 30) {
      ctx.beginPath(); let f = true;
      for (let lon = -180; lon <= 181; lon += 3) {
        const p = latLonToXY(lat, lon, rotX.current, rotY.current, cx, cy, r);
        if (p.z > 0) { f ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); f = false; } else f = true;
      }
      ctx.stroke();
    }
    for (let lon = -180; lon < 180; lon += 30) {
      ctx.beginPath(); let f = true;
      for (let lat = -90; lat <= 90; lat += 3) {
        const p = latLonToXY(lat, lon, rotX.current, rotY.current, cx, cy, r);
        if (p.z > 0) { f ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); f = false; } else f = true;
      }
      ctx.stroke();
    }

    // ── Continents ───────────────────────────────────────
    // Collect all visible polygon segments
    for (const lm of LANDMASSES) {
      const pts = lm.coords.map(([lat, lon]) =>
        latLonToXY(lat, lon, rotX.current, rotY.current, cx, cy, r)
      );
      // Only draw if centroid-ish point is on front
      const visible = pts.filter(p => p.z > 0);
      if (visible.length < 2) continue;

      ctx.beginPath();
      let started = false;
      for (const p of pts) {
        if (p.z > 0) {
          if (!started) { ctx.moveTo(p.x, p.y); started = true; }
          else ctx.lineTo(p.x, p.y);
        } else {
          if (started) ctx.closePath();
          started = false;
        }
      }
      ctx.closePath();
      ctx.fillStyle = isDarkMode ? '#2d5a27' : '#4a7c59';
      ctx.fill();
      ctx.strokeStyle = isDarkMode ? '#3a7032' : '#5d9e6e';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    ctx.restore(); // end clip

    // ── Globe border ─────────────────────────────────────
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(99,155,255,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // ── Specular highlight ───────────────────────────────
    const specGrad = ctx.createRadialGradient(cx - r * 0.38, cy - r * 0.38, 0, cx - r * 0.15, cy - r * 0.15, r * 0.65);
    specGrad.addColorStop(0, 'rgba(255,255,255,0.12)');
    specGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = specGrad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // ── Dark-side shadow ─────────────────────────────────
    const shadowGrad = ctx.createRadialGradient(cx + r * 0.4, cy + r * 0.1, 0, cx + r * 0.4, cy + r * 0.1, r * 1.1);
    shadowGrad.addColorStop(0, 'rgba(0,0,0,0)');
    shadowGrad.addColorStop(0.7, 'rgba(0,0,0,0.1)');
    shadowGrad.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = shadowGrad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // ── Markers ──────────────────────────────────────────
    const t = Date.now();
    for (const m of markers) {
      const p = latLonToXY(m.lat, m.lon, rotX.current, rotY.current, cx, cy, r);
      if (p.z < 0.05) continue;
      const alpha = Math.min(1, p.z * 3);

      if (m.pulse) {
        const pr = 6 + ((t % 2000) / 2000) * 10;
        const pa = (1 - (t % 2000) / 2000) * 0.4 * alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, pr, 0, Math.PI * 2);
        ctx.strokeStyle = m.color + Math.round(pa * 255).toString(16).padStart(2, '0');
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = m.color;
      ctx.globalAlpha = alpha;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = 'rgba(220,230,255,0.9)';
      ctx.font = '9px monospace';
      ctx.fillText(m.label, p.x + 7, p.y + 3);
      ctx.globalAlpha = 1;
    }
  }, [markers, isDarkMode]);

  useEffect(() => {
    let last = 0;
    const loop = (t: number) => {
      if (autoSpin.current && !dragging.current) rotY.current -= 0.003;
      if (t - last > 16) { draw(); last = t; }
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
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
    const cx = W / 2, cy = H / 2, r = Math.min(W, H) * 0.44;
    for (const m of markers) {
      const p = latLonToXY(m.lat, m.lon, rotX.current, rotY.current, cx, cy, r);
      if (p.z < 0.05) continue;
      const dx = mx - p.x, dy = my - p.y;
      if (Math.sqrt(dx * dx + dy * dy) < 10) return m;
    }
    return null;
  }, [markers]);

  const onMouseDown = (e: React.MouseEvent) => { dragging.current = true; autoSpin.current = false; lastMouse.current = { x: e.clientX, y: e.clientY }; };
  const onMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (dragging.current) {
      const dx = e.clientX - lastMouse.current.x, dy = e.clientY - lastMouse.current.y;
      rotY.current -= dx * 0.005;
      rotX.current = Math.max(-Math.PI/2, Math.min(Math.PI/2, rotX.current + dy * 0.005));
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
      className="w-full h-full rounded-xl"
      style={{ cursor: 'grab', display: 'block', background: 'transparent' }}
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
