import Link from 'next/link';
import { Compass, GraduationCap, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { isLocalDemo } from '@/lib/local-demo';
import DemoAccess from '@/components/DemoAccess';
export const dynamic = 'force-dynamic';

export default function GuestPage() {
  return <div className="max-w-6xl mx-auto px-6 py-16 space-y-10">
    <div className="max-w-3xl space-y-5"><p className="eyebrow">WELCOME TO YANTRA AI</p><h1 className="text-5xl font-bold tracking-tight">One event. Three ways in.</h1><p className="text-gray-400 text-lg">Explore as a guest, participate as a student, or operate the event as an authorized organizer.</p></div>
    {isLocalDemo() && <DemoAccess />}
    <div className="grid lg:grid-cols-3 gap-5">
      <article className="panel p-7 space-y-5"><Compass className="text-orange-200" size={32} /><h2 className="text-2xl font-bold">Guest</h2><p className="text-gray-400 text-sm leading-relaxed">Browse event information without an account. See published tracks, schedules, prizes, rules, FAQs and announcements.</p><Link href="/" className="btn-secondary">Explore YANTRA AI <ArrowUpRight size={17} /></Link><p className="text-xs text-gray-500">Guest browsing does not create a participant registration.</p></article>
      <article className="panel p-7 space-y-5"><GraduationCap className="text-orange-200" size={32} /><h2 className="text-2xl font-bold">Student / participant</h2><ol className="list-decimal pl-5 text-sm text-gray-400 space-y-3"><li>Create an account and verify your email.</li><li>Complete your profile and consent.</li><li>Create a team or join with an invitation.</li><li>Accept published rules and submit registration.</li><li>Track your status and notifications.</li></ol><div className="flex gap-3 flex-wrap"><Link href="/register" className="btn-primary">Register</Link><Link href="/login" className="btn-secondary">Student sign-in</Link></div></article>
      <article className="panel p-7 space-y-5"><ShieldCheck className="text-emerald-200" size={32} /><h2 className="text-2xl font-bold">Administrator / organizer</h2><ul className="list-disc pl-5 text-sm text-gray-400 space-y-3"><li>Configure the event, deadlines and team limits.</li><li>Publish official content and announcements.</li><li>Manage students, teams and registration reviews.</li><li>Export data and inspect audit history.</li><li>Add official problem statements when supplied.</li></ul><Link href="/login" className="btn-secondary">Organizer sign-in <ArrowUpRight size={17} /></Link><p className="text-xs text-gray-500">Organizer access is granted by an authorized operator; account registration grants participant access only.</p></article>
    </div>
  </div>;
}
