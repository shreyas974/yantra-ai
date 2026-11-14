import { getEventConfigMap } from "@/lib/event-config";
import { HelpCircle } from "lucide-react";
export const dynamic = "force-dynamic";
export default async function FaqPage() {
    const config = await getEventConfigMap();
    let faqs = [];
    try {
        faqs = JSON.parse(config["faqs"] || "[]");
    }
    catch {
        faqs = [];
    }
    return (<div className="max-w-4xl mx-auto px-4 py-16 space-y-12">
      <div className="text-center space-y-3">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white">Frequently Asked Questions</h1>
        <p className="text-gray-400">Everything you need to know about participating in YANTRA AI.</p>
      </div>

      <div className="space-y-4">
        {!faqs.length && <p className="panel p-6 text-gray-400">Organizer FAQs will be published soon.</p>}
        {faqs.map((faq: any, idx: number) => (<details key={idx} className="p-6 rounded-xl bg-surface border border-surface-border space-y-2">
            <summary className="text-lg font-bold text-white flex items-center gap-2 cursor-pointer">
              <HelpCircle className="w-5 h-5 text-orange-300 shrink-0"/>
              {faq.q}
            </summary>
            <p className="text-sm text-gray-300 pl-7 leading-relaxed">{faq.a}</p>
          </details>))}
      </div>
    </div>);
}
