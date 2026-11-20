import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ showLabel = false, className = '' }) => {
  const { isDark, toggleTheme } = useTheme();
  const proximoTema = isDark ? 'claro' : 'escuro';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Ativar tema ${proximoTema}`}
      aria-pressed={isDark}
      title={`Ativar tema ${proximoTema}`}
      className={`theme-toggle group inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-2.5 text-xs font-bold transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${className}`}
    >
      <span className="relative flex h-5 w-5 items-center justify-center overflow-hidden">
        <Sun className={`absolute h-4 w-4 transition duration-200 ${isDark ? '-rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} />
        <Moon className={`absolute h-4 w-4 transition duration-200 ${isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'}`} />
      </span>
      {showLabel && <span>{isDark ? 'Tema escuro' : 'Tema claro'}</span>}
    </button>
  );
};
