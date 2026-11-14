import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import WorkspaceNavigation from '@/components/WorkspaceNavigation';
export const dynamic = 'force-dynamic';
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  // Organizers have their own console and never act as participants.
  if (user.role === 'ADMIN') redirect('/admin');
  return <div className="workspace"><div className="workspace-top"><div><p className="eyebrow">YANTRA AI / STUDENT WORKSPACE</p><h1>A little curiosity. A lot of possibility.</h1><p className="workspace-email">Your team, your registration and your next step — all in one place.</p></div><Link href="/schedule" className="btn-secondary">Event timeline <ArrowUpRight size={16} /></Link></div>{!user.emailVerified && <div className="workspace-alert"><p>Verify <strong>{user.email}</strong> using the link in your inbox to unlock team creation and registration.</p><Link href="/dashboard/settings">Resend verification</Link></div>}<div className="workspace-grid"><aside className="workspace-side"><WorkspaceNavigation /><div className="workspace-profile"><p className="eyebrow mb-3">SIGNED IN AS</p><strong>{user.profile?.fullName || user.email}</strong><span>{user.emailVerified ? 'Email verified' : 'Verification pending'}</span></div></aside><div className="workspace-content">{children}</div></div></div>;
}
