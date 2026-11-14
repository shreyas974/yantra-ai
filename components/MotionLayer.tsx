'use client';
import { useEffect } from 'react';

/**
 * Marks the header once the page scrolls. Scroll reveals are pure CSS
 * (scroll-driven animations), so nothing here touches page markup.
 */
export default function MotionLayer() {
  useEffect(() => {
    const header = document.querySelector('.site-header');
    const onScroll = () => header?.toggleAttribute('data-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return null;
}
