'use client';
import { useEffect, useRef } from 'react';

/**
 * A wireframe torus rendered in real 3D on a 2D canvas. It slowly rotates,
 * leans toward the pointer and pauses while off-screen. With reduced motion
 * it renders a single still frame.
 */
export default function Torus3D({ className = '', tone = 'copper' }: { className?: string; tone?: 'copper' | 'sage' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const R = 1, r = 0.42, rings = 30, segments = 64, tubes = 40, tubeSegments = 40;
    const palette = tone === 'copper'
      ? { near: [244, 187, 139], far: [103, 140, 115], core: '#f4b984' }
      : { near: [205, 222, 196], far: [92, 124, 100], core: '#e9b58d' };

    // Precompute torus points once; only the rotation changes per frame.
    const point = (u: number, v: number) => [(R + r * Math.cos(v)) * Math.cos(u), (R + r * Math.cos(v)) * Math.sin(u), r * Math.sin(v)];
    const lines: number[][][] = [];
    for (let i = 0; i < rings; i++) lines.push(Array.from({ length: segments + 1 }, (_, j) => point((j / segments) * Math.PI * 2, (i / rings) * Math.PI * 2)));
    for (let i = 0; i < tubes; i++) lines.push(Array.from({ length: tubeSegments + 1 }, (_, j) => point((i / tubes) * Math.PI * 2, (j / tubeSegments) * Math.PI * 2)));

    let width = 0, height = 0, dpr = 1, frame = 0, visible = true, time = 0, last = performance.now();
    const target = { x: 0, y: 0 }, tilt = { x: 0, y: 0 };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width; height = rect.height;
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const scale = Math.min(width, height) * 0.3;
      const cx = width / 2, cy = height / 2;
      const ax = 1.05 + tilt.y * 0.5 + Math.sin(time * 0.25) * 0.08;
      const ay = time * 0.22 + tilt.x * 0.6;
      const az = 0.35 + Math.sin(time * 0.17) * 0.1;
      const [sx, cxr, sy, cyr, sz, czr] = [Math.sin(ax), Math.cos(ax), Math.sin(ay), Math.cos(ay), Math.sin(az), Math.cos(az)];
      const project = ([x, y, z]: number[]) => {
        // Rotate around Z (spin), then X (lean), then Y (turn).
        let x1 = x * czr - y * sz, y1 = x * sz + y * czr, z1 = z;
        const y2 = y1 * cxr - z1 * sx, z2 = y1 * sx + z1 * cxr;
        const x3 = x1 * cyr + z2 * sy, z3 = -x1 * sy + z2 * cyr;
        const perspective = 3.2 / (3.2 - z3);
        return [cx + x3 * scale * perspective, cy + y2 * scale * perspective, z3];
      };
      ctx.lineWidth = 0.7;
      for (const line of lines) {
        const pts = line.map(project);
        for (let k = 1; k < pts.length; k++) {
          const depth = (pts[k][2] + R + r) / (2 * (R + r)); // 0 far .. 1 near
          const c = palette.far.map((f, n) => Math.round(f + (palette.near[n] - f) * depth));
          ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${0.12 + depth * 0.6})`;
          ctx.beginPath(); ctx.moveTo(pts[k - 1][0], pts[k - 1][1]); ctx.lineTo(pts[k][0], pts[k][1]); ctx.stroke();
        }
      }
      // Pulsing core with a soft halo.
      const pulse = 0.75 + Math.sin(time * 1.6) * 0.25;
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, scale * 0.55);
      halo.addColorStop(0, `rgba(240,184,137,${0.28 * pulse})`); halo.addColorStop(1, 'rgba(240,184,137,0)');
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, scale * 0.55, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = palette.core; ctx.beginPath(); ctx.arc(cx, cy, 3.2 + pulse * 1.4, 0, Math.PI * 2); ctx.fill();
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      time += dt;
      tilt.x += (target.x - tilt.x) * 0.06; tilt.y += (target.y - tilt.y) * 0.06;
      draw();
      if (visible) frame = requestAnimationFrame(loop);
    };

    const onPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      target.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      target.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    const onLeave = () => { target.x = 0; target.y = 0; };

    resize();
    const resizeObserver = new ResizeObserver(() => { resize(); if (reduced || !visible) draw(); });
    resizeObserver.observe(canvas);
    if (reduced) { draw(); return () => resizeObserver.disconnect(); }

    const host = canvas.parentElement || canvas;
    host.addEventListener('pointermove', onPointer);
    host.addEventListener('pointerleave', onLeave);
    const io = new IntersectionObserver(([entry]) => {
      const was = visible; visible = entry.isIntersecting;
      if (visible && !was) { last = performance.now(); frame = requestAnimationFrame(loop); }
    });
    io.observe(canvas);
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame); io.disconnect(); resizeObserver.disconnect();
      host.removeEventListener('pointermove', onPointer); host.removeEventListener('pointerleave', onLeave);
    };
  }, [tone]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
