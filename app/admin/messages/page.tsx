import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Mail } from "lucide-react";
export const dynamic = "force-dynamic";
export default async function AdminMessagesPage() {
    if ((await getCurrentUser())?.role !== "ADMIN")
        redirect("/login");
    const messages = await db.contactMessage.findMany({
        orderBy: { createdAt: "desc" },
    });
    return (<div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Contact Inquiries</h2>
        <p className="text-xs text-gray-400">Messages submitted via the public contact form.</p>
      </div>

      {messages.length === 0 ? (<div className="text-center py-12 text-gray-400 p-8 rounded-2xl bg-surface border border-surface-border">
          No contact inquiries received yet.
        </div>) : (<div className="space-y-3">
          {messages.map((msg) => (<div key={msg.id} className="p-5 rounded-xl bg-surface border border-surface-border space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">{msg.name} ({msg.email})</span>
                <span className="font-mono text-gray-500">{new Date(msg.createdAt).toLocaleString()}</span>
              </div>
              <div className="text-xs text-orange-300 font-semibold">{msg.subject}</div>
              <p className="text-xs text-gray-300 whitespace-pre-line leading-relaxed">{msg.message}</p>
            </div>))}
        </div>)}
    </div>);
}
