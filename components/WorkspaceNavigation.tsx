'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, BookOpen, CalendarDays, CircleUserRound, ClipboardCheck, Database, FileCode2, FolderKanban, LayoutDashboard, Mail, Settings2, Users, UsersRound } from 'lucide-react';
const student = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/profile', label: 'My profile', icon: CircleUserRound },
  { href: '/dashboard/team', label: 'My team & invites', icon: UsersRound },
  { href: '/dashboard/registration', label: 'Registration', icon: ClipboardCheck },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/schedule', label: 'Event timeline', icon: CalendarDays },
  { href: '/rules', label: 'Official rules', icon: BookOpen },
  { href: '/dashboard/settings', label: 'Account settings', icon: Settings2 },
];
const organizer = [
  { href: '/admin', label: 'Event overview', icon: LayoutDashboard },
  { href: '/admin/registrations', label: 'Registration reviews', icon: ClipboardCheck },
  { href: '/admin/participants', label: 'Students & participants', icon: CircleUserRound },
  { href: '/admin/teams', label: 'Teams', icon: Users },
  { href: '/admin/config', label: 'Event settings', icon: Settings2 },
  { href: '/admin/content', label: 'Published content', icon: FolderKanban },
  { href: '/admin/announcements', label: 'Announcements', icon: Bell },
  { href: '/admin/problem-statements', label: 'Problem statements', icon: FileCode2 },
  { href: '/admin/messages', label: 'Contact inbox', icon: Mail },
  { href: '/admin/storage', label: 'Database & storage', icon: Database },
];
export default function WorkspaceNavigation({ admin = false }: { admin?: boolean }) {
  const path = usePathname();
  const links = admin ? organizer : student;
  return <nav className="workspace-nav" aria-label={admin ? 'Organizer navigation' : 'Student navigation'}>{links.map(({ href, label, icon: Icon }) => <Link href={href} key={href} aria-current={path === href ? 'page' : undefined}><Icon size={17} strokeWidth={1.5} />{label}</Link>)}</nav>;
}
