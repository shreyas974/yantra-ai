import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import Torus3D from '@/components/Torus3D';

export default function NotFound() {
  return <div className="not-found">
    <Torus3D className="not-found-torus" />
    <div className="not-found-copy">
      <p className="eyebrow">ERROR 404</p>
      <h1>This page <em>wandered off.</em></h1>
      <p>The link may be broken, or the page may have moved. Let’s get you back on track.</p>
      <div className="not-found-actions"><Link href="/" className="button-ink">Back to home <ArrowUpRight size={18} /></Link><Link href="/contact" className="button-text">Contact the organizers <ArrowUpRight size={17} /></Link></div>
    </div>
  </div>;
}
