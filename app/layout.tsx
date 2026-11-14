import PageSurface from '@/components/PageSurface';
import { BRAND } from '@/lib/brand';
import { isLocalDemo } from "@/lib/local-demo";
import Link from "next/link";
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MotionLayer from "@/components/MotionLayer";
import { Inter_Tight, Instrument_Serif, JetBrains_Mono } from "next/font/google";
const sans = Inter_Tight({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
    title: "YANTRA AI — Artificial Intelligence & Machine Learning Hackathon",
    icons: { icon: "/icon.svg" },
    openGraph: { title: "YANTRA AI — Code. Create. Conquer.", description: "Artificial Intelligence & Machine Learning Hackathon", images: ["/social.svg"] },
    description: BRAND.description,
};
export default function RootLayout({ children, }: Readonly<{
    children: React.ReactNode;
}>) {
    return (<html lang="en" className={`dark ${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-orange-300/30 selection:text-orange-100">

        <div className="relative z-10 flex flex-col min-h-screen">
          <a href="#main-content" className="sr-only focus:not-sr-only focus:p-4 focus:bg-orange-200 focus:text-black">Skip to content</a>
          <Navbar />
          <MotionLayer />
          {isLocalDemo() && <div className="bg-amber-950/70 border-b border-amber-500/30 px-4 py-3 text-center text-xs text-amber-200">LOCAL DEMO · Example accounts in an isolated database. <Link className="underline font-semibold" href="/guest">Switch student / organizer</Link></div>}
          <main id="main-content" className="flex-1"><PageSurface>{children}</PageSurface></main>
          <Footer />
        </div>
      </body>
    </html>);
}
