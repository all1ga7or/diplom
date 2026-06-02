import type { Metadata } from 'next';
import './globals.css';
import NavBar from '@/components/NavBar';

export const metadata: Metadata = {
  title: 'Система імітаційного моделювання енергетичної системи',
  description: 'Демонстраційно-навчальний симулятор сценаріїв роботи енергетичної системи на основі еволюційних алгоритмів. Генетичний алгоритм, адаптивна оптимізація, візуалізація результатів.',
  keywords: 'енергетична система, генетичний алгоритм, імітаційне моделювання, еволюційні алгоритми, збурення, оптимізація',
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
