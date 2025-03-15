import { PREBUILT_THEMES } from '@libs/ui-primitives';
import { makeAutoObservable, runInAction } from 'mobx';
import { makePersistable } from 'mobx-persist-store';

export class AppStore {
  constructor() {
    makeAutoObservable(this);

    void makePersistable(this, {
      name: 'AppStore',
      properties: ['currentThemeId'],
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    }).then(() => {
      runInAction(() => {
        this.initializeTheme();
      });
    });
  }

  public currentThemeId = 'dark';

  get theme() {
    return this.prebuiltThemes.find(theme => theme.id === this.currentThemeId);
  }

  setThemeId(id: string) {
    this.currentThemeId = id;
  }

  get prebuiltThemes() {
    return PREBUILT_THEMES;
  }

  private initializeTheme() {
    // Check if we're in a browser environment (to avoid SSR issues)
    if (typeof window !== 'undefined' && !this.currentThemeId) {
      // Only set the theme if it hasn't been explicitly set already
      this.setThemeBasedOnSystemPreference();
    }
  }

  private setThemeBasedOnSystemPreference() {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Set to dark or light theme based on system preference
    this.setThemeId(isDarkMode ? 'dark' : 'light');
  }
}
