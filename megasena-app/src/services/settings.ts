import { enable, disable, isEnabled } from 'tauri-plugin-autostart-api';

export type Theme = 'light' | 'dark' | 'system';

export const SettingsService = {
  getTheme(): Theme {
    return (localStorage.getItem('theme') as Theme) || 'system';
  },

  setTheme(theme: Theme) {
    localStorage.setItem('theme', theme);
    this.applyTheme(theme);
  },

  applyTheme(theme: Theme) {
    const root = window.document.documentElement;
    const isDark = 
      theme === 'dark' || 
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  },

  async isAutostartEnabled(): Promise<boolean> {
    try {
      return await isEnabled();
    } catch (e) {
      console.error('Autostart check failed:', e);
      return false;
    }
  },

  async setAutostart(enabled: boolean) {
    try {
      if (enabled) {
        await enable();
      } else {
        await disable();
      }
    } catch (e) {
      console.error('Failed to update autostart:', e);
    }
  }
};
