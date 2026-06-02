'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: '⚡ Симуляція' },
  { href: '/theory', label: '📖 Теорія' },
  { href: '/scenarios', label: '🎭 Сценарії' },
  { href: '/history', label: '📋 Історія' },
];

export default function NavBar() {
  const path = usePathname();
  return (
    <header className="appbar">
      <span className="appbar-title">
        Моделювання енергетичної системи
      </span>
      <nav className="appbar-nav">
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className={`nav-link${path === l.href ? ' active' : ''}`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="appbar-spacer" />
      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
        v2.0 · Web
      </div>
    </header>
  );
}
