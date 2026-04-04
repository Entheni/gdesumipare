import { ref } from 'vue';

const STORAGE_KEY = 'theme_preference';

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(preference) {
  return preference === 'system' ? getSystemTheme() : preference;
}

export const themePreference = ref(localStorage.getItem(STORAGE_KEY) || 'system');

export function applyTheme(preference = themePreference.value) {
  const theme = resolveTheme(preference);
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  window.dispatchEvent(new CustomEvent('gsp-theme-change', { detail: { theme, preference } }));
}

export function setThemePreference(preference, { persist = true } = {}) {
  themePreference.value = preference;
  if (persist) {
    localStorage.setItem(STORAGE_KEY, preference);
  }
  applyTheme(preference);
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (themePreference.value === 'system') {
    applyTheme('system');
  }
});

applyTheme(themePreference.value);
