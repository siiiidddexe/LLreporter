import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LLReporter — LogicLaunch Bug Platform",
  description: "Capture, triage, and fix bugs with the LogicLaunch team.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink text-white antialiased">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_80%_-10%,rgba(47,125,255,.12),transparent_60%),radial-gradient(800px_500px_at_-10%_110%,rgba(47,125,255,.08),transparent_60%)]"
        />
        {children}
      </body>
    </html>
  );
}
