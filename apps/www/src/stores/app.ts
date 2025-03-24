import { PREBUILT_THEMES } from '@libs/ui-primitives';
import { makeAutoObservable } from 'mobx';
import { makePersistable } from 'mobx-persist-store';

export class AppStore {
  // @TODO: random generate for anon users, store in local storage? or just keep hardcoded to "anon-user-id"..
  public readonly currentUserId = 'anon-user-id';

  constructor() {
    makeAutoObservable(this);
    void makePersistable(this, {
      name: 'AppStore',
      properties: ['sidebarCollapsed', 'currentThemeId', 'fontId'],
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
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

  setThemeId = (id: string) => {
    this.currentThemeId = id;
  };

  get prebuiltThemes() {
    return PREBUILT_THEMES;
  }

  public fontId = 'mono';

  get fontClass() {
    return this.fontId === 'mono' ? 'font-mono' : 'font-sans';
  }

  setFontId = (id: string) => {
    this.fontId = id;
  };
}
