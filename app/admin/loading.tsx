import BrandMark from '@/components/BrandMark';
export default function Loading() {
  return <div role="status" aria-live="polite" className="route-loading is-dark"><span className="route-loading-mark"><BrandMark /></span><p className="eyebrow">OPENING THE ORGANIZER CONSOLE…</p><span className="route-loading-bar" /></div>;
}
