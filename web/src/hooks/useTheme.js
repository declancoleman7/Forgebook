import { useCallback, useEffect, useState } from 'react';

const THEME_KEY = 'forgebook.theme'; // "light" | absent (absent = dark, the default)

function applyTheme(theme) {
  if (theme === 'light') document.documentElement.setAttribute('data-theme', 'light');
  else document.documentElement.removeAttribute('data-theme');
}

// Per-device, not synced (mirrors the old app's getThemePref/setThemePref) --
// an in-app setting shouldn't silently follow the OS chrome or another
// device's choice.
export function useTheme() {
  const [theme, setThemeState] = useState(() => (localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'));

  useEffect(() => { applyTheme(theme); }, [theme]);

  const setTheme = useCallback((next) => {
    if (next === 'light') localStorage.setItem(THEME_KEY, 'light');
    else localStorage.removeItem(THEME_KEY);
    setThemeState(next);
  }, []);

  return [theme, setTheme];
}
