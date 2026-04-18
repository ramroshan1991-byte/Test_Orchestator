import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Test Orchestrator - AI-Powered QA Automation',
  description: 'Automated test generation and orchestration platform powered by AI',
  keywords: ['QA', 'Testing', 'Automation', 'AI', 'Test Generation'],
  authors: [{ name: 'Test Orchestrator Team' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var isDark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
