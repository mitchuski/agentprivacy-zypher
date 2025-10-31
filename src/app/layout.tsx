import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "AgentPrivacy.ai - Privacy-First Payment Infrastructure for AI Agents",
  description: "I'm just another swordsman, privacy is my blade. The blade slashes cookies. The agent keeps no trail. Building the Infrastructure for Private, Sovereign AI Agents.",
  keywords: ["privacy", "AI agents", "zero-knowledge", "blockchain", "ERC-8004", "privacy pools", "x402"],
  authors: [{ name: "AgentPrivacy.ai" }],
  openGraph: {
    title: "AgentPrivacy.ai - Privacy-First Payment Infrastructure",
    description: "The blade slashes cookies. The agent keeps no trail.",
    type: "website",
    url: "https://agentprivacy.ai",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentPrivacy.ai",
    description: "Privacy-first personal payment and knowledge infrastructure for AI agents",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <main>
          {children}
        </main>

        <footer className="bg-background border-t border-surface/50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-text-muted">
              <a href="https://x.com/privacymage" target="_blank" rel="noopener noreferrer" className="hover:text-text transition-colors">
                privacymage: x
              </a>
            </div>
            <div className="flex flex-col items-center md:items-end gap-2">
              <a href="https://sync.soulbis.com/" target="_blank" rel="noopener noreferrer" className="text-sm text-text-muted hover:text-text transition-colors">
                soulbis research
              </a>
              <a href="https://intel.agentkyra.ai/" target="_blank" rel="noopener noreferrer" className="text-sm text-text-muted hover:text-text transition-colors">
                private ai: agent kyra
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

