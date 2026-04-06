'use client';
import { useEffect, useRef } from 'react';

interface LogLine {
  text: string;
  type?: 'info' | 'accent' | 'success' | 'warn' | 'divider';
}

interface Props {
  lines: LogLine[];
}

export default function LogPanel({ lines }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="log-panel" ref={ref}>
      {lines.length === 0 && (
        <div className="log-line" style={{ opacity: 0.4 }}>
          Журнал виконання порожній. Запустіть симуляцію...
        </div>
      )}
      {lines.map((l, i) => (
        <div key={i} className={`log-line ${l.type || ''}`}>
          {l.text}
        </div>
      ))}
    </div>
  );
}
