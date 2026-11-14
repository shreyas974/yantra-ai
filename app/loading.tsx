import BrandMark from '@/components/BrandMark';
export default function Loading() {
  return <div role="status" aria-live="polite" className="route-loading"><span className="route-loading-mark"><BrandMark /></span><p className="eyebrow">LOADING YANTRA AI…</p><span className="route-loading-bar" /></div>;
}
