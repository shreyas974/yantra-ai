import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import WorkspaceNavigation from '@/components/WorkspaceNavigation';
export const dynamic = 'force-dynamic';
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') redirect('/login');
  return <div className="workspace"><div className="workspace-top"><div><p className="eyebrow">YANTRA AI / ORGANIZER CONSOLE</p><h1>Make room for great ideas.</h1><p className="workspace-email">Manage your event, support your students and keep every team moving.</p></div><Link href="/" className="btn-secondary">View public site <ArrowUpRight size={16} /></Link></div><div className="workspace-grid"><aside className="workspace-side"><WorkspaceNavigation admin /><div className="workspace-profile"><p className="eyebrow mb-3">AUTHORIZED ORGANIZER</p><strong>{user.email}</strong><span>Administrator access</span></div></aside><div className="workspace-content">{children}</div></div></div>;
}
