import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';

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
      <body className="min-h-full bg-[#070b14] text-slate-100 selection:bg-indigo-500 selection:text-white">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
