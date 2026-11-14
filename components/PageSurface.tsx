'use client';
import { usePathname } from 'next/navigation';
const publicRoutes = new Set(['/about', '/tracks', '/schedule', '/prizes', '/rules', '/faq', '/contact', '/privacy', '/problem-statements', '/guest']);
export default function PageSurface({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return <div className={publicRoutes.has(path) ? 'paper-surface' : undefined}>{children}</div>;
}
