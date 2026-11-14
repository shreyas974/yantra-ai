'use client';
export default function ErrorPage({ reset }: {
    error: Error & {
        digest?: string;
    };
    reset: () => void;
}) { return <div className="max-w-xl mx-auto py-24 px-6 space-y-5"><p className="eyebrow">CONNECTION INTERRUPTED</p><h1 className="text-3xl font-bold">We couldn’t load this page.</h1><p className="text-gray-400">Please retry in a moment. If the issue continues, contact the event organizers.</p><button onClick={reset} className="btn-primary">Try again</button><a className="btn-secondary ml-3" href="/contact">Contact</a></div>; }
