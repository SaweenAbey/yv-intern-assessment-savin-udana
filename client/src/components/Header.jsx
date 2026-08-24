import React from 'react';
import { Clock } from 'lucide-react';

export default function Header() {
  return (
    <header className="top-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
        <Clock size={14} />
        <span>Sri Lankan Security Standards Compliant</span>
      </div>
    </header>
  );
}
