import { ref } from 'vue';

const STORAGE_KEY = 'theme_preference';
const DEFAULT_THEME_PREFERENCE = 'light';

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function normalizeThemePreference(preference) {
  if (preference === 'dark' || preference === 'light') {
    return preference;
  }
  if (preference === 'system') {
    return DEFAULT_THEME_PREFERENCE;
  }
  return DEFAULT_THEME_PREFERENCE;
}

const initialThemePreference = normalizeThemePreference(localStorage.getItem(STORAGE_KEY));
if (localStorage.getItem(STORAGE_KEY) !== initialThemePreference) {
  localStorage.setItem(STORAGE_KEY, initialThemePreference);
}

export const themePreference = ref(initialThemePreference);

export function applyTheme(preference = themePreference.value) {
  const theme = normalizeThemePreference(preference);
  document.documentElement.dataset.theme = theme;
  document.body.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.body.style.colorScheme = theme;
  window.dispatchEvent(new CustomEvent('gsp-theme-change', { detail: { theme, preference } }));
}

export function setThemePreference(preference, { persist = true } = {}) {
  const normalizedPreference = normalizeThemePreference(preference);
  themePreference.value = normalizedPreference;
  if (persist) {
    localStorage.setItem(STORAGE_KEY, normalizedPreference);
  }
  applyTheme(normalizedPreference);
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (themePreference.value === 'system') {
    applyTheme('system');
  }
});

applyTheme(themePreference.value);
