// Dedicated step-by-step Back Navigation Manager for browser & mobile hardware back button
export type MainSection =
  | 'home'
  | 'news'
  | 'events'
  | 'sports'
  | 'agriculture'
  | 'temples'
  | 'photos'
  | 'map'
  | 'village_3d'
  | 'ask'
  | 'people'
  | 'messages'
  | 'profile'
  | 'admin'
  | 'search'
  | 'notifications';

type ModalCloseHandler = () => void;

class BackNavigationService {
  private modalStack: Array<{ id: string; close: ModalCloseHandler }> = [];
  private sectionHistory: MainSection[] = ['home'];
  private currentSection: MainSection = 'home';
  private onSectionChangeCallback: ((section: MainSection) => void) | null = null;
  private onShowExitPromptCallback: ((show: boolean) => void) | null = null;
  private lastBackPressTime = 0;
  private exitTimeout: any = null;
  private isIgnoringNextPop = false;
  private isInitialized = false;

  public init(
    initialSection: MainSection,
    onSectionChange: (section: MainSection) => void,
    onShowExitPrompt: (show: boolean) => void
  ) {
    if (this.isInitialized) return;
    this.isInitialized = true;
    this.currentSection = initialSection;
    this.sectionHistory = [initialSection];
    this.onSectionChangeCallback = onSectionChange;
    this.onShowExitPromptCallback = onShowExitPrompt;

    // Set initial baseline history state
    if (typeof window !== 'undefined') {
      try {
        window.history.replaceState({ appRoot: true, section: initialSection, modalDepth: 0 }, '');
      } catch (e) {
        console.warn('History replaceState failed:', e);
      }

      window.addEventListener('popstate', this.handlePopState);
    }
  }

  public destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('popstate', this.handlePopState);
    }
    this.isInitialized = false;
  }

  /**
   * Register a modal or drawer opening. Returns a function to call when the modal is closed via UI.
   */
  public pushModal(id: string, closeHandler: ModalCloseHandler): () => void {
    const entry = { id, close: closeHandler };
    this.modalStack.push(entry);

    if (typeof window !== 'undefined') {
      try {
        window.history.pushState(
          {
            type: 'modal',
            modalId: id,
            modalDepth: this.modalStack.length,
            section: this.currentSection
          },
          ''
        );
      } catch (e) {
        console.warn('History pushState for modal failed:', e);
      }
    }

    // Dismissal function for UI buttons ('X', Cancel, Backdrop click)
    return () => {
      this.dismissModal(id);
    };
  }

  /**
   * Called when a modal is closed by UI interaction (e.g. clicking 'X' or cancel)
   */
  public dismissModal(id: string) {
    const index = this.modalStack.findIndex((m) => m.id === id);
    if (index !== -1) {
      this.modalStack.splice(index, 1);
      // Rewind browser history by 1 step so back button won't re-trigger a close
      if (typeof window !== 'undefined') {
        this.isIgnoringNextPop = true;
        try {
          window.history.back();
        } catch (e) {
          this.isIgnoringNextPop = false;
        }
      }
    }
  }

  /**
   * Navigate to a section. Pushes history state and updates section stack.
   */
  public navigateTo(section: MainSection) {
    if (this.currentSection === section) return;

    this.currentSection = section;
    this.sectionHistory.push(section);

    if (typeof window !== 'undefined') {
      try {
        window.history.pushState(
          {
            type: 'section',
            section,
            modalDepth: this.modalStack.length
          },
          ''
        );
      } catch (e) {
        console.warn('History pushState for section failed:', e);
      }
    }

    if (this.onSectionChangeCallback) {
      this.onSectionChangeCallback(section);
    }
  }

  /**
   * Core popstate handler triggered by hardware back button or browser back
   */
  private handlePopState = (event: PopStateEvent) => {
    if (this.isIgnoringNextPop) {
      this.isIgnoringNextPop = false;
      return;
    }

    // 1. If any modal is open, close the topmost modal first!
    if (this.modalStack.length > 0) {
      const topModal = this.modalStack.pop();
      if (topModal) {
        topModal.close();
      }
      return;
    }

    // 2. If user is in a sub-section (not home), go back one section or to 'home'
    if (this.sectionHistory.length > 1) {
      this.sectionHistory.pop(); // remove current section
      const prevSection = this.sectionHistory[this.sectionHistory.length - 1] || 'home';
      this.currentSection = prevSection;

      if (this.onSectionChangeCallback) {
        this.onSectionChangeCallback(prevSection);
      }
      return;
    }

    if (this.currentSection !== 'home') {
      this.currentSection = 'home';
      this.sectionHistory = ['home'];
      if (this.onSectionChangeCallback) {
        this.onSectionChangeCallback('home');
      }
      return;
    }

    // 3. User is already on 'home' and no modal is open: Double-back to exit protection!
    const now = Date.now();
    if (now - this.lastBackPressTime < 2500) {
      // User pressed back twice within 2.5 seconds: Allow normal exit / leave
      if (this.onShowExitPromptCallback) {
        this.onShowExitPromptCallback(false);
      }
      if (typeof window !== 'undefined') {
        window.history.back();
      }
    } else {
      // First back press on home: Prevent instant exit, show gentle reminder toast
      this.lastBackPressTime = now;
      if (typeof window !== 'undefined') {
        try {
          window.history.pushState({ appRoot: true, section: 'home', modalDepth: 0 }, '');
        } catch (e) {}
      }

      if (this.onShowExitPromptCallback) {
        this.onShowExitPromptCallback(true);
        if (this.exitTimeout) clearTimeout(this.exitTimeout);
        this.exitTimeout = setTimeout(() => {
          if (this.onShowExitPromptCallback) {
            this.onShowExitPromptCallback(false);
          }
        }, 2500);
      }
    }
  };
}

export const backNavigation = new BackNavigationService();
