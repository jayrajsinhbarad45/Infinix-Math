import type { Metadata } from 'next';
import './globals.css';
import { Header } from '../components/Header';

export const metadata: Metadata = {
  title: 'Infinix Math | Root of Infinity — AI Math Solver & Tutor',
  description:
    'Interactive AI-powered math solver and tutor pairing Google Gemini multimodal vision with SymPy deterministic symbolic verification.',
  keywords: [
    'Math Solver',
    'SymPy',
    'Calculus',
    'Algebra',
    'Gemini Vision',
    'Math OCR',
    'LaTeX',
    'Step-by-Step Solver',
  ],
  authors: [{ name: 'Jayrajsinh Barad' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
        <Header />
        <main className="flex-1 relative overflow-hidden">
          {/* Subtle background glow spheres */}
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />
          <div className="absolute top-40 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />
          {children}
        </main>
      </body>
    </html>
  );
}
