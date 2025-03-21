import { PREBUILT_THEMES } from '@libs/ui-primitives';
import { makeAutoObservable, runInAction } from 'mobx';
import { makePersistable } from 'mobx-persist-store';

export class AppStore {
  // @TODO: random generate for anon users, store in local storage? or just keep hardcoded to "anon-user-id"..
  public readonly currentUserId = 'anon-user-id';

  constructor() {
    makeAutoObservable(this);
    void makePersistable(this, {
      name: 'AppStore',
      properties: ['currentThemeId', 'sidebarCollapsed'],
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    }).then(() => {
      runInAction(() => {
        this.initializeTheme();
      });
    });
  }

  /**
   * Sidebar
   */

  public sidebarCollapsed = false;
  private _sidebarWidth = 0;

  get sidebarWidth() {
    return this._sidebarWidth;
  }

  setSidebarWidth(width: number) {
    this._sidebarWidth = width;
  }

  setSidebarCollapsed(collapsed: boolean) {
    this.sidebarCollapsed = collapsed;
  }

  /**
   * Main Canvas
   */

  public canvasHasHeader = true;
  setCanvasHasHeader(hasHeader: boolean) {
    this.canvasHasHeader = hasHeader;
  }

  /**
   * Chatbox
   */

  private _chatboxHeight = 0;

  get chatboxHeight() {
    return this._chatboxHeight;
  }

  setChatboxHeight(height: number) {
    this._chatboxHeight = height;
  }

  /**
   * Theme
   */

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
