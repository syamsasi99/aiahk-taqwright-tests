import { Mobile, Locator } from '@taqwright/taqwright';

/** The home screen a guest lands on. */
export class HomePage {
  /**
   * Shown only while nobody is signed in, and at any time of day — unlike the greeting,
   * whose accessibility id changes with the hour (`…-greetingMessage-afternoon`, …).
   */
  readonly loginSignupButton: Locator;
  /** The button's text. The button itself is a container with no text; its label is this child. */
  readonly loginSignupLabel: Locator;
  /** The bottom-nav "Menu" tab, unfocused while home is showing. */
  readonly menuTab: Locator;
  /** The bottom-nav "Home" label, as home shows it. */
  readonly homeTabLabel: Locator;

  constructor(private mobile: Mobile) {
    this.loginSignupButton = mobile.getByLabel('android-homeScreen-loginSignupButton-actionBtn');
    this.loginSignupLabel = mobile.getByLabel('android-homeScreen-loginSignupButton');
    this.menuTab = mobile.getByLabel('android-bottomNavigation-menu-unFocused');
    this.homeTabLabel = mobile.getByLabel('android-home-bottomNavigation-label');
  }
}
