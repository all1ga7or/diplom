import type { Metadata } from 'next';
import './globals.css';
import NavBar from '@/components/NavBar';

export const metadata: Metadata = {
  title: 'Еволюційне моделювання слабконелінійних систем',
  description: 'Адаптивна оптимізація слабконелінійних систем за допомогою генетичного алгоритму. Веб-застосунок для дослідження та візуалізації еволюційних процесів.',
  keywords: 'генетичний алгоритм, оптимізація, слабконелінійні системи, моделювання',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body>
        <div className="app-shell">
          <NavBar />
          <main className="page-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
