import { useTheme } from '../contexts/ThemeContext'

function IconMoon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function IconSun() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const nextIsDark = theme === 'light'

  return (
    <button
      type="button"
      className="btn btn--ghost btn--sm"
      onClick={toggleTheme}
      aria-label={nextIsDark ? 'Switch to dark theme' : 'Switch to light theme'}
    >
      {theme === 'light' ? <IconMoon /> : <IconSun />}
      <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
    </button>
  )
}
