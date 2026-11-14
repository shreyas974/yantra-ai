'use client';
import { useRef } from 'react';

/** Perspective tilt with a moving glare. Inert on touch and reduced motion. */
export default function Tilt({ children, className = '', max = 8, as: Tag = 'div' }: { children: React.ReactNode; className?: string; max?: number; as?: 'div' | 'article' }) {
  const ref = useRef<HTMLElement>(null);
  const frame = useRef(0);
  function move(event: React.PointerEvent) {
    const el = ref.current;
    if (!el || event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width, y = (event.clientY - rect.top) / rect.height;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty('--rx', `${(0.5 - y) * max}deg`);
      el.style.setProperty('--ry', `${(x - 0.5) * max}deg`);
      el.style.setProperty('--gx', `${x * 100}%`);
      el.style.setProperty('--gy', `${y * 100}%`);
      el.dataset.tilting = 'true';
    });
  }
  function leave() {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(frame.current);
    el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg');
    delete el.dataset.tilting;
  }
  return <Tag ref={ref as never} className={`tilt-3d ${className}`} onPointerMove={move} onPointerLeave={leave}>{children}<span className="tilt-glare" aria-hidden="true" /></Tag>;
}
